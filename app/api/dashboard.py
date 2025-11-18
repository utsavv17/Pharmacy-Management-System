from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.deps import get_current_user
from app.main import get_db
from app.services.dashboard_service import DashboardService
from app.models.medicine import Medicine
from app.models.supplier import Supplier
from app.models.sale import Sale
from app.models.sale_item import SaleItem


router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Total medicines
    total_medicines = db.query(Medicine).count()
    
    # Total suppliers
    total_suppliers = db.query(Supplier).count()
    
    # Total sales (number of sales)
    total_sales = db.query(Sale).count()
    
    # Total sold (sum of all quantities sold)
    total_sold = db.query(func.sum(SaleItem.quantity)).scalar() or 0
    
    # Total revenue (sum of all sale amounts)
    total_revenue = db.query(func.sum(Sale.total_amount)).scalar() or 0.0

    return {
        "success": True,
        "message": "Dashboard statistics fetched successfully",
        "data": {
            "total_medicines": total_medicines,
            "total_suppliers": total_suppliers,
            "total_sales": total_sales,
            "total_sold": total_sold,
            "total_revenue": total_revenue
        }
    }

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
