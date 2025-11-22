from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from sqlalchemy.orm import Session
import logging

from app.core.config import get_settings
from app.utils.settings import initialize_settings
from app.db.db import get_db

from app.api import auth, user, medicine, batch, inventory, purchase, sales, invoice, sales_report, dashboard, supplier, settings
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.security_headers import SecurityHeadersMiddleware
from app.middleware.request_logging import RequestLoggingMiddleware

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('security.log'),
        logging.StreamHandler()
    ]
)

app = FastAPI(
    title="Pharmacy Management System",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

origins = [
    "http://localhost",
    "http://localhost:3000",
    "https://develop.d393xravvewyoy.amplifyapp.com",
    "http://54.179.188.174"
]

# Security Middleware (order matters - applied in reverse)
# 1. Request logging (first to log everything)
app.add_middleware(RequestLoggingMiddleware)

# 2. Security headers
app.add_middleware(SecurityHeadersMiddleware)

# 3. Rate limiting
app.add_middleware(
    RateLimitMiddleware,
    requests_per_minute=60,
    requests_per_hour=1000
)

# 4. CORS (after rate limiting to prevent abuse)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 5. Trusted host (validate Host header)
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["localhost", "127.0.0.1", "54.179.188.174", "develop.d393xravvewyoy.amplifyapp.com", "*"]
)

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
