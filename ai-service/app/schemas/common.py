from typing import List, Dict, Any, Optional, Union
from pydantic import BaseModel, Field, HttpUrl, validator
from enum import Enum
from datetime import datetime


class SeverityLevel(str, Enum):
    """Enum for severity levels."""
    CRITICAL = "Critical"
    HIGH = "High" 
    MEDIUM = "Medium"
    LOW = "Low"
    INFO = "Info"


class StatusLevel(str, Enum):
    """Enum for status levels."""
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"
    INFO = "info"


class ApiStatus(BaseModel):
    """Schema for API response status."""
    status: StatusLevel = Field(..., description="Status level")
    message: str = Field(..., description="Status message")
    
    @classmethod
    def success(cls, message: str = "Operation successful") -> "ApiStatus":
        """Create a success status response."""
        return cls(status=StatusLevel.SUCCESS, message=message)
    
    @classmethod
    def error(cls, message: str = "An error occurred") -> "ApiStatus":
        """Create an error status response."""
        return cls(status=StatusLevel.ERROR, message=message)
    
    @classmethod
    def warning(cls, message: str = "Warning") -> "ApiStatus":
        """Create a warning status response."""
        return cls(status=StatusLevel.WARNING, message=message)
    
    @classmethod
    def info(cls, message: str = "Information") -> "ApiStatus":
        """Create an info status response."""
        return cls(status=StatusLevel.INFO, message=message)


class ApiResponse(BaseModel):
    """Base schema for API responses."""
    status: ApiStatus = Field(..., description="Response status")
    data: Optional[Any] = Field(None, description="Response data")
    errors: Optional[List[Dict[str, str]]] = Field(None, description="List of errors")
    
    @classmethod
    def success(cls, data: Any = None, message: str = "Operation successful") -> "ApiResponse":
        """Create a success response."""
        return cls(
            status=ApiStatus.success(message),
            data=data
        )
    
    @classmethod
    def error(cls, message: str = "An error occurred", errors: Optional[List[Dict[str, str]]] = None) -> "ApiResponse":
        """Create an error response."""
        return cls(
            status=ApiStatus.error(message),
            errors=errors or []
        )


class PaginationParams(BaseModel):
    """Schema for pagination parameters."""
    page: int = Field(1, description="Page number (1-indexed)", ge=1)
    limit: int = Field(10, description="Number of items per page", ge=1, le=100)


class PaginatedResponse(ApiResponse):
    """Schema for paginated API responses."""
    pagination: Optional[Dict[str, int]] = Field(None, description="Pagination information")


class HealthStatus(BaseModel):
    """Schema for service health status."""
    status: str = Field(..., description="Overall service status")
    version: str = Field(..., description="Service version")
    components: Dict[str, Dict[str, str]] = Field(..., description="Component statuses")
    uptime: int = Field(..., description="Service uptime in seconds")
    timestamp: datetime = Field(..., description="Status check timestamp")


class ModelInfo(BaseModel):
    """Schema for ML model information."""
    model_type: str = Field(..., description="Type of model")
    is_available: bool = Field(..., description="Whether the model is available")
    feature_count: Optional[int] = Field(None, description="Number of features used by the model")
    trained_date: Optional[str] = Field(None, description="Date when the model was trained")
    additional_info: Optional[Dict[str, Any]] = Field(None, description="Additional model information")


class DateRange(BaseModel):
    """Schema for date range filtering."""
    start_date: datetime = Field(..., description="Start date of the range")
    end_date: datetime = Field(..., description="End date of the range")
    
    @validator('end_date')
    def end_date_after_start_date(cls, v, values):
        """Validate that end_date is after start_date."""
        if 'start_date' in values and v < values['start_date']:
            raise ValueError('end_date must be after start_date')
        return v


class FilterOptions(BaseModel):
    """Schema for filtering options."""
    date_range: Optional[DateRange] = Field(None, description="Date range filter")
    severity: Optional[List[SeverityLevel]] = Field(None, description="Severity levels to include")
    categories: Optional[List[str]] = Field(None, description="Categories to include")
    min_score: Optional[int] = Field(None, description="Minimum score", ge=0, le=100)
    max_score: Optional[int] = Field(None, description="Maximum score", ge=0, le=100)
    keywords: Optional[List[str]] = Field(None, description="Keywords to search for")
    excluded_categories: Optional[List[str]] = Field(None, description="Categories to exclude")


class SortOptions(BaseModel):
    """Schema for sorting options."""
    sort_by: str = Field(..., description="Field to sort by")
    order: str = Field("desc", description="Sort order ('asc' or 'desc')")
    
    @validator('order')
    def validate_order(cls, v):
        """Validate sort order."""
        if v not in ['asc', 'desc']:
            raise ValueError("order must be either 'asc' or 'desc'")
        return v
