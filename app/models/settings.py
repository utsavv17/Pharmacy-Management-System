from sqlalchemy import Column, Integer, String, Text, Float
from app.db.base_class import Base


class Settings(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)   # Always 1 for singleton
    pharmacy_name = Column(String, nullable=False, default="My Pharmacy")
    address = Column(Text, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    invoice_footer = Column(Text, nullable=True)
    
    # Loyalty configuration
    currency_units_per_point = Column(Integer, nullable=False, default=100) # e.g. Rs 100 = 1 point
    minimum_redemption_points = Column(Integer, nullable=False, default=100)
    point_value = Column(Float, nullable=False, default=0.1) # e.g. 1 point = Rs 0.1 discount
    maximum_points_per_sale = Column(Integer, nullable=False, default=1000)
