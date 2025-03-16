import logging
import sys
import json
import time
from pathlib import Path
from typing import Dict, Any, Optional, Union
from datetime import datetime
from contextlib import contextmanager

from app.core.config import settings


class CustomFormatter(logging.Formatter):
    """Custom log formatter that outputs structured JSON logs."""
    
    def format(self, record: logging.LogRecord) -> str:
        log_record: Dict[str, Any] = {
            "timestamp": datetime.utcfromtimestamp(record.created).isoformat() + "Z",
            "level": record.levelname,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
            "service": settings.APP_NAME,
            "environment": settings.ENV,
        }
        
        # Add exception info if available
        if record.exc_info:
            log_record["exception"] = {
                "type": record.exc_info[0].__name__,
                "message": str(record.exc_info[1]),
                "traceback": self.formatException(record.exc_info)
            }
        
        # Add extra fields from record
        if hasattr(record, "extra") and record.extra:
            log_record["extra"] = record.extra
        
        return json.dumps(log_record)


def get_logger(name: str) -> logging.Logger:
    """Configure and return a logger with the given name."""
    logger = logging.getLogger(name)
    
    # Set log level based on configuration
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    logger.setLevel(log_level)
    
    # Create handlers based on environment
    if settings.ENV.lower() == "development":
        # Console handler for development
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(CustomFormatter())
        logger.addHandler(console_handler)
    else:
        # JSON handler for production
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(CustomFormatter())
        logger.addHandler(console_handler)
        
        # Optionally add a file handler for production if needed
        if settings.DEBUG:
            # Ensure log directory exists
            log_dir = Path("./logs")
            log_dir.mkdir(exist_ok=True)
            
            file_handler = logging.FileHandler(f"./logs/{name}.log")
            file_handler.setFormatter(CustomFormatter())
            logger.addHandler(file_handler)
    
    # Prevent propagation to root logger
    logger.propagate = False
    
    return logger


# Create a default logger
logger = get_logger("ai_service")


class LoggingMiddleware:
    """Middleware for logging HTTP requests and responses."""
    
    async def __call__(self, request, call_next):
        start_time = time.time()
        request_id = request.headers.get("X-Request-ID", "")
        
        # Log the request
        logger.info(
            f"Request started: {request.method} {request.url.path}",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "query_params": str(request.query_params),
                "client_ip": request.client.host if request.client else None,
                "user_agent": request.headers.get("User-Agent"),
            }
        )
        
        try:
            response = await call_next(request)
            
            # Calculate processing time
            process_time = time.time() - start_time
            
            # Log the response
            logger.info(
                f"Request completed: {request.method} {request.url.path}",
                extra={
                    "request_id": request_id,
                    "status_code": response.status_code,
                    "processing_time_ms": round(process_time * 1000, 2),
                }
            )
            
            return response
        except Exception as e:
            # Log any unhandled exceptions
            logger.error(
                f"Request failed: {request.method} {request.url.path}",
                extra={
                    "request_id": request_id,
                    "error": str(e),
                    "processing_time_ms": round((time.time() - start_time) * 1000, 2),
                },
                exc_info=True
            )
            raise


@contextmanager
def log_execution_time(operation_name: str, extra: Optional[Dict[str, Any]] = None):
    """Context manager to log the execution time of a block of code."""
    start_time = time.time()
    
    try:
        yield
    finally:
        execution_time = time.time() - start_time
        log_extra = {"execution_time_ms": round(execution_time * 1000, 2)}
        
        if extra:
            log_extra.update(extra)
            
        logger.info(f"Operation '{operation_name}' completed", extra=log_extra)


def log_model_performance(
    model_name: str,
    prediction_type: str,
    execution_time_ms: float,
    metrics: Optional[Dict[str, Union[float, int, str]]] = None
):
    """Log model performance metrics."""
    extra = {
        "model_name": model_name,
        "prediction_type": prediction_type,
        "execution_time_ms": execution_time_ms
    }
    
    if metrics:
        extra["metrics"] = metrics
        
    logger.info(f"Model '{model_name}' inference completed", extra=extra)
