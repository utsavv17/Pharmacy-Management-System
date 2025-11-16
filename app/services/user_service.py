from sqlalchemy.orm import Session
from app.models.user import User
from app.core.security import hash_password

class UserService:
    @staticmethod
    def create_user(db: Session, email: str, password: str, full_name: str = "", role: str = "staff"):
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            return None, "EMAIL_EXISTS"

        hashed_pw = hash_password(password)

        user = User(
            email=email,
            hashed_password=hashed_pw,
            full_name=full_name,
            role=role
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user, None

    @staticmethod
    def get_user_by_email(db: Session, email: str):
        return db.query(User).filter(User.email == email).first()
