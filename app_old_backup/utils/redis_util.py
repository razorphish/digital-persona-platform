import os
import redis.asyncio as aioredis
from typing import Optional

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

_redis = None

async def get_redis():
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(REDIS_URL, decode_responses=True)
    return _redis

async def redis_set(key: str, value: str, expire: Optional[int] = None):
    redis = await get_redis()
    await redis.set(key, value, ex=expire)

async def redis_get(key: str) -> Optional[str]:
    redis = await get_redis()
    return await redis.get(key)

async def redis_incr(key: str, expire: Optional[int] = None) -> int:
    redis = await get_redis()
    val = await redis.incr(key)
    if expire:
        await redis.expire(key, expire)
    return val

async def rate_limit(key: str, limit: int, window: int) -> bool:
    """Return True if allowed, False if rate limit exceeded."""
    count = await redis_incr(key, expire=window)
    return count <= limit 