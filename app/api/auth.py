from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.schemas.auth import LoginSchema, TokenResponse, LoginErrorResponse
from app.services.auth_service import AuthService
from app.main import get_db
from app.core.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Auth"])

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


@router.post("/login", response_model=TokenResponse | LoginErrorResponse)
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
