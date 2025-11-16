from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.db import get_db

from app.api import auth, user, medicine, batch, inventory

app = FastAPI()
settings = get_settings()

app.include_router(auth.router)
app.include_router(user.router)
app.include_router(medicine.router)
app.include_router(batch.router)
app.include_router(inventory.router)


@app.get("/")
def health_check(db: Session = Depends(get_db)):
    return {
        "status": "ok",
        "app_name": settings.app_name,
        "env": settings.app_env
    }
