from app.models.settings import Settings
from app.db.session import SessionLocal


def initialize_settings():
    db = SessionLocal()
    try:
        exists = db.query(Settings).first()

        if not exists:
            print("No organization-specific settings found. Skipping default settings initialization.")
    finally:
        db.close()