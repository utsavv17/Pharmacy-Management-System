from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.deps import get_current_user, get_current_organization
from app.main import get_db
from app.services.sale_service import SaleService
from app.models.sale import Sale
from app.models.medicine import Medicine
from app.models.batch import Batch
from app.schemas.sale import SaleCreate, SaleResponse
from app.utils.pagination import Paginator


router = APIRouter(prefix="/sales", tags=["Sales"])

@router.get("/")
def get_sales_history(
    page: int = 1,
    limit: int = 10,
    search: str | None = None,
    customer_id: int | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    org_id: int = Depends(get_current_organization)
):
    from sqlalchemy import or_
    from app.models.customer import Customer
    
    query = db.query(Sale).filter(Sale.organization_id == org_id)
    
    if search:
        query = query.filter(Sale.invoice_number.ilike(f"%{search}%"))
    if customer_id:
        query = query.filter(Sale.customer_id == customer_id)
    if start_date:
        query = query.filter(Sale.sale_date >= start_date)
    if end_date:
        query = query.filter(Sale.sale_date <= end_date)
    if status:
        query = query.filter(Sale.status == status)
        
    query = query.order_by(Sale.created_at.desc())
    paginated = Paginator.paginate(query, page, limit)
    
    items = []
    for sale in paginated["items"]:
        customer = db.query(Customer).filter(Customer.id == sale.customer_id, Customer.organization_id == org_id).first() if sale.customer_id else None
        items.append({
            "id": sale.id,
            "invoice_number": sale.invoice_number,
            "customer_id": sale.customer_id,
            "customer_name": customer.name if customer else sale.customer_name,
            "sale_date": sale.sale_date,
            "subtotal": sale.subtotal,
            "discount_amount": sale.discount_amount,
            "points_earned": getattr(sale, 'points_earned', 0),
            "points_redeemed": getattr(sale, 'points_redeemed', 0),
            "total_amount": sale.total_amount,
            "status": getattr(sale, 'status', 'COMPLETED'),
            "created_at": sale.created_at,
            "items_count": len(sale.items)
        })
        
    return {
        "success": True,
        "message": "Sales fetched",
        "data": {
            "items": items,
            "pagination": paginated["pagination"]
        }
    }


@router.get("/pos/medicines")
def get_pos_medicines(
    search: str | None = None,
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    org_id: int = Depends(get_current_organization)
):
    """
    Get all medicines with available stock for POS system
    """
    query = (
        db.query(
            Medicine.id.label("medicine_id"),
            Medicine.name.label("medicine_name"),
            Batch.id.label("batch_id"),
            Batch.batch_no.label("batch_number"),
            Batch.quantity.label("stock"),
            Batch.selling_price,
            Batch.expiry_date
        )
        .join(Batch, Medicine.id == Batch.medicine_id)
        .filter(Batch.quantity > 0, Medicine.organization_id == org_id)
    )
    
    if search:
        s = f"%{search}%"
        query = query.filter(
            (Medicine.name.ilike(s)) |
            (Medicine.generic_name.ilike(s)) |
            (Batch.batch_no.ilike(s))
        )
    
    query = query.order_by(Medicine.name, Batch.expiry_date)
    
    paginated = Paginator.paginate(query, page, limit)
    
    medicines_list = [
        {
            "medicine_id": m.medicine_id,
            "medicine_name": m.medicine_name,
            "batch_id": m.batch_id,
            "batch_number": m.batch_number,
            "stock": int(m.stock),
            "selling_price": float(m.selling_price),
            "expiry_date": str(m.expiry_date)
        }
        for m in paginated["items"]
    ]
    
    return {
        "success": True,
        "message": "POS medicines fetched successfully",
        "data": {
            "items": medicines_list,
            "pagination": paginated["pagination"]
        }
    }


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

@router.post("/bulk-create")
def create_multiple_sales(
    sales: List[SaleCreate],
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    created_sales = []
    errors = []
    
    for i, sale_data in enumerate(sales):
        try:
            sale = SaleService.create_sale(db, sale_data)
            created_sales.append({
                "id": sale.id,
                "invoice_number": sale.invoice_number,
                "customer_name": sale.customer_name,
                "sale_date": sale.sale_date,
                "total_amount": sale.total_amount
            })
        except Exception as e:
            errors.append({
                "index": i,
                "invoice_number": getattr(sale_data, 'invoice_number', None),
                "error": str(e)
            })
    
    return {
        "success": len(errors) == 0,
        "message": f"Created {len(created_sales)} sales" + (f", {len(errors)} failed" if errors else ""),
        "data": {
            "created": created_sales,
            "errors": errors,
            "summary": {
                "total_requested": len(sales),
                "created_count": len(created_sales),
                "error_count": len(errors)
            }
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
