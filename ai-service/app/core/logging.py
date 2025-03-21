import logging
import sys
from typing import Optional

def setup_logging(level: str = "INFO") -> logging.Logger:
    """Setup basic logging configuration.
    
    Args:
        level: The logging level to use. Default is "INFO".
        
    Returns:
        A configured logger instance.
    """
    # Get the logging level
    logging_level = getattr(logging, level.upper(), logging.INFO)
    
    # Configure the root logger
    logging.basicConfig(
        level=logging_level,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )
    
    # Create and return a logger for the application
    logger = logging.getLogger("app")
    logger.setLevel(logging_level)
    
    return logger

# Additional logging utilities
def get_logger(name: Optional[str] = None) -> logging.Logger:
    """Get a logger with the given name.
    
    Args:
        name: The name for the logger. If None, returns the root logger.
        
    Returns:
        A logger instance.
    """
    return logging.getLogger(name)