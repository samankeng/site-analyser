# Option 2: Create a modified ai-service Dockerfile that replaces this file
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip
RUN pip install --no-cache-dir --upgrade pip

# Copy requirements file
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install additional ML libraries
RUN pip install --no-cache-dir \
    scikit-learn==1.3.0 \
    pandas==2.0.3 \
    numpy==1.25.2 \
    joblib==1.3.2 \
    httpx==0.24.1 \
    tenacity==8.2.3

# Create directory structure
RUN mkdir -p /app/app/core

# Create a fixed logging.py file
RUN echo 'import logging\n\ndef setup_logging(level: str = "INFO"):\n    """Setup basic logging configuration."""\n    logging_level = getattr(logging, level.upper(), logging.INFO)\n    logging.basicConfig(\n        level=logging_level,\n        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",\n    )\n    return logging.getLogger("app")' > /app/app/core/logging.py

# Copy application code
COPY . .

# Expose the port
EXPOSE 8000

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Command to run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]