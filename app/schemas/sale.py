from pydantic import BaseModel
from datetime import date
from typing import List

class SaleItemCreate(BaseModel):
    medicine_id: int
    quantity: int


class SaleCreate(BaseModel):
    invoice_number: str | None = None
    customer_name: str | None = None
    sale_date: date | None = None
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
    customer_name: str | None
    sale_date: date
    total_amount: float
    items: List[SaleItemResponse]

    class Config:
        from_attributes = True


class SaleResponse(BaseModel):
    id: int
    invoice_number: str
    customer_name: str | None
    sale_date: date
    total_amount: float
    items: List[SaleItemResponse]

    class Config:
        from_attributes = True
