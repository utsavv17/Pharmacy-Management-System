from sqlalchemy.orm import Session
from datetime import date
from app.models.batch import Batch
from app.models.medicine import Medicine


class InventoryService:

    @staticmethod
    def get_medicine_stock(db: Session, medicine_id: int, org_id: int):
        """Total available stock for a medicine (sum of all batches)"""
        batches = db.query(Batch).filter(
            Batch.medicine_id == medicine_id,
            Batch.organization_id == org_id,
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
    def get_low_stock(db: Session, org_id: int, limit: int = 20):
        """Medicines with stock <= minimum_stock_level"""
        from sqlalchemy import func
        
        query = (
            db.query(
                Medicine.id,
                Medicine.name,
                Medicine.minimum_stock_level,
                func.coalesce(func.sum(Batch.quantity), 0).label("total_stock")
            )
            .outerjoin(Batch, (Batch.medicine_id == Medicine.id) & (Batch.organization_id == org_id))
            .filter(Medicine.organization_id == org_id)
            .group_by(Medicine.id)
            .having(func.coalesce(func.sum(Batch.quantity), 0) <= Medicine.minimum_stock_level)
            .limit(limit)
        )

        result = []
        for row in query.all():
            result.append({
                "medicine_id": row.id,
                "name": row.name,
                "total_stock": row.total_stock,
                "minimum_stock_level": row.minimum_stock_level
            })

        return result

    @staticmethod
    def get_near_expiry(db: Session, org_id: int, days: int = 30):
        """Batches expiring within X days"""
        today = date.today()

        batches = db.query(Batch).filter(
            Batch.organization_id == org_id,
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
    def get_expired(db: Session, org_id: int):
        """Batches already expired"""
        today = date.today()

        batches = db.query(Batch).filter(
            Batch.organization_id == org_id,
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
