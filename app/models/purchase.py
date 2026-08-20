from sqlalchemy import Column, Integer, String, Date, Float, DateTime, func, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Purchase(Base):
    __tablename__ = "purchases"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String, nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True, index=True)
    supplier_name = Column(String, nullable=True) # Kept for backwards compatibility
    purchase_date = Column(Date, nullable=False)
    total_amount = Column(Float, nullable=False, default=0)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)

    items = relationship("PurchaseItem", back_populates="purchase", cascade="all, delete")
    supplier = relationship("Supplier")
    organization = relationship("Organization")
