"""Application configuration management."""
import os
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database
    database_url: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:///./openflag.db"
    )
    
    # Redis
    redis_url: Optional[str] = os.getenv("REDIS_URL")
    
    # Cache
    cache_ttl: int = int(os.getenv("CACHE_TTL", "30"))
    
    # Application
    environment: str = os.getenv("ENVIRONMENT", "development")
    log_level: str = os.getenv("LOG_LEVEL", "info")
    
    # CORS
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost",
        "http://localhost:80",
    ]
    
    class Config:
        case_sensitive = False


# Global settings instance
settings = Settings()
