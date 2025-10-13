"""Database configuration and session management"""
from sqlmodel import SQLModel, create_engine, Session
from typing import Generator

# SQLite database URL - will create file in backend directory
DATABASE_URL = "sqlite:///./openflag.db"

# Create engine with connection pooling
engine = create_engine(
    DATABASE_URL,
    echo=True,  # Log SQL queries in development
    connect_args={"check_same_thread": False}  # Needed for SQLite
)


def create_db_and_tables():
    """Create all database tables"""
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    """Get database session for dependency injection"""
    with Session(engine) as session:
        yield session
