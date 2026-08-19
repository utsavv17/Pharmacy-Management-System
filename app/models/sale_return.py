from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class SaleReturn(Base):
    __tablename__ = "sale_returns"

    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True, index=True)
    refund_amount = Column(Float, nullable=False, default=0.0)
    reason = Column(String, nullable=False)
    
    # COMPLETED, CANCELLED
    status = Column(String, nullable=False, default="COMPLETED")
    processed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)

    # Relationships
    sale = relationship("Sale", back_populates="returns")
    customer = relationship("Customer", back_populates="returns")
    processor = relationship("User")
    items = relationship("SaleReturnItem", back_populates="sale_return", cascade="all, delete-orphan")
    reward_transactions = relationship("RewardTransaction", back_populates="sale_return")
    organization = relationship("Organization")


class SaleReturnItem(Base):
    __tablename__ = "sale_return_items"

    id = Column(Integer, primary_key=True, index=True)
    return_id = Column(Integer, ForeignKey("sale_returns.id"), nullable=False, index=True)
    sale_item_id = Column(Integer, ForeignKey("sale_items.id"), nullable=False, index=True)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=False)
    
    quantity = Column(Integer, nullable=False)
    refund_amount = Column(Float, nullable=False, default=0.0)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)

    # Relationships
    sale_return = relationship("SaleReturn", back_populates="items")
    sale_item = relationship("SaleItem")
    batch = relationship("Batch")
    organization = relationship("Organization")
