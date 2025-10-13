"""Test configuration and fixtures"""
import pytest
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool
from fastapi.testclient import TestClient

from app.main import app
from app.database import get_session
from app.cache import flag_cache


@pytest.fixture(name="session")
def session_fixture():
    """Create a fresh database session for each test"""
    # Use in-memory SQLite for tests
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    
    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(session: Session):
    """Create a test client with overridden database session"""
    def get_session_override():
        return session
    
    app.dependency_overrides[get_session] = get_session_override
    
    # Clear cache before each test
    flag_cache.clear()
    
    client = TestClient(app)
    yield client
    
    app.dependency_overrides.clear()
