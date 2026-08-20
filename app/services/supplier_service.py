from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models.supplier import Supplier


class SupplierService:

    @staticmethod
    def create_supplier(db: Session, data, org_id: int):
        supplier = Supplier(**data.dict(), organization_id=org_id)
        db.add(supplier)
        db.commit()
        db.refresh(supplier)
        return supplier

    @staticmethod
    def get_supplier(db: Session, supplier_id: int, org_id: int):
        return db.query(Supplier).filter(Supplier.id == supplier_id, Supplier.organization_id == org_id).first()

    @staticmethod
    def update_supplier(db: Session, supplier_id: int, payload, org_id: int):
        supplier = db.query(Supplier).filter(Supplier.id == supplier_id, Supplier.organization_id == org_id).first()
        if not supplier:
            return None, "NOT_FOUND"
        
        update_data = payload.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(supplier, key, value)
            
        db.commit()
        db.refresh(supplier)
        return supplier, None

    @staticmethod
    def delete_supplier(db: Session, supplier_id: int, org_id: int):
        supplier = db.query(Supplier).filter(Supplier.id == supplier_id, Supplier.organization_id == org_id).first()
        if not supplier:
            return "NOT_FOUND"
        try:
            db.delete(supplier)
            db.commit()
            return None
        except IntegrityError:
            db.rollback()
            return "HAS_RELATED_RECORDS"
