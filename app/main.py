from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.db import get_db


app = FastAPI()
settings = get_settings()

@app.get("/")
def health_check(db: Session = Depends(get_db)):
    return {
        "status": "ok",
        "app_name": settings.app_name,
        "env": settings.app_env
    }
