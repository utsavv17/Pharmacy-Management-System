from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List

from app.db.db import get_db
from app.core.deps import get_current_user, get_current_organization
from app.models.user import User
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse
from app.schemas.sale import SaleResponse
from app.schemas.reward import RewardTransactionResponse
from app.services.customer_service import CustomerService
from app.utils.pagination import Paginator

router = APIRouter(prefix="/customers", tags=["Customers"])

@router.get("/", response_model=dict)
def get_customers(
    page: int = 1,
    limit: int = 20,
    search: str = None,
    active_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org_id: int = Depends(get_current_organization)
):
    query = CustomerService.get_customers_query(db, org_id, search=search, active_only=active_only)
    paginated = Paginator.paginate(query, page, limit)
    
    return {
        "items": [CustomerResponse.model_validate(c) for c in paginated["items"]],
        "pagination": paginated["pagination"]
    }

@router.get("/search", response_model=CustomerResponse)
def search_customer_by_phone(
    phone: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org_id: int = Depends(get_current_organization)
):
    return CustomerService.search_by_phone(db, phone, org_id)

@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org_id: int = Depends(get_current_organization)
):
    return CustomerService.get_customer(db, customer_id, org_id)

@router.post("/", response_model=CustomerResponse)
def create_customer(
    customer_in: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org_id: int = Depends(get_current_organization)
):
    return CustomerService.create_customer(db, customer_in, org_id)

@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: int,
    customer_in: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org_id: int = Depends(get_current_organization)
):
    return CustomerService.update_customer(db, customer_id, customer_in, org_id)

@router.delete("/{customer_id}")
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org_id: int = Depends(get_current_organization)
):
    CustomerService.delete_customer(db, customer_id, org_id)
    return {"success": True, "message": "Customer deleted successfully"}

@router.get("/{customer_id}/sales", response_model=dict)
def get_customer_sales(
    customer_id: int,
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org_id: int = Depends(get_current_organization)
):
    query = CustomerService.get_customer_sales_query(db, customer_id, org_id)
    paginated = Paginator.paginate(query, page, limit)
    
    return {
        "items": [SaleResponse.model_validate(s) for s in paginated["items"]],
        "pagination": paginated["pagination"]
    }

@router.get("/{customer_id}/rewards", response_model=dict)
def get_customer_rewards(
    customer_id: int,
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    org_id: int = Depends(get_current_organization)
):
    query = CustomerService.get_customer_rewards_query(db, customer_id, org_id)
    paginated = Paginator.paginate(query, page, limit)
    
    return {
        "items": [RewardTransactionResponse.model_validate(r) for r in paginated["items"]],
        "pagination": paginated["pagination"]
    }
