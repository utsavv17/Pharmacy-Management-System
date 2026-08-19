from sqlalchemy.orm import Session
from app.models.medicine import Medicine


class MedicineService:

    @staticmethod
    def create(db: Session, data, org_id: int):
        # Check duplicate medicine by name in the same org
        existing = db.query(Medicine).filter(Medicine.name == data.name, Medicine.organization_id == org_id).first()
        if existing:
            return None, "MEDICINE_EXISTS"

        med = Medicine(**data.dict(), organization_id=org_id)
        db.add(med)
        db.commit()
        db.refresh(med)
        return med, None

    @staticmethod
    def get_all(db: Session, org_id: int):
        return db.query(Medicine).filter(Medicine.organization_id == org_id).order_by(Medicine.id.desc()).all()

    @staticmethod
    def get_by_id(db: Session, id: int, org_id: int):
        return db.query(Medicine).filter(Medicine.id == id, Medicine.organization_id == org_id).first()

    @staticmethod
    def update(db: Session, id: int, data, org_id: int):
        med = db.query(Medicine).filter(Medicine.id == id, Medicine.organization_id == org_id).first()
        if not med:
            return None, "NOT_FOUND"

        for field, value in data.dict(exclude_unset=True).items():
            setattr(med, field, value)

        db.commit()
        db.refresh(med)
        return med, None

    @staticmethod
    def delete(db: Session, id: int, org_id: int):
        med = db.query(Medicine).filter(Medicine.id == id, Medicine.organization_id == org_id).first()
        if not med:
            return "NOT_FOUND"

        db.delete(med)
        db.commit()
        return None
