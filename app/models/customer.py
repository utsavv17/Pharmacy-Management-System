from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, func, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    phone = Column(String, index=True, nullable=False, unique=True)
    email = Column(String, nullable=True)
    address = Column(String, nullable=True)
    
    # Cached summaries
    total_points = Column(Integer, default=0, nullable=False)
    total_purchase_amount = Column(Float, default=0.0, nullable=False)
    total_orders = Column(Integer, default=0, nullable=False)
    
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)

    # Relationships
    sales = relationship("Sale", back_populates="customer")
    reward_transactions = relationship("RewardTransaction", back_populates="customer", cascade="all, delete-orphan")
    returns = relationship("SaleReturn", back_populates="customer")
    organization = relationship("Organization")
