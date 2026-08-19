from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    generic_name = Column(String, nullable=True)
    brand = Column(String, nullable=True)
    category = Column(String, nullable=True)   # tablet, syrup, injection
    unit = Column(String, nullable=True)       # strip, bottle, piece
    strength = Column(String, nullable=True)   # 500mg, 100mg etc.
    barcode = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    minimum_stock_level = Column(Integer, default=20, nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    
    batches = relationship("Batch", back_populates="medicine", cascade="all, delete")
    organization = relationship("Organization")
