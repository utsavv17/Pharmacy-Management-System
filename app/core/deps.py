from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from jose.exceptions import ExpiredSignatureError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.main import get_db
from app.models.user import User
from app.models.organization import Organization
from app.services.auth_service import AuthService
from fastapi import Request

settings = get_settings()

def auth_exception():
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={
            "success": False,
            "message": "Invalid or missing token",
            "error": "UNAUTHORIZED"
        },
        headers={"WWW-Authenticate": "Bearer"},
    )

security = HTTPBearer(auto_error=False)

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):

    if not credentials:
        raise auth_exception()

    # Check if token is blocked
    if AuthService.is_token_blocked(db, credentials.credentials):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "message": "Token has been revoked",
                "error": "TOKEN_REVOKED"
            },
            headers={"WWW-Authenticate": "Bearer"}
        )

    try:
        payload = jwt.decode(
            credentials.credentials, 
            settings.secret_key, 
            algorithms=["HS256"],
            options={"verify_exp": True}
        )
        
        email = payload.get("sub")
        if not email:
            raise auth_exception()

        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise auth_exception()

        return user

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "message": "Token has expired",
                "error": "TOKEN_EXPIRED"
            },
            headers={"WWW-Authenticate": "Bearer"}
        )
    except (JWTError, Exception):
        raise auth_exception()

def get_current_organization(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> int:
    if current_user.role == "super_admin":
        org_id = request.headers.get("X-Organization-ID")
        if not org_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"success": False, "message": "X-Organization-ID header required for super_admin"}
            )
        
        org = db.query(Organization).filter(Organization.id == int(org_id), Organization.status == "ACTIVE").first()
        if not org:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"success": False, "message": "Invalid or inactive organization"}
            )
        return org.id
    
    if not current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"success": False, "message": "User does not belong to any organization"}
        )
    
    return current_user.organization_id

def require_super_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"success": False, "message": "Super Admin privileges required"}
        )
    return current_user