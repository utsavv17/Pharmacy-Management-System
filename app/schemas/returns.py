from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional

class SaleReturnItemCreate(BaseModel):
    sale_item_id: int
    quantity: int = Field(..., gt=0)

class SaleReturnCreate(BaseModel):
    sale_id: int
    reason: str = Field(..., min_length=1, max_length=255)
    items: List[SaleReturnItemCreate] = Field(..., min_length=1)

class SaleReturnItemResponse(BaseModel):
    id: int
    return_id: int
    sale_item_id: int
    batch_id: int
    quantity: int
    refund_amount: float

    class Config:
        from_attributes = True

class SaleReturnResponse(BaseModel):
    id: int
    sale_id: int
    customer_id: Optional[int]
    refund_amount: float
    reason: str
    status: str
    processed_by: Optional[int]
    created_at: datetime
    items: List[SaleReturnItemResponse]

    class Config:
        from_attributes = True
