from pydantic import BaseModel

class UserCreateSchema(BaseModel):
    email: str
    password: str
    full_name: str = ""
    role: str = "staff"   # allowed: admin, staff


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str

class UserUpdateSchema(BaseModel):
    full_name: str

class ChangePasswordSchema(BaseModel):
    current_password: str
    new_password: str
