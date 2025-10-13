"""Simple in-memory cache for feature flags"""
from typing import Optional, Dict
from datetime import datetime, timedelta

from app.models import Flag


class FlagCache:
    """Simple in-memory cache with TTL"""
    
    def __init__(self, ttl_seconds: int = 30):
        self._cache: Dict[str, tuple[Flag, datetime]] = {}
        self._ttl = timedelta(seconds=ttl_seconds)
    
    def get(self, key: str) -> Optional[Flag]:
        """Get flag from cache if not expired"""
        if key not in self._cache:
            return None
        
        flag, timestamp = self._cache[key]
        
        # Check if expired
        if datetime.utcnow() - timestamp > self._ttl:
            del self._cache[key]
            return None
        
        return flag
    
    def set(self, key: str, flag: Flag) -> None:
        """Store flag in cache with current timestamp"""
        self._cache[key] = (flag, datetime.utcnow())
    
    def delete(self, key: str) -> None:
        """Remove flag from cache"""
        self._cache.pop(key, None)
    
    def clear(self) -> None:
        """Clear entire cache"""
        self._cache.clear()


# Global cache instance
flag_cache = FlagCache(ttl_seconds=30)
