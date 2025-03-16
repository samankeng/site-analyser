import os
import numpy as np
import pandas as pd
import joblib
import logging
from typing import List, Dict, Any, Optional, Tuple
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from datetime import datetime

from app.core.config import settings
from app.core.logging import log_execution_time, log_model_performance
from app.models.risk_scoring.scoring_model import _extract_features, RISK_CATEGORIES

# Set up logger
logger = logging.getLogger(__name__)

# Model paths
MODEL_PATH = os.path.join(settings.MODEL_PATH, "risk_scoring_model.joblib")
SCALER_PATH = os.path.join(settings.MODEL_PATH, "risk_scoring_scaler.joblib")
METRICS_PATH = os.path.join(settings.MODEL_PATH, "risk_scoring_metrics.json")


def train_model(
    training_data: Optional[List[Dict[str, Any]]] = None,
    hyperparameter_tuning: bool = False,
    test_size: float = 0.2,
    random_state: int = 42,
    save_model: bool = True
) -> Tuple[GradientBoostingRegressor, StandardScaler, Dict[str, Any]]:
    """
    Train a risk scoring regression model
    
    Args:
        training_data: List of scan data dictionaries with risk scores. If None, synthetic data will be used
        hyperparameter_tuning: Whether to perform grid search for hyperparameter tuning
        test_size: Proportion of data to use for testing
        random_state: Random state for reproducibility
        save_model: Whether to save the trained model to disk
        
    Returns:
        Tuple containing (trained model, scaler, performance metrics)
    """
    with log_execution_time("risk_scoring_training"):
        # Check if we have training data, otherwise generate synthetic data
        if training_data is None or len(training_data) < 100:
            logger.info("Insufficient real training data, generating synthetic data")
            X, y = _generate_synthetic_data()
        else:
            logger.info(f"Training with {len(training_data)} real data points")
            X, y = _prepare_data(training_data)
        
        # Split into training and testing sets
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state
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
            model = GradientBoostingRegressor(
                n_estimators=100,
                learning_rate=0.1,
                max_depth=3,
                min_samples_split=2,
                min_samples_leaf=1,
                subsample=1.0,
                max_features=None,
                random_state=random_state
            )
            model.fit(X_train_scaled, y_train)
        
        # Evaluate the model
        y_pred = model.predict(X_test_scaled)
        metrics = _evaluate_model(y_test, y_pred, model)
        
        # Save the model if requested
        if save_model:
            _save_model(model, scaler, metrics)
        
        # Log model performance
        log_model_performance(
            model_name="risk_scoring",
            prediction_type="regression",
            execution_time_ms=0,  # Will be filled by the context manager
            metrics={
                "rmse": metrics["rmse"],
                "mae": metrics["mae"],
                "r2": metrics["r2"]
            }
        )
        
        return model, scaler, metrics


