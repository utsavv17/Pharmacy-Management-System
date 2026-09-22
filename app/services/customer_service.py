from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Tuple
from fastapi import HTTPException

from app.models.customer import Customer
from app.models.sale import Sale
from app.models.reward_transaction import RewardTransaction
from app.schemas.customer import CustomerCreate, CustomerUpdate

import re

class CustomerService:
    @staticmethod
    def normalize_phone(phone: str) -> str:
        """Normalize Indian phone numbers to 10 digits if possible."""
        if not phone:
            return ""
        cleaned = re.sub(r'[^\d+]', '', phone)
        if cleaned.startswith("+91"):
            cleaned = cleaned[3:]
        elif cleaned.startswith("91") and len(cleaned) == 12:
            cleaned = cleaned[2:]
        return cleaned

    @staticmethod
    def search_by_phone(db: Session, phone: str, org_id: int) -> Customer:
        normalized = CustomerService.normalize_phone(phone)
        if not normalized:
            raise HTTPException(status_code=400, detail="Invalid phone number")
        customer = db.query(Customer).filter(Customer.phone == normalized, Customer.organization_id == org_id).first()
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        return customer

    @staticmethod
    def get_customers_query(db: Session, org_id: int, search: str = None, active_only: bool = False):
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
            
        return query.order_by(Customer.created_at.desc())

    @staticmethod
    def get_customer(db: Session, customer_id: int, org_id: int) -> Customer:
        customer = db.query(Customer).filter(Customer.id == customer_id, Customer.organization_id == org_id).first()
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        return customer

    @staticmethod
    def create_customer(db: Session, customer_in: CustomerCreate, org_id: int) -> Customer:
        # Normalize phone
        customer_in.phone = CustomerService.normalize_phone(customer_in.phone)
        
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
        
        if "phone" in update_data:
            update_data["phone"] = CustomerService.normalize_phone(update_data["phone"])
            
            # Check phone uniqueness if it's being updated
            if update_data["phone"] != customer.phone:
                existing = db.query(Customer).filter(Customer.phone == update_data["phone"], Customer.organization_id == org_id).first()
                if existing:
                    raise HTTPException(status_code=400, detail="Customer with this phone number already exists")
                
        for field, value in update_data.items():
            setattr(customer, field, value)
            
        db.commit()
        db.refresh(customer)
        return customer

    @staticmethod
    def delete_customer(db: Session, customer_id: int, org_id: int) -> None:
        customer = CustomerService.get_customer(db, customer_id, org_id)
        db.delete(customer)
        db.commit()

    @staticmethod
    def get_customer_sales_query(db: Session, customer_id: int, org_id: int):
        query = db.query(Sale).filter(Sale.customer_id == customer_id, Sale.organization_id == org_id)
        return query.order_by(Sale.created_at.desc())

    @staticmethod
    def get_customer_rewards_query(db: Session, customer_id: int, org_id: int):
        query = db.query(RewardTransaction).filter(RewardTransaction.customer_id == customer_id, RewardTransaction.organization_id == org_id)
        return query.order_by(RewardTransaction.created_at.desc())
