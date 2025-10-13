"""Database models for OpenFlag"""
from datetime import datetime
from typing import Optional
from enum import Enum

from sqlmodel import Field, SQLModel


class FlagType(str, Enum):
    """Flag value types"""
    BOOLEAN = "boolean"
    STRING = "string"
    NUMBER = "number"
    JSON = "json"


class Flag(SQLModel, table=True):
    """Feature flag model"""
    __tablename__ = "flags"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    key: str = Field(index=True, unique=True, max_length=255)
    name: str = Field(max_length=255)
    description: Optional[str] = Field(default=None, max_length=1000)
    type: FlagType = Field(default=FlagType.BOOLEAN)
    value: str = Field(default="false")  # Store all values as strings
    enabled: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class FlagCreate(SQLModel):
    """Schema for creating a new flag"""
    key: str = Field(min_length=1, max_length=255)
    name: str = Field(min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=1000)
    type: FlagType = FlagType.BOOLEAN
    value: str = "false"
    enabled: bool = True


class FlagUpdate(SQLModel):
    """Schema for updating an existing flag"""
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = None
    type: Optional[FlagType] = None
    value: Optional[str] = None
    enabled: Optional[bool] = None


class FlagResponse(SQLModel):
    """Schema for flag responses"""
    id: int
    key: str
    name: str
    description: Optional[str]
    type: FlagType
    value: str
    enabled: bool
    created_at: datetime
    updated_at: datetime
