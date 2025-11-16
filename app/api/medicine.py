from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.schemas.medicine import MedicineCreateSchema, MedicineUpdateSchema
from app.services.medicine_service import MedicineService
from app.core.deps import get_current_user
from app.main import get_db

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
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    medicines = MedicineService.get_all(db)

    return {
        "success": True,
        "message": "Medicines fetched",
        "data": [
            {
                "id": m.id,
                "name": m.name,
                "generic_name": m.generic_name,
                "brand": m.brand,
                "category": m.category,
                "unit": m.unit,
                "strength": m.strength
            }
            for m in medicines
        ]
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
