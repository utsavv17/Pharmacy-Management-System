from fastapi import FastAPI
from app.core.config import get_settings

app = FastAPI()
settings = get_settings()

@app.get("/")
def health_check():
    return {
        "status": "ok",
        "app_name": settings.app_name,
        "env": settings.app_env
    }
