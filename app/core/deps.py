from fastapi import Depends, HTTPException, status
from fastapi.security import APIKeyHeader
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.main import get_db
from app.models.user import User

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

auth_header = APIKeyHeader(name="Authorization", auto_error=False)



def get_current_user(
    token: str = Depends(auth_header),
    db: Session = Depends(get_db)
):

    if not token:
        # No token provided → custom error
        raise auth_exception()

    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
        email = payload.get("sub")
        if email is None:
            raise JWTError()

        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise JWTError()

        return user

    except JWTError:
        raise auth_exception()