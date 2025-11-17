from app.models.settings import Settings
from app.db.session import SessionLocal

# Ensure settings table has one record
def initialize_settings():
    db = SessionLocal()
    exists = db.query(Settings).first()
    if not exists:
        default_settings = Settings(
            id=1,
            pharmacy_name="My Pharmacy",
            address="",
            phone="",
            email="",
            invoice_footer="Thank you for visiting!"
        )
        db.add(default_settings)
        db.commit()
    db.close()
