import pytest
from unittest.mock import patch, MagicMock
import json

from app.services.threat_intelligence import (
    get_threat_intelligence, _extract_domain, _query_virustotal,
    _query_shodan, _calculate_risk_score, _generate_summary
)


@pytest.mark.asyncio
@patch("app.services.threat_intelligence._query_virustotal")
@patch("app.services.threat_intelligence._query_shodan")
async def test_get_threat_intelligence(mock_query_shodan, mock_query_virustotal):
    """Test threat intelligence retrieval"""
    # Configure mocks
    mock_query_virustotal.return_value = {
        "malicious": 0,
        "suspicious": 1,
        "harmless": 15,
        "reputation": 0,
        "categories": {},
        "last_analysis_date": 1609459200
    }
    
    mock_query_shodan.return_value = {
        "total": 1,
        "ports": [80, 443],
        "vulns": {},
        "services": ["nginx"]
    }
    
    # Get threat intelligence
    result = await get_threat_intelligence("https://example.com")
    
    # Check result structure
    assert result is not None
    assert "domain" in result
    assert "sources" in result
    assert "timestamp" in result
    assert "risk_score" in result
    assert "summary" in result
    
    # Check domain extraction
    assert result["domain"] == "example.com"
    
    # Check sources
    assert "virustotal" in result["sources"]
    assert "shodan" in result["sources"]
    
    # Verify mocks were called
    mock_query_virustotal.assert_called_once_with("example.com")
    mock_query_shodan.assert_called_once_with("example.com")


@pytest.mark.asyncio
@patch("app.services.threat_intelligence._query_virustotal")
@patch("app.services.threat_intelligence._query_shodan")
async def test_get_threat_intelligence_high_risk(mock_query_shodan, mock_query_virustotal):
    """Test threat intelligence with high risk signals"""
    # Configure mocks with high risk signals
    mock_query_virustotal.return_value = {
        "malicious": 5,
        "suspicious": 3,
        "harmless": 8,
        "reputation": -20,
        "categories": {"malicious": ["malware"]},
        "last_analysis_date": 1609459200
    }
    
    mock_query_shodan.return_value = {
        "total": 5,
        "ports": [21, 22, 80, 443, 8080],
        "vulns": {"CVE-2021-12345": {"cvss": 8.5}},
        "services": ["apache", "ftp", "ssh"]
    }
    
    # Get threat intelligence
    result = await get_threat_intelligence("https://malicious-example.com")
    
    # Check risk scoring
    assert result["risk_score"] > 50  # Should be high risk
    assert "malicious" in result["summary"].lower()
    assert result["malicious_indicators"] > 0
    assert result["suspicious_indicators"] > 0


@pytest.mark.asyncio
async def test_get_threat_intelligence_error():
    """Test error handling in threat intelligence retrieval"""
    # Test with exception in both API queries
    with patch("app.services.threat_intelligence._query_virustotal", side_effect=Exception("API error")), \
         patch("app.services.threat_intelligence._query_shodan", side_effect=Exception("API error")):
        
        result = await get_threat_intelligence("https://example.com")
        
        # Should return None on error
        assert result is None


def test_extract_domain():
    """Test domain extraction from URLs"""
    # Test various URL formats
    assert _extract_domain("https://example.com") == "example.com"
    assert _extract_domain("http://www.example.com") == "example.com"
    assert _extract_domain("https://subdomain.example.com/path") == "subdomain.example.com"
    assert _extract_domain("https://example.com:8080") == "example.com"
    
    # Test edge cases
    assert _extract_domain("example.com") == "example.com"  # No scheme
    assert _extract_domain("invalid") == "invalid"  # Not a valid URL


@pytest.mark.asyncio
@patch("httpx.AsyncClient.get")
async def test_query_virustotal(mock_get):
    """Test VirusTotal API querying"""
    # Configure mock response
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "data": {
            "attributes": {
                "last_analysis_stats": {
                    "malicious": 0,
                    "suspicious": 1,
                    "harmless": 15
                },
                "reputation": 0,
                "categories": {},
                "last_analysis_date": 1609459200
            }
        }
    }
    mock_get.return_value = mock_response
    
    # Set API key
    with patch("app.core.config.settings.VIRUSTOTAL_API_KEY", "test_key"):
        result = await _query_virustotal("example.com")
        
        # Check result
        assert result is not None
        assert "malicious" in result
        assert "suspicious" in result
        assert "harmless" in result
        assert "reputation" in result
        
        # Verify mock was called with correct URL and headers
        mock_get.assert_called_once()
        args, kwargs = mock_get.call_args
        assert "virustotal.com" in args[0]
        assert "example.com" in args[0]
        assert kwargs["headers"]["x-apikey"] == "test_key"


