from fastapi import HTTPException, status
from typing import Any, Dict, Optional, Union


class BaseAppException(Exception):
    """Base exception class for the application."""
    def __init__(
        self,
        status_code: int,
        detail: str,
        code: Optional[str] = None,
        headers: Optional[Dict[str, Any]] = None
    ):
        self.status_code = status_code
        self.detail = detail
        self.code = code
        self.headers = headers


class APIError(BaseAppException):
    """Exception raised for API errors."""
    def __init__(
        self,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail: str = "Internal server error",
        code: Optional[str] = "internal_error",
        headers: Optional[Dict[str, Any]] = None
    ):
        super().__init__(status_code, detail, code, headers)


class AuthenticationError(BaseAppException):
    """Exception raised for authentication errors."""
    def __init__(
        self,
        detail: str = "Authentication failed",
        code: Optional[str] = "authentication_error",
        headers: Optional[Dict[str, Any]] = None
    ):
        super().__init__(status.HTTP_401_UNAUTHORIZED, detail, code, headers)


class AuthorizationError(BaseAppException):
    """Exception raised for authorization errors."""
    def __init__(
        self,
        detail: str = "Permission denied",
        code: Optional[str] = "authorization_error",
        headers: Optional[Dict[str, Any]] = None
    ):
        super().__init__(status.HTTP_403_FORBIDDEN, detail, code, headers)


class ResourceNotFoundError(BaseAppException):
    """Exception raised when a resource is not found."""
    def __init__(
        self,
        detail: str = "Resource not found",
        code: Optional[str] = "not_found",
        headers: Optional[Dict[str, Any]] = None
    ):
        super().__init__(status.HTTP_404_NOT_FOUND, detail, code, headers)


class ValidationError(BaseAppException):
    """Exception raised for validation errors."""
    def __init__(
        self,
        detail: Union[str, Dict[str, Any]] = "Validation error",
        code: Optional[str] = "validation_error",
        headers: Optional[Dict[str, Any]] = None
    ):
        super().__init__(status.HTTP_422_UNPROCESSABLE_ENTITY, detail, code, headers)


class RateLimitError(BaseAppException):
    """Exception raised when rate limit is exceeded."""
    def __init__(
        self,
        detail: str = "Rate limit exceeded",
        code: Optional[str] = "rate_limit_exceeded",
        headers: Optional[Dict[str, Any]] = None
    ):
        super().__init__(status.HTTP_429_TOO_MANY_REQUESTS, detail, code, headers)


class ModelError(BaseAppException):
    """Exception raised for errors related to ML models."""
    def __init__(
        self,
        detail: str = "Model error",
        code: Optional[str] = "model_error",
        headers: Optional[Dict[str, Any]] = None
    ):
        super().__init__(status.HTTP_500_INTERNAL_SERVER_ERROR, detail, code, headers)


class ExternalServiceError(BaseAppException):
    """Exception raised for errors with external services."""
    def __init__(
        self,
        detail: str = "External service error",
        code: Optional[str] = "external_service_error",
        headers: Optional[Dict[str, Any]] = None
    ):
        super().__init__(status.HTTP_502_BAD_GATEWAY, detail, code, headers)


# Exception handler for FastAPI
def exception_handler(app):
    """Register exception handlers with FastAPI app."""
    
    @app.exception_handler(BaseAppException)
    async def handle_base_exception(request, exc):
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": exc.code,
                    "message": exc.detail
                }
            },
            headers=exc.headers
        )
    
    @app.exception_handler(Exception)
    async def handle_unhandled_exception(request, exc):
        from fastapi.responses import JSONResponse
        # Log the unexpected error
        import logging
        logging.error(f"Unhandled exception: {str(exc)}", exc_info=True)
        
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": {
                    "code": "internal_server_error",
                    "message": "An unexpected error occurred"
                }
            }
        )
