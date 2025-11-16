from logging.config import fileConfig
from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context
from app.core.config import get_settings
from app.db.base import Base

settings = get_settings()
config = context.config
config.set_main_option("sqlalchemy.url", settings.database_url)

# Interpret the config file for Python logging.
fileConfig(config.config_file_name)

target_metadata = Base.metadata
