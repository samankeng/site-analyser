import os
import pandas as pd
import numpy as np
import joblib
import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import precision_score, recall_score, f1_score

from app.core.config import settings
from app.core.logging import log_execution_time, log_model_performance

# Set up logger
logger = logging.getLogger(__name__)

# Model path
MODEL_PATH = os.path.join(settings.MODEL_PATH, "anomaly_detection.joblib")
SCALER_PATH = os.path.join(settings.MODEL_PATH, "anomaly_detection_scaler.joblib")
METRICS_PATH = os.path.join(settings.MODEL_PATH, "anomaly_detection_metrics.json")

def train_model(
    data: Optional[List[Dict[str, Any]]] = None,
    n_estimators: int = 100,
    max_samples: str = 'auto',
    contamination: float = 0.1,
    random_state: int = 42,
    save_model: bool = True
) -> Tuple[IsolationForest, StandardScaler, Dict[str, float]]:
    """
    Train an Isolation Forest anomaly detection model
    
    Args:
        data: List of scan data dictionaries. If None, synthetic data will be generated
        n_estimators: Number of base estimators in the ensemble
        max_samples: Number of samples to draw to train each base estimator
        contamination: Expected proportion of anomalies in the data
        random_state: Random state for reproducibility
        save_model: Whether to save the trained model to disk
        
    Returns:
        Tuple containing (trained model, scaler, performance metrics)
    """
    with log_execution_time("anomaly_detection_training"):
        if data is None:
            logger.info("No training data provided, generating synthetic data")
            X, y = _generate_synthetic_data()
            dataset_size = len(X)
        else:
            logger.info(f"Training with {len(data)} real data points")
            X, y = _prepare_data(data)
            dataset_size = len(X)
        
        # Standardize features
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        # Create and train model
        model = IsolationForest(
            n_estimators=n_estimators,
            max_samples=max_samples,
            contamination=contamination,
            random_state=random_state
        )
        
        model.fit(X_scaled)
        
        # Evaluate model if we have labels
        if y is not None:
            metrics = _evaluate_model(model, X_scaled, y)
        else:
            # If no labels, just provide basic info
            metrics = {
                "training_date": datetime.now().isoformat(),
                "model_type": "IsolationForest",
                "n_estimators": n_estimators,
                "contamination": contamination,
                "dataset_size": dataset_size
            }
        
        # Save the model if requested
        if save_model:
            _save_model(model, scaler, metrics)
        
        # Log model performance
        log_model_performance(
            model_name="anomaly_detection",
            prediction_type="anomaly_detection",
            execution_time_ms=0,  # Will be filled by the context manager
            metrics=metrics
        )
        
        return model, scaler, metrics

def _prepare_data(data: List[Dict[str, Any]]) -> Tuple[np.ndarray, Optional[np.ndarray]]:
    """
    Extract features from scan data and prepare for training
    
    Args:
        data: List of scan data dictionaries
        
    Returns:
        Tuple of (features array, labels array if available)
    """
    features_list = []
    labels = []
    
    # Process each scan data entry
    for entry in data:
        # Extract features using the same function as in isolation_forest.py
        from app.models.anomaly_detection.isolation_forest import _extract_features
        features = _extract_features(entry)
        features_list.append(features)
        
        # If entry has a label, add it
        if "is_anomaly" in entry:
            # Convert to -1 for anomaly, 1 for normal (IsolationForest convention)
            label = -1 if entry["is_anomaly"] else 1
            labels.append(label)
    
    # Convert to numpy arrays
    X = np.array(features_list)
    
    # Return labels if available, otherwise None
    if labels:
        y = np.array(labels)
        return X, y
    else:
        return X, None

def _generate_synthetic_data(n_samples: int = 1000) -> Tuple[np.ndarray, np.ndarray]:
    """
    Generate synthetic data for initial model training
    
    Args:
        n_samples: Number of samples to generate
        
    Returns:
        Tuple of (features array, labels array)
    """
    # Set random seed for reproducibility
    np.random.seed(42)
    
    # Determine number of normal and anomalous samples
    anomaly_ratio = 0.1
    n_normal = int(n_samples * (1 - anomaly_ratio))
    n_anomalies = n_samples - n_normal
    
    # Generate normal data centered around certain values
    # Features: [overall, ssl, headers, vulnerabilities, server, 
    #            critical, high, medium, low, info, critical_ratio, high_critical_ratio]
    normal_means = [80, 85, 75, 90, 85, 0, 2, 5, 10, 20, 0.0, 0.05]
    normal_stds = [10, 15, 10, 5, 10, 0.5, 1, 3, 5, 10, 0.01, 0.03]
    
    X_normal = np.vstack([
        np.random.normal(mu, sigma, n_normal) 
        for mu, sigma in zip(normal_means, normal_stds)
    ]).T
    
    # Ensure values are in reasonable ranges
    X_normal[:, 0:5] = np.clip(X_normal[:, 0:5], 0, 100)  # Scores between 0-100
    X_normal[:, 5:10] = np.abs(X_normal[:, 5:10])         # Counts are non-negative
    X_normal[:, 10:12] = np.clip(X_normal[:, 10:12], 0, 1)  # Ratios between 0-1
    
    # Generate anomalous data with different distributions
    anomaly_means = [40, 30, 45, 50, 40, 5, 10, 15, 20, 10, 0.2, 0.5]
    anomaly_stds = [20, 15, 20, 25, 15, 3, 5, 7, 5, 5, 0.1, 0.2]
    
    X_anomalies = np.vstack([
        np.random.normal(mu, sigma, n_anomalies) 
        for mu, sigma in zip(anomaly_means, anomaly_stds)
    ]).T
    
    # Ensure values are in reasonable ranges
    X_anomalies[:, 0:5] = np.clip(X_anomalies[:, 0:5], 0, 100)  # Scores between 0-100
    X_anomalies[:, 5:10] = np.abs(X_anomalies[:, 5:10])         # Counts are non-negative
    X_anomalies[:, 10:12] = np.clip(X_anomalies[:, 10:12], 0, 1)  # Ratios between 0-1
    
    # Combine normal and anomalous data
    X = np.vstack([X_normal, X_anomalies])
    
    # Create labels: 1 for normal, -1 for anomalies (IsolationForest convention)
    y = np.concatenate([np.ones(n_normal), -np.ones(n_anomalies)])
    
    # Shuffle the data
    indices = np.arange(n_samples)
    np.random.shuffle(indices)
    X = X[indices]
    y = y[indices]
    
    return X, y

