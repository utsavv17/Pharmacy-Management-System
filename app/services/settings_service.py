from sqlalchemy.orm import Session
from app.models.settings import Settings


class SettingsService:

    @staticmethod
    def get_settings(db: Session, org_id: int):
        return db.query(Settings).filter(Settings.organization_id == org_id).first()

    @staticmethod
    def update_settings(db: Session, data, org_id: int):
        settings = db.query(Settings).filter(Settings.organization_id == org_id).first()
        if not settings:
            settings = Settings(organization_id=org_id)
            db.add(settings)
            db.flush()
        for key, value in data.dict().items():
            setattr(settings, key, value)
        db.commit()
        db.refresh(settings)
        return settings
