import numpy as np
import joblib
import logging
import os
from typing import Dict, Any, List
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

from app.core.config import settings

# Set up logger
logger = logging.getLogger(__name__)

# Model path
MODEL_PATH = os.path.join(settings.MODEL_PATH, "anomaly_detection.joblib")

def detect_anomalies(scan_data: Dict[str, Any]) -> bool:
    """
    Detect anomalies in scan data using Isolation Forest
    
    Args:
        scan_data: Dictionary containing scan results
        
    Returns:
        Boolean indicating if anomalies were detected
    """
    try:
        # Ensure model exists
        if not os.path.exists(MODEL_PATH):
            logger.info("Training new anomaly detection model")
            _train_model()
        
        # Load the model
        model = joblib.load(MODEL_PATH)
        
        # Extract features
        features = _extract_features(scan_data)
        
        # Reshape features for prediction
        X = np.array(features).reshape(1, -1)
        
        # Standardize features
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        # Predict anomalies (-1 is anomaly, 1 is normal)
        result = model.predict(X_scaled)
        
        return result[0] == -1
    except Exception as e:
        logger.error(f"Error in anomaly detection: {str(e)}", exc_info=True)
        return False

def _extract_features(scan_data: Dict[str, Any]) -> List[float]:
    """
    Extract features from scan data for anomaly detection
    
    Args:
        scan_data: Dictionary containing scan results
        
    Returns:
        List of numerical features
    """
    features = []
    
    # Add overall scores
    summary = scan_data.get("summary", {})
    features.extend([
        float(summary.get("overall", 0)),
        float(summary.get("ssl", 0)),
        float(summary.get("headers", 0)),
        float(summary.get("vulnerabilities", 0)),
        float(summary.get("server", 0))
    ])
    
    # Count findings by severity
    severity_counts = {
        "Critical": 0,
        "High": 0,
        "Medium": 0,
        "Low": 0,
        "Info": 0
    }
    
    # Process findings
    for finding in scan_data.get("findings", []):
        severity = finding.get("severity")
        if severity in severity_counts:
            severity_counts[severity] += 1
    
    # Process headers
    for header in scan_data.get("headers", []):
        severity = header.get("severity")
        if severity in severity_counts:
            severity_counts[severity] += 1
    
    # Process SSL
    for ssl in scan_data.get("ssl", []):
        severity = ssl.get("severity")
        if severity in severity_counts:
            severity_counts[severity] += 1
    
    # Add severity counts to features
    features.extend(severity_counts.values())
    
    # Add ratio features
    total_findings = sum(severity_counts.values())
    if total_findings > 0:
        features.append(severity_counts["Critical"] / total_findings)
        features.append((severity_counts["Critical"] + severity_counts["High"]) / total_findings)
    else:
        features.extend([0, 0])
    
    return features

def _train_model():
    """
    Train and save a new anomaly detection model
    """
    try:
        # For initial model, we'll create a generic model
        # that would be replaced with a properly trained one in production
        
        # Generate random sample data (10 features, 100 samples)
        np.random.seed(42)
        X = np.random.rand(100, 12)
        
        # Create and train model
        model = IsolationForest(
            n_estimators=100,
            max_samples='auto',
            contamination=0.1,
            random_state=42
        )
        model.fit(X)
        
        # Save the model
        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        joblib.dump(model, MODEL_PATH)
        
        logger.info(f"Anomaly detection model trained and saved to {MODEL_PATH}")
    except Exception as e:
        logger.error(f"Error training anomaly detection model: {str(e)}", exc_info=True)
        raise