"""FastAPI application main entry point"""
from contextlib import asynccontextmanager
from typing import Dict
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import create_db_and_tables
from app.routers import flags
from app.config import settings

# Configure logging
logging.basicConfig(
    level=settings.log_level.upper(),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup: Create database tables
    logger.info(f"Starting OpenFlag in {settings.environment} mode")
    logger.info(f"Database: {settings.database_url.split('@')[-1] if '@' in settings.database_url else settings.database_url}")
    logger.info(f"Cache: {'Redis' if settings.redis_url else 'In-Memory'}")
    
    create_db_and_tables()
    logger.info("Database tables created/verified")
    
    yield
    
    # Shutdown: cleanup if needed
    logger.info("Shutting down OpenFlag")


# Create FastAPI application
app = FastAPI(
    title="OpenFlag",
    description="Self-hosted feature flag service",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check() -> Dict[str, str]:
    """Health check endpoint"""
    return {
        "status": "healthy", 
        "service": "openflag",
        "environment": settings.environment,
        "version": "1.0.0"
    }


# Include routers
app.include_router(flags.router, prefix="/api/flags", tags=["flags"])
