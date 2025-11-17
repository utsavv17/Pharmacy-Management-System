from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.schemas.medicine import MedicineCreateSchema, MedicineUpdateSchema
from app.services.medicine_service import MedicineService
from app.core.deps import get_current_user
from app.main import get_db
from app.utils.pagination import Paginator
from app.models.medicine import Medicine


router = APIRouter(prefix="/medicines", tags=["Medicines"])


# Create Medicine
@router.post("/create")
def create_medicine(
    payload: MedicineCreateSchema,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    med, error = MedicineService.create(db, payload)

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
            "strength": med.strength
        }
    }


# List Medicines
@router.get("/")
def list_medicines(
    search: str | None = None,
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = db.query(Medicine)

    if search:
        query = query.filter(Medicine.name.ilike(f"%{search}%"))

    paginated = Paginator.paginate(query, page, limit)

    return {
        "success": True,
        "message": "Medicines fetched successfully",
        "data": {
            "items": [
                {
                    "id": m.id,
                "name": m.name,
                "generic_name": m.generic_name,
                "brand": m.brand,
                "category": m.category,
                "unit": m.unit,
                "strength": m.strength
                }
                for m in paginated["items"]
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
    current_user = Depends(get_current_user)
):

    med, error = MedicineService.update(db, medicine_id, payload)

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
            "strength": med.strength
        }
    }


# Delete Medicine
@router.delete("/{medicine_id}")
def delete_medicine(
    medicine_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    # Optional: only admins can delete
    if current_user.role != "admin":
        return {
            "success": False,
            "message": "Permission denied",
            "error": "FORBIDDEN"
        }

    error = MedicineService.delete(db, medicine_id)

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
