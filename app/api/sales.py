from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.deps import get_current_user
from app.main import get_db
from app.services.sale_service import SaleService
from app.models.sale import Sale
from app.models.medicine import Medicine
from app.schemas.sale import SaleCreate, SaleResponse
from app.utils.pagination import Paginator


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
            "subtotal": sale.subtotal,
            "discount_amount": sale.discount_amount,
            "total_amount": sale.total_amount,
            "created_at": sale.created_at,
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

    # Get medicine details for each item
    items_with_medicine = []
    for item in sale.items:
        medicine = db.query(Medicine).filter(Medicine.id == item.medicine_id).first()
        items_with_medicine.append({
            "id": item.id,
            "medicine_id": item.medicine_id,
            "medicine_name": medicine.name if medicine else None,
            "medicine_strength": medicine.strength if medicine else None,
            "batch_id": item.batch_id,
            "quantity": item.quantity,
            "selling_price": item.selling_price
        })

    return {
        "success": True,
        "message": "Sale details fetched",
        "data": {
            "id": sale.id,
            "invoice_number": sale.invoice_number,
            "customer_name": sale.customer_name,
            "sale_date": sale.sale_date,
            "subtotal": sale.subtotal,
            "discount_amount": sale.discount_amount,
            "total_amount": sale.total_amount,
            "created_at": sale.created_at,
            "items": items_with_medicine
        }
    }
