from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta

from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.purchase import Purchase
from app.models.batch import Batch
from app.models.medicine import Medicine
from app.models.supplier import Supplier


class DashboardService:

    # 1. Today Summary
    @staticmethod
    def today_summary(db: Session):
        today = date.today()

        # Today's Sales Amount
        total_sales = (
            db.query(func.sum(Sale.total_amount))
            .filter(Sale.sale_date == today)
            .scalar()
        ) or 0

        # Today's Purchases Amount
        total_purchases = (
            db.query(func.sum(Purchase.total_amount))
            .filter(Purchase.purchase_date == today)
            .scalar()
        ) or 0

        # Total Invoices Today
        total_invoices = (
            db.query(func.count(Sale.id))
            .filter(Sale.sale_date == today)
            .scalar()
        ) or 0

        # Total Items Sold Today
        total_items_sold = (
            db.query(func.sum(SaleItem.quantity))
            .join(Sale)
            .filter(Sale.sale_date == today)
            .scalar()
        ) or 0

        return {
            "date": str(today),
            "today_sales": int(total_invoices),
            "today_purchases": float(total_purchases),
            "today_invoices": int(total_invoices),
            "today_items_sold": int(total_items_sold),
            "today_revenue": float(total_sales)
        }

    # Grand Total Summary (All Time)
    @staticmethod
    def grand_total_summary(db: Session):
        # Total medicines
        total_medicines = db.query(func.count(Medicine.id)).scalar() or 0
        
        # Total suppliers
        total_suppliers = db.query(func.count(Supplier.id)).scalar() or 0
        
        # Total sales count (all time)
        total_sales_count = db.query(func.count(Sale.id)).scalar() or 0
        
        # Total items sold (all time)
        total_items_sold = db.query(func.sum(SaleItem.quantity)).scalar() or 0
        
        # Total revenue (all time)
        total_revenue = db.query(func.sum(Sale.total_amount)).scalar() or 0.0

        return {
            "total_medicines": total_medicines,
            "total_suppliers": total_suppliers,
            "total_sales": total_sales_count,
            "total_items_sold": int(total_items_sold),
            "total_revenue": float(total_revenue)
        }

    # 2. Inventory Summary
    @staticmethod
    def inventory_summary(db: Session):
        # Low stock (< 10)
        low_stock = (
            db.query(Medicine.id, Medicine.name, func.sum(Batch.quantity).label("qty"))
            .join(Batch, Medicine.id == Batch.medicine_id)
            .group_by(Medicine.id, Medicine.name)
            .having(func.sum(Batch.quantity) < 10)
            .all()
        )

        low_stock_list = [
            {
                "medicine_id": row.id,
                "medicine_name": row.name,
                "quantity": int(row.qty)
            }
            for row in low_stock
        ]

        # Near expiry — next 30 days
        today = date.today()
        next_30 = today + timedelta(days=30)

        near_expiry = (
            db.query(Batch)
            .filter(Batch.expiry_date >= today,
                    Batch.expiry_date <= next_30,
                    Batch.quantity > 0)
            .all()
        )

        near_expiry_list = [
            {
                "batch_id": b.id,
                "medicine_id": b.medicine_id,
                "batch_no": b.batch_no,
                "expiry_date": str(b.expiry_date),
                "quantity": b.quantity
            }
            for b in near_expiry
        ]

        # Total stock value (purchase price * qty)
        stock_value = (
            db.query(func.sum(Batch.purchase_price * Batch.quantity))
            .scalar()
        ) or 0

        return {
            "low_stock": low_stock_list,
            "near_expiry": near_expiry_list,
            "total_stock_value": float(stock_value)
        }

    # 3. Sales Chart (Last 7 Days)
    @staticmethod
    def last_7_days_sales(db: Session):
        today = date.today()
        last_week = today - timedelta(days=6)

        sales_data = (
            db.query(
                Sale.sale_date,
                func.sum(Sale.total_amount).label("amount")
            )
            .filter(Sale.sale_date >= last_week)
            .group_by(Sale.sale_date)
            .order_by(Sale.sale_date)
            .all()
        )

        return [
            {
                "date": str(row.sale_date),
                "amount": float(row.amount)
            }
            for row in sales_data
        ]
