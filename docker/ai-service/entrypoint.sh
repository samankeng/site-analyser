#!/bin/bash
set -e

# Create models directory if it doesn't exist
mkdir -p /app/models

# Initialize models if they don't exist
python -c "
import os
from app.models.threat_detection.training import train_model as train_threat_model
from app.models.anomaly_detection.training import train_model as train_anomaly_model
from app.models.risk_scoring.training import train_model as train_risk_model

# Check and initialize threat detection model
threat_model_path = os.path.join('/app/models', 'threat_classifier.joblib')
if not os.path.exists(threat_model_path):
    print('Initializing threat detection model...')
    train_threat_model()
    print('Threat detection model initialized.')

# Check and initialize anomaly detection model
anomaly_model_path = os.path.join('/app/models', 'anomaly_detection.joblib')
if not os.path.exists(anomaly_model_path):
    print('Initializing anomaly detection model...')
    train_anomaly_model()
    print('Anomaly detection model initialized.')

# Check and initialize risk scoring model
risk_model_path = os.path.join('/app/models', 'risk_scoring_model.joblib')
if not os.path.exists(risk_model_path):
    print('Initializing risk scoring model...')
    train_risk_model()
    print('Risk scoring model initialized.')

print('All models have been initialized successfully!')
"

# Wait for Ollama service to be ready
if [ -n "$OLLAMA_ENDPOINT" ]; then
    echo "Waiting for Ollama service to be ready..."
    OLLAMA_HOST=$(echo $OLLAMA_ENDPOINT | sed -E 's/https?:\/\///' | cut -d/ -f1 | cut -d: -f1)
    OLLAMA_PORT=$(echo $OLLAMA_ENDPOINT | sed -E 's/https?:\/\///' | cut -d/ -f1 | cut -d: -f2)
    
    if [ -z "$OLLAMA_PORT" ]; then
        OLLAMA_PORT=11434
    fi
    
    RETRIES=30
    until [ $RETRIES -eq 0 ] || (echo > /dev/tcp/$OLLAMA_HOST/$OLLAMA_PORT) >/dev/null 2>&1; do
        echo "Ollama is unavailable - retrying..."
        sleep 10
        RETRIES=$((RETRIES-1))
    done
    
    if [ $RETRIES -eq 0 ]; then
        echo "Warning: Failed to connect to Ollama within the allocated time, continuing anyway..."
    else
        echo "Ollama is up and running!"
    fi
fi

# Run the application
exec "$@"
