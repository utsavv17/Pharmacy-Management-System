from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    legal_name = Column(String, nullable=True)
    owner_name = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True)
    phone = Column(String, nullable=False)
    address = Column(String, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    pincode = Column(String, nullable=True)
    gst_number = Column(String, nullable=True)
    drug_license_number = Column(String, nullable=True)
    
    status = Column(String, default="ACTIVE") # ACTIVE, SUSPENDED, INACTIVE
    plan_id = Column(Integer, ForeignKey("plans.id"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    plan = relationship("Plan", back_populates="organizations")
    users = relationship("User", back_populates="organization")
