from sqlalchemy.orm import Session
from app.models.user import User
from app.core.security import verify_password
from app.core.jwt import create_access_token

class AuthService:

    @staticmethod
    def login(db: Session, email: str, password: str):

        user = db.query(User).filter(User.email == email).first()

        if not user:
            return None, "USER_NOT_FOUND"

        if not verify_password(password, user.hashed_password):
            return None, "PASSWORD_INCORRECT"

        token = create_access_token({"sub": user.email})

        return token, user, None
