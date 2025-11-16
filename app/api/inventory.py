from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.services.inventory_service import InventoryService
from app.core.deps import get_current_user
from app.main import get_db

router = APIRouter(prefix="/inventory", tags=["Inventory"])

# Get stock for a specific medicine
@router.get("/medicine/{medicine_id}")
def get_medicine_stock(
    medicine_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    data = InventoryService.get_medicine_stock(db, medicine_id)

    return {
        "success": True,
        "message": "Stock fetched successfully",
        "data": data
    }

# Get low stock medicines
@router.get("/low")
def get_low_stock(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    data = InventoryService.get_low_stock(db, limit)

    return {
        "success": True,
        "message": "Low stock medicines fetched",
        "data": data
    }

# Get near expiry batches
@router.get("/near-expiry")
def get_near_expiry(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    data = InventoryService.get_near_expiry(db, days)

    return {
        "success": True,
        "message": "Near expiry batches fetched",
        "data": data
    }

# Get expired batches
@router.get("/expired")
def get_expired(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    data = InventoryService.get_expired(db)

    return {
        "success": True,
        "message": "Expired batches fetched",
        "data": data
    }
