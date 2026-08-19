from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class RewardTransactionResponse(BaseModel):
    id: int
    customer_id: int
    sale_id: Optional[int]
    return_id: Optional[int]
    type: str # EARN, REDEEM, REFUND_REVERSAL, MANUAL_ADJUSTMENT
    points: int
    balance_after: int
    description: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
