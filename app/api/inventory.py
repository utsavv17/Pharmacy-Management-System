from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.services.inventory_service import InventoryService
from app.core.deps import get_current_user, get_current_organization
from app.main import get_db
from app.utils.pagination import Paginator
from app.models.medicine import Medicine
from app.models.batch import Batch

router = APIRouter(prefix="/inventory", tags=["Inventory"])

@router.get("/alerts")
def get_inventory_alerts(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    org_id: int = Depends(get_current_organization)
):
    low_stock = InventoryService.get_low_stock(db, org_id, 100)
    near_expiry = InventoryService.get_near_expiry(db, org_id, 30)
    expired = InventoryService.get_expired(db, org_id)
    
    out_of_stock = db.query(
        Medicine.id, Medicine.name, Medicine.generic_name
    ).outerjoin(Batch, Medicine.id == Batch.medicine_id).filter(
        Medicine.organization_id == org_id
    ).group_by(
        Medicine.id, Medicine.name, Medicine.generic_name
    ).having(func.coalesce(func.sum(Batch.quantity), 0) == 0).all()
    
    out_of_stock_list = [{"medicine_id": m.id, "medicine_name": m.name, "generic_name": m.generic_name} for m in out_of_stock]
    
    return {
        "success": True,
        "message": "Inventory alerts fetched",
        "data": {
            "low_stock": low_stock,
            "near_expiry": near_expiry,
            "expired": expired,
            "out_of_stock": out_of_stock_list
        }
    }

@router.get("/")
def inventory_list(
    search: str | None = None,
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    org_id: int = Depends(get_current_organization)
):
    query = (
        db.query(
            Batch.id.label("batch_id"),
            Medicine.id.label("medicine_id"),
            Medicine.name.label("medicine_name"),
            Medicine.generic_name.label("generic_name"),
            Batch.batch_no.label("batch_number"),
            Batch.expiry_date.label("expiry_date"),
            Batch.quantity.label("available_quantity"),
            Batch.purchase_price.label("purchase_price"),
            Batch.selling_price.label("selling_price"),
            Medicine.minimum_stock_level.label("minimum_stock_level")
        )
        .join(Batch, Medicine.id == Batch.medicine_id)
        .filter(Medicine.organization_id == org_id)
    )

    if search:
        s = f"%{search}%"
        query = query.filter(
            (Medicine.name.ilike(s)) |
            (Medicine.generic_name.ilike(s)) |
            (Batch.batch_no.ilike(s))
        )

    query = query.order_by(Medicine.name.asc(), Batch.expiry_date.asc())
    paginated = Paginator.paginate(query, page, limit)

    return {
        "success": True,
        "message": "Inventory fetched",
        "data": {
            "items": [
                {
                    "batch_id": row.batch_id,
                    "medicine_id": row.medicine_id,
                    "medicine_name": row.medicine_name,
                    "generic_name": row.generic_name,
                    "batch_number": row.batch_number,
                    "expiry_date": row.expiry_date,
                    "available_quantity": row.available_quantity,
                    "purchase_price": float(row.purchase_price) if row.purchase_price else 0,
                    "selling_price": float(row.selling_price) if row.selling_price else 0,
                    "minimum_stock_level": row.minimum_stock_level
                }
                for row in paginated["items"]
            ],
            "pagination": paginated["pagination"]
        }
    }


@router.get("/batch/{batch_id}/movement")
def get_stock_movement(
    batch_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    org_id: int = Depends(get_current_organization)
):
    from app.models.purchase_item import PurchaseItem
    from app.models.purchase import Purchase
    from app.models.sale_item import SaleItem
    from app.models.sale import Sale

    # Fetch purchases
    purchases = (
        db.query(PurchaseItem, Purchase)
        .join(Purchase)
        .filter(PurchaseItem.batch_no == db.query(Batch.batch_no).filter(Batch.id == batch_id, Batch.organization_id == org_id).scalar())
        .filter(PurchaseItem.medicine_id == db.query(Batch.medicine_id).filter(Batch.id == batch_id, Batch.organization_id == org_id).scalar())
        .filter(Purchase.organization_id == org_id)
        .all()
    )

    # Fetch sales
    sales = (
        db.query(SaleItem, Sale)
        .join(Sale)
        .filter(SaleItem.batch_id == batch_id)
        .filter(Sale.organization_id == org_id)
        .all()
    )

    movements = []

    for item, purchase in purchases:
        movements.append({
            "date": purchase.purchase_date.strftime("%Y-%m-%d"),
            "timestamp": purchase.created_at,
            "type": "PURCHASE",
            "quantity": item.quantity,
            "reference": purchase.invoice_number
        })

    for item, sale in sales:
        movements.append({
            "date": sale.sale_date.strftime("%Y-%m-%d"),
            "timestamp": sale.created_at,
            "type": "SALE",
            "quantity": -item.quantity,
            "reference": sale.invoice_number
        })

    # Sort by timestamp
    movements.sort(key=lambda x: x["timestamp"])

    # Calculate balance
    balance = 0
    for m in movements:
        balance += m["quantity"]
        m["balance"] = balance
        m["timestamp"] = str(m["timestamp"]) # Convert to string for JSON serialization

    return {
        "success": True,
        "message": "Stock movement fetched",
        "data": movements
    }


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
