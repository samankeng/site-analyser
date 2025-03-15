import os
from typing import List, Optional, Dict, Any
from pydantic import BaseSettings, root_validator, AnyHttpUrl

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
    
    # CORS settings
    CORS_ORIGINS: List[str] = os.getenv("CORS_ORIGINS", "*").split(",")
    
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
    
    @root_validator
    def validate_cors_origins(cls, values: Dict[str, Any]) -> Dict[str, Any]:
        if values.get("CORS_ORIGINS") == ["*"]:
            values["CORS_ORIGINS"] = ["*"]
        return values
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

# Create settings instance
settings = Settings()

# Ensure model directory exists
os.makedirs(settings.MODEL_PATH, exist_ok=True)