from fastapi import Depends, Header, HTTPException, Security, Request
from fastapi.security import APIKeyHeader
from typing import Optional, List, Union, Dict, Any, Callable
import time
import secrets
from starlette.status import HTTP_403_FORBIDDEN, HTTP_401_UNAUTHORIZED, HTTP_429_TOO_MANY_REQUESTS
import hashlib
import hmac

from app.core.config import settings
from app.core.errors import AuthenticationError, RateLimitError


# API Key security scheme
api_key_header = APIKeyHeader(name=settings.API_KEY_HEADER, auto_error=False)


async def verify_api_key(api_key: Optional[str] = Security(api_key_header)) -> str:
    """
    Verify the API key provided in the request.
    
    Args:
        api_key: The API key from the request header
        
    Returns:
        The validated API key
        
    Raises:
        AuthenticationError: If API key is invalid or missing
    """
    if not settings.API_KEY:
        # If no API key is configured, skip validation (for development)
        return api_key
    
    if not api_key or api_key != settings.API_KEY:
        raise AuthenticationError(
            detail="Invalid or missing API key",
            code="invalid_api_key",
            headers={"WWW-Authenticate": "ApiKey"}
        )
    
    return api_key


# IP-based rate limiting
class RateLimiter:
    """Simple in-memory rate limiter based on IP address."""
    
    def __init__(self, requests_limit: int = 60, time_window: int = 60):
        """
        Initialize the rate limiter.
        
        Args:
            requests_limit: Maximum number of requests allowed in the time window
            time_window: Time window in seconds
        """
        self.requests_limit = requests_limit
        self.time_window = time_window
        self.request_records: Dict[str, List[float]] = {}
    
    def is_rate_limited(self, key: str) -> bool:
        """
        Check if a key is rate limited.
        
        Args:
            key: Usually the client IP address
            
        Returns:
            True if rate limited, False otherwise
        """
        current_time = time.time()
        
        # Initialize if key doesn't exist
        if key not in self.request_records:
            self.request_records[key] = []
        
        # Clean up old records
        self.request_records[key] = [
            timestamp for timestamp in self.request_records[key]
            if current_time - timestamp < self.time_window
        ]
        
        # Check if limit exceeded
        if len(self.request_records[key]) >= self.requests_limit:
            return True
        
        # Add new record
        self.request_records[key].append(current_time)
        return False


# Create a rate limiter instance
rate_limiter = RateLimiter(
    requests_limit=100,  # Adjust based on your needs
    time_window=60       # 1 minute window
)


async def rate_limit_dependency(request: Request) -> None:
    """
    Dependency for rate limiting requests.
    
    Args:
        request: The request object
        
    Raises:
        RateLimitError: If rate limit is exceeded
    """
    client_ip = request.client.host if request.client else "unknown"
    
    # Skip rate limiting in development mode
    if settings.ENV.lower() == "development" and settings.DEBUG:
        return
    
    if rate_limiter.is_rate_limited(client_ip):
        retry_after = 60  # Suggest retry after 1 minute
        raise RateLimitError(
            detail="Rate limit exceeded. Please try again later.",
            headers={"Retry-After": str(retry_after)}
        )


# HMAC signature verification for webhooks
def verify_webhook_signature(
    request_body: bytes,
    signature: str,
    secret: str,
    tolerance_seconds: int = 300
) -> bool:
    """
    Verify the HMAC signature of a webhook request.
    
    Args:
        request_body: The raw request body bytes
        signature: The signature header value
        secret: The shared secret for HMAC
        tolerance_seconds: Time tolerance in seconds
        
    Returns:
        True if signature is valid, False otherwise
    """
    try:
        # Format: timestamp.signature
        timestamp_str, sig = signature.split(".")
        timestamp = int(timestamp_str)
        
        # Check timestamp is recent
        current_time = int(time.time())
        if abs(current_time - timestamp) > tolerance_seconds:
            return False
        
        # Compute expected signature
        message = f"{timestamp}.{request_body.decode('utf-8')}"
        expected_sig = hmac.new(
            secret.encode("utf-8"),
            message.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()
        
        # Compare signatures using constant time comparison
        return secrets.compare_digest(sig, expected_sig)
    except Exception:
        return False


# Content Security Policy headers
def get_security_headers() -> Dict[str, str]:
    """
    Get security headers to add to responses.
    
    Returns:
        Dictionary of security headers
    """
    return {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Content-Security-Policy": "default-src 'self'; script-src 'self'; object-src 'none'",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        "Referrer-Policy": "strict-origin-when-cross-origin"
    }


class SecurityMiddleware:
    """Middleware for adding security headers to responses."""
    
    async def __call__(self, request: Request, call_next: Callable):
        # Process the request and get the response
        response = await call_next(request)
        
        # Add security headers
        security_headers = get_security_headers()
        for header_name, header_value in security_headers.items():
            response.headers[header_name] = header_value
        
        return response


# Sanitize input function
def sanitize_input(text: str) -> str:
    """
    Sanitize input text to prevent injection attacks.
    
    Args:
        text: Input text to sanitize
        
    Returns:
        Sanitized text
    """
    if not text:
        return text
    
    # Basic sanitization - replace potentially dangerous characters
    # For a more robust solution, consider using a library like bleach
    replacements = {
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&#x27;",
        "/": "&#x2F;",
        "\\": "&#x5C;",
        "`": "&#96;"
    }
    
    for char, replacement in replacements.items():
        text = text.replace(char, replacement)
    
    return text
