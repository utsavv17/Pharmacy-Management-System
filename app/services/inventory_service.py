from sqlalchemy.orm import Session
from datetime import date
from app.models.batch import Batch
from app.models.medicine import Medicine


class InventoryService:

    @staticmethod
    def get_medicine_stock(db: Session, medicine_id: int):
        """Total available stock for a medicine (sum of all batches)"""
        batches = db.query(Batch).filter(
            Batch.medicine_id == medicine_id,
            Batch.quantity > 0
        ).all()

        total_stock = sum(b.quantity for b in batches)

        return {
            "medicine_id": medicine_id,
            "total_stock": total_stock,
            "batches": [
                {
                    "batch_id": b.id,
                    "batch_no": b.batch_no,
                    "expiry_date": b.expiry_date,
                    "quantity": b.quantity
                }
                for b in batches
            ]
        }

    @staticmethod
    def get_low_stock(db: Session, limit: int = 20):
        """Medicines with stock <= minimum_stock_level"""
        medicines = db.query(Medicine).all()

        result = []

        for m in medicines:
            total_stock = sum(b.quantity for b in m.batches)
            if total_stock <= m.minimum_stock_level:
                result.append({
                    "medicine_id": m.id,
                    "name": m.name,
                    "total_stock": total_stock,
                    "minimum_stock_level": m.minimum_stock_level
                })

        return result

    @staticmethod
    def get_near_expiry(db: Session, days: int = 30):
        """Batches expiring within X days"""
        today = date.today()

        batches = db.query(Batch).filter(
            Batch.expiry_date <= today.replace(day=today.day) +  # safe month edges
            (date.fromordinal(today.toordinal() + days) - today)  # offset
        ).all()

        return [
            {
                "batch_id": b.id,
                "medicine_id": b.medicine_id,
                "batch_no": b.batch_no,
                "expiry_date": b.expiry_date,
                "quantity": b.quantity
            }
            for b in batches
        ]

    @staticmethod
    def get_expired(db: Session):
        """Batches already expired"""
        today = date.today()

        batches = db.query(Batch).filter(
            Batch.expiry_date < today
        ).all()

        return [
            {
                "batch_id": b.id,
                "medicine_id": b.medicine_id,
                "batch_no": b.batch_no,
                "expiry_date": b.expiry_date,
                "quantity": b.quantity
            }
            for b in batches
        ]