def _prepare_data(
    training_data: List[Dict[str, Any]]
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Extract features and target values from training data
    
    Args:
        training_data: List of scan data dictionaries with risk scores
        
    Returns:
        Tuple of (features array, target values array)
    """
    features_list = []
    targets = []
    
    # Process each scan data entry
    for entry in training_data:
        # Extract features
        features = _extract_features(entry)
        features_list.append(features)
        
        # Extract target risk score
        if "overall_risk_score" in entry:
            risk_score = entry["overall_risk_score"]
        elif "risk_score" in entry:
            risk_score = entry["risk_score"]
        else:
            # Use category scores if available
            category_scores = entry.get("category_scores", {})
            if category_scores:
                weighted_sum = 0
                total_weight = 0
                
                for category, weight in RISK_CATEGORIES.items():
                    if category in category_scores:
                        score = category_scores[category].get("score", 0)
                        weighted_sum += score * weight
                        total_weight += weight
                
                risk_score = weighted_sum / total_weight if total_weight > 0 else 50
            else:
                # Default to middle risk score if no information available
                risk_score = 50
        
        targets.append(risk_score)
    
    # Convert to numpy arrays
    X = np.array(features_list)
    y = np.array(targets)
    
    return X, y


def _generate_synthetic_data(n_samples: int = 1000) -> Tuple[np.ndarray, np.ndarray]:
    """
    Generate synthetic data for initial model training
    
    Args:
        n_samples: Number of samples to generate
        
    Returns:
        Tuple of (features array, target values array)
    """
    # Set random seed for reproducibility
    np.random.seed(42)
    
    # Number of features that _extract_features function returns
    n_features = 31
    
    # Generate random features
    X = np.random.rand(n_samples, n_features)
    
    # Generate meaningful synthetic risk scores based on features
    # We'll create a simple model where certain features contribute more to risk
    
    # Define feature importance for synthetic data generation
    # This doesn't need to match the actual model, just create plausible data
    feature_importances = np.zeros(n_features)
    
    # Critical findings (feature 0) has highest importance
    feature_importances[0] = 5.0
    
    # High findings (feature 1) has high importance
    feature_importances[1] = 3.0
    
    # Medium findings (feature 2) has medium importance
    feature_importances[2] = 1.5
    
    # SSL features (features 5-9) have moderate importance
    feature_importances[5:10] = 1.0
    
    # Headers features (features 10-16) have lower importance
    feature_importances[10:17] = 0.8
    
    # Server features (features 23-26) have high importance
    feature_importances[23:27] = 2.0
    
    # Reputation features (features 27-30) have high importance
    feature_importances[27:31] = 2.5
    
    # Normalize importances
    feature_importances = feature_importances / np.sum(feature_importances)
    
    # Generate risk scores as weighted combinations of features
    # Adding some noise to make it more realistic
    y = np.zeros(n_samples)
    for i in range(n_samples):
        # Base score between 20-80
        base_score = 20 + 60 * np.random.rand()
        
        # Add weighted feature contributions
        feature_contribution = np.sum(X[i] * feature_importances) * 100
        
        # Add random noise
        noise = np.random.normal(0, 5)
        
        # Combine and ensure within 0-100 range
        y[i] = np.clip(base_score + feature_contribution + noise, 0, 100)
    
    return X, y


def _hyperparameter_tuning(X_train: np.ndarray, y_train: np.ndarray) -> GradientBoostingRegressor:
    """
    Perform grid search for hyperparameter tuning
    
    Args:
        X_train: Training features
        y_train: Training targets
        
    Returns:
        Tuned GradientBoostingRegressor model
    """
    # Define parameter grid
    param_grid = {
        'n_estimators': [50, 100, 200],
        'learning_rate': [0.05, 0.1, 0.2],
        'max_depth': [2, 3, 4, 5],
        'min_samples_split': [2, 5, 10],
        'min_samples_leaf': [1, 2, 4],
        'subsample': [0.8, 1.0]
    }
    
    # Create grid search
    grid_search = GridSearchCV(
        GradientBoostingRegressor(random_state=42),
        param_grid,
        cv=5,
        scoring='neg_mean_squared_error',
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
    model: GradientBoostingRegressor
) -> Dict[str, Any]:
    """
    Evaluate the performance of the risk scoring model
    
    Args:
        y_true: True risk scores
        y_pred: Predicted risk scores
        model: Trained model
        
    Returns:
        Dictionary of performance metrics
    """
    # Calculate regression metrics
    mse = mean_squared_error(y_true, y_pred)
    rmse = np.sqrt(mse)
    mae = mean_absolute_error(y_true, y_pred)
    r2 = r2_score(y_true, y_pred)
    
    # Calculate relative errors
    mean_rel_error = np.mean(np.abs(y_true - y_pred) / (y_true + 1e-8)) * 100  # Add small constant to avoid division by zero
    
    # Calculate error distribution
    error_margins = {
        "within_5_points": np.mean(np.abs(y_true - y_pred) <= 5) * 100,
        "within_10_points": np.mean(np.abs(y_true - y_pred) <= 10) * 100,
        "within_15_points": np.mean(np.abs(y_true - y_pred) <= 15) * 100,
        "within_20_points": np.mean(np.abs(y_true - y_pred) <= 20) * 100
    }
    
    # Get feature importances
    feature_importance = model.feature_importances_
    feature_importance_dict = {f"feature_{i}": float(importance) for i, importance in enumerate(feature_importance)}
    
    # Compile metrics
    metrics = {
        "mse": float(mse),
        "rmse": float(rmse),
        "mae": float(mae),
        "r2": float(r2),
        "mean_relative_error_pct": float(mean_rel_error),
        "error_distribution": error_margins,
        "feature_importance": feature_importance_dict,
        "training_date": datetime.now().isoformat(),
        "model_type": "GradientBoostingRegressor",
        "n_estimators": model.n_estimators,
        "max_depth": model.max_depth if model.max_depth is not None else "None"
    }
    
    return metrics


def _save_model(
    model: GradientBoostingRegressor, 
    scaler: StandardScaler, 
    metrics: Dict[str, Any]
) -> None:
    """
    Save the trained model, scaler, and metrics to disk
    
    Args:
        model: Trained GradientBoostingRegressor model
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
            
            # Simplify feature importance to top 10 features for storage
            if "feature_importance" in metrics_for_storage:
                importances = metrics_for_storage["feature_importance"]
                top_features = sorted(importances.items(), key=lambda x: x[1], reverse=True)[:10]
                metrics_for_storage["top_feature_importance"] = dict(top_features)
                del metrics_for_storage["feature_importance"]
            
            json.dump(metrics_for_storage, f, indent=2)
        logger.info(f"Metrics saved to {METRICS_PATH}")
    except Exception as e:
        logger.error(f"Error saving model artifacts: {str(e)}", exc_info=True)
        raise


def load_model() -> Tuple[GradientBoostingRegressor, StandardScaler]:
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


def analyze_feature_importance(
    model: Optional[GradientBoostingRegressor] = None
) -> Dict[str, Any]:
    """
    Analyze and explain the feature importance of the risk scoring model
    
    Args:
        model: Trained model. If None, will attempt to load from disk
        
    Returns:
        Dictionary with feature importance analysis
    """
    if model is None:
        # Try to load model
        if not os.path.exists(MODEL_PATH):
            logger.warning("Model not found, training new model for feature analysis")
            model, _, _ = train_model()
        else:
            model = joblib.load(MODEL_PATH)
    
    # Get feature importances
    feature_importance = model.feature_importances_
    
    # Create feature names based on categories
    feature_names = [
        # Severity counts (0-4)
        "critical_findings", "high_findings", "medium_findings", "low_findings", "info_findings",
        # SSL features (5-9)
        "ssl_valid", "ssl_days_to_expiry", "ssl_cipher_strength", "ssl_pfs", "ssl_no_vulnerabilities",
        # Header features (10-16)
        "has_csp", "has_x_frame_options", "has_hsts", "has_x_content_type", "has_xss_protection", 
        "has_referrer_policy", "has_permissions_policy",
        # Content features (17-22)
        "external_script_count", "inline_script_count", "form_count", "input_field_count", 
        "has_login_form", "cookie_count",
        # Server features (23-26)
        "server_version_disclosed", "server_outdated", "open_port_count", "server_vulnerability_count",
        # Reputation features (27-30)
        "is_blacklisted", "has_malware_history", "has_phishing_history", "reputation_risk_score"
    ]
    
    # Create ordered feature importances
    importance_data = []
    for i, importance in enumerate(feature_importance):
        if i < len(feature_names):
            name = feature_names[i]
        else:
            name = f"feature_{i}"
            
        importance_data.append({
            "feature": name,
            "importance": float(importance),
            "percentage": float(importance * 100)
        })
    
    # Sort by importance
    importance_data = sorted(importance_data, key=lambda x: x["importance"], reverse=True)
    
    # Group by feature categories
    category_importance = {
        "severity": sum(feature_importance[0:5]),
        "ssl": sum(feature_importance[5:10]),
        "headers": sum(feature_importance[10:17]),
        "content": sum(feature_importance[17:23]),
        "server": sum(feature_importance[23:27]),
        "reputation": sum(feature_importance[27:31])
    }
    
    # Normalize to percentages
    total = sum(category_importance.values())
    category_importance = {k: float(v / total * 100) for k, v in category_importance.items()}
    
    # Create final analysis
    analysis = {
        "feature_importance": importance_data,
        "category_importance": category_importance,
        "top_features": importance_data[:5],
        "model_info": {
            "model_type": "GradientBoostingRegressor",
            "n_estimators": model.n_estimators,
            "max_depth": model.max_depth
        }
    }
    
    return analysis