from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_current_organization
from app.main import get_db
from app.schemas.supplier import SupplierCreate, SupplierUpdate
from app.services.supplier_service import SupplierService
from app.utils.pagination import Paginator
from app.models.supplier import Supplier


router = APIRouter(prefix="/suppliers", tags=["Suppliers"])


@router.post("/create")
def create_supplier(
    payload: SupplierCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    org_id: int = Depends(get_current_organization)
):
    supplier = SupplierService.create_supplier(db, payload, org_id)

    return {
        "success": True,
        "message": "Supplier created successfully",
        "data": supplier
    }


@router.get("/")
def list_suppliers(
    search: str | None = None,
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    org_id: int = Depends(get_current_organization)
):
    query = db.query(Supplier).filter(Supplier.organization_id == org_id)

    if search:
        s = f"%{search}%"
        query = query.filter(
            Supplier.name.ilike(s) |
            Supplier.company_name.ilike(s)
        )

    paginated = Paginator.paginate(query, page, limit)

    return {
        "success": True,
        "message": "Suppliers fetched successfully",
        "data": {
            "items": paginated["items"],
            "pagination": paginated["pagination"]
        }
    }


@router.get("/{supplier_id}")
def get_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    org_id: int = Depends(get_current_organization)
):
    supplier = SupplierService.get_supplier(db, supplier_id, org_id)
    if not supplier:
        return {
            "success": False,
            "message": "Supplier not found",
            "error": "NOT_FOUND"
        }
        
    return {
        "success": True,
        "message": "Supplier fetched successfully",
        "data": supplier
    }


@router.put("/{supplier_id}")
def update_supplier(
    supplier_id: int,
    payload: SupplierUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    org_id: int = Depends(get_current_organization)
):
    supplier, error = SupplierService.update_supplier(db, supplier_id, payload, org_id)
    
    if error == "NOT_FOUND":
        return {
            "success": False,
            "message": "Supplier not found",
            "error": "NOT_FOUND"
        }
        
    return {
        "success": True,
        "message": "Supplier updated successfully",
        "data": supplier
    }


@router.delete("/{supplier_id}")
def delete_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    org_id: int = Depends(get_current_organization)
):
    error = SupplierService.delete_supplier(db, supplier_id, org_id)
    
    if error == "NOT_FOUND":
        return {
            "success": False,
            "message": "Supplier not found",
            "error": "NOT_FOUND"
        }
        
    return {
        "success": True,
        "message": "Supplier deleted successfully"
    }
