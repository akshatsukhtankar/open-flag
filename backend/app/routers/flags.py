"""Feature flags CRUD API endpoints"""
from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.database import get_session
from app.models import Flag, FlagCreate, FlagUpdate, FlagResponse
from app.cache import flag_cache


router = APIRouter()


@router.post("", response_model=FlagResponse, status_code=status.HTTP_201_CREATED)
async def create_flag(
    flag_data: FlagCreate,
    session: Session = Depends(get_session)
) -> Flag:
    """Create a new feature flag"""
    # Check if key already exists
    existing = session.exec(
        select(Flag).where(Flag.key == flag_data.key)
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Flag with key '{flag_data.key}' already exists"
        )
    
    # Validate value based on type
    _validate_flag_value(flag_data.type, flag_data.value)
    
    # Create new flag
    new_flag = Flag(**flag_data.model_dump())
    session.add(new_flag)
    session.commit()
    session.refresh(new_flag)
    
    # Update cache
    flag_cache.set(new_flag.key, new_flag)
    
    return new_flag


@router.get("", response_model=List[FlagResponse])
async def list_flags(
    skip: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session)
) -> List[Flag]:
    """List all feature flags with pagination"""
    flags = session.exec(
        select(Flag).offset(skip).limit(limit)
    ).all()
    return list(flags)


@router.get("/{flag_id}", response_model=FlagResponse)
async def get_flag(
    flag_id: int,
    session: Session = Depends(get_session)
) -> Flag:
    """Get a single flag by ID"""
    flag = session.get(Flag, flag_id)
    if not flag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Flag with id {flag_id} not found"
        )
    return flag


@router.get("/key/{key}", response_model=FlagResponse)
async def get_flag_by_key(
    key: str,
    session: Session = Depends(get_session)
) -> Flag:
    """Get a single flag by key (with caching)"""
    # Check cache first
    cached_flag = flag_cache.get(key)
    if cached_flag:
        return cached_flag
    
    # Query database
    flag = session.exec(
        select(Flag).where(Flag.key == key)
    ).first()
    
    if not flag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Flag with key '{key}' not found"
        )
    
    # Update cache
    flag_cache.set(key, flag)
    
    return flag


@router.put("/{flag_id}", response_model=FlagResponse)
async def update_flag(
    flag_id: int,
    flag_update: FlagUpdate,
    session: Session = Depends(get_session)
) -> Flag:
    """Update an existing flag"""
    flag = session.get(Flag, flag_id)
    if not flag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Flag with id {flag_id} not found"
        )
    
    # Update only provided fields
    update_data = flag_update.model_dump(exclude_unset=True)
    
    # Validate value if both type and value are being updated
    if "value" in update_data or "type" in update_data:
        new_type = update_data.get("type", flag.type)
        new_value = update_data.get("value", flag.value)
        _validate_flag_value(new_type, new_value)
    
    for key, value in update_data.items():
        setattr(flag, key, value)
    
    flag.updated_at = datetime.utcnow()
    session.add(flag)
    session.commit()
    session.refresh(flag)
    
    # Invalidate cache
    flag_cache.delete(flag.key)
    
    return flag


@router.delete("/{flag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_flag(
    flag_id: int,
    session: Session = Depends(get_session)
) -> None:
    """Delete a flag"""
    flag = session.get(Flag, flag_id)
    if not flag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Flag with id {flag_id} not found"
        )
    
    # Invalidate cache
    flag_cache.delete(flag.key)
    
    session.delete(flag)
    session.commit()


def _validate_flag_value(flag_type: str, value: str) -> None:
    """Validate flag value based on type"""
    if flag_type == "boolean":
        if value.lower() not in ["true", "false"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Boolean flags must have value 'true' or 'false'"
            )
    elif flag_type == "number":
        try:
            float(value)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Number flags must have a numeric value"
            )
    elif flag_type == "json":
        import json
        try:
            json.loads(value)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="JSON flags must have valid JSON value"
            )
