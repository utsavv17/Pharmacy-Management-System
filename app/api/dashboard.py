from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.main import get_db
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

# Get today's summary
@router.get("/today")
def dashboard_today(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    data = DashboardService.today_summary(db)
    return {
        "success": True,
        "message": "Today's summary fetched",
        "data": data
    }

# Get inventory summary
@router.get("/inventory")
def dashboard_inventory(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    data = DashboardService.inventory_summary(db)
    return {
        "success": True,
        "message": "Inventory summary fetched",
        "data": data
    }

# Get last 7 days sales summary
@router.get("/sales-7-days")
def dashboard_last_7_days_sales(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    data = DashboardService.last_7_days_sales(db)
    return {
        "success": True,
        "message": "Last 7 days sales fetched",
        "data": data
    }
