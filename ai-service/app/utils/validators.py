import re
import ipaddress
from typing import Dict, Any, List, Optional, Union, Tuple
from datetime import datetime
from urllib.parse import urlparse
import json


def validate_url(url: str) -> Tuple[bool, Optional[str]]:
    """
    Validate a URL.
    
    Args:
        url: URL to validate
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not url:
        return False, "URL is required"
    
    try:
        result = urlparse(url)
        
        # Check for required components
        if not all([result.scheme, result.netloc]):
            return False, "URL must include scheme and hostname"
        
        # Check scheme
        if result.scheme not in ['http', 'https']:
            return False, "URL scheme must be http or https"
        
        return True, None
    except Exception as e:
        return False, f"Invalid URL: {str(e)}"


def validate_ip_address(ip: str) -> Tuple[bool, Optional[str]]:
    """
    Validate an IP address (IPv4 or IPv6).
    
    Args:
        ip: IP address to validate
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not ip:
        return False, "IP address is required"
    
    try:
        ipaddress.ip_address(ip)
        return True, None
    except ValueError:
        return False, "Invalid IP address format"


def validate_email(email: str) -> Tuple[bool, Optional[str]]:
    """
    Validate an email address.
    
    Args:
        email: Email address to validate
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not email:
        return False, "Email is required"
    
    # Simple pattern for basic email validation
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}
    
    if re.match(pattern, email):
        return True, None
    else:
        return False, "Invalid email format"


def validate_json(json_str: str) -> Tuple[bool, Optional[str], Optional[Dict[str, Any]]]:
    """
    Validate a JSON string.
    
    Args:
        json_str: JSON string to validate
        
    Returns:
        Tuple of (is_valid, error_message, parsed_json)
    """
    if not json_str:
        return False, "JSON string is required", None
    
    try:
        parsed = json.loads(json_str)
        return True, None, parsed
    except json.JSONDecodeError as e:
        return False, f"Invalid JSON: {str(e)}", None


def validate_date_format(date_str: str, format_str: str = "%Y-%m-%d") -> Tuple[bool, Optional[str]]:
    """
    Validate a date string against a format.
    
    Args:
        date_str: Date string to validate
        format_str: Expected date format
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not date_str:
        return False, "Date string is required"
    
    try:
        datetime.strptime(date_str, format_str)
        return True, None
    except ValueError:
        return False, f"Invalid date format. Expected format: {format_str}"


def validate_datetime_format(datetime_str: str, format_str: str = "%Y-%m-%dT%H:%M:%S") -> Tuple[bool, Optional[str]]:
    """
    Validate a datetime string against a format.
    
    Args:
        datetime_str: Datetime string to validate
        format_str: Expected datetime format
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not datetime_str:
        return False, "Datetime string is required"
    
    try:
        datetime.strptime(datetime_str, format_str)
        return True, None
    except ValueError:
        return False, f"Invalid datetime format. Expected format: {format_str}"


def validate_iso8601_datetime(datetime_str: str) -> Tuple[bool, Optional[str]]:
    """
    Validate an ISO 8601 datetime string.
    
    Args:
        datetime_str: Datetime string to validate
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not datetime_str:
        return False, "Datetime string is required"
    
    try:
        datetime.fromisoformat(datetime_str.replace('Z', '+00:00'))
        return True, None
    except ValueError:
        return False, "Invalid ISO 8601 datetime format"


def validate_required_fields(data: Dict[str, Any], required_fields: List[str]) -> Tuple[bool, List[str]]:
    """
    Validate that all required fields are present in a dictionary.
    
    Args:
        data: Dictionary to validate
        required_fields: List of required field names
        
    Returns:
        Tuple of (is_valid, missing_fields)
    """
    missing = [field for field in required_fields if field not in data or data[field] is None]
    
    if missing:
        return False, missing
    
    return True, []


