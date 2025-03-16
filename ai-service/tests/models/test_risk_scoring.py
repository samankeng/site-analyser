import pytest
import numpy as np
import os
import tempfile
from unittest.mock import patch, MagicMock
import joblib

from app.models.risk_scoring.scoring_model import (
    calculate_risk_score, _ml_based_scoring, _rule_based_scoring, 
    _extract_features, _get_risk_level
)
from app.models.risk_scoring.training import train_model, _generate_synthetic_data


@pytest.fixture
def sample_scan_data():
    """Sample scan data for testing"""
    return {
        "findings": [
            {"severity": "Medium", "title": "Finding 1"},
            {"severity": "Low", "title": "Finding 2"}
        ],
        "ssl": {
            "is_valid": True,
            "days_to_expiry": 90,
            "cipher_strength": 128,
            "has_pfs": True,
            "vulnerabilities": []
        },
        "headers": {
            "content_security_policy": True,
            "x_frame_options": True,
            "strict_transport_security": True,
            "x_content_type_options": True,
            "x_xss_protection": True
        },
        "content_analysis": {
            "external_script_count": 2,
            "inline_script_count": 1,
            "form_count": 1,
            "input_field_count": 3,
            "has_login_form": False,
            "cookie_count": 2
        },
        "server_info": {
            "version_disclosed": False,
            "is_outdated": False,
            "open_port_count": 2,
            "vulnerability_count": 0
        },
        "domain_reputation": {
            "is_blacklisted": False,
            "has_malware_history": False,
            "has_phishing_history": False,
            "risk_score": 5
        }
    }


@pytest.fixture
def high_risk_scan_data():
    """High risk scan data for testing"""
    return {
        "findings": [
            {"severity": "Critical", "title": "Critical Finding"},
            {"severity": "High", "title": "High Finding 1"},
            {"severity": "High", "title": "High Finding 2"}
        ],
        "ssl": {
            "is_valid": False,
            "days_to_expiry": 5,
            "cipher_strength": 64,
            "has_pfs": False,
            "vulnerabilities": ["POODLE", "HEARTBLEED"]
        },
        "headers": {
            "content_security_policy": False,
            "x_frame_options": False,
            "strict_transport_security": False,
            "x_content_type_options": False,
            "x_xss_protection": False
        },
        "content_analysis": {
            "external_script_count": 8,
            "inline_script_count": 5,
            "form_count": 3,
            "input_field_count": 12,
            "has_login_form": True,
            "cookie_count": 10
        },
        "server_info": {
            "version_disclosed": True,
            "is_outdated": True,
            "open_port_count": 15,
            "vulnerability_count": 5
        },
        "domain_reputation": {
            "is_blacklisted": True,
            "has_malware_history": True,
            "has_phishing_history": True,
            "risk_score": 85
        }
    }


def test_extract_features(sample_scan_data):
    """Test feature extraction from scan data"""
    features = _extract_features(sample_scan_data)
    
    # Check that features were extracted correctly
    assert len(features) > 0
    assert isinstance(features, list)
    assert all(isinstance(f, float) for f in features)
    
    # Features should include severity counts, SSL features, header features, etc.
    assert len(features) >= 20  # Feature vector should be substantial


def test_rule_based_scoring(sample_scan_data, high_risk_scan_data):
    """Test rule-based risk scoring"""
    # Test with normal risk data
    normal_result = _rule_based_scoring(sample_scan_data)
    
    # Check structure of result
    assert "overall_score" in normal_result
    assert "risk_level" in normal_result
    assert "risk_color" in normal_result
    assert "category_scores" in normal_result
    assert "scoring_method" in normal_result
    assert normal_result["scoring_method"] == "rule_based"
    
    # Check that all categories are present
    categories = ["vulnerability", "compliance", "exposure", "configuration", "content", "reputation"]
    for category in categories:
        assert category in normal_result["category_scores"]
        assert "score" in normal_result["category_scores"][category]
        assert "weight" in normal_result["category_scores"][category]
    
    # Test with high risk data
    high_result = _rule_based_scoring(high_risk_scan_data)
    
    # Check that high risk data gets a higher score
    assert high_result["overall_score"] > normal_result["overall_score"]
    
    # Check risk levels
    assert normal_result["risk_level"] in ["Low", "Moderate", "Medium"]
    assert high_result["risk_level"] in ["High", "Critical"]


