from sqlalchemy import Column, Integer, String, Date, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Batch(Base):
    __tablename__ = "batches"

    id = Column(Integer, primary_key=True, index=True)
    batch_no = Column(String, nullable=False)
    expiry_date = Column(Date, nullable=False)
    purchase_price = Column(Float, nullable=False)
    selling_price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False, default=0)

    medicine_id = Column(Integer, ForeignKey("medicines.id"), nullable=False)

    # relationship
    medicine = relationship("Medicine", back_populates="batches")