def _evaluate_model(
    model: IsolationForest, 
    X: np.ndarray, 
    y_true: np.ndarray
) -> Dict[str, float]:
    """
    Evaluate the performance of the anomaly detection model
    
    Args:
        model: Trained IsolationForest model
        X: Feature matrix
        y_true: True labels (-1 for anomalies, 1 for normal)
        
    Returns:
        Dictionary of performance metrics
    """
    # Get model predictions
    y_pred = model.predict(X)
    
    # Calculate metrics
    precision = precision_score(y_true, y_pred, pos_label=-1)
    recall = recall_score(y_true, y_pred, pos_label=-1)
    f1 = f1_score(y_true, y_pred, pos_label=-1)
    
    # Get anomaly scores
    scores = -model.score_samples(X)
    
    # Calculate AUC-like metrics for anomaly detection
    # This is a simplified approach, for a true ROC-AUC you'd need to vary the threshold
    anomaly_indices = (y_true == -1)
    normal_indices = (y_true == 1)
    
    anomaly_scores = scores[anomaly_indices]
    normal_scores = scores[normal_indices]
    
    # Calculate mean score difference (higher is better)
    mean_anomaly_score = np.mean(anomaly_scores) if len(anomaly_scores) > 0 else 0
    mean_normal_score = np.mean(normal_scores) if len(normal_scores) > 0 else 0
    score_difference = mean_anomaly_score - mean_normal_score
    
    # Compile metrics
    metrics = {
        "precision": float(precision),
        "recall": float(recall),
        "f1_score": float(f1),
        "mean_anomaly_score": float(mean_anomaly_score),
        "mean_normal_score": float(mean_normal_score),
        "score_difference": float(score_difference),
        "training_date": datetime.now().isoformat(),
        "model_type": "IsolationForest",
        "n_estimators": model.n_estimators,
        "contamination": model.contamination
    }
    
    return metrics

def _save_model(
    model: IsolationForest, 
    scaler: StandardScaler, 
    metrics: Dict[str, float]
) -> None:
    """
    Save the trained model, scaler, and metrics to disk
    
    Args:
        model: Trained IsolationForest model
        scaler: Fitted StandardScaler
        metrics: Performance metrics
    """
    try:
        # Ensure model directory exists
        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        
        # Save model
        joblib.dump(model, MODEL_PATH)
        logger.info(f"Model saved to {MODEL_PATH}")
        
        # Save scaler
        joblib.dump(scaler, SCALER_PATH)
        logger.info(f"Scaler saved to {SCALER_PATH}")
        
        # Save metrics
        import json
        with open(METRICS_PATH, 'w') as f:
            json.dump(metrics, f, indent=2)
        logger.info(f"Metrics saved to {METRICS_PATH}")
    except Exception as e:
        logger.error(f"Error saving model artifacts: {str(e)}", exc_info=True)
        raise

def load_model() -> Tuple[IsolationForest, StandardScaler]:
    """
    Load the trained model and scaler from disk
    
    Returns:
        Tuple containing (trained model, scaler)
    """
    try:
        # Check if model and scaler exist
        if not os.path.exists(MODEL_PATH) or not os.path.exists(SCALER_PATH):
            logger.info("Model or scaler not found, training new model")
            model, scaler, _ = train_model()
            return model, scaler
        
        # Load model and scaler
        model = joblib.load(MODEL_PATH)
        scaler = joblib.load(SCALER_PATH)
        
        logger.info(f"Model and scaler loaded from {MODEL_PATH} and {SCALER_PATH}")
        return model, scaler
    except Exception as e:
        logger.error(f"Error loading model: {str(e)}", exc_info=True)
        logger.info("Training new model due to load error")
        model, scaler, _ = train_model()
        return model, scaler
