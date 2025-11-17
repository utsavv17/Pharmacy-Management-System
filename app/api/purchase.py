from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.models.purchase import Purchase
from app.schemas.purchase import PurchaseCreate, PurchaseResponse
from app.services.purchase_service import PurchaseService
from app.core.deps import get_current_user
from app.main import get_db

router = APIRouter(prefix="/purchases", tags=["Purchases"])

@router.post("/create")
def create_purchase(
    payload: PurchaseCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    # Create purchase + items + batches
    purchase = PurchaseService.create_purchase(db, payload)

    # Format response
    return {
        "success": True,
        "message": "Purchase created successfully",
        "data": {
            "id": purchase.id,
            "invoice_number": purchase.invoice_number,
            "supplier_name": purchase.supplier_name,
            "purchase_date": purchase.purchase_date,
            "total_amount": purchase.total_amount,
            "items": [
                {
                    "id": item.id,
                    "medicine_id": item.medicine_id,
                    "batch_no": item.batch_no,
                    "expiry_date": item.expiry_date,
                    "purchase_price": item.purchase_price,
                    "selling_price": item.selling_price,
                    "quantity": item.quantity
                }
                for item in purchase.items
            ]
        }
    }

# List purchases
@router.get("/")
def list_purchases(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    purchases = db.query(Purchase).order_by(Purchase.id.desc()).all()

    return {
        "success": True,
        "message": "Purchases fetched successfully",
        "data": [
            {
                "id": p.id,
                "invoice_number": p.invoice_number,
                "supplier_name": p.supplier_name,
                "purchase_date": p.purchase_date,
                "total_amount": p.total_amount
            }
            for p in purchases
        ]
    }

# Get purchase by ID
@router.get("/{purchase_id}")
def get_purchase(
    purchase_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    purchase = db.query(Purchase).filter(Purchase.id == purchase_id).first()

    if not purchase:
        return {
            "success": False,
            "message": "Purchase not found",
            "error": "NOT_FOUND"
        }

    return {
        "success": True,
        "message": "Purchase details fetched",
        "data": {
            "id": purchase.id,
            "invoice_number": purchase.invoice_number,
            "supplier_name": purchase.supplier_name,
            "purchase_date": purchase.purchase_date,
            "total_amount": purchase.total_amount,
            "items": [
                {
                    "id": item.id,
                    "medicine_id": item.medicine_id,
                    "batch_no": item.batch_no,
                    "expiry_date": item.expiry_date,
                    "purchase_price": item.purchase_price,
                    "selling_price": item.selling_price,
                    "quantity": item.quantity
                }
                for item in purchase.items
            ]
        }
    }
