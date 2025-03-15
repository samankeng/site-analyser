import uvicorn
import os
from app.core.config import settings
from app.core.logging import setup_logging
from app.api.routes import app

# Set up logging
setup_logging()

def main():
    """
    Main function to run the application
    """
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        log_level=settings.LOG_LEVEL.lower(),
        reload=settings.ENV != "production"
    )

if __name__ == "__main__":
    main()