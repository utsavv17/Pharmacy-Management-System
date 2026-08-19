from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Tuple
from fastapi import HTTPException

from app.models.customer import Customer
from app.models.sale import Sale
from app.models.reward_transaction import RewardTransaction
from app.schemas.customer import CustomerCreate, CustomerUpdate

class CustomerService:
    @staticmethod
    def get_customers(db: Session, org_id: int, skip: int = 0, limit: int = 100, search: str = None, active_only: bool = False) -> Tuple[List[Customer], int]:
        query = db.query(Customer).filter(Customer.organization_id == org_id)
        
        if active_only:
            query = query.filter(Customer.is_active == True)
            
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    Customer.name.ilike(search_term),
                    Customer.phone.ilike(search_term)
                )
            )
            
        total = query.count()
        customers = query.order_by(Customer.created_at.desc()).offset(skip).limit(limit).all()
        return customers, total

    @staticmethod
    def get_customer(db: Session, customer_id: int, org_id: int) -> Customer:
        customer = db.query(Customer).filter(Customer.id == customer_id, Customer.organization_id == org_id).first()
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        return customer

    @staticmethod
    def create_customer(db: Session, customer_in: CustomerCreate, org_id: int) -> Customer:
        # Check if phone exists
        existing = db.query(Customer).filter(Customer.phone == customer_in.phone, Customer.organization_id == org_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Customer with this phone number already exists")
            
        customer = Customer(**customer_in.model_dump(), organization_id=org_id)
        db.add(customer)
        db.commit()
        db.refresh(customer)
        return customer

    @staticmethod
    def update_customer(db: Session, customer_id: int, customer_in: CustomerUpdate, org_id: int) -> Customer:
        customer = CustomerService.get_customer(db, customer_id, org_id)
        
        update_data = customer_in.model_dump(exclude_unset=True)
        
        # Check phone uniqueness if it's being updated
        if "phone" in update_data and update_data["phone"] != customer.phone:
            existing = db.query(Customer).filter(Customer.phone == update_data["phone"], Customer.organization_id == org_id).first()
            if existing:
                raise HTTPException(status_code=400, detail="Customer with this phone number already exists")
                
        for field, value in update_data.items():
            setattr(customer, field, value)
            
        db.commit()
        db.refresh(customer)
        return customer

    @staticmethod
    def get_customer_sales(db: Session, customer_id: int, org_id: int, skip: int = 0, limit: int = 50) -> Tuple[List[Sale], int]:
        query = db.query(Sale).filter(Sale.customer_id == customer_id, Sale.organization_id == org_id)
        total = query.count()
        sales = query.order_by(Sale.created_at.desc()).offset(skip).limit(limit).all()
        return sales, total

    @staticmethod
    def get_customer_rewards(db: Session, customer_id: int, org_id: int, skip: int = 0, limit: int = 50) -> Tuple[List[RewardTransaction], int]:
        query = db.query(RewardTransaction).filter(RewardTransaction.customer_id == customer_id, RewardTransaction.organization_id == org_id)
        total = query.count()
        rewards = query.order_by(RewardTransaction.created_at.desc()).offset(skip).limit(limit).all()
        return rewards, total
