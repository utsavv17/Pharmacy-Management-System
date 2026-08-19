from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.main import get_db
from app.core.deps import get_current_user, require_super_admin
from app.models.plan import Plan
from app.schemas.plan import PlanCreate, PlanUpdate, PlanResponse

router = APIRouter(prefix="/plans", tags=["Plans"])

@router.get("/", response_model=List[PlanResponse])
def get_plans(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get all subscription plans. Any authenticated user can view plans (e.g. for upgrading).
    """
    plans = db.query(Plan).offset(skip).limit(limit).all()
    return plans

@router.get("/{plan_id}", response_model=PlanResponse)
def get_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return plan

@router.post("/", response_model=PlanResponse)
def create_plan(
    plan_in: PlanCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_super_admin)
):
    """
    Create a new plan. Only SUPER_ADMIN can do this.
    """
    plan = Plan(**plan_in.model_dump())
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan

@router.put("/{plan_id}", response_model=PlanResponse)
def update_plan(
    plan_id: int,
    plan_in: PlanUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_super_admin)
):
    """
    Update an existing plan. Only SUPER_ADMIN can do this.
    """
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
        
    for field, value in plan_in.model_dump(exclude_unset=True).items():
        setattr(plan, field, value)
        
    db.commit()
    db.refresh(plan)
    return plan

@router.delete("/{plan_id}")
def delete_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_super_admin)
):
    """
    Delete a plan. Only SUPER_ADMIN can do this.
    """
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
        
    db.delete(plan)
    db.commit()
    return {"success": True, "message": "Plan deleted successfully"}
