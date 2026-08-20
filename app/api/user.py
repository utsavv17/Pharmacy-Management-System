from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.schemas.user import UserCreateSchema, UserUpdateSchema, ChangePasswordSchema
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


@router.patch("/me")
def update_profile(
    payload: UserUpdateSchema,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    user, error = UserService.update_profile(
        db=db,
        user_id=current_user.id,
        full_name=payload.full_name
    )

    if error:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "message": "Failed to update profile",
                "error": error
            }
        )

    return {
        "success": True,
        "message": "Profile updated successfully",
        "data": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "organization_id": user.organization_id
        }
    }


@router.post("/me/change-password")
def change_password(
    payload: ChangePasswordSchema,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    success, error = UserService.change_password(
        db=db,
        user_id=current_user.id,
        current_password=payload.current_password,
        new_password=payload.new_password
    )

    if error == "PASSWORD_INCORRECT":
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "message": "Current password is incorrect.",
                "error": error
            }
        )
    elif error:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "message": "Failed to change password",
                "error": error
            }
        )

    return {
        "success": True,
        "message": "Password changed successfully."
    }
