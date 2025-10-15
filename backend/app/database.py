"""Database configuration and session management"""
from sqlmodel import SQLModel, create_engine, Session
from typing import Generator
from .config import settings

# Create engine with connection pooling
# Supports both SQLite (development) and PostgreSQL (production)
connect_args = {}
if settings.database_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.database_url,
    echo=(settings.environment == "development"),  # Log SQL queries in development
    connect_args=connect_args,
    pool_pre_ping=True,  # Verify connections before using
    pool_size=5,  # Connection pool size
    max_overflow=10,  # Max overflow connections
)


def create_db_and_tables():
    """Create all database tables"""
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    """Get database session for dependency injection"""
    with Session(engine) as session:
        yield session
