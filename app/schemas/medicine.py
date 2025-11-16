from pydantic import BaseModel

class MedicineBase(BaseModel):
    name: str
    generic_name: str | None = None
    brand: str | None = None
    category: str | None = None
    unit: str | None = None
    strength: str | None = None


class MedicineCreateSchema(MedicineBase):
    pass


class MedicineUpdateSchema(BaseModel):
    name: str | None = None
    generic_name: str | None = None
    brand: str | None = None
    category: str | None = None
    unit: str | None = None
    strength: str | None = None


class MedicineResponse(BaseModel):
    id: int
    name: str
    generic_name: str | None
    brand: str | None
    category: str | None
    unit: str | None
    strength: str | None

    class Config:
        from_attributes = True
