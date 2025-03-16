FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip
RUN pip install --no-cache-dir --upgrade pip

# Copy requirements first for better layer caching
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

# Create model directory
RUN mkdir -p /app/models

# Copy application code
COPY . .

# Use the custom entrypoint script
COPY ./docker/ai-service/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose the port
EXPOSE 8000

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Run the entrypoint script
ENTRYPOINT ["/entrypoint.sh"]

# Default command
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
