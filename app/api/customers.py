from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List

from app.db.db import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse
from app.schemas.sale import SaleResponse
from app.schemas.reward import RewardTransactionResponse
from app.services.customer_service import CustomerService

router = APIRouter(prefix="/customers", tags=["Customers"])

@router.get("/", response_model=dict)
def get_customers(
    skip: int = 0,
    limit: int = 100,
    search: str = None,
    active_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    customers, total = CustomerService.get_customers(db, skip=skip, limit=limit, search=search, active_only=active_only)
    # converting to schema here so we can return total
    return {
        "items": [CustomerResponse.model_validate(c) for c in customers],
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return CustomerService.get_customer(db, customer_id)

@router.post("/", response_model=CustomerResponse)
def create_customer(
    customer_in: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return CustomerService.create_customer(db, customer_in)

@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: int,
    customer_in: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return CustomerService.update_customer(db, customer_id, customer_in)

@router.get("/{customer_id}/sales", response_model=dict)
def get_customer_sales(
    customer_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sales, total = CustomerService.get_customer_sales(db, customer_id, skip=skip, limit=limit)
    return {
        "items": [SaleResponse.model_validate(s) for s in sales],
        "total": total
    }

@router.get("/{customer_id}/rewards", response_model=dict)
def get_customer_rewards(
    customer_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rewards, total = CustomerService.get_customer_rewards(db, customer_id, skip=skip, limit=limit)
    return {
        "items": [RewardTransactionResponse.model_validate(r) for r in rewards],
        "total": total
    }
