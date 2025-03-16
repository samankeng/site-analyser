import pytest
import numpy as np
import os
import tempfile
from unittest.mock import patch, MagicMock
import joblib

from app.models.anomaly_detection.isolation_forest import detect_anomalies, _extract_features
from app.models.anomaly_detection.training import train_model, _generate_synthetic_data


@pytest.fixture
def sample_scan_data():
    """Sample scan data for testing"""
    return {
        "summary": {
            "overall": 75,
            "ssl": 80,
            "headers": 70,
            "vulnerabilities": 60,
            "server": 85
        },
        "findings": [
            {
                "severity": "Medium",
                "title": "Finding 1",
                "description": "Test finding"
            },
            {
                "severity": "Low",
                "title": "Finding 2",
                "description": "Test finding"
            }
        ],
        "headers": [
            {
                "severity": "Medium",
                "title": "Header issue",
                "description": "Test header issue"
            }
        ],
        "ssl": [
            {
                "severity": "Low",
                "title": "SSL issue",
                "description": "Test SSL issue"
            }
        ]
    }


@pytest.fixture
def anomalous_scan_data():
    """Anomalous scan data for testing"""
    return {
        "summary": {
            "overall": 35,
            "ssl": 30,
            "headers": 40,
            "vulnerabilities": 25,
            "server": 45
        },
        "findings": [
            {
                "severity": "Critical",
                "title": "Critical Finding",
                "description": "Critical security issue"
            },
            {
                "severity": "High",
                "title": "High Finding",
                "description": "High security issue"
            },
            {
                "severity": "High",
                "title": "Another High Finding",
                "description": "Another high security issue"
            }
        ],
        "headers": [
            {
                "severity": "High",
                "title": "Serious Header issue",
                "description": "Serious header issue"
            }
        ],
        "ssl": [
            {
                "severity": "Critical",
                "title": "Critical SSL issue",
                "description": "Critical SSL issue"
            }
        ]
    }


def test_extract_features(sample_scan_data):
    """Test feature extraction from scan data"""
    features = _extract_features(sample_scan_data)
    
    # Check that features were extracted correctly
    assert len(features) > 0
    assert isinstance(features, list)
    assert all(isinstance(f, float) for f in features)
    
    # Features should include severity counts and ratios
    assert len(features) >= 7  # At minimum, 5 severity counts + 2 ratios


@patch("joblib.load")
def test_detect_anomalies_model_exists(mock_load, sample_scan_data, anomalous_scan_data):
    """Test anomaly detection when model exists"""
    # Create a mock model that returns 1 for normal and -1 for anomalous data
    mock_model = MagicMock()
    
    # Configure the mock to return different results for different inputs
    def side_effect(X):
        # This is a simplified check - in reality it would depend on the features
        if X[0][0] <= 2:  # If critical findings count is low
            return np.array([1])  # Normal
        else:
            return np.array([-1])  # Anomalous
    
    mock_model.predict.side_effect = side_effect
    mock_load.return_value = mock_model
    
    # Test with normal data
    with patch("os.path.exists", return_value=True):
        result_normal = detect_anomalies(sample_scan_data)
        assert result_normal is False  # Not anomalous
    
    # Test with anomalous data
    with patch("os.path.exists", return_value=True):
        result_anomalous = detect_anomalies(anomalous_scan_data)
        assert result_anomalous is True  # Anomalous


@patch("app.models.anomaly_detection.isolation_forest._train_model")
def test_detect_anomalies_no_model(mock_train, sample_scan_data):
    """Test anomaly detection when model does not exist"""
    # Configure the mock to indicate no anomaly
    mock_model = MagicMock()
    mock_model.predict.return_value = np.array([1])  # 1 means normal (not anomalous)
    mock_train.return_value = None
    
    # Test with model not existing
    with patch("os.path.exists", return_value=False):
        result = detect_anomalies(sample_scan_data)
        assert result is False  # Default to non-anomalous if error/no model
        mock_train.assert_called_once()  # Should attempt to train a new model


def test_generate_synthetic_data():
    """Test synthetic data generation"""
    X, y = _generate_synthetic_data(n_samples=100)
    
    # Check that data was generated with correct shape
    assert X.shape[0] == 100  # 100 samples
    assert y.shape[0] == 100  # 100 labels
    
    # Check that labels are either -1 (anomaly) or 1 (normal)
    assert set(np.unique(y)) <= {-1, 1}
    
    # Check reasonable ratio of normal to anomalous data (around 90% normal, 10% anomalous)
    assert 0.05 <= (y == -1).mean() <= 0.15


def test_train_model():
    """Test model training"""
    # Use a temporary directory for model saving
    with tempfile.TemporaryDirectory() as tmpdir:
        # Set the model path to the temp directory
        model_path = os.path.join(tmpdir, "anomaly_detection.joblib")
        
        with patch("app.models.anomaly_detection.training.MODEL_PATH", model_path):
            # Train with synthetic data
            model, scaler, metrics = train_model(save_model=True)
            
            # Check that model was trained and saved
            assert os.path.exists(model_path)
            
            # Check that metrics were calculated
            assert "accuracy" in metrics or "auc" in metrics
            
            # Load the model and check it's the right type
            loaded_model = joblib.load(model_path)
            assert hasattr(loaded_model, "predict")


@patch("app.models.anomaly_detection.training._evaluate_model")
def test_train_model_with_real_data(mock_evaluate):
    """Test model training with real data"""
    # Mock evaluation results
    mock_evaluate.return_value = {
        "accuracy": 0.9,
        "precision": 0.85,
        "recall": 0.8,
        "f1": 0.825
    }
    
    # Create some simple labeled data
    training_data = [
        {"summary": {"overall": 80}, "findings": [], "is_anomaly": False},
        {"summary": {"overall": 30}, "findings": [{"severity": "Critical"}], "is_anomaly": True}
    ]
    
    # Train with mock data
    with patch("joblib.dump"):  # Prevent actual file saving
        model, scaler, metrics = train_model(training_data=training_data, save_model=False)
        
        # Check that metrics were returned
        assert metrics == mock_evaluate.return_value
        
        # Check that model is of the right type
        assert hasattr(model, "predict")
