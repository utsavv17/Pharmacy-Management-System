from sqlalchemy import Column, Integer, String, Date, Float
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Purchase(Base):
    __tablename__ = "purchases"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String, nullable=False)
    supplier_name = Column(String, nullable=True)
    purchase_date = Column(Date, nullable=False)
    total_amount = Column(Float, nullable=False, default=0)

    items = relationship("PurchaseItem", back_populates="purchase", cascade="all, delete")
