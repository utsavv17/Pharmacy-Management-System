from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class RewardTransaction(Base):
    __tablename__ = "reward_transactions"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=True, index=True)
    return_id = Column(Integer, ForeignKey("sale_returns.id"), nullable=True, index=True)
    
    # EARN, REDEEM, REFUND_REVERSAL, MANUAL_ADJUSTMENT
    type = Column(String, nullable=False)
    
    points = Column(Integer, nullable=False)
    balance_after = Column(Integer, nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)

    # Relationships
    customer = relationship("Customer", back_populates="reward_transactions")
    sale = relationship("Sale", back_populates="reward_transactions")
    sale_return = relationship("SaleReturn", back_populates="reward_transactions")
    organization = relationship("Organization")
