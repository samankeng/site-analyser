import re
import json
from typing import Dict, Any, List, Optional, Union
from datetime import datetime, date
import hashlib
import uuid
from urllib.parse import urlparse


def format_datetime(dt: Union[datetime, str], format_str: str = "%Y-%m-%d %H:%M:%S") -> str:
    """
    Format a datetime object or string to a specified format.
    
    Args:
        dt: Datetime object or string to format
        format_str: Format string to use
        
    Returns:
        Formatted datetime string
    """
    if isinstance(dt, str):
        try:
            dt = datetime.fromisoformat(dt.replace('Z', '+00:00'))
        except ValueError:
            try:
                dt = datetime.strptime(dt, "%Y-%m-%dT%H:%M:%S.%fZ")
            except ValueError:
                return dt  # Return original if parsing fails
    
    return dt.strftime(format_str)


def format_date(d: Union[date, str], format_str: str = "%Y-%m-%d") -> str:
    """
    Format a date object or string to a specified format.
    
    Args:
        d: Date object or string to format
        format_str: Format string to use
        
    Returns:
        Formatted date string
    """
    if isinstance(d, str):
        try:
            d = datetime.strptime(d, "%Y-%m-%d").date()
        except ValueError:
            return d  # Return original if parsing fails
    
    return d.strftime(format_str)


def truncate_string(s: str, max_length: int = 100, suffix: str = "...") -> str:
    """
    Truncate a string to a specified maximum length.
    
    Args:
        s: String to truncate
        max_length: Maximum length of the truncated string
        suffix: Suffix to add to truncated string
        
    Returns:
        Truncated string
    """
    if len(s) <= max_length:
        return s
    
    return s[:max_length - len(suffix)] + suffix


def format_json(data: Dict[str, Any], indent: int = 2) -> str:
    """
    Format a dictionary as a JSON string.
    
    Args:
        data: Dictionary to format
        indent: Indentation level
        
    Returns:
        Formatted JSON string
    """
    return json.dumps(data, indent=indent, default=_json_serializer)


def _json_serializer(obj: Any) -> Any:
    """
    JSON serializer for objects not serializable by default json code.
    
    Args:
        obj: Object to serialize
        
    Returns:
        Serialized object
    """
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    
    return str(obj)  # Convert any other objects to strings


def format_number(num: Union[int, float], decimal_places: int = 2, 
                  thousands_separator: str = ",") -> str:
    """
    Format a number with thousands separators and specified decimal places.
    
    Args:
        num: Number to format
        decimal_places: Number of decimal places to include
        thousands_separator: Character to use as thousands separator
        
    Returns:
        Formatted number string
    """
    if isinstance(num, int):
        return f"{num:,}".replace(',', thousands_separator)
    
    format_str = f"{{:,.{decimal_places}f}}".replace(',', thousands_separator)
    return format_str.format(num)


def format_percentage(value: Union[int, float], decimal_places: int = 1) -> str:
    """
    Format a value as a percentage.
    
    Args:
        value: Value to format (0-1 or 0-100)
        decimal_places: Number of decimal places to include
        
    Returns:
        Formatted percentage string
    """
    # Check if value is already in percentage (0-100)
    if value > 1:
        percentage = value
    else:
        percentage = value * 100
    
    return f"{percentage:.{decimal_places}f}%"


def format_severity(severity: str) -> str:
    """
    Format a severity level to a standardized format.
    
    Args:
        severity: Severity level to format
        
    Returns:
        Formatted severity level
    """
    severity = severity.lower()
    
    if severity in ("critical", "crit", "c"):
        return "Critical"
    elif severity in ("high", "h"):
        return "High"
    elif severity in ("medium", "med", "m"):
        return "Medium"
    elif severity in ("low", "l"):
        return "Low"
    elif severity in ("info", "information", "i"):
        return "Info"
    
    return severity.capitalize()


def format_url(url: str, include_protocol: bool = True, 
               include_path: bool = True) -> str:
    """
    Format a URL for display.
    
    Args:
        url: URL to format
        include_protocol: Whether to include the protocol
        include_path: Whether to include the path
        
    Returns:
        Formatted URL
    """
    try:
        parsed = urlparse(url)
        
        hostname = parsed.netloc
        
        if not include_protocol:
            result = hostname
        else:
            result = f"{parsed.scheme}://{hostname}"
        
        if include_path and parsed.path and parsed.path != "/":
            result += parsed.path
        
        if parsed.query:
            result += f"?{parsed.query}"
        
        return result
    except Exception:
        return url  # Return original URL if parsing fails


