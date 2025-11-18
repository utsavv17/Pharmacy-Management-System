from sqlalchemy.orm import Session
from datetime import datetime, date

from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.batch import Batch


class SaleService:

    @staticmethod
    def create_sale(db: Session, data):
        # 1) Create the parent sale
        # create a unique invoice number
        invoice_number = f"INV-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        sale = Sale(
            invoice_number=invoice_number,
            customer_name=data.customer_name or "Walk-in Customer",
            sale_date=data.sale_date or date.today(),
            total_amount=0
        )
        db.add(sale)
        db.commit()
        db.refresh(sale)

        total_amount = 0

        # 2) Process sale items with FIFO batch deduction
        for item in data.items:

            needed_qty = item.quantity

            # Get FIFO batches: earliest expiry first, skip expired
            fifo_batches = db.query(Batch).filter(
                Batch.medicine_id == item.medicine_id,
                Batch.expiry_date >= date.today(),
                Batch.quantity > 0
            ).order_by(Batch.expiry_date.asc()).all()

            if not fifo_batches:
                raise Exception(f"No valid batches found for medicine_id: {item.medicine_id}")

            for batch in fifo_batches:
                if needed_qty == 0:
                    break

                if batch.quantity <= 0:
                    continue

                # Deduct from this batch
                deduct_qty = min(batch.quantity, needed_qty)

                # Create sale item entry
                sale_item = SaleItem(
                    sale_id=sale.id,
                    medicine_id=item.medicine_id,
                    batch_id=batch.id,
                    quantity=deduct_qty,
                    selling_price=batch.selling_price
                )
                db.add(sale_item)
                db.commit()
                db.refresh(sale_item)

                # Update batch stock
                batch.quantity -= deduct_qty
                db.commit()

                # Update running totals
                total_amount += batch.selling_price * deduct_qty
                needed_qty -= deduct_qty

            if needed_qty > 0:
                raise Exception(
                    f"Not enough stock for medicine_id {item.medicine_id}. Missing: {needed_qty}"
                )

        # 3) Update total sale amount
        sale.total_amount = total_amount
        db.commit()
        db.refresh(sale)

        return sale
