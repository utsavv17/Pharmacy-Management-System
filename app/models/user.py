from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="staff")  # 'super_admin', 'owner', 'staff'
    is_active = Column(Integer, default=1)  # 1=true, 0=false
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    
    refresh_tokens = relationship("RefreshToken", back_populates="user")
    organization = relationship("Organization", back_populates="users")
