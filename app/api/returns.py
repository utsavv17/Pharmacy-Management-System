from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.db.db import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.returns import SaleReturnCreate, SaleReturnResponse
from app.services.return_service import ReturnService

router = APIRouter(prefix="/returns", tags=["Returns"])

@router.post("/create", response_model=SaleReturnResponse)
def create_return(
    return_in: SaleReturnCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return ReturnService.process_return(db, return_in, current_user.id)
