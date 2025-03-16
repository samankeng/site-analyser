import pytest
from unittest.mock import patch, MagicMock
import json

from app.services.ai_analysis import (
    generate_recommendations, _create_analysis_prompt, 
    _parse_llm_response, _get_fallback_recommendations
)


@pytest.fixture
def sample_scan_data():
    """Sample scan data for testing"""
    return {
        "url": "https://example.com",
        "summary": {
            "overall": 65,
            "ssl": 70,
            "headers": 60,
            "vulnerabilities": 65,
            "server": 60
        },
        "findings": [
            {
                "severity": "Medium",
                "title": "Missing Content-Security-Policy header",
                "description": "The Content-Security-Policy header is missing, which helps prevent XSS attacks."
            },
            {
                "severity": "Low",
                "title": "Server information disclosure",
                "description": "The server is disclosing version information in HTTP headers."
            }
        ],
        "headers": [
            {
                "severity": "Medium",
                "title": "Missing Content-Security-Policy header",
                "description": "The Content-Security-Policy header is missing, which helps prevent XSS attacks."
            }
        ],
        "ssl": [
            {
                "severity": "Low",
                "title": "Weak cipher suite supported",
                "description": "The server supports cipher suites that are considered weak."
            }
        ]
    }


@pytest.fixture
def sample_llm_response():
    """Sample LLM response for testing"""
    return """
    RISK ASSESSMENT:
    The website demonstrates moderate security risks due to missing security headers and weak SSL configuration. The absence of Content-Security-Policy exposes the site to potential XSS attacks, while information disclosure and weak cipher support could facilitate targeted attacks.
    
    RECOMMENDATIONS:
    - Implement a Content-Security-Policy header to prevent XSS attacks and restrict resource loading
    - Configure the server to hide version information in HTTP headers
    - Update SSL configuration to disable weak cipher suites and protocols
    
    PRIORITIZED ACTIONS:
    - Add Content-Security-Policy header with appropriate directives for your website
    - Update server configuration to prevent information disclosure
    - Strengthen SSL/TLS configuration by disabling weak ciphers
    """


@patch("app.services.ai_analysis._call_ollama")
async def test_generate_recommendations(mock_call_ollama, sample_scan_data, sample_llm_response):
    """Test AI recommendations generation"""
    # Configure mock to return sample response
    mock_call_ollama.return_value = sample_llm_response
    
    # Generate recommendations
    result = await generate_recommendations(sample_scan_data)
    
    # Check that results were parsed correctly
    assert "risk_assessment" in result
    assert "recommendations" in result
    assert "prioritized_actions" in result
    
    # Check content of results
    assert len(result["recommendations"]) == 3
    assert len(result["prioritized_actions"]) == 3
    
    # Verify the mock was called with correct data
    mock_call_ollama.assert_called_once()
    prompt = mock_call_ollama.call_args[0][0]
    assert "example.com" in prompt
    assert "Missing Content-Security-Policy header" in prompt


@patch("app.services.ai_analysis._call_ollama")
async def test_generate_recommendations_error(mock_call_ollama, sample_scan_data):
    """Test error handling in recommendations generation"""
    # Configure mock to raise an exception
    mock_call_ollama.side_effect = Exception("LLM API error")
    
    # Generate recommendations (should not raise exception)
    result = await generate_recommendations(sample_scan_data)
    
    # Should return fallback recommendations
    assert "risk_assessment" in result
    assert "recommendations" in result
    assert "prioritized_actions" in result
    assert "Unable to generate AI analysis" in result["risk_assessment"]


def test_create_analysis_prompt(sample_scan_data):
    """Test prompt creation for LLM"""
    prompt = _create_analysis_prompt(sample_scan_data)
    
    # Check that prompt contains necessary information
    assert "example.com" in prompt
    assert "65/100" in prompt
    assert "Medium severity: Missing Content-Security-Policy header" in prompt
    assert "Low severity: Server information disclosure" in prompt
    
    # Check that prompt contains required format guidelines
    assert "RISK ASSESSMENT:" in prompt
    assert "RECOMMENDATIONS:" in prompt
    assert "PRIORITIZED ACTIONS:" in prompt


def test_parse_llm_response(sample_llm_response):
    """Test parsing of LLM response"""
    parsed = _parse_llm_response(sample_llm_response)
    
    # Check that parsed response has the correct structure
    assert "risk_assessment" in parsed
    assert "recommendations" in parsed
    assert "prioritized_actions" in parsed
    
    # Check that content was extracted correctly
    assert "moderate security risks" in parsed["risk_assessment"]
    assert any("Content-Security-Policy" in rec for rec in parsed["recommendations"])
    assert any("server configuration" in action for action in parsed["prioritized_actions"])
    
    # Check counts
    assert len(parsed["recommendations"]) == 3
    assert len(parsed["prioritized_actions"]) == 3


def test_parse_llm_response_incomplete():
    """Test parsing of incomplete LLM response"""
    # Test missing sections
    incomplete_response = """
    RISK ASSESSMENT:
    This site has security issues.
    
    RECOMMENDATIONS:
    - Fix security headers
    """
    
    parsed = _parse_llm_response(incomplete_response)
    
    # Check that missing sections are handled gracefully
    assert "risk_assessment" in parsed
    assert "recommendations" in parsed
    assert "prioritized_actions" in parsed
    assert len(parsed["recommendations"]) == 1
    assert len(parsed["prioritized_actions"]) == 3  # Should use defaults
    
    # Test completely wrong format
    wrong_format = "This is not the expected format at all."
    
    parsed = _parse_llm_response(wrong_format)
    
    # Should still return a valid structure with defaults
    assert "risk_assessment" in parsed
    assert "recommendations" in parsed
    assert "prioritized_actions" in parsed


def test_get_fallback_recommendations():
    """Test fallback recommendations"""
    fallback = _get_fallback_recommendations()
    
    # Check structure
    assert "risk_assessment" in fallback
    assert "recommendations" in fallback
    assert "prioritized_actions" in fallback
    
    # Check content
    assert len(fallback["recommendations"]) == 3
    assert len(fallback["prioritized_actions"]) == 3
    assert "Unable to generate AI analysis" in fallback["risk_assessment"]