from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Any

from app.core.deps import get_current_user
from app.main import get_db
from app.models.user import User
from app.schemas.search import GlobalSearchResponse
from app.services.search_service import search_service

router = APIRouter(prefix="/search", tags=["search"])

@router.get("/", response_model=GlobalSearchResponse)
def global_search(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Search across multiple entities globally (medicines, customers, batches, sales, suppliers).
    """
    return search_service.global_search(
        db=db,
        organization_id=str(current_user.organization_id),
        query=q
    )
