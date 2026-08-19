from pydantic import BaseModel
from datetime import date, datetime
from typing import List

class SaleItemCreate(BaseModel):
    medicine_id: int
    quantity: int


class SaleCreate(BaseModel):
    invoice_number: str | None = None
    customer_id: int | None = None
    customer_name: str | None = None
    sale_date: date | None = None
    discount_amount: float = 0
    points_redeemed: int = 0
    items: List[SaleItemCreate]


class SaleItemResponse(BaseModel):
    id: int
    medicine_id: int
    batch_id: int
    quantity: int
    selling_price: float

    class Config:
        from_attributes = True

class SaleResponse(BaseModel):
    id: int
    invoice_number: str
    customer_id: int | None
    customer_name: str | None
    sale_date: date
    subtotal: float
    discount_amount: float
    points_earned: int
    points_redeemed: int
    total_amount: float
    status: str
    created_at: datetime | None
    items: List[SaleItemResponse]

    class Config:
        from_attributes = True
