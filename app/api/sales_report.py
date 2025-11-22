from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date

from app.core.deps import get_current_user
from app.main import get_db
from app.services.sales_report_service import SalesReportService
from app.services.dashboard_service import DashboardService
from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.utils.pagination import Paginator

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

# Get last 7 days sales summary
@router.get("/sales-7-days")
def get_last_7_days_sales(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    data = DashboardService.last_7_days_sales(db)
    return {
        "success": True,
        "message": "Last 7 days sales fetched",
        "data": data
    }

# List all sales
@router.get("/")
def list_sales(
    year: int = date.today().year,
    search: str | None = None,
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    from sqlalchemy import extract, func
    from app.models.sale_item import SaleItem
    from app.models.batch import Batch
    
    query = db.query(Sale).filter(extract('year', Sale.sale_date) == year)

    if search:
        s = f"%{search}%"
        query = query.filter(
            (Sale.invoice_number.ilike(s)) |
            (Sale.customer_name.ilike(s))
        )

    query = query.order_by(Sale.created_at.desc())
    paginated = Paginator.paginate(query, page, limit)
    
    # Year totals
    year_sales_count = db.query(func.count(Sale.id)).filter(extract('year', Sale.sale_date) == year).scalar() or 0
    year_sale_amount = db.query(func.sum(Sale.total_amount)).filter(extract('year', Sale.sale_date) == year).scalar() or 0
    year_subtotal = db.query(func.sum(Sale.subtotal)).filter(extract('year', Sale.sale_date) == year).scalar() or 0
    year_discount = db.query(func.sum(Sale.discount_amount)).filter(extract('year', Sale.sale_date) == year).scalar() or 0
    year_revenue = DashboardService.calculate_year_revenue(db, year)
    year_items_sold = db.query(func.sum(SaleItem.quantity)).join(Sale).filter(extract('year', Sale.sale_date) == year).scalar() or 0

    return {
        "success": True,
        "message": "Sales fetched",
        "data": {
            "items": [
                {
                    "id": s.id,
                    "invoice_number": s.invoice_number,
                    "customer_name": s.customer_name,
                    "sale_date": s.sale_date,
                    "subtotal": s.subtotal,
                    "discount_amount": s.discount_amount,
                    "total_amount": s.total_amount
                }
                for s in paginated["items"]
            ],
            "pagination": paginated["pagination"],
            "year_summary": {
                "year": year,
                "total_sales": year_sales_count,
                "total_subtotal": round(float(year_subtotal), 2),
                "total_discount": round(float(year_discount), 2),
                "total_sale_amount": round(float(year_sale_amount), 2),
                "total_revenue": round(float(year_revenue), 2),
                "total_items_sold": int(year_items_sold)
            }
        }
    }

