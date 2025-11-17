from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date

from app.core.deps import get_current_user
from app.main import get_db
from app.services.sales_report_service import SalesReportService

router = APIRouter(prefix="/reports/sales", tags=["Sales Reports"])

# Get daily sales report
@router.get("/daily")
def get_daily_sales(
    day: date = date.today(),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    data = SalesReportService.daily_sales(db, day)

    return {
        "success": True,
        "message": "Daily sales report generated",
        "data": data
    }

# Get monthly sales report
@router.get("/monthly")
def get_monthly_sales(
    year: int,
    month: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    data = SalesReportService.monthly_sales(db, year, month)

    return {
        "success": True,
        "message": "Monthly sales report generated",
        "data": data
    }

# Get sales report for a specific medicine
@router.get("/medicine/{medicine_id}")
def get_sales_by_medicine(
    medicine_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    data, error = SalesReportService.sales_by_medicine(db, medicine_id)

    if error == "NOT_FOUND":
        return {
            "success": False,
            "message": "Medicine not found",
            "error": "NOT_FOUND"
        }

    return {
        "success": True,
        "message": "Sales report generated for medicine",
        "data": data
    }
