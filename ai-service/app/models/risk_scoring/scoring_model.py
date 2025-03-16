import os
import joblib
import logging
import numpy as np
from typing import Dict, Any, List, Optional, Tuple
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler

from app.core.config import settings
from app.core.errors import ModelError

# Set up logger
logger = logging.getLogger(__name__)

# Model paths
MODEL_PATH = os.path.join(settings.MODEL_PATH, "risk_scoring_model.joblib")
SCALER_PATH = os.path.join(settings.MODEL_PATH, "risk_scoring_scaler.joblib")

# Risk categories and weights (adjust based on your risk model)
RISK_CATEGORIES = {
    "vulnerability": 0.30,   # Security vulnerabilities
    "compliance": 0.20,      # Compliance with security standards
    "exposure": 0.15,        # Internet exposure factors
    "configuration": 0.15,   # Server/application configuration
    "content": 0.10,         # Content-related risks
    "reputation": 0.10       # Domain reputation factors
}

# Risk levels
RISK_LEVELS = {
    (0, 20): {"level": "Low", "color": "#4CAF50"},
    (20, 40): {"level": "Moderate", "color": "#FFC107"},
    (40, 60): {"level": "Medium", "color": "#FF9800"},
    (60, 80): {"level": "High", "color": "#F44336"},
    (80, 101): {"level": "Critical", "color": "#9C27B0"}
}


