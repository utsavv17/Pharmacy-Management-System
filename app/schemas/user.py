from pydantic import BaseModel, EmailStr

class UserCreateSchema(BaseModel):
    email: EmailStr
    password: str
    full_name: str = ""
    role: str = "staff"   # allowed: admin, staff


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
