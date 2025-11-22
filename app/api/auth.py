from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.schemas.auth import LoginSchema, TokenResponse, LoginErrorResponse
from app.services.auth_service import AuthService
from app.main import get_db
from app.core.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Auth"])
security = HTTPBearer(auto_error=False)

@router.get("/me")
def get_me(user: User = Depends(get_current_user)):
    return {
        "success": True,
        "message": "User profile fetched",
        "data": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role
        }
    }

@router.post("/login")
def login(payload: LoginSchema, request: Request, response: Response, db: Session = Depends(get_db)):
    # Get client IP
    client_ip = request.headers.get("X-Forwarded-For", request.client.host if request.client else "unknown")
    
    access_token, refresh_token, expires_in, user, error = AuthService.login(
        db,
        email=payload.email,
        password=payload.password,
        ip_address=client_ip
    )

    if error == "USER_NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "message": "User not found",
                "error": "USER_NOT_FOUND"
            }
        )

    if error == "PASSWORD_INCORRECT":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "message": "Invalid password",
                "error": "PASSWORD_INCORRECT"
            }
        )

    # Set refresh token as HTTP-only cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        max_age=30 * 24 * 60 * 60,  # 30 days
        httponly=True,
        secure=True,
        samesite="strict"
    )

    return {
        "success": True,
        "message": "Login successful",
        "data": {
            "access_token": access_token,
            "expires_in": expires_in,
            "user": {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role
            }
        }
    }

@router.post("/refresh")
def refresh_token(request: Request, db: Session = Depends(get_db)):
    refresh_token = request.cookies.get("refresh_token")
    
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "message": "Refresh token not found",
                "error": "REFRESH_TOKEN_MISSING"
            }
        )
    
    access_token, expires_in, error = AuthService.refresh_access_token(
        db, refresh_token
    )
    
    if error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "message": "Invalid refresh token",
                "error": "INVALID_REFRESH_TOKEN"
            }
        )
    
    return {
        "success": True,
        "message": "Token refreshed successfully",
        "data": {
            "access_token": access_token,
            "expires_in": expires_in
        }
    }

@router.post("/logout")
def logout(
    request: Request,
    response: Response,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "message": "Token required",
                "error": "TOKEN_REQUIRED"
            }
        )
    
    refresh_token = request.cookies.get("refresh_token")
    AuthService.logout(db, credentials.credentials, refresh_token)
    
    # Clear refresh token cookie
    response.delete_cookie("refresh_token")
    
    return {
        "success": True,
        "message": "Logged out successfully"
    }
