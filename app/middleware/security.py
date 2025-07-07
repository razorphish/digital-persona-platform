"""
Security middleware for production deployment
"""
import time
import logging
from typing import Dict, List, Optional
from fastapi import Request, Response, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import RequestResponseEndpoint
import redis.asyncio as redis
from app.config import settings

logger = logging.getLogger(__name__)

class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware using Redis"""
    
    def __init__(self, app, redis_client: redis.Redis):
        super().__init__(app)
        self.redis = redis_client
        self.rate_limits = {
            "default": {"requests": 100, "window": 60},  # 100 requests per minute
            "auth": {"requests": 5, "window": 60},       # 5 auth attempts per minute
            "api": {"requests": 1000, "window": 60},     # 1000 API calls per minute
        }
    
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        client_ip = self._get_client_ip(request)
        endpoint = self._get_endpoint_type(request.url.path)
        
        # Skip rate limiting for health checks
        if request.url.path == "/health":
            return await call_next(request)
        
        # Check rate limit
        if not await self._check_rate_limit(client_ip, endpoint):
            logger.warning(f"Rate limit exceeded for IP: {client_ip}, endpoint: {endpoint}")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please try again later."
            )
        
        response = await call_next(request)
        return response
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP from request headers"""
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        return request.client.host if request.client else "unknown"
    
    def _get_endpoint_type(self, path: str) -> str:
        """Determine endpoint type for rate limiting"""
        if path.startswith("/auth/"):
            return "auth"
        elif path.startswith("/api/") or path.startswith("/"):
            return "api"
        return "default"
    
    async def _check_rate_limit(self, client_ip: str, endpoint: str) -> bool:
        """Check if request is within rate limit"""
        try:
            limit_config = self.rate_limits.get(endpoint, self.rate_limits["default"])
            key = f"rate_limit:{endpoint}:{client_ip}"
            
            # Get current count
            current = await self.redis.get(key)
            if current is None:
                # First request in window
                await self.redis.setex(key, limit_config["window"], 1)
                return True
            
            current_count = int(current)
            if current_count >= limit_config["requests"]:
                return False
            
            # Increment counter
            await self.redis.incr(key)
            return True
            
        except Exception as e:
            logger.error(f"Rate limiting error: {e}")
            # Allow request if Redis is unavailable
            return True

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses"""
    
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        response = await call_next(request)
        
        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        
        # Content Security Policy
        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self'; "
            "connect-src 'self' https:; "
            "frame-ancestors 'none';"
        )
        response.headers["Content-Security-Policy"] = csp
        
        return response

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Log all requests for monitoring and debugging"""
    
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        start_time = time.time()
        
        # Log request
        logger.info(f"Request: {request.method} {request.url.path} from {request.client.host}")
        
        try:
            response = await call_next(request)
            process_time = time.time() - start_time
            
            # Log response
            logger.info(
                f"Response: {response.status_code} for {request.method} {request.url.path} "
                f"took {process_time:.3f}s"
            )
            
            # Add timing header
            response.headers["X-Process-Time"] = str(process_time)
            
            return response
            
        except Exception as e:
            process_time = time.time() - start_time
            logger.error(
                f"Error: {str(e)} for {request.method} {request.url.path} "
                f"took {process_time:.3f}s"
            )
            raise

def setup_security_middleware(app, redis_client: Optional[redis.Redis] = None):
    """Setup all security middleware"""
    
    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )
    
    # Custom middleware
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(RequestLoggingMiddleware)
    
    if redis_client:
        app.add_middleware(RateLimitMiddleware, redis_client=redis_client)
    
    logger.info("Security middleware configured successfully") 