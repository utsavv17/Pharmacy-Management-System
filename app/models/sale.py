from sqlalchemy import Column, Integer, String, Date, Float
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String, nullable=False)
    customer_name = Column(String, nullable=True)
    sale_date = Column(Date, nullable=False)
    total_amount = Column(Float, nullable=False, default=0)

    items = relationship("SaleItem", back_populates="sale", cascade="all, delete")