def format_file_size(size_bytes: int) -> str:
    """
    Format a file size in bytes to a human-readable format.
    
    Args:
        size_bytes: File size in bytes
        
    Returns:
        Formatted file size
    """
    if size_bytes < 1024:
        return f"{size_bytes} B"
    
    for unit in ['KB', 'MB', 'GB', 'TB']:
        size_bytes /= 1024
        if size_bytes < 1024:
            return f"{size_bytes:.2f} {unit}"
    
    return f"{size_bytes:.2f} PB"


def strip_html(html: str) -> str:
    """
    Remove HTML tags from a string.
    
    Args:
        html: HTML string to strip
        
    Returns:
        String with HTML tags removed
    """
    # Simple tag stripping, for complex HTML parsing consider using a library like BeautifulSoup
    return re.sub(r'<[^>]*>', '', html)


def generate_hash(data: Union[str, bytes], hash_type: str = "sha256") -> str:
    """
    Generate a hash from data.
    
    Args:
        data: Data to hash
        hash_type: Type of hash to generate (md5, sha1, sha256, sha512)
        
    Returns:
        Hash string
    """
    if isinstance(data, str):
        data = data.encode('utf-8')
    
    if hash_type == "md5":
        return hashlib.md5(data).hexdigest()
    elif hash_type == "sha1":
        return hashlib.sha1(data).hexdigest()
    elif hash_type == "sha512":
        return hashlib.sha512(data).hexdigest()
    else:
        return hashlib.sha256(data).hexdigest()


def generate_unique_id(prefix: str = "", length: int = 32) -> str:
    """
    Generate a unique ID.
    
    Args:
        prefix: Prefix to add to the ID
        length: Length of the ID (excluding prefix)
        
    Returns:
        Unique ID string
    """
    # Generate a random UUID
    random_uuid = uuid.uuid4().hex
    
    # Truncate or pad if necessary
    if length < 32:
        random_uuid = random_uuid[:length]
    elif length > 32:
        random_uuid = random_uuid.zfill(length)
    
    return f"{prefix}{random_uuid}"


def format_key_value_pairs(data: Dict[str, Any], separator: str = ": ", 
                           line_separator: str = "\n") -> str:
    """
    Format a dictionary as a string of key-value pairs.
    
    Args:
        data: Dictionary to format
        separator: Separator between keys and values
        line_separator: Separator between lines
        
    Returns:
        Formatted string
    """
    return line_separator.join(f"{k}{separator}{v}" for k, v in data.items())


def format_list(items: List[Any], separator: str = ", ", 
                prefix: str = "", suffix: str = "") -> str:
    """
    Format a list as a string.
    
    Args:
        items: List to format
        separator: Separator between items
        prefix: Prefix to add to each item
        suffix: Suffix to add to each item
        
    Returns:
        Formatted string
    """
    return separator.join(f"{prefix}{item}{suffix}" for item in items)


def camel_to_snake(name: str) -> str:
    """
    Convert a camelCase string to snake_case.
    
    Args:
        name: String to convert
        
    Returns:
        Converted string
    """
    # Add an underscore before uppercase letters and convert to lowercase
    s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
    return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()


def snake_to_camel(name: str) -> str:
    """
    Convert a snake_case string to camelCase.
    
    Args:
        name: String to convert
        
    Returns:
        Converted string
    """
    components = name.split('_')
    return components[0] + ''.join(x.title() for x in components[1:])


def convert_case_recursive(data: Any, converter_func) -> Any:
    """
    Convert all keys in a nested dictionary or list of dictionaries.
    
    Args:
        data: Data to convert
        converter_func: Function to convert keys
        
    Returns:
        Converted data
    """
    if isinstance(data, dict):
        return {converter_func(k): convert_case_recursive(v, converter_func) for k, v in data.items()}
    elif isinstance(data, list):
        return [convert_case_recursive(item, converter_func) for item in data]
    else:
        return data
