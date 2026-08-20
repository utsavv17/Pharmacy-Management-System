from sqlalchemy.orm import Session
from datetime import datetime, date
from fastapi import HTTPException

from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.batch import Batch
from app.models.customer import Customer
from app.services.loyalty_service import LoyaltyService


class SaleService:

    @staticmethod
    def create_sale(db: Session, data, org_id: int):
        # Atomic transaction begins here (provided by db session, we commit at the end)
        
        # 1) Validate Customer and Loyalty Redemption
        loyalty_discount = 0.0
        customer = None
        
        # Resolve or create customer if phone is provided but no ID
        if not data.customer_id and getattr(data, 'customer_phone', None):
            customer = db.query(Customer).filter(
                Customer.phone == data.customer_phone, 
                Customer.organization_id == org_id
            ).first()
            if not customer:
                customer = Customer(
                    name=data.customer_name or "Walk-in Customer",
                    phone=data.customer_phone,
                    email=getattr(data, 'customer_email', None),
                    address=getattr(data, 'customer_address', None),
                    organization_id=org_id
                )
                db.add(customer)
                db.flush()
            data.customer_id = customer.id

        if data.customer_id:
            if not customer:
                customer = db.query(Customer).filter(Customer.id == data.customer_id, Customer.organization_id == org_id).first()
            if not customer:
                raise HTTPException(status_code=404, detail="Customer not found")
                
        # create a unique invoice number
        invoice_number = f"INV-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        sale = Sale(
            invoice_number=invoice_number,
            customer_id=data.customer_id,
            customer_name=customer.name if customer else (data.customer_name or "Walk-in Customer"),
            sale_date=data.sale_date or date.today(),
            subtotal=0,
            discount_amount=data.discount_amount,
            total_amount=0,
            points_earned=0,
            points_redeemed=data.points_redeemed if data.points_redeemed else 0,
            status="COMPLETED",
            created_at=datetime.now(),
            organization_id=org_id
        )
        db.add(sale)
        db.flush() # get sale.id

        total_amount = 0

        # 2) Process sale items with FIFO batch deduction
        for item in data.items:

            needed_qty = item.quantity

            # Get FIFO batches: earliest expiry first, skip expired
            # Explicitly checking expiry_date > today to ensure we NEVER sell expired medicine
            fifo_batches = db.query(Batch).filter(
                Batch.medicine_id == item.medicine_id,
                Batch.expiry_date >= date.today(),
                Batch.quantity > 0,
                Batch.organization_id == org_id
            ).order_by(Batch.expiry_date.asc()).with_for_update().all()

            if not fifo_batches:
                raise HTTPException(status_code=400, detail=f"No valid/unexpired batches found for medicine_id: {item.medicine_id}")

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
                    selling_price=batch.selling_price,
                    organization_id=org_id
                )
                db.add(sale_item)

                # Update batch stock
                batch.quantity -= deduct_qty

                # Update running totals
                total_amount += batch.selling_price * deduct_qty
                needed_qty -= deduct_qty

            if needed_qty > 0:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Not enough unexpired stock for medicine_id {item.medicine_id}. Missing: {needed_qty}"
                )

        # 3) Process Loyalty Redemption
        if sale.customer_id and sale.points_redeemed > 0:
            final_before_loyalty = total_amount - sale.discount_amount
            loyalty_discount = LoyaltyService.validate_redemption(db, customer, sale.points_redeemed, final_before_loyalty, org_id)
            LoyaltyService.redeem_points(db, sale.customer_id, sale.points_redeemed, sale.id, org_id)

        # 4) Update sale amounts
        sale.subtotal = total_amount
        sale.total_amount = total_amount - sale.discount_amount - loyalty_discount
        
        # 5) Process Loyalty Earning
        if sale.customer_id:
            # We calculate points on the actual amount paid
            eligible_amount = sale.total_amount
            points_earned = LoyaltyService.calculate_eligible_points(db, eligible_amount, org_id)
            if points_earned > 0:
                LoyaltyService.award_points(db, sale.customer_id, points_earned, sale.id, org_id)
                sale.points_earned = points_earned
                
            # Update customer aggregates
            customer.total_orders += 1
            customer.total_purchase_amount += sale.total_amount

        # Commit everything atomically
        db.commit()
        db.refresh(sale)

        return sale
