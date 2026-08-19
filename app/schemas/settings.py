from pydantic import BaseModel


class SettingsUpdate(BaseModel):
    pharmacy_name: str
    address: str | None = None
    phone: str | None = None
    email: str | None = None
    invoice_footer: str | None = None
    currency_units_per_point: int | None = 100
    minimum_redemption_points: int | None = 100
    point_value: float | None = 0.1
    maximum_points_per_sale: int | None = 1000


class SettingsResponse(BaseModel):
    pharmacy_name: str
    address: str | None
    phone: str | None
    email: str | None
    invoice_footer: str | None
    currency_units_per_point: int
    minimum_redemption_points: int
    point_value: float
    maximum_points_per_sale: int

    class Config:
        from_attributes = True