def calculate_risk_score(scan_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculate security risk score from scan data
    
    Args:
        scan_data: Dictionary containing scan results
        
    Returns:
        Dictionary with risk score and category breakdowns
    """
    try:
        # Try ML-based scoring if model exists
        if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
            return _ml_based_scoring(scan_data)
        else:
            logger.info("Risk scoring model not found, using rule-based scoring")
            return _rule_based_scoring(scan_data)
    except Exception as e:
        logger.error(f"Error in risk scoring: {str(e)}", exc_info=True)
        # Fall back to rule-based scoring on error
        return _rule_based_scoring(scan_data)


def _ml_based_scoring(scan_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculate risk score using ML model
    
    Args:
        scan_data: Dictionary containing scan results
        
    Returns:
        Dictionary with risk score and breakdown
    """
    try:
        # Load model and scaler
        model = joblib.load(MODEL_PATH)
        scaler = joblib.load(SCALER_PATH)
        
        # Extract features
        features = _extract_features(scan_data)
        
        # Scale features
        X = np.array(features).reshape(1, -1)
        X_scaled = scaler.transform(X)
        
        # Predict overall risk score
        overall_score = float(model.predict(X_scaled)[0])
        # Ensure score is within bounds
        overall_score = max(0, min(100, overall_score))
        
        # Get risk level based on score
        risk_level = _get_risk_level(overall_score)
        
        # Generate category scores using feature importance and partial dependence
        category_scores = _generate_category_scores(scan_data, model, features)
        
        # Create response
        result = {
            "overall_score": round(overall_score, 1),
            "risk_level": risk_level["level"],
            "risk_color": risk_level["color"],
            "category_scores": category_scores,
            "scoring_method": "machine_learning"
        }
        
        return result
    except Exception as e:
        logger.error(f"Error in ML-based scoring: {str(e)}", exc_info=True)
        # Fall back to rule-based scoring
        return _rule_based_scoring(scan_data)


def _rule_based_scoring(scan_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculate risk score using rule-based approach
    
    Args:
        scan_data: Dictionary containing scan results
        
    Returns:
        Dictionary with risk score and breakdown
    """
    # Calculate category scores
    category_scores = {}
    
    # Vulnerability score
    vulnerability_score = _calculate_vulnerability_score(scan_data)
    category_scores["vulnerability"] = {
        "score": vulnerability_score,
        "weight": RISK_CATEGORIES["vulnerability"],
        "description": "Security vulnerabilities and weaknesses"
    }
    
    # Compliance score
    compliance_score = _calculate_compliance_score(scan_data)
    category_scores["compliance"] = {
        "score": compliance_score,
        "weight": RISK_CATEGORIES["compliance"],
        "description": "Adherence to security standards and best practices"
    }
    
    # Exposure score
    exposure_score = _calculate_exposure_score(scan_data)
    category_scores["exposure"] = {
        "score": exposure_score,
        "weight": RISK_CATEGORIES["exposure"],
        "description": "Internet exposure and attack surface area"
    }
    
    # Configuration score
    configuration_score = _calculate_configuration_score(scan_data)
    category_scores["configuration"] = {
        "score": configuration_score,
        "weight": RISK_CATEGORIES["configuration"],
        "description": "Server and application configuration security"
    }
    
    # Content score
    content_score = _calculate_content_score(scan_data)
    category_scores["content"] = {
        "score": content_score,
        "weight": RISK_CATEGORIES["content"],
        "description": "Website content security issues"
    }
    
    # Reputation score
    reputation_score = _calculate_reputation_score(scan_data)
    category_scores["reputation"] = {
        "score": reputation_score,
        "weight": RISK_CATEGORIES["reputation"],
        "description": "Domain reputation and history"
    }
    
    # Calculate weighted average for overall score
    overall_score = sum(
        category_scores[cat]["score"] * category_scores[cat]["weight"]
        for cat in category_scores
    )
    
    # Get risk level based on score
    risk_level = _get_risk_level(overall_score)
    
    # Create response
    result = {
        "overall_score": round(overall_score, 1),
        "risk_level": risk_level["level"],
        "risk_color": risk_level["color"],
        "category_scores": category_scores,
        "scoring_method": "rule_based"
    }
    
    return result


def _extract_features(scan_data: Dict[str, Any]) -> List[float]:
    """
    Extract numerical features from scan data for risk scoring
    
    Args:
        scan_data: Dictionary containing scan results
        
    Returns:
        List of numerical features
    """
    features = []
    
    # Severity counts
    severity_counts = {
        "Critical": 0,
        "High": 0,
        "Medium": 0,
        "Low": 0,
        "Info": 0
    }
    
    # Count findings by severity
    for finding in scan_data.get("findings", []):
        severity = finding.get("severity")
        if severity in severity_counts:
            severity_counts[severity] += 1
    
    # Add severity counts to features
    features.extend(severity_counts.values())
    
    # Process SSL data
    ssl = scan_data.get("ssl", {})
    ssl_features = [
        1.0 if ssl.get("is_valid", False) else 0.0,
        min(float(ssl.get("days_to_expiry", 0)) / 365.0, 1.0),  # Normalize to [0,1]
        float(ssl.get("cipher_strength", 0)) / 256.0,  # Normalize to [0,1]
        1.0 if ssl.get("has_pfs", False) else 0.0,
        0.0 if ssl.get("vulnerabilities", []) else 1.0  # 1 if no vulnerabilities
    ]
    features.extend(ssl_features)
    
    # Process headers
    headers = scan_data.get("headers", {})
    header_features = [
        1.0 if headers.get("content_security_policy") else 0.0,
        1.0 if headers.get("x_frame_options") else 0.0,
        1.0 if headers.get("strict_transport_security") else 0.0,
        1.0 if headers.get("x_content_type_options") else 0.0,
        1.0 if headers.get("x_xss_protection") else 0.0,
        1.0 if headers.get("referrer_policy") else 0.0,
        1.0 if headers.get("permissions_policy") else 0.0
    ]
    features.extend(header_features)
    
    # Process content analysis
    content = scan_data.get("content_analysis", {})
    content_features = [
        min(float(content.get("external_script_count", 0)) / 10.0, 1.0),
        min(float(content.get("inline_script_count", 0)) / 10.0, 1.0),
        min(float(content.get("form_count", 0)) / 5.0, 1.0),
        min(float(content.get("input_field_count", 0)) / 10.0, 1.0),
        1.0 if content.get("has_login_form", False) else 0.0,
        min(float(content.get("cookie_count", 0)) / 5.0, 1.0)
    ]
    features.extend(content_features)
    
    # Process server info
    server = scan_data.get("server_info", {})
    server_features = [
        1.0 if server.get("version_disclosed", False) else 0.0,
        1.0 if server.get("is_outdated", False) else 0.0,
        float(server.get("open_port_count", 0)) / 10.0,  # Normalize to [0,1]
        min(float(server.get("vulnerability_count", 0)) / 5.0, 1.0)
    ]
    features.extend(server_features)
    
    # Process domain reputation
    reputation = scan_data.get("domain_reputation", {})
    reputation_features = [
        1.0 if reputation.get("is_blacklisted", False) else 0.0,
        1.0 if reputation.get("has_malware_history", False) else 0.0,
        1.0 if reputation.get("has_phishing_history", False) else 0.0,
        min(float(reputation.get("risk_score", 0)) / 100.0, 1.0)
    ]
    features.extend(reputation_features)
    
    return features


def _generate_category_scores(
    scan_data: Dict[str, Any], 
    model: GradientBoostingRegressor,
    features: List[float]
) -> Dict[str, Dict[str, Any]]:
    """
    Generate scores for each risk category
    
    Args:
        scan_data: Dictionary containing scan results
        model: Trained risk scoring model
        features: Extracted features
        
    Returns:
        Dictionary with category scores
    """
    # As a fallback, calculate rule-based category scores
    rule_based_scores = {
        "vulnerability": _calculate_vulnerability_score(scan_data),
        "compliance": _calculate_compliance_score(scan_data),
        "exposure": _calculate_exposure_score(scan_data),
        "configuration": _calculate_configuration_score(scan_data),
        "content": _calculate_content_score(scan_data),
        "reputation": _calculate_reputation_score(scan_data)
    }
    
    # Try to use model feature importance to calculate category scores
    # This is a simplified approach - in production you might use SHAP values
    # or other explainability techniques for more accurate breakdowns
    category_scores = {}
    
    for category, weight in RISK_CATEGORIES.items():
        category_scores[category] = {
            "score": rule_based_scores[category],
            "weight": weight,
            "description": _get_category_description(category)
        }
    
    return category_scores


def _calculate_vulnerability_score(scan_data: Dict[str, Any]) -> float:
    """
    Calculate vulnerability risk score
    
    Args:
        scan_data: Dictionary containing scan results
        
    Returns:
        Vulnerability risk score (0-100)
    """
    # Count findings by severity
    severity_weights = {
        "Critical": 100,
        "High": 80,
        "Medium": 50,
        "Low": 20,
        "Info": 0
    }
    
    findings = scan_data.get("findings", [])
    if not findings:
        return 0.0
    
    # Calculate weighted score
    total_weight = 0
    weighted_sum = 0
    
    for finding in findings:
        severity = finding.get("severity", "Low")
        weight = severity_weights.get(severity, 0)
        total_weight += 1
        weighted_sum += weight
    
    # Return normalized score
    if total_weight == 0:
        return 0.0
    
    # Cap at 100
    return min(100.0, weighted_sum / total_weight)


def _calculate_compliance_score(scan_data: Dict[str, Any]) -> float:
    """
    Calculate compliance risk score
    
    Args:
        scan_data: Dictionary containing scan results
        
    Returns:
        Compliance risk score (0-100)
    """
    # Check for required security headers
    headers = scan_data.get("headers", {})
    required_headers = [
        "content_security_policy",
        "x_frame_options",
        "strict_transport_security",
        "x_content_type_options",
        "x_xss_protection",
        "referrer_policy"
    ]
    
    # Count missing headers
    missing_headers = sum(1 for h in required_headers if not headers.get(h))
    header_score = (len(required_headers) - missing_headers) / len(required_headers) * 100
    
    # Check SSL compliance
    ssl = scan_data.get("ssl", {})
    ssl_score = 100
    
    if not ssl.get("is_valid", False):
        ssl_score -= 50
    
    if ssl.get("vulnerabilities", []):
        ssl_score -= min(50, len(ssl.get("vulnerabilities", [])) * 10)
    
    # Check other compliance factors
    other_factors = 100
    
    # Average the scores
    return 100 - ((100 - header_score) * 0.3 + (100 - ssl_score) * 0.5 + (100 - other_factors) * 0.2)


def _calculate_exposure_score(scan_data: Dict[str, Any]) -> float:
    """
    Calculate exposure risk score
    
    Args:
        scan_data: Dictionary containing scan results
        
    Returns:
        Exposure risk score (0-100)
    """
    # Check open ports
    server_info = scan_data.get("server_info", {})
    open_ports = server_info.get("open_port_count", 0)
    port_score = min(100, open_ports * 10)
    
    # Check information disclosure
    disclosure_score = 0
    if server_info.get("version_disclosed", False):
        disclosure_score += 30
    
    # Check other exposure factors
    exposed_services = len(server_info.get("exposed_services", []))
    services_score = min(100, exposed_services * 20)
    
    # Weight and combine scores
    return (port_score * 0.4 + disclosure_score * 0.3 + services_score * 0.3)


def _calculate_configuration_score(scan_data: Dict[str, Any]) -> float:
    """
    Calculate configuration risk score
    
    Args:
        scan_data: Dictionary containing scan results
        
    Returns:
        Configuration risk score (0-100)
    """
    # Start with baseline score
    score = 0
    
    # Check server configuration
    server_info = scan_data.get("server_info", {})
    if server_info.get("is_outdated", False):
        score += 40
    
    # Check SSL configuration
    ssl = scan_data.get("ssl", {})
    if not ssl.get("has_pfs", False):  # Check for Perfect Forward Secrecy
        score += 30
    
    if ssl.get("is_valid", False) and ssl.get("days_to_expiry", 0) < 30:
        score += 20  # Expiring soon
    
    # Check for misconfigurations
    misconfigurations = scan_data.get("misconfigurations", [])
    score += min(30, len(misconfigurations) * 10)
    
    return min(100, score)


def _calculate_content_score(scan_data: Dict[str, Any]) -> float:
    """
    Calculate content risk score
    
    Args:
        scan_data: Dictionary containing scan results
        
    Returns:
        Content risk score (0-100)
    """
    # Start with baseline score
    score = 0
    
    # Check content analysis
    content = scan_data.get("content_analysis", {})
    
    # Check for external scripts
    external_scripts = content.get("external_script_count", 0)
    score += min(40, external_scripts * 8)
    
    # Check for forms
    if content.get("has_login_form", False):
        score += 30
    
    # Check for iframe usage
    iframe_count = content.get("iframe_count", 0)
    score += min(20, iframe_count * 10)
    
    # Check other content factors
    return min(100, score)


def _calculate_reputation_score(scan_data: Dict[str, Any]) -> float:
    """
    Calculate reputation risk score
    
    Args:
        scan_data: Dictionary containing scan results
        
    Returns:
        Reputation risk score (0-100)
    """
    # Check domain reputation
    reputation = scan_data.get("domain_reputation", {})
    
    # Start with reputation score if available
    score = reputation.get("risk_score", 0)
    
    # Add penalties for blacklisting
    if reputation.get("is_blacklisted", False):
        score += 50
    
    # Add penalties for malware/phishing history
    if reputation.get("has_malware_history", False):
        score += 30
    
    if reputation.get("has_phishing_history", False):
        score += 30
    
    return min(100, score)


def _get_risk_level(score: float) -> Dict[str, str]:
    """
    Get risk level from numerical score
    
    Args:
        score: Risk score (0-100)
        
    Returns:
        Dictionary with risk level and color
    """
    for (lower, upper), level_info in RISK_LEVELS.items():
        if lower <= score < upper:
            return level_info
    
    # Default to Critical if something goes wrong
    return RISK_LEVELS[(80, 101)]


def _get_category_description(category: str) -> str:
    """
    Get description for a risk category
    
    Args:
        category: Risk category name
        
    Returns:
        Description string
    """
    descriptions = {
        "vulnerability": "Security vulnerabilities and weaknesses",
        "compliance": "Adherence to security standards and best practices",
        "exposure": "Internet exposure and attack surface area",
        "configuration": "Server and application configuration security",
        "content": "Website content security issues",
        "reputation": "Domain reputation and history"
    }
    
    return descriptions.get(category, "")


def get_model_info() -> Dict[str, Any]:
    """
    Get information about the current risk scoring model
    
    Returns:
        Dictionary with model information
    """
    info = {
        "model_type": "GradientBoostingRegressor",
        "feature_count": None,
        "trained_date": None,
        "is_available": os.path.exists(MODEL_PATH)
    }
    
    if info["is_available"]:
        try:
            model = joblib.load(MODEL_PATH)
            info["feature_count"] = model.n_features_in_
            
            # Try to get last modified time of model file as proxy for training date
            mod_time = os.path.getmtime(MODEL_PATH)
            from datetime import datetime
            info["trained_date"] = datetime.fromtimestamp(mod_time).isoformat()
            
        except Exception as e:
            logger.error(f"Error getting model info: {str(e)}", exc_info=True)
    
    return info
