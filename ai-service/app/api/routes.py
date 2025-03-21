from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security.api_key import APIKeyHeader
import logging
from typing import Dict, Any
from datetime import datetime

from app.core.config import settings
from app.core.security import verify_api_key
from app.api import analyze
from app.schemas.common import HealthStatus

# Configure logging
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered security analysis for the Site-Analyser platform",
    version="1.0.0",
    docs_url="/api/docs" if settings.ENV != "production" else None,
    redoc_url="/api/redoc" if settings.ENV != "production" else None,
    openapi_url="/api/openapi.json" if settings.ENV != "production" else None,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Key security
api_key_header = APIKeyHeader(name=settings.API_KEY_HEADER, auto_error=False)

# Root endpoint
@app.get("/", include_in_schema=False)
async def root():
    return {
        "name": settings.APP_NAME,
        "version": "1.0.0",
        "docs": "/api/docs",
    }

# Health check endpoint
@app.get(
    "/health",
    response_model=HealthStatus,
    summary="Health check",
    description="Get service health status"
)
async def health_check():
    """
    Health check endpoint to verify the service is running
    """
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "environment": settings.ENV
    }

# Include API endpoints
app.include_router(
    analyze.router,
    prefix=settings.API_PREFIX,
    dependencies=[Depends(verify_api_key)] if settings.API_KEY else [],
    tags=["analysis"]
)

# Exception handler for generic exceptions
@app.exception_handler(Exception)
async def generic_exception_handler(request, exc):
    logger.error(f"Unexpected error: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected error occurred"}
    )

# Log application startup
@app.on_event("startup")
async def startup_event():
    logger.info(f"Starting {settings.APP_NAME} in {settings.ENV} environment")
    # Additional startup tasks here