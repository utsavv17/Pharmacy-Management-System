from pydantic import BaseModel
from datetime import date, datetime
from typing import List
from app.schemas.medicine import MedicineCreateSchema

class POSPurchaseItemCreate(BaseModel):
    supplier_id: int | None = None
    supplier_name: str | None = None
    purchase_date: date
    batch_no: str
    expiry_date: date
    purchase_price: float
    selling_price: float
    quantity: int

class POSMedicinePurchaseCreate(BaseModel):
    medicine: MedicineCreateSchema
    purchase: POSPurchaseItemCreate

class SaleItemCreate(BaseModel):
    medicine_id: int
    quantity: int


class SaleCreate(BaseModel):
    invoice_number: str | None = None
    customer_id: int | None = None
    customer_name: str | None = None
    customer_phone: str | None = None
    customer_email: str | None = None
    customer_address: str | None = None
    sale_date: date | None = None
    discount_amount: float = 0
    points_redeemed: int = 0
    payment_method: str | None = "CASH"
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
    payment_method: str
    created_at: datetime | None
    items: List[SaleItemResponse]

    class Config:
        from_attributes = True
