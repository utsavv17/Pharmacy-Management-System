from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    app_name: str
    app_env: str
    database_url: str
    secret_key: str
    access_token_expire_minutes: int

    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()
