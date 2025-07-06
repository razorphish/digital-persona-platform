"""
Health check endpoints for production monitoring
"""
import asyncio
import logging
import time
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
import redis.asyncio as redis
from app.database import get_db
from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

class HealthChecker:
    """Health check service"""
    
    def __init__(self):
        self.redis_client: Optional[redis.Redis] = None
        self.start_time = time.time()
    
    async def check_database(self, db: AsyncSession) -> Dict[str, Any]:
        """Check database connectivity and performance"""
        try:
            start_time = time.time()
            result = await db.execute(text("SELECT 1"))
            await result.fetchone()
            response_time = (time.time() - start_time) * 1000
            
            return {
                "status": "healthy",
                "response_time_ms": round(response_time, 2),
                "database_url": settings.DATABASE_URL.split("@")[-1] if "@" in settings.DATABASE_URL else "sqlite"
            }
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e),
                "response_time_ms": None
            }
    
    async def check_redis(self) -> Dict[str, Any]:
        """Check Redis connectivity and performance"""
        if not self.redis_client:
            return {"status": "not_configured"}
        
        try:
            start_time = time.time()
            await self.redis_client.ping()
            response_time = (time.time() - start_time) * 1000
            
            # Test basic operations
            test_key = "health_check_test"
            await self.redis_client.set(test_key, "test", ex=10)
            await self.redis_client.get(test_key)
            
            return {
                "status": "healthy",
                "response_time_ms": round(response_time, 2),
                "redis_url": settings.REDIS_URL
            }
        except Exception as e:
            logger.error(f"Redis health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e),
                "response_time_ms": None
            }
    
    async def check_openai(self) -> Dict[str, Any]:
        """Check OpenAI API connectivity"""
        if not settings.openai_available:
            return {"status": "not_configured"}
        
        try:
            # Import here to avoid circular imports
            from app.services.openai_service import OpenAIService
            openai_service = OpenAIService()
            
            start_time = time.time()
            # Simple test call
            response = await openai_service.test_connection()
            response_time = (time.time() - start_time) * 1000
            
            return {
                "status": "healthy",
                "response_time_ms": round(response_time, 2),
                "model": settings.openai_model
            }
        except Exception as e:
            logger.error(f"OpenAI health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e),
                "response_time_ms": None
            }
    
    async def check_s3(self) -> Dict[str, Any]:
        """Check AWS S3 connectivity"""
        if not settings.s3_available:
            return {"status": "not_configured"}
        
        try:
            # Import here to avoid circular imports
            from app.utils.s3_util import S3Client
            s3_client = S3Client()
            
            start_time = time.time()
            # Test bucket access
            await s3_client.test_connection()
            response_time = (time.time() - start_time) * 1000
            
            return {
                "status": "healthy",
                "response_time_ms": round(response_time, 2),
                "bucket": settings.S3_BUCKET_NAME
            }
        except Exception as e:
            logger.error(f"S3 health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e),
                "response_time_ms": None
            }
    
    def get_system_info(self) -> Dict[str, Any]:
        """Get system information"""
        import psutil
        
        return {
            "uptime_seconds": round(time.time() - self.start_time, 2),
            "cpu_percent": psutil.cpu_percent(interval=1),
            "memory_percent": psutil.virtual_memory().percent,
            "disk_percent": psutil.disk_usage('/').percent,
            "environment": settings.ENVIRONMENT,
            "version": "1.0.0"  # You can get this from your app version
        }

# Global health checker instance
health_checker = HealthChecker()

@router.get("/health")
async def health_check():
    """Basic health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "service": "digital-persona-platform"
    }

@router.get("/health/detailed")
async def detailed_health_check(db: AsyncSession = Depends(get_db)):
    """Detailed health check with all services"""
    try:
        # Run all health checks concurrently
        tasks = [
            health_checker.check_database(db),
            health_checker.check_redis(),
            health_checker.check_openai(),
            health_checker.check_s3(),
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Extract results
        db_health, redis_health, openai_health, s3_health = results
        
        # Get system info
        system_info = health_checker.get_system_info()
        
        # Determine overall status
        all_healthy = all(
            result.get("status") in ["healthy", "not_configured"] 
            for result in [db_health, redis_health, openai_health, s3_health]
        )
        
        overall_status = "healthy" if all_healthy else "degraded"
        
        return {
            "status": overall_status,
            "timestamp": time.time(),
            "service": "digital-persona-platform",
            "checks": {
                "database": db_health,
                "redis": redis_health,
                "openai": openai_health,
                "s3": s3_health
            },
            "system": system_info
        }
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")

@router.get("/health/ready")
async def readiness_check(db: AsyncSession = Depends(get_db)):
    """Readiness check for Kubernetes"""
    try:
        # Check critical services only
        db_health = await health_checker.check_database(db)
        
        if db_health["status"] != "healthy":
            raise HTTPException(status_code=503, detail="Service not ready")
        
        return {"status": "ready"}
        
    except Exception as e:
        logger.error(f"Readiness check failed: {e}")
        raise HTTPException(status_code=503, detail="Service not ready")

@router.get("/health/live")
async def liveness_check():
    """Liveness check for Kubernetes"""
    return {"status": "alive"}

def set_redis_client(redis_client: redis.Redis):
    """Set Redis client for health checks"""
    health_checker.redis_client = redis_client 