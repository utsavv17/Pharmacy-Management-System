from sqlalchemy import Column, Integer, String, Date, Float, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String, nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True, index=True)
    customer_name = Column(String, nullable=True) # Kept for backward compatibility and walk-ins
    sale_date = Column(Date, nullable=False)
    
    subtotal = Column(Float, nullable=False, default=0)
    discount_amount = Column(Float, nullable=False, default=0)
    total_amount = Column(Float, nullable=False, default=0)
    
    # Loyalty
    points_earned = Column(Integer, nullable=False, default=0)
    points_redeemed = Column(Integer, nullable=False, default=0)
    
    # Status: COMPLETED, PARTIALLY_RETURNED, FULLY_RETURNED, CANCELLED
    status = Column(String, nullable=False, default="COMPLETED")
    
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    # Relationships
    customer = relationship("Customer", back_populates="sales")
    items = relationship("SaleItem", back_populates="sale", cascade="all, delete")
    reward_transactions = relationship("RewardTransaction", back_populates="sale")
    returns = relationship("SaleReturn", back_populates="sale")
