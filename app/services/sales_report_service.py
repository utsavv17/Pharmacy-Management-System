from sqlalchemy.orm import Session
from datetime import date, datetime
from sqlalchemy import func
from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.medicine import Medicine


class SalesReportService:

    @staticmethod
    def daily_sales(db: Session, target_date: date, org_id: int):
        # total sale amount
        total_amount = (
            db.query(func.sum(Sale.total_amount))
            .filter(Sale.sale_date == target_date, Sale.organization_id == org_id)
            .scalar()
        ) or 0

        # total items sold
        total_items = (
            db.query(func.sum(SaleItem.quantity))
            .join(Sale)
            .filter(Sale.sale_date == target_date, Sale.organization_id == org_id)
            .scalar()
        ) or 0

        return {
            "date": target_date,
            "total_amount": float(total_amount),
            "total_items": int(total_items)
        }

    @staticmethod
    def monthly_sales(db: Session, year: int, month: int, org_id: int):
        # first and last date of month
        first_day = date(year, month, 1)
        last_day = date(year, month, 28)
        while True:
            try:
                last_day = date(year, month, last_day.day + 1)
            except:
                break

        # total sale amount in month
        total_amount = (
            db.query(func.sum(Sale.total_amount))
            .filter(Sale.sale_date >= first_day, Sale.sale_date < last_day, Sale.organization_id == org_id)
            .scalar()
        ) or 0

        # daily breakdown
        daily_data = (
            db.query(
                Sale.sale_date,
                func.sum(Sale.total_amount).label("day_total")
            )
            .filter(Sale.sale_date >= first_day, Sale.sale_date < last_day, Sale.organization_id == org_id)
            .group_by(Sale.sale_date)
            .order_by(Sale.sale_date)
            .all()
        )

        breakdown = [
            {
                "date": str(day.sale_date),
                "total": float(day.day_total)
            }
            for day in daily_data
        ]

        return {
            "year": year,
            "month": month,
            "total_amount": float(total_amount),
            "daily_breakdown": breakdown
        }

    @staticmethod
    def sales_by_medicine(db: Session, medicine_id: int, org_id: int):
        # get medicine info
        medicine = db.query(Medicine).filter(Medicine.id == medicine_id, Medicine.organization_id == org_id).first()
        if not medicine:
            return None, "NOT_FOUND"

        # total quantity sold for this medicine
        total_quantity = (
            db.query(func.sum(SaleItem.quantity))
            .filter(SaleItem.medicine_id == medicine_id, SaleItem.organization_id == org_id)
            .scalar()
        ) or 0

        # total revenue
        total_revenue = (
            db.query(func.sum(SaleItem.quantity * SaleItem.selling_price))
            .filter(SaleItem.medicine_id == medicine_id, SaleItem.organization_id == org_id)
            .scalar()
        ) or 0

        # batch breakdown
        batch_sales = (
            db.query(
                SaleItem.batch_id,
                func.sum(SaleItem.quantity).label("qty"),
                func.sum(SaleItem.selling_price * SaleItem.quantity).label("revenue"),
            )
            .filter(SaleItem.medicine_id == medicine_id, SaleItem.organization_id == org_id)
            .group_by(SaleItem.batch_id)
            .all()
        )

        breakdown = [
            {
                "batch_id": row.batch_id,
                "quantity": int(row.qty),
                "revenue": float(row.revenue)
            }
            for row in batch_sales
        ]

        return {
            "medicine_id": medicine_id,
            "medicine_name": medicine.name,
            "total_quantity": int(total_quantity),
            "total_revenue": float(total_revenue),
            "batch_breakdown": breakdown
        }, None
