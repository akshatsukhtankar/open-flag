"""Cache layer supporting both in-memory and Redis"""
from typing import Optional, Dict
from datetime import datetime, timedelta
import json

from app.models import Flag
from app.config import settings

# Try to import Redis, fall back to in-memory if not available
try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False


class InMemoryCache:
    """Simple in-memory cache with TTL (fallback)"""
    
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


class RedisCache:
    """Redis-backed distributed cache"""
    
    def __init__(self, redis_url: str, ttl_seconds: int = 30):
        self._redis = redis.from_url(redis_url, decode_responses=True)
        self._ttl = ttl_seconds
        self._prefix = "openflag:flag:"
    
    def get(self, key: str) -> Optional[Flag]:
        """Get flag from Redis cache"""
        cache_key = f"{self._prefix}{key}"
        data = self._redis.get(cache_key)
        
        if not data:
            return None
        
        try:
            flag_dict = json.loads(data)
            return Flag(**flag_dict)
        except (json.JSONDecodeError, Exception):
            return None
    
    def set(self, key: str, flag: Flag) -> None:
        """Store flag in Redis with TTL"""
        cache_key = f"{self._prefix}{key}"
        data = flag.model_dump_json()
        self._redis.setex(cache_key, self._ttl, data)
    
    def delete(self, key: str) -> None:
        """Remove flag from Redis"""
        cache_key = f"{self._prefix}{key}"
        self._redis.delete(cache_key)
    
    def clear(self) -> None:
        """Clear all cached flags"""
        keys = self._redis.keys(f"{self._prefix}*")
        if keys:
            self._redis.delete(*keys)


# Initialize cache based on configuration
def create_cache():
    """Factory function to create appropriate cache instance"""
    if REDIS_AVAILABLE and settings.redis_url:
        try:
            return RedisCache(settings.redis_url, settings.cache_ttl)
        except Exception as e:
            print(f"Failed to connect to Redis: {e}. Falling back to in-memory cache.")
            return InMemoryCache(settings.cache_ttl)
    else:
        return InMemoryCache(settings.cache_ttl)


# Global cache instance
flag_cache = create_cache()
