from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.main import get_db
from app.core.deps import get_current_user, require_super_admin, get_current_organization
from app.models.organization import Organization
from app.models.user import User
from app.schemas.organization import OrganizationCreate, OrganizationUpdate, OrganizationResponse
from app.core.security import hash_password

router = APIRouter(prefix="/organizations", tags=["Organizations"])

@router.get("/", response_model=List[OrganizationResponse])
def get_organizations(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(require_super_admin)
):
    """
    Get all organizations. Only SUPER_ADMIN can view all organizations.
    """
    orgs = db.query(Organization).order_by(Organization.created_at.desc()).offset(skip).limit(limit).all()
    return orgs

@router.get("/me", response_model=OrganizationResponse)
def get_my_organization(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    org_id: int = Depends(get_current_organization)
):
    """
    Get the currently active organization for the authenticated user/request.
    """
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org

@router.get("/{org_id}", response_model=OrganizationResponse)
def get_organization(
    org_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_super_admin)
):
    """
    Get specific organization. Only SUPER_ADMIN can do this.
    """
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org

@router.post("/", response_model=OrganizationResponse)
def create_organization(
    org_in: OrganizationCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_super_admin)
):
    """
    Create a new organization and its default owner user. Only SUPER_ADMIN can do this.
    """
    # 1. Check if email already exists for owner user
    existing_user = db.query(User).filter(User.email == org_in.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="A user with this email already exists")

    # 2. Check if organization email already exists
    existing_org = db.query(Organization).filter(Organization.email == org_in.email).first()
    if existing_org:
        raise HTTPException(status_code=400, detail="An organization with this email already exists")

    # 3. Create the Organization
    org_data = org_in.model_dump(exclude={"password"})
    org = Organization(**org_data)
    db.add(org)
    db.commit()
    db.refresh(org)
    
    # 4. Create the Owner User for this organization
    owner_user = User(
        email=org.email,
        full_name=org.owner_name,
        hashed_password=hash_password(org_in.password),
        role="owner",
        is_active=True,
        organization_id=org.id
    )
    db.add(owner_user)
    db.commit()
    
    # Initialize basic settings for the new organization
    from app.models.settings import Settings
    settings = Settings(
        organization_id=org.id,
        pharmacy_name=org.name,
        address=org.address or "",
        phone=org.phone,
        email=org.email,
        currency="Tk"
    )
    db.add(settings)
    db.commit()

    return org

@router.put("/{org_id}", response_model=OrganizationResponse)
def update_organization(
    org_id: int,
    org_in: OrganizationUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Update an organization. SUPER_ADMIN can update any, Owner can update their own.
    """
    if current_user.role != "super_admin" and current_user.organization_id != org_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
        
    for field, value in org_in.model_dump(exclude_unset=True).items():
        setattr(org, field, value)
        
    db.commit()
    db.refresh(org)
    return org

@router.delete("/{org_id}")
def delete_organization(
    org_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_super_admin)
):
    """
    Delete an organization. Only SUPER_ADMIN can do this.
    """
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
        
    # Note: A real system would likely do a soft delete or require cascading deletes for all org data
    org.status = "INACTIVE"
    db.commit()
    
    return {"success": True, "message": "Organization deactivated successfully"}
