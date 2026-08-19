from sqlalchemy.orm import Session
from datetime import datetime
from app.models.purchase import Purchase
from app.models.purchase_item import PurchaseItem
from app.models.batch import Batch


class PurchaseService:

    @staticmethod
    def create_purchase(db: Session, data, org_id: int):
        try:
            # 1) Create parent purchase
            # create a unique invoice number
            invoice_number = f"PUR-{datetime.now().strftime('%Y%m%d%H%M%S')}"
            purchase = Purchase(
                invoice_number=invoice_number,
                supplier_name=data.supplier_name,
                purchase_date=data.purchase_date,
                total_amount=0,
                created_at=datetime.now(),
                organization_id=org_id
            )

            db.add(purchase)
            db.flush()  # Populate purchase.id without committing

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
                    quantity=item.quantity,
                    organization_id=org_id
                )
                db.add(purchase_item)

                # Calculate amount (unit cost × quantity)
                total_amount += item.purchase_price * item.quantity

                # 3) Update or Create batch
                batch = db.query(Batch).filter(
                    Batch.medicine_id == item.medicine_id,
                    Batch.batch_no == item.batch_no,
                    Batch.organization_id == org_id
                ).first()

                if batch:
                    batch.quantity += item.quantity
                    # Ensure price updates if required by business logic, but let's keep it simple
                    batch.purchase_price = item.purchase_price
                    batch.selling_price = item.selling_price
                    batch.expiry_date = item.expiry_date
                else:
                    batch = Batch(
                        batch_no=item.batch_no,
                        expiry_date=item.expiry_date,
                        purchase_price=item.purchase_price,
                        selling_price=item.selling_price,
                        quantity=item.quantity,
                        medicine_id=item.medicine_id,
                        organization_id=org_id
                    )
                    db.add(batch)

            # 4) Update total amount
            purchase.total_amount = total_amount
            
            # Commit the entire transaction atomically
            db.commit()
            db.refresh(purchase)

            return purchase
        except Exception as e:
            db.rollback()
            raise e
