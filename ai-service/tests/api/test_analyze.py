import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import json
from datetime import datetime

from app.main import app
from app.schemas.analysis import ScanRequest, ScanResult, ScoreSummary

# Create test client
client = TestClient(app)


@pytest.fixture
def mock_scan_data():
    """Fixture for mock scan data"""
    return {
        "scan_id": "test_scan_123",
        "url": "https://example.com",
        "scan_date": datetime.now().isoformat(),
        "summary": {
            "overall": 65,
            "ssl": 80,
            "headers": 60,
            "vulnerabilities": 70,
            "server": 50,
            "content": 65
        },
        "findings": [
            {
                "id": "finding_1",
                "title": "Missing Content-Security-Policy header",
                "description": "The Content-Security-Policy header is missing, which helps prevent XSS attacks.",
                "severity": "Medium",
                "category": "misconfiguration",
                "affected_component": "HTTP Headers",
                "remediation": "Add a Content-Security-Policy header to your server responses."
            }
        ],
        "headers": [
            {
                "name": "Content-Security-Policy",
                "value": None,
                "expected": "default-src 'self'",
                "severity": "Medium",
                "title": "Missing Content-Security-Policy header",
                "description": "The Content-Security-Policy header is missing, which helps prevent XSS attacks.",
                "remediation": "Add a Content-Security-Policy header to your server responses."
            }
        ],
        "ssl": []
    }


@pytest.fixture
def mock_analysis_result():
    """Fixture for mock analysis result"""
    return {
        "scan_id": "test_scan_123",
        "url": "https://example.com",
        "threat_detection": {
            "threat_detected": False,
            "primary_threat_type": "none",
            "threat_confidence": 0.0,
            "threat_details": {
                "malware": {"probability": 0.01, "severity": "Info"},
                "phishing": {"probability": 0.02, "severity": "Info"},
                "none": {"probability": 0.97, "severity": "Info"}
            }
        },
        "risk_scoring": {
            "overall_score": 35.0,
            "risk_level": "Medium",
            "risk_color": "#FFC107",
            "category_scores": {
                "vulnerability": {
                    "score": 30.0,
                    "weight": 0.3,
                    "description": "Security vulnerabilities and weaknesses"
                },
                "compliance": {
                    "score": 40.0,
                    "weight": 0.2,
                    "description": "Adherence to security standards and best practices"
                },
                "exposure": {
                    "score": 35.0,
                    "weight": 0.15,
                    "description": "Internet exposure and attack surface area"
                },
                "configuration": {
                    "score": 45.0,
                    "weight": 0.15,
                    "description": "Server and application configuration security"
                },
                "content": {
                    "score": 25.0,
                    "weight": 0.1,
                    "description": "Website content security issues"
                },
                "reputation": {
                    "score": 30.0,
                    "weight": 0.1,
                    "description": "Domain reputation and history"
                }
            },
            "scoring_method": "rule_based"
        },
        "ai_recommendations": {
            "risk_assessment": "The website has moderate security risks due to missing security headers and potential misconfiguration.",
            "recommendations": [
                "Implement proper security headers, especially Content-Security-Policy",
                "Ensure SSL/TLS is properly configured",
                "Address identified misconfiguration issues"
            ],
            "prioritized_actions": [
                "Add Content-Security-Policy header",
                "Review and update server configuration",
                "Implement regular security scanning"
            ]
        }
    }


@patch("app.api.analyze.analyze_scan_data")
def test_analyze_endpoint_success(mock_analyze, mock_scan_data, mock_analysis_result):
    """Test successful analysis endpoint"""
    # Configure mock
    mock_analyze.return_value = mock_analysis_result
    
    # Send request
    response = client.post(
        "/api/analyze",
        json=mock_scan_data
    )
    
    # Check response
    assert response.status_code == 200
    result = response.json()
    assert result["status"]["status"] == "success"
    assert result["data"]["scan_id"] == mock_analysis_result["scan_id"]
    assert result["data"]["url"] == mock_analysis_result["url"]
    assert "threat_detection" in result["data"]
    assert "risk_scoring" in result["data"]
    assert "ai_recommendations" in result["data"]
    
    # Verify mock was called with the correct data
    mock_analyze.assert_called_once()
    call_args = mock_analyze.call_args[0][0]
    assert call_args.scan_id == mock_scan_data["scan_id"]
    assert call_args.url == mock_scan_data["url"]


@patch("app.api.analyze.analyze_scan_data")
def test_analyze_endpoint_missing_data(mock_analyze):
    """Test analyze endpoint with missing data"""
    # Send request with missing required fields
    response = client.post(
        "/api/analyze",
        json={"incomplete": "data"}
    )
    
    # Check response
    assert response.status_code == 422  # Validation error
    
    # Verify mock was not called
    mock_analyze.assert_not_called()


@patch("app.api.analyze.analyze_scan_data")
def test_analyze_endpoint_service_error(mock_analyze, mock_scan_data):
    """Test analyze endpoint with service error"""
    # Configure mock to raise an exception
    mock_analyze.side_effect = Exception("Analysis service error")
    
    # Send request
    response = client.post(
        "/api/analyze",
        json=mock_scan_data
    )
    
    # Check response
    assert response.status_code == 500
    result = response.json()
    assert result["status"]["status"] == "error"
    assert "error" in result["status"]["message"].lower()


def test_health_endpoint():
    """Test health check endpoint"""
    response = client.get("/api/health")
    
    assert response.status_code == 200
    result = response.json()
    assert result["status"] == "ok"
    assert "version" in result
    assert "components" in result
    assert "uptime" in result


@patch("app.api.analyze.get_model_info")
def test_models_endpoint(mock_get_model_info):
    """Test models info endpoint"""
    # Configure mock
    mock_get_model_info.return_value = {
        "threat_detection": {
            "model_type": "RandomForestClassifier",
            "is_available": True,
            "feature_count": 25,
            "trained_date": "2023-01-01T00:00:00"
        },
        "anomaly_detection": {
            "model_type": "IsolationForest",
            "is_available": True,
            "feature_count": 15,
            "trained_date": "2023-01-01T00:00:00"
        },
        "risk_scoring": {
            "model_type": "GradientBoostingRegressor",
            "is_available": True,
            "feature_count": 30,
            "trained_date": "2023-01-01T00:00:00"
        }
    }
    
    # Send request
    response = client.get("/api/models")
    
    # Check response
    assert response.status_code == 200
    result = response.json()
    assert result["status"]["status"] == "success"
    assert "threat_detection" in result["data"]
    assert "anomaly_detection" in result["data"]
    assert "risk_scoring" in result["data"]