@pytest.mark.asyncio
@patch("httpx.AsyncClient.get")
async def test_query_virustotal_error(mock_get):
    """Test error handling in VirusTotal API querying"""
    # Configure mock for error response
    mock_response = MagicMock()
    mock_response.status_code = 401
    mock_response.text = "Unauthorized"
    mock_get.return_value = mock_response
    
    # Set API key
    with patch("app.core.config.settings.VIRUSTOTAL_API_KEY", "invalid_key"):
        result = await _query_virustotal("example.com")
        
        # Should return None on error
        assert result is None


@pytest.mark.asyncio
@patch("httpx.AsyncClient.get")
async def test_query_shodan(mock_get):
    """Test Shodan API querying"""
    # Configure mock response
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "matches": [
            {
                "port": 80,
                "product": "nginx",
                "vulns": {"CVE-2021-12345": {"cvss": 7.5}}
            },
            {
                "port": 443,
                "product": "nginx"
            }
        ],
        "total": 2
    }
    mock_get.return_value = mock_response
    
    # Set API key
    with patch("app.core.config.settings.SHODAN_API_KEY", "test_key"):
        result = await _query_shodan("example.com")
        
        # Check result
        assert result is not None
        assert "total" in result
        assert "ports" in result
        assert "vulns" in result
        assert "services" in result
        assert 80 in result["ports"]
        assert 443 in result["ports"]
        assert "nginx" in result["services"]
        assert "CVE-2021-12345" in result["vulns"]
        
        # Verify mock was called with correct params
        mock_get.assert_called_once()
        args, kwargs = mock_get.call_args
        assert "shodan.io" in args[0]
        assert kwargs["params"]["query"] == "hostname:example.com"
        assert kwargs["params"]["key"] == "test_key"


@pytest.mark.asyncio
@patch("httpx.AsyncClient.get")
async def test_query_shodan_error(mock_get):
    """Test error handling in Shodan API querying"""
    # Configure mock for error response
    mock_response = MagicMock()
    mock_response.status_code = 401
    mock_response.text = "Unauthorized"
    mock_get.return_value = mock_response
    
    # Set API key
    with patch("app.core.config.settings.SHODAN_API_KEY", "invalid_key"):
        result = await _query_shodan("example.com")
        
        # Should return None on error
        assert result is None


def test_calculate_risk_score():
    """Test risk score calculation"""
    # Test low risk case
    low_risk_data = {
        "sources": {
            "virustotal": {
                "malicious": 0,
                "reputation": 0
            },
            "shodan": {
                "vulns": {},
                "ports": [80, 443]
            }
        }
    }
    
    low_score = _calculate_risk_score(low_risk_data)
    assert low_score < 20  # Should be low risk
    
    # Test high risk case
    high_risk_data = {
        "sources": {
            "virustotal": {
                "malicious": 8,
                "reputation": -50
            },
            "shodan": {
                "vulns": {"CVE-1": {}, "CVE-2": {}, "CVE-3": {}},
                "ports": [21, 22, 23, 80, 443, 8080, 9000]
            }
        }
    }
    
    high_score = _calculate_risk_score(high_risk_data)
    assert high_score > 70  # Should be high risk
    
    # Test missing data
    no_data = {"sources": {}}
    no_data_score = _calculate_risk_score(no_data)
    assert no_data_score == 0  # No data means no risk


def test_generate_summary():
    """Test summary generation"""
    # Test low risk case
    low_risk_data = {
        "domain": "example.com",
        "risk_score": 10,
        "sources": {
            "virustotal": {
                "malicious": 0
            }
        }
    }
    
    low_summary = _generate_summary(low_risk_data)
    assert "example.com" in low_summary
    assert "low risk" in low_summary.lower()
    
    # Test high risk case with malicious indicators
    high_risk_data = {
        "domain": "malicious-example.com",
        "risk_score": 80,
        "sources": {
            "virustotal": {
                "malicious": 5
            },
            "shodan": {
                "vulns": {"CVE-1": {}, "CVE-2": {}}
            }
        }
    }
    
    high_summary = _generate_summary(high_risk_data)
    assert "malicious-example.com" in high_summary
    assert "high risk" in high_summary.lower()
    assert "malicious indicators" in high_summary
    assert "vulnerabilities" in high_summary
