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
    def today_summary(db: Session, org_id: int):
        today = date.today()

        # Today's Revenue (quantity * selling_price - purchase_price - discount_amount)
        # Calculate gross profit from items
        today_gross_profit = (
            db.query(
                func.sum(
                    (SaleItem.selling_price - Batch.purchase_price) * SaleItem.quantity
                )
            )
            .select_from(SaleItem)
            .join(Sale, SaleItem.sale_id == Sale.id)
            .join(Batch, SaleItem.batch_id == Batch.id)
            .filter(Sale.sale_date == today, Sale.organization_id == org_id)
            .scalar()
        ) or 0
        
        # Calculate total discount for today
        today_discount = (
            db.query(func.sum(Sale.discount_amount))
            .filter(Sale.sale_date == today, Sale.organization_id == org_id)
            .scalar()
        ) or 0
        
        today_revenue = today_gross_profit - today_discount

        # Today's Purchases Amount
        total_purchases = (
            db.query(func.sum(Purchase.total_amount))
            .filter(Purchase.purchase_date == today, Purchase.organization_id == org_id)
            .scalar()
        ) or 0

        # Total Invoices Today
        total_invoices = (
            db.query(func.count(Sale.id))
            .filter(Sale.sale_date == today, Sale.organization_id == org_id)
            .scalar()
        ) or 0

        # Total Items Sold Today
        total_items_sold = (
            db.query(func.sum(SaleItem.quantity))
            .join(Sale)
            .filter(Sale.sale_date == today, Sale.organization_id == org_id)
            .scalar()
        ) or 0

        return {
            "date": str(today),
            "today_sales": int(total_invoices),
            "today_purchases": round(float(total_purchases), 2),
            "today_invoices": int(total_invoices),
            "today_items_sold": int(total_items_sold),
            "today_revenue": round(float(today_revenue), 2)
        }

    # Grand Total Summary (All Time)
    @staticmethod
    def grand_total_summary(db: Session, org_id: int):
        # Total medicines with stock (quantity > 0)
        total_medicines = (
            db.query(func.count(func.distinct(Medicine.id)))
            .join(Batch, Medicine.id == Batch.medicine_id)
            .filter(Batch.quantity > 0, Medicine.organization_id == org_id)
            .scalar()
        ) or 0
        
        # Total suppliers
        total_suppliers = db.query(func.count(Supplier.id)).filter(Supplier.organization_id == org_id).scalar() or 0
        
        # Total sales count (all time)
        total_sales_count = db.query(func.count(Sale.id)).filter(Sale.organization_id == org_id).scalar() or 0
        
        # Total items sold (all time)
        total_items_sold = db.query(func.sum(SaleItem.quantity)).join(Sale).filter(Sale.organization_id == org_id).scalar() or 0
        
        # Total discount amount (all time)
        total_discount = db.query(func.sum(Sale.discount_amount)).filter(Sale.organization_id == org_id).scalar() or 0.0
        
        # Total revenue (all time) - proper calculation with discount
        total_revenue = (
            db.query(
                func.sum(
                    (SaleItem.selling_price - Batch.purchase_price) * SaleItem.quantity
                )
            )
            .select_from(SaleItem)
            .join(Sale, SaleItem.sale_id == Sale.id)
            .join(Batch, SaleItem.batch_id == Batch.id)
            .scalar()
        ) or 0.0
        
        total_revenue -= total_discount

        return {
            "total_medicines": total_medicines,
            "total_suppliers": total_suppliers,
            "total_sales": total_sales_count,
            "total_items_sold": int(total_items_sold),
            "total_discount": round(float(total_discount), 2),
            "total_revenue": round(float(total_revenue), 2)
        }

    # 2. Inventory Summary
    @staticmethod
    def inventory_summary(db: Session, org_id: int):
        # Low stock (<= minimum_stock_level)
        low_stock = (
            db.query(Medicine.id, Medicine.name, Medicine.minimum_stock_level, func.sum(Batch.quantity).label("qty"))
            .join(Batch, Medicine.id == Batch.medicine_id)
            .filter(Medicine.organization_id == org_id)
            .group_by(Medicine.id, Medicine.name, Medicine.minimum_stock_level)
            .having(func.sum(Batch.quantity) <= Medicine.minimum_stock_level)
            .all()
        )

        low_stock_list = [
            {
                "medicine_id": row.id,
                "medicine_name": row.name,
                "quantity": int(row.qty),
                "minimum_stock_level": row.minimum_stock_level
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
                    Batch.quantity > 0,
                    Batch.organization_id == org_id)
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
            .filter(Batch.organization_id == org_id)
            .scalar()
        ) or 0

        return {
            "low_stock": low_stock_list,
            "near_expiry": near_expiry_list,
            "total_stock_value": round(float(stock_value), 2)
        }

    # Year Revenue Calculation (Reusable)
    @staticmethod
    def calculate_year_revenue(db: Session, year: int, org_id: int):
        from sqlalchemy import extract
        
        # Calculate gross profit
        gross_profit = (
            db.query(
                func.sum(
                    (SaleItem.selling_price - Batch.purchase_price) * SaleItem.quantity
                )
            )
            .select_from(SaleItem)
            .join(Sale, SaleItem.sale_id == Sale.id)
            .join(Batch, SaleItem.batch_id == Batch.id)
            .filter(extract('year', Sale.sale_date) == year, Sale.organization_id == org_id)
            .scalar()
        ) or 0
        
        # Calculate total discount for the year
        year_discount = (
            db.query(func.sum(Sale.discount_amount))
            .filter(extract('year', Sale.sale_date) == year, Sale.organization_id == org_id)
            .scalar()
        ) or 0
        
        return round(gross_profit - year_discount, 2)

    # 3. Sales Chart (Last 7 Days)
    @staticmethod
    def last_7_days_sales(db: Session, org_id: int):
        today = date.today()
        last_week = today - timedelta(days=6)

        sales_data = (
            db.query(
                Sale.sale_date,
                func.sum(Sale.total_amount).label("amount")
            )
            .filter(Sale.sale_date >= last_week, Sale.organization_id == org_id)
            .group_by(Sale.sale_date)
            .order_by(Sale.sale_date)
            .all()
        )

        return [
            {
                "date": str(row.sale_date),
                "amount": round(float(row.amount), 2)
            }
            for row in sales_data
        ]