def validate_field_type(value: Any, expected_type: type, field_name: str = "field") -> Tuple[bool, Optional[str]]:
    """
    Validate that a value is of the expected type.
    
    Args:
        value: Value to validate
        expected_type: Expected type
        field_name: Name of the field for error message
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not isinstance(value, expected_type):
        return False, f"{field_name} must be of type {expected_type.__name__}"
    
    return True, None


def validate_numeric_range(value: Union[int, float], min_value: Optional[Union[int, float]] = None, 
                           max_value: Optional[Union[int, float]] = None, 
                           field_name: str = "field") -> Tuple[bool, Optional[str]]:
    """
    Validate that a numeric value is within a range.
    
    Args:
        value: Value to validate
        min_value: Minimum allowed value (inclusive)
        max_value: Maximum allowed value (inclusive)
        field_name: Name of the field for error message
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if min_value is not None and value < min_value:
        return False, f"{field_name} must be greater than or equal to {min_value}"
    
    if max_value is not None and value > max_value:
        return False, f"{field_name} must be less than or equal to {max_value}"
    
    return True, None


def validate_string_length(value: str, min_length: Optional[int] = None, 
                          max_length: Optional[int] = None, 
                          field_name: str = "field") -> Tuple[bool, Optional[str]]:
    """
    Validate that a string's length is within a range.
    
    Args:
        value: String to validate
        min_length: Minimum allowed length (inclusive)
        max_length: Maximum allowed length (inclusive)
        field_name: Name of the field for error message
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not isinstance(value, str):
        return False, f"{field_name} must be a string"
    
    if min_length is not None and len(value) < min_length:
        return False, f"{field_name} must be at least {min_length} characters long"
    
    if max_length is not None and len(value) > max_length:
        return False, f"{field_name} must be at most {max_length} characters long"
    
    return True, None


def validate_enum_value(value: Any, valid_values: List[Any], field_name: str = "field") -> Tuple[bool, Optional[str]]:
    """
    Validate that a value is one of a set of valid values.
    
    Args:
        value: Value to validate
        valid_values: List of valid values
        field_name: Name of the field for error message
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if value not in valid_values:
        valid_str = ", ".join(str(v) for v in valid_values)
        return False, f"{field_name} must be one of: {valid_str}"
    
    return True, None


def validate_regex(value: str, pattern: str, field_name: str = "field") -> Tuple[bool, Optional[str]]:
    """
    Validate that a string matches a regular expression pattern.
    
    Args:
        value: String to validate
        pattern: Regular expression pattern
        field_name: Name of the field for error message
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not isinstance(value, str):
        return False, f"{field_name} must be a string"
    
    if not re.match(pattern, value):
        return False, f"{field_name} does not match required pattern"
    
    return True, None


def validate_http_header_name(name: str) -> Tuple[bool, Optional[str]]:
    """
    Validate an HTTP header name.
    
    Args:
        name: Header name to validate
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not name:
        return False, "Header name is required"
    
    # HTTP header names are case-insensitive and can contain alphanumeric characters, hyphens, and underscores
    pattern = r'^[A-Za-z0-9_-]+
    
    if re.match(pattern, name):
        return True, None
    else:
        return False, "Invalid HTTP header name format"


def validate_domain_name(domain: str) -> Tuple[bool, Optional[str]]:
    """
    Validate a domain name.
    
    Args:
        domain: Domain name to validate
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not domain:
        return False, "Domain name is required"
    
    # Basic domain name validation
    pattern = r'^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}
    
    if re.match(pattern, domain):
        return True, None
    else:
        return False, "Invalid domain name format"


def sanitize_html(html: str) -> str:
    """
    Sanitize HTML content by removing potentially dangerous tags.
    
    Args:
        html: HTML content to sanitize
        
    Returns:
        Sanitized HTML
    """
    # This is a very simplified sanitizer that removes script and iframe tags
    # For production, consider using a library like bleach
    sanitized = re.sub(r'<script.*?>.*?</script>', '', html, flags=re.DOTALL)
    sanitized = re.sub(r'<iframe.*?>.*?</iframe>', '', sanitized, flags=re.DOTALL)
    sanitized = re.sub(r'javascript:', '', sanitized, flags=re.IGNORECASE)
    sanitized = re.sub(r'on\w+\s*=', '', sanitized, flags=re.IGNORECASE)
    
    return sanitized