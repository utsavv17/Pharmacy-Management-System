from sqlalchemy import Column, Integer, String, Float, Boolean, Text
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Plan(Base):
    __tablename__ = "plans"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False, default=0.0)
    billing_cycle = Column(String, default="monthly") # monthly, yearly
    max_users = Column(Integer, default=5)
    max_products = Column(Integer, default=1000)
    max_monthly_transactions = Column(Integer, default=5000)
    features = Column(Text, nullable=True) # JSON or comma separated string
    is_active = Column(Boolean, default=True)

    organizations = relationship("Organization", back_populates="plan")
