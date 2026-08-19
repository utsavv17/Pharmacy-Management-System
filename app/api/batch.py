from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.schemas.batch import BatchCreateSchema, BatchUpdateSchema
from app.services.batch_service import BatchService
from app.core.deps import get_current_user, get_current_organization
from app.main import get_db
from app.utils.pagination import Paginator
from app.models.batch import Batch
from app.models.medicine import Medicine


router = APIRouter(prefix="/batches", tags=["Batches"])

# Create a batch
@router.post("/create")
def create_batch(
    payload: BatchCreateSchema,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    org_id: int = Depends(get_current_organization)
):

    batch, error = BatchService.create(db, payload, org_id)

    return {
        "success": True,
        "message": "Batch created successfully",
        "data": {
            "id": batch.id,
            "batch_no": batch.batch_no,
            "expiry_date": batch.expiry_date,
            "purchase_price": batch.purchase_price,
            "selling_price": batch.selling_price,
            "quantity": batch.quantity,
            "medicine_id": batch.medicine_id
        }
    }

# List all batches
@router.get("/")
def list_batches(
    search: str | None = None,       # batch_no or medicine name
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    org_id: int = Depends(get_current_organization)
):

    query = db.query(Batch).join(Medicine).filter(Batch.organization_id == org_id)

    if search:
        s = f"%{search}%"
        query = query.filter(
            (Batch.batch_no.ilike(s)) |
            (Medicine.name.ilike(s))
        )

    paginated = Paginator.paginate(query, page, limit)

    return {
        "success": True,
        "message": "Batches fetched",
        "data": {
            "items": [
                {
                    "id": b.id,
                    "batch_no": b.batch_no,
                    "expiry_date": b.expiry_date,
                    "purchase_price": b.purchase_price,
                    "selling_price": b.selling_price,
                    "quantity": b.quantity,
                    "medicine_id": b.medicine_id
                }
                for b in paginated["items"]
            ],
            "pagination": paginated["pagination"]
        }
    }

# List batches by medicine ID
@router.get("/medicine/{medicine_id}")
def list_batches(
    medicine_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    org_id: int = Depends(get_current_organization)
):

    batches = BatchService.get_by_medicine(db, medicine_id, org_id)

    return {
        "success": True,
        "message": "Batches fetched",
        "data": [
            {
                "id": b.id,
                "batch_no": b.batch_no,
                "expiry_date": b.expiry_date,
                "purchase_price": b.purchase_price,
                "selling_price": b.selling_price,
                "quantity": b.quantity,
                "medicine_id": b.medicine_id
            }
            for b in batches
        ]
    }

# Update a batch
@router.put("/{batch_id}")
def update_batch(
    batch_id: int,
    payload: BatchUpdateSchema,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    org_id: int = Depends(get_current_organization)
):

    batch, error = BatchService.update(db, batch_id, payload, org_id)

    if error == "NOT_FOUND":
        return {
            "success": False,
            "message": "Batch not found",
            "error": "NOT_FOUND"
        }

    return {
        "success": True,
        "message": "Batch updated successfully",
        "data": {
            "id": batch.id,
            "batch_no": batch.batch_no,
            "expiry_date": batch.expiry_date,
            "purchase_price": batch.purchase_price,
            "selling_price": batch.selling_price,
            "quantity": batch.quantity,
            "medicine_id": batch.medicine_id
        }
    }

# Delete a batch
@router.delete("/{batch_id}")
def delete_batch(
    batch_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    org_id: int = Depends(get_current_organization)
):

    if current_user.role != "admin":
        return {
            "success": False,
            "message": "Permission denied",
            "error": "FORBIDDEN"
        }

    error = BatchService.delete(db, batch_id, org_id)

    if error == "NOT_FOUND":
        return {
            "success": False,
            "message": "Batch not found",
            "error": "NOT_FOUND"
        }

    return {
        "success": True,
        "message": "Batch deleted successfully",
        "data": {}
    }
