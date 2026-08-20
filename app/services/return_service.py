from sqlalchemy.orm import Session
from fastapi import HTTPException
from typing import List
from datetime import datetime

from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.batch import Batch
from app.models.sale_return import SaleReturn, SaleReturnItem
from app.schemas.returns import SaleReturnCreate
from app.services.loyalty_service import LoyaltyService

class ReturnService:
    @staticmethod
    def process_return(db: Session, return_in: SaleReturnCreate, current_user_id: int, org_id: int) -> SaleReturn:
        # Get the sale
        sale = db.query(Sale).filter(Sale.id == return_in.sale_id, Sale.organization_id == org_id).with_for_update().first()
        if not sale:
            raise HTTPException(status_code=404, detail="Sale not found")
            
        if sale.status in ["FULLY_RETURNED", "CANCELLED"]:
            raise HTTPException(status_code=400, detail=f"Cannot return items for a sale with status {sale.status}")

        total_refund_amount = 0.0
        
        # Pre-fetch all previous returns for this sale to calculate returnable qty
        previous_return_items = db.query(SaleReturnItem).join(SaleReturn).filter(SaleReturn.sale_id == sale.id, SaleReturn.status == "COMPLETED").all()
        returned_qty_map = {}
        for pri in previous_return_items:
            returned_qty_map[pri.sale_item_id] = returned_qty_map.get(pri.sale_item_id, 0) + pri.quantity

        new_return = SaleReturn(
            sale_id=sale.id,
            customer_id=sale.customer_id,
            reason=return_in.reason,
            status="COMPLETED",
            processed_by=current_user_id,
            refund_amount=0.0, # Will be updated
            organization_id=org_id
        )
        db.add(new_return)
        db.flush() # get new_return.id

        total_sold_qty_all = sum([item.quantity for item in sale.items])
        total_returned_qty_after_this = sum(returned_qty_map.values())
        
        points_to_reverse = 0

        for item_in in return_in.items:
            sale_item = db.query(SaleItem).filter(SaleItem.id == item_in.sale_item_id, SaleItem.sale_id == sale.id, SaleItem.organization_id == org_id).first()
            if not sale_item:
                raise HTTPException(status_code=400, detail=f"Sale item {item_in.sale_item_id} not found in this sale")
                
            already_returned = returned_qty_map.get(sale_item.id, 0)
            returnable_qty = sale_item.quantity - already_returned
            
            if item_in.quantity > returnable_qty:
                raise HTTPException(status_code=400, detail=f"Cannot return {item_in.quantity} for item {sale_item.id}. Max returnable is {returnable_qty}")
                
            # Restock into ORIGINAL batch
            batch = db.query(Batch).filter(Batch.id == sale_item.batch_id, Batch.organization_id == org_id).with_for_update().first()
            if not batch:
                raise HTTPException(status_code=500, detail=f"Original batch {sale_item.batch_id} not found for restocking")
                
            batch.quantity += item_in.quantity
            
            # Calculate prorated refund amount
            # The sale_item selling_price is the price BEFORE sale discount (subtotal component)
            # The actual proportion of the final paid amount:
            # We know the total paid (sale.total_amount), subtotal (sale.subtotal).
            # True item value = (sale_item.selling_price * item_in.quantity)
            # Discount ratio applied to the sale:
            if sale.subtotal > 0:
                discount_ratio = (sale.discount_amount + (sale.points_redeemed * 0.1 if sale.points_redeemed else 0)) / sale.subtotal # Approximating point value if not stored explicitly, but wait, sale.total_amount is exactly what was paid.
                # Actually, total_amount = subtotal - discount - loyalty_discount
                paid_ratio = sale.total_amount / sale.subtotal
            else:
                paid_ratio = 1.0
                
            item_refund = (sale_item.selling_price * item_in.quantity) * paid_ratio
            total_refund_amount += item_refund
            total_returned_qty_after_this += item_in.quantity
            
            # Calculate prorated points reversal
            if sale.points_earned > 0 and sale.subtotal > 0:
                item_point_ratio = (sale_item.selling_price * item_in.quantity) / sale.subtotal
                points_to_reverse += int(sale.points_earned * item_point_ratio)

            return_item = SaleReturnItem(
                return_id=new_return.id,
                sale_item_id=sale_item.id,
                batch_id=batch.id,
                quantity=item_in.quantity,
                refund_amount=item_refund,
                organization_id=org_id
            )
            db.add(return_item)

        new_return.refund_amount = total_refund_amount
        
        if total_returned_qty_after_this >= total_sold_qty_all:
            sale.status = "FULLY_RETURNED"
        else:
            sale.status = "PARTIALLY_RETURNED"

        # Reverse points
        if sale.customer_id and points_to_reverse > 0:
            LoyaltyService.reverse_points(
                db=db,
                customer_id=sale.customer_id,
                points_to_reverse=points_to_reverse,
                return_id=new_return.id,
                org_id=org_id
            )

        db.commit()
        db.refresh(new_return)
        return new_return
