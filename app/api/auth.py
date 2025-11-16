from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.schemas.auth import LoginSchema, TokenResponse
from app.services.auth_service import AuthService
from app.main import get_db

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginSchema, db: Session = Depends(get_db)):
    token, user, error = AuthService.login(
        db,
        email=payload.email,
        password=payload.password
    )

    if error == "USER_NOT_FOUND":
        return {
            "success": False,
            "message": "User not found",
            "error": "USER_NOT_FOUND"
        }

    if error == "PASSWORD_INCORRECT":
        return {
            "success": False,
            "message": "Invalid password",
            "error": "PASSWORD_INCORRECT"
        }

    return {
        "success": True,
        "message": "Login successful",
        "data": {
            "access_token": token,
            "user": {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role
            }
        }
    }
