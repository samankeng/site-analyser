import os
from typing import List, Optional, Dict, Any
from pydantic import BaseSettings, Field, validator

class Settings(BaseSettings):
    # Application settings
    APP_NAME: str = "Site-Analyser AI Service"
    API_PREFIX: str = "/api"
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    ENV: str = os.getenv("ENV", "development")
    
    # Server settings
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    # CORS settings - defined as empty list first, will be populated in __init__
    CORS_ORIGINS: List[str] = []
    
    # Security settings
    API_KEY: Optional[str] = os.getenv("API_KEY")
    API_KEY_HEADER: str = "X-API-KEY"
    
    # ML Model settings
    MODEL_PATH: str = os.getenv("MODEL_PATH", "./models")
    
    # External API settings
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    SHODAN_API_KEY: Optional[str] = os.getenv("SHODAN_API_KEY")
    VIRUSTOTAL_API_KEY: Optional[str] = os.getenv("VIRUSTOTAL_API_KEY")
    
    # Ollama settings
    OLLAMA_ENDPOINT: str = os.getenv("OLLAMA_ENDPOINT", "http://localhost:11434/api/generate")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama2")
    
    def __init__(self, **data: Any):
        # Process ALLOWED_ORIGINS before initializing
        cors_input = os.getenv("ALLOWED_ORIGINS", "*")
        
        if cors_input == "*":
            data["CORS_ORIGINS"] = ["*"]
        else:
            data["CORS_ORIGINS"] = [origin.strip() for origin in cors_input.split(",") if origin.strip()]
        
        super().__init__(**data)
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        # Important: disable JSON parsing for env vars
        json_loads = lambda v: v  # This ensures env vars aren't parsed as JSON

# Create settings instance
settings = Settings()

# Ensure model directory exists
os.makedirs(settings.MODEL_PATH, exist_ok=True)