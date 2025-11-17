from pydantic import BaseModel


class SettingsUpdate(BaseModel):
    pharmacy_name: str
    address: str | None = None
    phone: str | None = None
    email: str | None = None
    invoice_footer: str | None = None


class SettingsResponse(BaseModel):
    pharmacy_name: str
    address: str | None
    phone: str | None
    email: str | None
    invoice_footer: str | None

    class Config:
        from_attributes = True
