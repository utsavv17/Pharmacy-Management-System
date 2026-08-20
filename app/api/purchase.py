from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.models.purchase import Purchase
from app.schemas.purchase import PurchaseCreate, PurchaseResponse
from typing import List
from app.services.purchase_service import PurchaseService
from app.core.deps import get_current_user, get_current_organization
from app.main import get_db
from app.utils.pagination import Paginator
from app.models.purchase import Purchase
from app.models.supplier import Supplier
from app.models.medicine import Medicine
import hashlib
from fastapi import UploadFile, File, HTTPException
from app.services.invoice_parser.text_parser import TextInvoiceParser
from app.services.matching_service import MatchingService
from app.schemas.invoice import InvoiceConfirmPayload, InvoiceExtractionResult

router = APIRouter(prefix="/purchases", tags=["Purchases"])

@router.post("/create")
def create_purchase(
    payload: PurchaseCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    org_id: int = Depends(get_current_organization)
):

    # Create purchase + items + batches
    purchase = PurchaseService.create_purchase(db, payload, org_id)

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
            "created_at": purchase.created_at,
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

@router.post("/bulk-create")
def create_multiple_purchases(
    purchases: List[PurchaseCreate],
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    org_id: int = Depends(get_current_organization)
):
    created_purchases = []
    errors = []
    
    for i, purchase_data in enumerate(purchases):
        try:
            purchase = PurchaseService.create_purchase(db, purchase_data, org_id)
            created_purchases.append({
                "id": purchase.id,
                "invoice_number": purchase.invoice_number,
                "supplier_name": purchase.supplier_name,
                "purchase_date": purchase.purchase_date,
                "total_amount": purchase.total_amount
            })
        except Exception as e:
            errors.append({
                "index": i,
                "invoice_number": purchase_data.invoice_number,
                "error": str(e)
            })
    
    return {
        "success": len(errors) == 0,
        "message": f"Created {len(created_purchases)} purchases" + (f", {len(errors)} failed" if errors else ""),
        "data": {
            "created": created_purchases,
            "errors": errors,
            "summary": {
                "total_requested": len(purchases),
                "created_count": len(created_purchases),
                "error_count": len(errors)
            }
        }
    }

# List purchases
@router.get("/")
def list_purchases(
    search: str | None = None,    # invoice or supplier
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    org_id: int = Depends(get_current_organization)
):

    query = db.query(Purchase).filter(Purchase.organization_id == org_id)

    if search:
        s = f"%{search}%"
        query = query.filter(
            (Purchase.invoice_number.ilike(s)) |
            (Purchase.supplier_name.ilike(s))
        )

    query = query.order_by(Purchase.created_at.desc())
    paginated = Paginator.paginate(query, page, limit)

    return {
        "success": True,
        "message": "Purchases fetched",
        "data": {
            "items": [
                {
                    "id": p.id,
                    "invoice_number": p.invoice_number,
                    "supplier_name": p.supplier_name,
                    "purchase_date": p.purchase_date,
                    "total_amount": p.total_amount,
                    "created_at": p.created_at
                }
                for p in paginated["items"]
            ],
            "pagination": paginated["pagination"]
        }
    }


# Get purchase by ID
@router.get("/{purchase_id}")
def get_purchase(
    purchase_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    org_id: int = Depends(get_current_organization)
):
    purchase = db.query(Purchase).filter(Purchase.id == purchase_id, Purchase.organization_id == org_id).first()

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
            "created_at": purchase.created_at,
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

@router.post("/import-invoice")
async def import_invoice(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    org_id: int = Depends(get_current_organization)
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
        
    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Empty file uploaded.")
        
    file_hash = hashlib.sha256(content).hexdigest()
    
    # Duplicate Check
    existing = db.query(Purchase).filter(
        Purchase.organization_id == org_id,
        Purchase.invoice_file_hash == file_hash
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"This invoice has already been imported on {existing.created_at.date() if existing.created_at else 'unknown date'} (Purchase ID: {existing.id})"
        )
        
    # Write to a temp file for pdfplumber
    import tempfile
    import os
    
    fd, temp_path = tempfile.mkstemp(suffix=".pdf")
    try:
        with os.fdopen(fd, 'wb') as f:
            f.write(content)
            
        with open(temp_path, 'rb') as f:
            parser = TextInvoiceParser()
            result = parser.parse(f, file.filename, file_hash)
            
        # Run matching
        result = MatchingService.process_extraction(db, org_id, result)
        
        return {
            "success": True,
            "message": "Invoice analyzed successfully.",
            "data": result.model_dump()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse invoice: {str(e)}")
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


@router.post("/import-invoice/confirm")
def confirm_imported_invoice(
    payload: InvoiceConfirmPayload,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    org_id: int = Depends(get_current_organization)
):
    # 1. Duplicate check again to be safe
    existing = db.query(Purchase).filter(
        Purchase.organization_id == org_id,
        Purchase.invoice_file_hash == payload.file_hash
    ).first()
    
    if existing:
        raise HTTPException(status_code=409, detail="This invoice has already been imported.")
        
    # 2. Supplier Resolution
    supplier_id = payload.supplier_id
    if payload.create_supplier and payload.supplier_details and payload.supplier_details.name:
        # Create missing supplier
        new_supplier = Supplier(
            name=payload.supplier_details.name,
            phone=payload.supplier_details.phone or "N/A",
            email=payload.supplier_details.email,
            address=payload.supplier_details.address,
            organization_id=org_id
        )
        db.add(new_supplier)
        db.flush()
        supplier_id = new_supplier.id
        
    if not supplier_id:
        raise HTTPException(status_code=400, detail="Supplier could not be resolved.")
        
    # Get supplier name for purchase
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    
    # 3. Create mapping to PurchaseCreate
    from app.schemas.purchase import PurchaseCreate, PurchaseItemCreate
    
    purchase_items = []
    for item in payload.items:
        med_id = item.medicine_id
        if item.create_medicine and item.product_name:
            new_med = Medicine(
                name=item.product_name,
                manufacturer=item.manufacturer or "Unknown",
                category="General",
                unit="Unit",
                organization_id=org_id
            )
            db.add(new_med)
            db.flush()
            med_id = new_med.id
            
        if not med_id:
            raise HTTPException(status_code=400, detail=f"Medicine '{item.product_name}' could not be resolved.")
            
        purchase_items.append(
            PurchaseItemCreate(
                medicine_id=med_id,
                batch_no=item.batch_no,
                expiry_date=item.expiry_date,
                purchase_price=item.purchase_price,
                selling_price=item.mrp,
                quantity=item.quantity + item.free_quantity
            )
        )
        
    # 4. Construct PurchaseCreate
    purchase_data = PurchaseCreate(
        invoice_number=payload.invoice_number or f"IMPORT-{payload.file_hash[:8]}",
        supplier_id=supplier_id,
        supplier_name=supplier.name if supplier else None,
        purchase_date=payload.invoice_date,
        items=purchase_items,
        invoice_source="IMPORTED",
        original_invoice_filename=payload.source_filename,
        invoice_file_hash=payload.file_hash,
        supplier_invoice_number=payload.invoice_number
    )
    
    # 5. Use existing PurchaseService
    try:
        purchase = PurchaseService.create_purchase(db, purchase_data, org_id)
        
        return {
            "success": True,
            "message": "Invoice imported successfully.",
            "data": {
                "purchase_id": purchase.id,
                "invoice_number": purchase.invoice_number,
                "items_count": len(purchase.items),
                "total_quantity": sum(i.quantity for i in purchase.items),
                "total_amount": purchase.total_amount
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to import purchase: {str(e)}")