@patch("joblib.load")
def test_ml_based_scoring(mock_load, sample_scan_data):
    """Test ML-based risk scoring"""
    # Create a mock model that returns a risk score
    mock_model = MagicMock()
    mock_model.predict.return_value = np.array([45.0])  # Medium risk score
    
    mock_scaler = MagicMock()
    mock_scaler.transform.return_value = np.array([[0.1, 0.2, 0.3]])  # Fake scaled features
    
    # Configure the mocks
    mock_load.side_effect = [mock_model, mock_scaler]
    
    # Test ML-based scoring
    with patch("os.path.exists", return_value=True):
        result = _ml_based_scoring(sample_scan_data)
        
        # Check structure of result
        assert "overall_score" in result
        assert "risk_level" in result
        assert "risk_color" in result
        assert "category_scores" in result
        assert "scoring_method" in result
        assert result["scoring_method"] == "machine_learning"
        
        # Check that the model was used
        mock_model.predict.assert_called_once()


def test_calculate_risk_score(sample_scan_data):
    """Test the main risk scoring function"""
    # Test with no ML model available
    with patch("os.path.exists", return_value=False):
        result = calculate_risk_score(sample_scan_data)
        
        # Should fall back to rule-based scoring
        assert "overall_score" in result
        assert "risk_level" in result
        assert "category_scores" in result
        assert result["scoring_method"] == "rule_based"
    
    # Test with ML model available but error occurs
    with patch("os.path.exists", return_value=True), \
         patch("app.models.risk_scoring.scoring_model._ml_based_scoring", side_effect=Exception("Test error")):
        
        result = calculate_risk_score(sample_scan_data)
        
        # Should fall back to rule-based scoring
        assert result["scoring_method"] == "rule_based"


def test_get_risk_level():
    """Test risk level determination"""
    # Test all possible risk levels
    assert _get_risk_level(10)["level"] == "Low"
    assert _get_risk_level(30)["level"] == "Moderate"
    assert _get_risk_level(50)["level"] == "Medium"
    assert _get_risk_level(70)["level"] == "High"
    assert _get_risk_level(90)["level"] == "Critical"
    
    # Test edge cases
    assert _get_risk_level(0)["level"] == "Low"
    assert _get_risk_level(100)["level"] == "Critical"
    
    # Each risk level should have a color
    for score in [10, 30, 50, 70, 90]:
        assert "color" in _get_risk_level(score)
        assert _get_risk_level(score)["color"].startswith("#")  # Color should be a hex code


def test_generate_synthetic_data():
    """Test synthetic data generation"""
    X, y = _generate_synthetic_data(n_samples=100)
    
    # Check that data was generated with correct shape
    assert X.shape[0] == 100  # 100 samples
    assert y.shape[0] == 100  # 100 scores
    
    # Check that scores are within range
    assert np.all(y >= 0)
    assert np.all(y <= 100)


def test_train_model():
    """Test model training"""
    # Use a temporary directory for model saving
    with tempfile.TemporaryDirectory() as tmpdir:
        # Set the model path to the temp directory
        model_path = os.path.join(tmpdir, "risk_scoring_model.joblib")
        
        with patch("app.models.risk_scoring.training.MODEL_PATH", model_path):
            # Train with synthetic data
            model, scaler, metrics = train_model(save_model=True)
            
            # Check that model was trained and saved
            assert os.path.exists(model_path)
            
            # Check that metrics were calculated
            assert "rmse" in metrics
            assert "mae" in metrics
            assert "r2" in metrics
            
            # Load the model and check it's the right type
            loaded_model = joblib.load(model_path)
            assert hasattr(loaded_model, "predict")


@patch("app.models.risk_scoring.training._evaluate_model")
def test_train_model_with_real_data(mock_evaluate):
    """Test model training with real data"""
    # Mock evaluation results
    mock_evaluate.return_value = {
        "rmse": 5.5,
        "mae": 4.2,
        "r2": 0.85
    }
    
    # Create some simple labeled data
    training_data = [
        {
            "findings": [],
            "ssl": {"is_valid": True},
            "overall_risk_score": 20
        },
        {
            "findings": [{"severity": "Critical"}],
            "ssl": {"is_valid": False},
            "overall_risk_score": 80
        }
    ]
    
    # Train with mock data
    with patch("joblib.dump"):  # Prevent actual file saving
        model, scaler, metrics = train_model(training_data=training_data, save_model=False)
        
        # Check that metrics were returned
        assert metrics == mock_evaluate.return_value
        
        # Check that model is of the right type
        assert hasattr(model, "predict")
