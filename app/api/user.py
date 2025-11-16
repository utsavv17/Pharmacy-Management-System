from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.schemas.user import UserCreateSchema
from app.services.user_service import UserService
from app.core.deps import get_current_user
from app.main import get_db

router = APIRouter(prefix="/users", tags=["Users"])


@router.post("/create")
def create_user_endpoint(
    payload: UserCreateSchema,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    # Allow only admin to create users
    if current_user.role != "admin":
        return {
            "success": False,
            "message": "Permission denied",
            "error": "FORBIDDEN"
        }

    user, error = UserService.create_user(
        db=db,
        email=payload.email,
        password=payload.password,
        full_name=payload.full_name,
        role=payload.role
    )

    if error == "EMAIL_EXISTS":
        return {
            "success": False,
            "message": "Email already registered",
            "error": "EMAIL_EXISTS"
        }

    return {
        "success": True,
        "message": "User created successfully",
        "data": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role
        }
    }
