from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.deps import get_current_user
from app.main import get_db
from app.services.sale_service import SaleService
from app.models.sale import Sale
from app.schemas.sale import SaleCreate, SaleResponse
from app.utils.pagination import Paginator
from app.models.sale import Sale


router = APIRouter(prefix="/sales", tags=["Sales"])


@router.post("/create")
def create_sale(
    payload: SaleCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Create a sale. Request schema should match app/schemas/sale.SaleCreate.
    Business errors are returned with consistent JSON format.
    """
    try:
        sale = SaleService.create_sale(db, payload)
    except Exception as exc:
        # Known business error strings from service or Python exceptions are returned cleanly
        message = str(exc)
        # If it's a stock / batch problem, return 400 with structured error
        return {
            "success": False,
            "message": message,
            "error": "BUSINESS_ERROR"
        }

    # format response
    return {
        "success": True,
        "message": "Sale created successfully",
        "data": {
            "id": sale.id,
            "invoice_number": sale.invoice_number,
            "customer_name": sale.customer_name,
            "sale_date": sale.sale_date,
            "total_amount": sale.total_amount,
            "items": [
                {
                    "id": it.id,
                    "medicine_id": it.medicine_id,
                    "batch_id": it.batch_id,
                    "quantity": it.quantity,
                    "selling_price": it.selling_price
                }
                for it in sale.items
            ]
        }
    }


@router.get("/")
def list_sales(
    search: str | None = None,     # invoice_no or customer_name
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    query = db.query(Sale)

    if search:
        s = f"%{search}%"
        query = query.filter(
            (Sale.invoice_number.ilike(s)) |
            (Sale.customer_name.ilike(s))
        )

    paginated = Paginator.paginate(query, page, limit)

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
                    "total_amount": s.total_amount
                }
                for s in paginated["items"]
            ],
            "pagination": paginated["pagination"]
        }
    }



@router.get("/{sale_id}")
def get_sale(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    sale = db.query(Sale).filter(Sale.id == sale_id).first()

    if not sale:
        return {
            "success": False,
            "message": "Sale not found",
            "error": "NOT_FOUND"
        }

    return {
        "success": True,
        "message": "Sale details fetched",
        "data": {
            "id": sale.id,
            "invoice_number": sale.invoice_number,
            "customer_name": sale.customer_name,
            "sale_date": sale.sale_date,
            "total_amount": sale.total_amount,
            "items": [
                {
                    "id": it.id,
                    "medicine_id": it.medicine_id,
                    "batch_id": it.batch_id,
                    "quantity": it.quantity,
                    "selling_price": it.selling_price
                }
                for it in sale.items
            ]
        }
    }
