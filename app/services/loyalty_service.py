from sqlalchemy.orm import Session
from fastapi import HTTPException
import math

from app.models.customer import Customer
from app.models.reward_transaction import RewardTransaction
from app.models.settings import Settings

class LoyaltyService:
    @staticmethod
    def _get_settings(db: Session) -> Settings:
        settings = db.query(Settings).first()
        if not settings:
            # Fallbacks if settings missing
            settings = Settings(
                currency_units_per_point=100,
                minimum_redemption_points=100,
                point_value=0.1,
                maximum_points_per_sale=1000
            )
        return settings

    @staticmethod
    def calculate_eligible_points(db: Session, eligible_amount: float) -> int:
        settings = LoyaltyService._get_settings(db)
        if settings.currency_units_per_point <= 0:
            return 0
        
        # E.g. Rs 550 spent, 100 per point -> 5 points (floor)
        return math.floor(eligible_amount / settings.currency_units_per_point)

    @staticmethod
    def validate_redemption(db: Session, customer: Customer, points_to_redeem: int, final_total_before_loyalty: float) -> float:
        if points_to_redeem <= 0:
            return 0.0
            
        settings = LoyaltyService._get_settings(db)
        
        if customer.total_points < points_to_redeem:
            raise HTTPException(status_code=400, detail=f"Insufficient points. Available: {customer.total_points}")
            
        if points_to_redeem < settings.minimum_redemption_points:
            raise HTTPException(status_code=400, detail=f"Minimum points required to redeem is {settings.minimum_redemption_points}")
            
        if points_to_redeem > settings.maximum_points_per_sale:
            raise HTTPException(status_code=400, detail=f"Maximum points redeemable per sale is {settings.maximum_points_per_sale}")
            
        loyalty_discount = points_to_redeem * settings.point_value
        
        # Don't allow discounting more than the cart value
        if loyalty_discount > final_total_before_loyalty:
            raise HTTPException(status_code=400, detail="Loyalty discount cannot exceed final amount")
            
        return loyalty_discount

    @staticmethod
    def award_points(db: Session, customer_id: int, points: int, sale_id: int, description: str = "Points earned from purchase"):
        if points <= 0:
            return
            
        customer = db.query(Customer).filter(Customer.id == customer_id).with_for_update().first()
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
            
        customer.total_points += points
        
        tx = RewardTransaction(
            customer_id=customer_id,
            sale_id=sale_id,
            type="EARN",
            points=points,
            balance_after=customer.total_points,
            description=description
        )
        db.add(tx)
        # We don't commit here because this should be part of the Sale transaction

    @staticmethod
    def redeem_points(db: Session, customer_id: int, points: int, sale_id: int, description: str = "Points redeemed for purchase"):
        if points <= 0:
            return
            
        customer = db.query(Customer).filter(Customer.id == customer_id).with_for_update().first()
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
            
        if customer.total_points < points:
            raise HTTPException(status_code=400, detail="Insufficient points for redemption")
            
        customer.total_points -= points
        
        tx = RewardTransaction(
            customer_id=customer_id,
            sale_id=sale_id,
            type="REDEEM",
            points=-points,
            balance_after=customer.total_points,
            description=description
        )
        db.add(tx)

    @staticmethod
    def reverse_points(db: Session, customer_id: int, points_to_reverse: int, return_id: int, description: str = "Points reversed due to refund"):
        """
        Reverse points earned from a sale that is now being refunded.
        If the customer has already spent the points, their balance could technically go negative,
        or we limit to 0. 
        """
        if points_to_reverse <= 0:
            return
            
        customer = db.query(Customer).filter(Customer.id == customer_id).with_for_update().first()
        if not customer:
            return
            
        # Standard approach: Reverse exactly what they earned. If they spent it, let it go negative to reflect debt.
        # But per requirements: "Do NOT silently create a negative balance... reverse available points, record remaining as adjustment".
        # Let's ensure balance doesn't drop below 0 natively.
        actual_reversal = min(points_to_reverse, customer.total_points)
        debt = points_to_reverse - actual_reversal
        
        if actual_reversal > 0:
            customer.total_points -= actual_reversal
            tx = RewardTransaction(
                customer_id=customer_id,
                return_id=return_id,
                type="REFUND_REVERSAL",
                points=-actual_reversal,
                balance_after=customer.total_points,
                description=description
            )
            db.add(tx)
            
        if debt > 0:
            # We record that they *should* have lost more, but balance hit 0.
            # Next time they earn points, we could adjust it, but for simplicity, we just log it as an adjustment/debt that we forgive.
            tx_debt = RewardTransaction(
                customer_id=customer_id,
                return_id=return_id,
                type="MANUAL_ADJUSTMENT",
                points=-debt,
                balance_after=customer.total_points,
                description=f"Forgiven point debt due to refund: {debt} points"
            )
            db.add(tx_debt)
