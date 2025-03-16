import os
import numpy as np
import pandas as pd
import joblib
import logging
from typing import List, Dict, Any, Optional, Tuple
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
from datetime import datetime

from app.core.config import settings
from app.core.logging import log_execution_time, log_model_performance
from app.models.threat_detection.classifier import THREAT_CATEGORIES, _extract_features

# Set up logger
logger = logging.getLogger(__name__)

# Model paths
MODEL_PATH = os.path.join(settings.MODEL_PATH, "threat_classifier.joblib")
SCALER_PATH = os.path.join(settings.MODEL_PATH, "threat_scaler.joblib")
METRICS_PATH = os.path.join(settings.MODEL_PATH, "threat_classifier_metrics.json")


def train_model(
    training_data: Optional[List[Dict[str, Any]]] = None,
    hyperparameter_tuning: bool = False,
    test_size: float = 0.2,
    random_state: int = 42,
    save_model: bool = True
) -> Tuple[RandomForestClassifier, StandardScaler, Dict[str, Any]]:
    """
    Train a threat classification model
    
    Args:
        training_data: List of scan data dictionaries with labels. If None, synthetic data will be used
        hyperparameter_tuning: Whether to perform grid search for hyperparameter tuning
        test_size: Proportion of data to use for testing
        random_state: Random state for reproducibility
        save_model: Whether to save the trained model to disk
        
    Returns:
        Tuple containing (trained model, scaler, performance metrics)
    """
    with log_execution_time("threat_classifier_training"):
        # Check if we have training data, otherwise generate synthetic data
        if training_data is None or len(training_data) < 100:
            logger.info("Insufficient real training data, generating synthetic data")
            X, y = _generate_synthetic_data()
            class_names = THREAT_CATEGORIES
        else:
            logger.info(f"Training with {len(training_data)} real data points")
            X, y, class_names = _prepare_data(training_data)
        
        # Split into training and testing sets
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state, stratify=y
        )
        
        # Standardize features
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        
        # Create and train the model
        if hyperparameter_tuning:
            logger.info("Performing hyperparameter tuning")
            model = _hyperparameter_tuning(X_train_scaled, y_train)
        else:
            model = RandomForestClassifier(
                n_estimators=100, 
                max_depth=None,
                min_samples_split=2,
                min_samples_leaf=1,
                random_state=random_state,
                class_weight='balanced'
            )
            model.fit(X_train_scaled, y_train)
        
        # Evaluate the model
        y_pred = model.predict(X_test_scaled)
        metrics = _evaluate_model(y_test, y_pred, model, X_test_scaled, class_names)
        
        # Save the model if requested
        if save_model:
            _save_model(model, scaler, metrics)
        
        # Log model performance
        log_model_performance(
            model_name="threat_classifier",
            prediction_type="threat_classification",
            execution_time_ms=0,  # Will be filled by the context manager
            metrics={
                "accuracy": metrics["accuracy"],
                "weighted_f1": metrics["weighted_f1"],
                "classes": len(class_names)
            }
        )
        
        return model, scaler, metrics


def _prepare_data(
    training_data: List[Dict[str, Any]]
) -> Tuple[np.ndarray, np.ndarray, List[str]]:
    """
    Extract features and labels from training data
    
    Args:
        training_data: List of scan data dictionaries with labels
        
    Returns:
        Tuple of (features array, labels array, class names)
    """
    features_list = []
    labels = []
    
    # Process each scan data entry
    for entry in training_data:
        # Extract features
        features = _extract_features(entry)
        features_list.append(features)
        
        # Extract label
        threat_type = entry.get("threat_type", "none")
        labels.append(threat_type)
    
    # Convert to numpy arrays
    X = np.array(features_list)
    
    # Get unique class names
    class_names = sorted(set(labels))
    
    # Convert labels to numerical indices
    label_map = {label: i for i, label in enumerate(class_names)}
    y = np.array([label_map[label] for label in labels])
    
    return X, y, class_names


