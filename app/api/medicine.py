from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.schemas.medicine import MedicineCreateSchema, MedicineUpdateSchema
from typing import List
from app.services.medicine_service import MedicineService
from app.core.deps import get_current_user, get_current_organization
from app.main import get_db
from app.utils.pagination import Paginator
from app.models.medicine import Medicine
from app.models.batch import Batch
from sqlalchemy import func


router = APIRouter(prefix="/medicines", tags=["Medicines"])


# Create Medicine
@router.post("/")
def create_medicine(
    payload: MedicineCreateSchema,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    org_id: int = Depends(get_current_organization)
):

    med, error = MedicineService.create(db, payload, org_id)

    if error == "MEDICINE_EXISTS":
        return {
            "success": False,
            "message": "Medicine name already exists",
            "error": "MEDICINE_EXISTS"
        }

    return {
        "success": True,
        "message": "Medicine created successfully",
        "data": {
            "id": med.id,
            "name": med.name,
            "generic_name": med.generic_name,
            "brand": med.brand,
            "category": med.category,
            "unit": med.unit,
            "strength": med.strength,
            "barcode": med.barcode,
            "image_url": med.image_url
        }
    }


# Bulk Create Medicines
@router.post("/bulk-create")
def bulk_create_medicines(
    medicines: List[MedicineCreateSchema],
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    org_id: int = Depends(get_current_organization)
):
    created_medicines = []
    errors = []
    
    for i, medicine_data in enumerate(medicines):
        med, error = MedicineService.create(db, medicine_data, org_id)
        
        if error:
            errors.append({
                "index": i,
                "name": medicine_data.name,
                "error": error
            })
        else:
            created_medicines.append({
                "id": med.id,
                "name": med.name,
                "generic_name": med.generic_name,
                "brand": med.brand,
                "category": med.category,
                "unit": med.unit,
                "strength": med.strength,
                "barcode": med.barcode,
                "image_url": med.image_url
            })
    
    return {
        "success": True,
        "message": f"Bulk operation completed. {len(created_medicines)} created, {len(errors)} failed.",
        "data": {
            "created": created_medicines,
            "errors": errors,
            "summary": {
                "total": len(medicines),
                "created": len(created_medicines),
                "failed": len(errors)
            }
        }
    }


# Get Medicine Detail
@router.get("/{medicine_id}")
def get_medicine_detail(
    medicine_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    org_id: int = Depends(get_current_organization)
):
    medicine = db.query(Medicine).filter(Medicine.id == medicine_id, Medicine.organization_id == org_id).first()
    
    if not medicine:
        return {
            "success": False,
            "message": "Medicine not found",
            "error": "NOT_FOUND"
        }
    
    return {
        "success": True,
        "message": "Medicine details fetched successfully",
        "data": {
            "id": medicine.id,
            "name": medicine.name,
            "generic_name": medicine.generic_name,
            "brand": medicine.brand,
            "category": medicine.category,
            "unit": medicine.unit,
            "strength": medicine.strength,
            "barcode": medicine.barcode,
            "image_url": medicine.image_url
        }
    }

# List Medicines
@router.get("/")
def list_medicines(
    search: str | None = None,
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    org_id: int = Depends(get_current_organization)
):
    # Subquery to get latest batch for each medicine
    latest_batch = db.query(
        Batch.medicine_id,
        func.max(Batch.expiry_date).label('latest_expiry')
    ).group_by(Batch.medicine_id).subquery()
    
    query = db.query(Medicine, Batch.selling_price, Batch.expiry_date).outerjoin(
        latest_batch, Medicine.id == latest_batch.c.medicine_id
    ).outerjoin(
        Batch, (Batch.medicine_id == Medicine.id) & (Batch.expiry_date == latest_batch.c.latest_expiry)
    ).filter(Medicine.organization_id == org_id)

    if search:
        s = f"%{search}%"
        query = query.filter(
            (Medicine.name.ilike(s)) |
            (Medicine.generic_name.ilike(s))
        )

    paginated = Paginator.paginate(query, page, limit)

    return {
        "success": True,
        "message": "Medicines fetched successfully",
        "data": {
            "items": [
                {
                    "id": item[0].id,
                    "name": item[0].name,
                    "generic_name": item[0].generic_name,
                    "brand": item[0].brand,
                    "category": item[0].category,
                    "unit": item[0].unit,
                    "strength": item[0].strength,
                    "barcode": item[0].barcode,
                    "image_url": item[0].image_url,
                    "price": item[1] if len(item) > 1 and item[1] else None,
                    "expiry_date": item[2].isoformat() if len(item) > 2 and item[2] else None
                }
                for item in paginated["items"]
            ],
            "pagination": paginated["pagination"]
        }
    }

# Update Medicine
@router.put("/{medicine_id}")
def update_medicine(
    medicine_id: int,
    payload: MedicineUpdateSchema,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    org_id: int = Depends(get_current_organization)
):

    med, error = MedicineService.update(db, medicine_id, payload, org_id)

    if error == "NOT_FOUND":
        return {
            "success": False,
            "message": "Medicine not found",
            "error": "NOT_FOUND"
        }

    return {
        "success": True,
        "message": "Medicine updated successfully",
        "data": {
            "id": med.id,
            "name": med.name,
            "generic_name": med.generic_name,
            "brand": med.brand,
            "category": med.category,
            "unit": med.unit,
            "strength": med.strength,
            "barcode": med.barcode,
            "image_url": med.image_url
        }
    }


# Delete Medicine
@router.delete("/{medicine_id}")
def delete_medicine(
    medicine_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    org_id: int = Depends(get_current_organization)
):

    # Optional: only admins can delete
    if current_user.role != "admin":
        return {
            "success": False,
            "message": "Permission denied",
            "error": "FORBIDDEN"
        }

    error = MedicineService.delete(db, medicine_id, org_id)

    if error == "NOT_FOUND":
        return {
            "success": False,
            "message": "Medicine not found",
            "error": "NOT_FOUND"
        }

    return {
        "success": True,
        "message": "Medicine deleted successfully",
        "data": {}
    }
