from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.utils.settings import initialize_settings
from app.db.db import get_db

from app.api import auth, user, medicine, batch, inventory, purchase, sales, invoice, sales_report, dashboard, supplier, settings

app = FastAPI()

initialize_settings()
app_settings = get_settings()

app.include_router(auth.router)
app.include_router(user.router)
app.include_router(medicine.router)
app.include_router(batch.router)
app.include_router(inventory.router)
app.include_router(purchase.router)
app.include_router(sales.router)
app.include_router(invoice.router)
app.include_router(sales_report.router)
app.include_router(dashboard.router)
app.include_router(supplier.router)
app.include_router(settings.router)

@app.get("/", tags=["Health"])
def health_check(db: Session = Depends(get_db)):
    return {
        "status": "ok",
        "app_name": app_settings.app_name,
        "env": app_settings.app_env
    }