def _generate_synthetic_data(
    n_samples: int = 1000,
    n_features: int = 22  # Match the number of features in _extract_features
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Generate synthetic data for initial model training
    
    Args:
        n_samples: Number of samples to generate
        n_features: Number of features to generate
        
    Returns:
        Tuple of (features array, labels array)
    """
    # Set seed for reproducibility
    np.random.seed(42)
    
    # Determine number of samples per class
    n_classes = len(THREAT_CATEGORIES)
    samples_per_class = n_samples // n_classes
    
    # Lists to store data
    X_list = []
    y_list = []
    
    # Generate data for each threat category
    for class_idx, threat_type in enumerate(THREAT_CATEGORIES):
        # Create class-specific feature distributions
        if threat_type == "malware":
            # High suspicious script count, moderate findings
            features = np.random.normal(
                loc=[3, 2, 1, 0, 10, 5, 10, 2, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 3],
                scale=[1, 1, 0.5, 0.2, 3, 2, 3, 1, 1, 0.5, 0.3, 0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1],
                size=(samples_per_class, n_features)
            )
        elif threat_type == "phishing":
            # High form count, external links
            features = np.random.normal(
                loc=[1, 1, 0, 0, 5, 2, 8, 5, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 3],
                scale=[0.5, 0.5, 0.2, 0.1, 2, 1, 3, 2, 0.5, 0.5, 0.3, 0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1],
                size=(samples_per_class, n_features)
            )
        elif threat_type == "sql_injection":
            # Database-related vulnerabilities
            features = np.random.normal(
                loc=[2, 3, 1, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 4],
                scale=[1, 1, 0.5, 0.2, 1, 0.5, 0.5, 0.5, 0.5, 0.5, 0.3, 0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1],
                size=(samples_per_class, n_features)
            )
        elif threat_type == "xss":
            # Script related vulnerabilities
            features = np.random.normal(
                loc=[1, 2, 1, 0, 2, 4, 1, 0, 0, 0, 0, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 3],
                scale=[0.5, 1, 0.5, 0.2, 1, 2, 1, 0.5, 0.5, 0.5, 0.3, 0.5, 0.3, 0.3, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1],
                size=(samples_per_class, n_features)
            )
        elif threat_type == "csrf":
            # Form-related vulnerabilities
            features = np.random.normal(
                loc=[0, 2, 1, 0, 1, 0, 3, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1, 0, 0, 2],
                scale=[0.2, 1, 0.5, 0.2, 1, 0.5, 1, 0.5, 0.5, 0.5, 0.3, 0.3, 0.5, 0.3, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1],
                size=(samples_per_class, n_features)
            )
        elif threat_type == "open_redirect":
            # Redirect-related features
            features = np.random.normal(
                loc=[0, 1, 1, 0, 1, 0, 1, 4, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 4],
                scale=[0.2, 0.5, 0.5, 0.2, 1, 0.5, 1, 2, 0.5, 0.5, 0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1],
                size=(samples_per_class, n_features)
            )
        elif threat_type == "command_injection":
            # System command features
            features = np.random.normal(
                loc=[2, 2, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 3],
                scale=[1, 1, 0.2, 0.2, 1, 0.5, 0.5, 0.5, 0.5, 0.5, 0.3, 0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1],
                size=(samples_per_class, n_features)
            )
        elif threat_type == "insecure_deserialization":
            # Deserialization vulnerabilities
            features = np.random.normal(
                loc=[1, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 3],
                scale=[0.5, 0.5, 0.2, 0.2, 1, 0.5, 0.5, 0.5, 0.5, 0.5, 0.3, 0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1],
                size=(samples_per_class, n_features)
            )
        else:  # "none" - no threat
            # Normal/safe patterns
            features = np.random.normal(
                loc=[0, 0, 1, 2, 5, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                scale=[0.2, 0.2, 0.5, 1, 2, 0.5, 0.5, 0.5, 0.5, 0.5, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.5],
                size=(samples_per_class, n_features)
            )
        
        # Ensure values are in reasonable ranges
        # No negative counts
        features = np.maximum(features, 0)
        
        # Binary features should be 0 or 1
        binary_indices = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19]
        for idx in binary_indices:
            features[:, idx] = np.round(np.clip(features[:, idx], 0, 1))
        
        # Add to dataset
        X_list.append(features)
        y_list.append(np.full(samples_per_class, class_idx))
    
    # Combine all classes
    X = np.vstack(X_list)
    y = np.concatenate(y_list)
    
    # Shuffle the data
    indices = np.arange(n_samples)
    np.random.shuffle(indices)
    X = X[indices]
    y = y[indices]
    
    return X, y


def _hyperparameter_tuning(X_train: np.ndarray, y_train: np.ndarray) -> RandomForestClassifier:
    """
    Perform grid search for hyperparameter tuning
    
    Args:
        X_train: Training features
        y_train: Training labels
        
    Returns:
        Tuned RandomForestClassifier model
    """
    # Define parameter grid
    param_grid = {
        'n_estimators': [50, 100, 200],
        'max_depth': [None, 10, 20, 30],
        'min_samples_split': [2, 5, 10],
        'min_samples_leaf': [1, 2, 4],
        'class_weight': [None, 'balanced']
    }
    
    # Create grid search
    grid_search = GridSearchCV(
        RandomForestClassifier(random_state=42),
        param_grid,
        cv=5,
        scoring='f1_weighted',
        n_jobs=-1
    )
    
    # Fit grid search
    grid_search.fit(X_train, y_train)
    
    # Get best model
    logger.info(f"Best parameters: {grid_search.best_params_}")
    
    return grid_search.best_estimator_


def _evaluate_model(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    model: RandomForestClassifier,
    X_test: np.ndarray,
    class_names: List[str]
) -> Dict[str, Any]:
    """
    Evaluate the performance of the threat classification model
    
    Args:
        y_true: True labels
        y_pred: Predicted labels
        model: Trained model
        X_test: Test features
        class_names: List of class names
        
    Returns:
        Dictionary of performance metrics
    """
    # Calculate metrics
    accuracy = accuracy_score(y_true, y_pred)
    
    # Get detailed classification report
    report = classification_report(y_true, y_pred, target_names=class_names, output_dict=True)
    
    # Get feature importances
    feature_importance = model.feature_importances_
    feature_importance_dict = {f"feature_{i}": float(importance) for i, importance in enumerate(feature_importance)}
    
    # Get confusion matrix
    cm = confusion_matrix(y_true, y_pred)
    cm_dict = {}
    for i, true_class in enumerate(class_names):
        for j, pred_class in enumerate(class_names):
            cm_dict[f"{true_class}_as_{pred_class}"] = int(cm[i, j])
    
    # Compile metrics
    metrics = {
        "accuracy": float(accuracy),
        "weighted_precision": float(report["weighted avg"]["precision"]),
        "weighted_recall": float(report["weighted avg"]["recall"]),
        "weighted_f1": float(report["weighted avg"]["f1-score"]),
        "class_metrics": report,
        "feature_importance": feature_importance_dict,
        "confusion_matrix": cm_dict,
        "training_date": datetime.now().isoformat(),
        "model_type": "RandomForestClassifier",
        "n_estimators": model.n_estimators,
        "max_depth": model.max_depth if model.max_depth is not None else "None",
        "class_count": len(class_names),
        "class_names": class_names
    }
    
    return metrics


def _save_model(
    model: RandomForestClassifier, 
    scaler: StandardScaler, 
    metrics: Dict[str, Any]
) -> None:
    """
    Save the trained model, scaler, and metrics to disk
    
    Args:
        model: Trained RandomForestClassifier model
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
            # Remove large nested dictionaries for storage
            metrics_for_storage = metrics.copy()
            if "class_metrics" in metrics_for_storage:
                # Extract just the per-class F1 scores to save space
                metrics_for_storage["class_f1_scores"] = {
                    class_name: metrics["class_metrics"][class_name]["f1-score"]
                    for class_name in metrics["class_metrics"] 
                    if class_name not in ["accuracy", "macro avg", "weighted avg"]
                }
                del metrics_for_storage["class_metrics"]
            
            json.dump(metrics_for_storage, f, indent=2)
        logger.info(f"Metrics saved to {METRICS_PATH}")
    except Exception as e:
        logger.error(f"Error saving model artifacts: {str(e)}", exc_info=True)
        raise


def load_model() -> Tuple[RandomForestClassifier, StandardScaler]:
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