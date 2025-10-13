"""FastAPI application main entry point"""
from contextlib import asynccontextmanager
from typing import Dict

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import create_db_and_tables
from app.routers import flags


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup: Create database tables
    create_db_and_tables()
    yield
    # Shutdown: cleanup if needed


# Create FastAPI application
app = FastAPI(
    title="OpenFlag",
    description="Self-hosted feature flag service",
    version="0.1.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check() -> Dict[str, str]:
    """Health check endpoint"""
    return {"status": "healthy", "service": "openflag"}


# Include routers
app.include_router(flags.router, prefix="/api/flags", tags=["flags"])
