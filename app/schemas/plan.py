from pydantic import BaseModel
from typing import Optional

class PlanBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float = 0.0
    billing_cycle: str = "monthly"
    max_users: int = 5
    max_products: int = 1000
    max_monthly_transactions: int = 5000
    features: Optional[str] = None
    is_active: bool = True

class PlanCreate(PlanBase):
    pass

class PlanUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    billing_cycle: Optional[str] = None
    max_users: Optional[int] = None
    max_products: Optional[int] = None
    max_monthly_transactions: Optional[int] = None
    features: Optional[str] = None
    is_active: Optional[bool] = None

class PlanResponse(PlanBase):
    id: int

    class Config:
        from_attributes = True
