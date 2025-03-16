import os
import joblib
import logging
import numpy as np
from typing import Dict, Any, List, Tuple, Optional
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from collections import Counter

from app.core.config import settings
from app.core.errors import ModelError

# Set up logger
logger = logging.getLogger(__name__)

# Model paths
MODEL_PATH = os.path.join(settings.MODEL_PATH, "threat_classifier.joblib")
SCALER_PATH = os.path.join(settings.MODEL_PATH, "threat_scaler.joblib")
VECTORIZER_PATH = os.path.join(settings.MODEL_PATH, "threat_vectorizer.joblib")

# Threat categories
THREAT_CATEGORIES = [
    "malware",
    "phishing",
    "command_injection",
    "sql_injection",
    "xss",
    "csrf",
    "open_redirect",
    "insecure_deserialization",
    "none"  # No threat detected
]


def classify_threats(scan_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Classify potential threats in scan data
    
    Args:
        scan_data: Dictionary containing scan results
        
    Returns:
        Dictionary with threat classification results
    """
    try:
        # Ensure model exists
        if not os.path.exists(MODEL_PATH) or not os.path.exists(SCALER_PATH):
            logger.warning("Threat detection model not found, using fallback detection")
            return _fallback_detection(scan_data)
        
        # Load model and scaler
        model = joblib.load(MODEL_PATH)
        scaler = joblib.load(SCALER_PATH)
        
        # Extract features from scan data
        features = _extract_features(scan_data)
        
        # Scale features
        X = np.array(features).reshape(1, -1)
        X_scaled = scaler.transform(X)
        
        # Get classification probabilities
        threat_probs = model.predict_proba(X_scaled)[0]
        
        # Create result dictionary with probabilities for each threat category
        result = {
            "threat_detected": False,
            "primary_threat_type": "none",
            "threat_confidence": 0.0,
            "threat_details": {}
        }
        
        # Add individual threat probabilities
        for i, category in enumerate(THREAT_CATEGORIES):
            prob = float(threat_probs[i])
            result["threat_details"][category] = {
                "probability": prob,
                "severity": _get_severity_from_probability(prob)
            }
            
            # Update primary threat if this one has higher probability
            if category != "none" and prob > result["threat_confidence"]:
                result["threat_confidence"] = prob
                result["primary_threat_type"] = category
        
        # Determine if a threat was detected (using threshold)
        if result["threat_confidence"] >= 0.6:  # Threshold for positive detection
            result["threat_detected"] = True
            
            # Add contextual information based on the threat type
            result["recommendations"] = _get_recommendations(result["primary_threat_type"])
        
        return result
    except Exception as e:
        logger.error(f"Error in threat classification: {str(e)}", exc_info=True)
        # Fall back to simple detection on error
        return _fallback_detection(scan_data)


def _extract_features(scan_data: Dict[str, Any]) -> List[float]:
    """
    Extract numerical features from scan data for threat detection
    
    Args:
        scan_data: Dictionary containing scan results
        
    Returns:
        List of numerical features
    """
    features = []
    
    # Count findings by severity
    severity_counts = {
        "Critical": 0,
        "High": 0,
        "Medium": 0,
        "Low": 0,
        "Info": 0
    }
    
    # Process findings and count severity
    for finding in scan_data.get("findings", []):
        severity = finding.get("severity")
        if severity in severity_counts:
            severity_counts[severity] += 1
    
    # Add severity counts to features
    features.extend(severity_counts.values())
    
    # Extract content analysis data
    content = scan_data.get("content_analysis", {})
    
    # Add content features
    features.extend([
        float(content.get("suspicious_script_count", 0)),
        float(content.get("external_link_count", 0)),
        float(content.get("form_count", 0)),
        float(content.get("iframe_count", 0)),
        float(content.get("redirect_count", 0)),
        float(content.get("cookie_count", 0))
    ])
    
    # Add header security features (0 for missing, 1 for present)
    headers = scan_data.get("headers", {})
    header_features = [
        1.0 if headers.get("content_security_policy") else 0.0,
        1.0 if headers.get("x_frame_options") else 0.0,
        1.0 if headers.get("strict_transport_security") else 0.0,
        1.0 if headers.get("x_content_type_options") else 0.0,
        1.0 if headers.get("x_xss_protection") else 0.0
    ]
    features.extend(header_features)
    
    # Add SSL/TLS features
    ssl = scan_data.get("ssl", {})
    ssl_features = [
        1.0 if ssl.get("is_valid") else 0.0,
        float(ssl.get("days_to_expiry", 0)) / 365.0,  # Normalize to [0,1]
        float(ssl.get("cipher_strength", 0)) / 256.0,  # Normalize to [0,1]
        1.0 if ssl.get("has_pfs") else 0.0,
        0.0 if ssl.get("vulnerabilities", []) else 1.0  # 1 if no vulnerabilities
    ]
    features.extend(ssl_features)
    
    # Add URL features
    url_info = scan_data.get("url_info", {})
    url_features = [
        float(url_info.get("subdomain_count", 0)),
        float(url_info.get("path_depth", 0)),
        float(url_info.get("query_param_count", 0)),
        1.0 if url_info.get("uses_https", False) else 0.0
    ]
    features.extend(url_features)
    
    return features


def _get_severity_from_probability(probability: float) -> str:
    """
    Convert a probability to a severity rating
    
    Args:
        probability: Float between 0 and 1
        
    Returns:
        Severity rating as string
    """
    if probability < 0.2:
        return "Info"
    elif probability < 0.4:
        return "Low"
    elif probability < 0.6:
        return "Medium"
    elif probability < 0.8:
        return "High"
    else:
        return "Critical"


def _fallback_detection(scan_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Simple rule-based fallback threat detection when model is unavailable
    
    Args:
        scan_data: Dictionary containing scan results
        
    Returns:
        Dictionary with threat detection results
    """
    result = {
        "threat_detected": False,
        "primary_threat_type": "none",
        "threat_confidence": 0.0,
        "threat_details": {category: {"probability": 0.0, "severity": "Info"} for category in THREAT_CATEGORIES}
    }
    
    # Simple rules for threat detection
    findings = scan_data.get("findings", [])
    content = scan_data.get("content_analysis", {})
    
    # Check for critical findings
    critical_findings = [f for f in findings if f.get("severity") == "Critical"]
    if critical_findings:
        result["threat_detected"] = True
        result["threat_confidence"] = 0.8
        
        # Try to determine threat type from finding names
        finding_names = [f.get("name", "").lower() for f in critical_findings]
        
        if any("sql" in name for name in finding_names):
            result["primary_threat_type"] = "sql_injection"
        elif any("xss" in name for name in finding_names):
            result["primary_threat_type"] = "xss"
        elif any("csrf" in name for name in finding_names):
            result["primary_threat_type"] = "csrf"
        elif any(("redirect" in name) for name in finding_names):
            result["primary_threat_type"] = "open_redirect"
        elif any(("injection" in name) for name in finding_names):
            result["primary_threat_type"] = "command_injection"
        elif any(("serialize" in name or "deserialize" in name) for name in finding_names):
            result["primary_threat_type"] = "insecure_deserialization"
        else:
            # Default to most severe threat type if can't determine
            result["primary_threat_type"] = "malware"
    
    # Check content for phishing indicators
    suspicious_script = content.get("suspicious_script_count", 0)
    form_count = content.get("form_count", 0)
    if form_count > 0 and suspicious_script > 0:
        # Potential phishing
        phishing_confidence = min(0.7, 0.3 + (form_count * 0.1) + (suspicious_script * 0.1))
        
        if phishing_confidence > result["threat_confidence"]:
            result["threat_detected"] = True
            result["primary_threat_type"] = "phishing"
            result["threat_confidence"] = phishing_confidence
    
    # Update details for the primary threat
    if result["primary_threat_type"] != "none":
        result["threat_details"][result["primary_threat_type"]] = {
            "probability": result["threat_confidence"],
            "severity": _get_severity_from_probability(result["threat_confidence"])
        }
        
        # Add recommendations
        result["recommendations"] = _get_recommendations(result["primary_threat_type"])
    
    return result


def _get_recommendations(threat_type: str) -> List[str]:
    """
    Get recommendations based on the detected threat type
    
    Args:
        threat_type: The type of threat detected
        
    Returns:
        List of recommendation strings
    """
    recommendations = {
        "malware": [
            "Scan the entire site with a malware scanner",
            "Check for unauthorized file modifications",
            "Review server logs for suspicious activities",
            "Ensure all CMS and plugins are up to date"
        ],
        "phishing": [
            "Verify legitimacy of all forms collecting user data",
            "Implement anti-phishing headers (DMARC, SPF, DKIM)",
            "Review all scripts for suspicious behavior",
            "Add client-side form validation"
        ],
        "command_injection": [
            "Sanitize all user inputs used in system commands",
            "Implement input validation for all parameters",
            "Use parameterized APIs instead of direct command execution",
            "Apply the principle of least privilege for execution contexts"
        ],
        "sql_injection": [
            "Use parameterized queries or prepared statements",
            "Implement input validation for all database queries",
            "Apply proper escaping for user-supplied data",
            "Consider using an ORM with built-in protections"
        ],
        "xss": [
            "Implement Content-Security-Policy headers",
            "Sanitize all user inputs displayed on pages",
            "Use framework-provided XSS protection features",
            "Encode output appropriately for the HTML context"
        ],
        "csrf": [
            "Implement anti-CSRF tokens in all forms",
            "Use SameSite cookie attributes",
            "Verify the Origin and Referer headers",
            "Consider using the Double Submit Cookie pattern"
        ],
        "open_redirect": [
            "Validate and sanitize all redirect URLs",
            "Use a whitelist of allowed redirect destinations",
            "Implement indirect reference maps for redirects",
            "Consider not allowing external redirects at all"
        ],
        "insecure_deserialization": [
            "Avoid deserializing data from untrusted sources",
            "Implement integrity checks for serialized data",
            "Use safer alternatives like JSON with schema validation",
            "Apply the principle of least privilege for deserialization processes"
        ],
        "none": [
            "Continue regular security scanning",
            "Keep all software and dependencies up to date",
            "Implement security headers if not already present",
            "Consider a Web Application Firewall for additional protection"
        ]
    }
    
    return recommendations.get(threat_type, recommendations["none"])


def get_model_info() -> Dict[str, Any]:
    """
    Get information about the current threat detection model
    
    Returns:
        Dictionary with model information
    """
    info = {
        "model_type": "RandomForestClassifier",
        "classes": THREAT_CATEGORIES,
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
