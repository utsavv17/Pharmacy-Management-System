from sqlalchemy.orm import Session
from app.models.purchase import Purchase
from app.models.purchase_item import PurchaseItem
from app.models.batch import Batch


class PurchaseService:

    @staticmethod
    def create_purchase(db: Session, data):
        # 1) Create parent purchase
        purchase = Purchase(
            invoice_number=data.invoice_number,
            supplier_name=data.supplier_name,
            purchase_date=data.purchase_date,
            total_amount=0
        )

        db.add(purchase)
        db.commit()
        db.refresh(purchase)

        total_amount = 0

        # 2) Loop through purchase items
        for item in data.items:
            purchase_item = PurchaseItem(
                purchase_id=purchase.id,
                medicine_id=item.medicine_id,
                batch_no=item.batch_no,
                expiry_date=item.expiry_date,
                purchase_price=item.purchase_price,
                selling_price=item.selling_price,
                quantity=item.quantity
            )
            db.add(purchase_item)
            db.commit()
            db.refresh(purchase_item)

            # Calculate amount (unit cost × quantity)
            total_amount += item.purchase_price * item.quantity

            # 3) Create batch immediately
            batch = Batch(
                batch_no=item.batch_no,
                expiry_date=item.expiry_date,
                purchase_price=item.purchase_price,
                selling_price=item.selling_price,
                quantity=item.quantity,
                medicine_id=item.medicine_id
            )

            db.add(batch)
            db.commit()

        # 4) Update total amount
        purchase.total_amount = total_amount
        db.commit()
        db.refresh(purchase)

        return purchase
