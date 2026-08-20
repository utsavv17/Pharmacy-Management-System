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

    @staticmethod
    def update_profile(db: Session, user_id: int, full_name: str):
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return None, "USER_NOT_FOUND"
        
        user.full_name = full_name
        db.commit()
        db.refresh(user)
        return user, None

    @staticmethod
    def change_password(db: Session, user_id: int, current_password: str, new_password: str):
        from app.core.security import verify_password
        
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return False, "USER_NOT_FOUND"
            
        if not verify_password(current_password, user.hashed_password):
            return False, "PASSWORD_INCORRECT"
            
        user.hashed_password = hash_password(new_password)
        db.commit()
        return True, None
