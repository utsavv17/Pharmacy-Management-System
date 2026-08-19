from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_current_organization
from app.main import get_db
from app.schemas.settings import SettingsUpdate
from app.services.settings_service import SettingsService

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get("/")
def get_settings(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    org_id: int = Depends(get_current_organization)
):
    settings = SettingsService.get_settings(db, org_id)
    return {
        "success": True,
        "message": "Settings fetched successfully",
        "data": settings
    }


@router.put("/")
def update_settings(
    payload: SettingsUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    org_id: int = Depends(get_current_organization)
):
    settings = SettingsService.update_settings(db, payload, org_id)
    return {
        "success": True,
        "message": "Settings updated successfully",
        "data": settings
    }
