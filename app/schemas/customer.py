from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class CustomerBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    phone: str = Field(..., min_length=5, max_length=20)
    email: Optional[str] = None
    address: Optional[str] = None
    is_active: bool = True

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, min_length=5, max_length=20)
    email: Optional[str] = None
    address: Optional[str] = None
    is_active: Optional[bool] = None

class CustomerResponse(CustomerBase):
    id: int
    total_points: int
    total_purchase_amount: float
    total_orders: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
