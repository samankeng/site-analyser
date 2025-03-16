from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, HttpUrl
from enum import Enum
from datetime import datetime

from app.schemas.common import SeverityLevel


class ScanRequest(BaseModel):
    """Request schema for initiating a website security scan."""
    url: HttpUrl = Field(..., description="URL of the website to scan")
    scan_options: Optional[Dict[str, bool]] = Field(
        default={},
        description="Optional scan options to enable/disable specific scan features"
    )
    user_id: Optional[str] = Field(None, description="ID of the user initiating the scan")


class FindingItem(BaseModel):
    """Schema for a security finding/issue."""
    id: str = Field(..., description="Unique identifier for the finding")
    title: str = Field(..., description="Short title of the finding")
    description: str = Field(..., description="Detailed description of the finding")
    severity: SeverityLevel = Field(..., description="Severity level of the finding")
    category: str = Field(..., description="Category of the finding (e.g., 'vulnerability', 'misconfiguration')")
    affected_component: Optional[str] = Field(None, description="Component affected by the finding")
    references: Optional[List[str]] = Field(None, description="References to documentation or standards")
    remediation: Optional[str] = Field(None, description="Suggested remediation steps")


class HeaderItem(BaseModel):
    """Schema for HTTP header finding."""
    name: str = Field(..., description="Header name")
    value: Optional[str] = Field(None, description="Header value if present")
    expected: Optional[str] = Field(None, description="Expected value or pattern")
    severity: SeverityLevel = Field(..., description="Severity level of the finding")
    title: str = Field(..., description="Short description of the issue")
    description: str = Field(..., description="Detailed description of the issue")
    remediation: Optional[str] = Field(None, description="Suggested remediation steps")


class SslItem(BaseModel):
    """Schema for SSL/TLS finding."""
    title: str = Field(..., description="Short description of the SSL/TLS issue")
    description: str = Field(..., description="Detailed description of the issue")
    severity: SeverityLevel = Field(..., description="Severity level of the finding")
    affected_component: Optional[str] = Field(None, description="Affected component (e.g., 'certificate', 'cipher')")
    remediation: Optional[str] = Field(None, description="Suggested remediation steps")


class ContentAnalysisResult(BaseModel):
    """Schema for content analysis results."""
    external_script_count: int = Field(0, description="Number of external scripts")
    inline_script_count: int = Field(0, description="Number of inline scripts")
    form_count: int = Field(0, description="Number of forms")
    input_field_count: int = Field(0, description="Number of input fields")
    iframe_count: int = Field(0, description="Number of iframes")
    has_login_form: bool = Field(False, description="Whether a login form was detected")
    suspicious_script_count: int = Field(0, description="Number of suspicious scripts")
    external_link_count: int = Field(0, description="Number of external links")
    redirect_count: int = Field(0, description="Number of redirects")
    cookie_count: int = Field(0, description="Number of cookies")


class ServerInfo(BaseModel):
    """Schema for server information."""
    server_type: Optional[str] = Field(None, description="Server type (e.g., 'nginx', 'apache')")
    server_version: Optional[str] = Field(None, description="Server version if disclosed")
    version_disclosed: bool = Field(False, description="Whether server version is disclosed")
    is_outdated: bool = Field(False, description="Whether server version is outdated")
    technologies: Optional[List[str]] = Field(None, description="Technologies detected on the server")
    open_ports: Optional[List[int]] = Field(None, description="Open ports detected")
    open_port_count: int = Field(0, description="Number of open ports")
    exposed_services: Optional[List[str]] = Field(None, description="Exposed services")
    vulnerability_count: int = Field(0, description="Number of server vulnerabilities")


class ScoreSummary(BaseModel):
    """Schema for security score summary."""
    overall: int = Field(..., description="Overall security score (0-100)")
    ssl: int = Field(..., description="SSL/TLS security score (0-100)")
    headers: int = Field(..., description="HTTP headers security score (0-100)")
    vulnerabilities: int = Field(..., description="Vulnerabilities score (0-100)")
    server: int = Field(..., description="Server security score (0-100)")
    content: Optional[int] = Field(None, description="Content security score (0-100)")


class ThreatCategory(str, Enum):
    """Enum for threat categories."""
    MALWARE = "malware"
    PHISHING = "phishing"
    SQL_INJECTION = "sql_injection"
    XSS = "xss"
    CSRF = "csrf"
    OPEN_REDIRECT = "open_redirect"
    COMMAND_INJECTION = "command_injection"
    INSECURE_DESERIALIZATION = "insecure_deserialization"
    NONE = "none"


class ThreatDetectionResult(BaseModel):
    """Schema for threat detection results."""
    threat_detected: bool = Field(..., description="Whether a threat was detected")
    primary_threat_type: ThreatCategory = Field(..., description="Primary threat type detected")
    threat_confidence: float = Field(..., description="Confidence level for the threat detection (0-1)")
    threat_details: Dict[str, Dict[str, Any]] = Field(..., description="Detailed threat information by category")
    recommendations: Optional[List[str]] = Field(None, description="Recommended actions")


class AnomalyDetectionResult(BaseModel):
    """Schema for anomaly detection results."""
    is_anomalous: bool = Field(..., description="Whether anomalous behavior was detected")
    anomaly_score: float = Field(..., description="Anomaly score (higher means more anomalous)")
    anomalous_features: Optional[List[str]] = Field(None, description="Features that contributed to anomaly detection")


class RiskScoreCategory(BaseModel):
    """Schema for a risk score category."""
    score: float = Field(..., description="Category risk score (0-100)")
    weight: float = Field(..., description="Weight of this category in overall score")
    description: str = Field(..., description="Description of this risk category")


class RiskScoringResult(BaseModel):
    """Schema for risk scoring results."""
    overall_score: float = Field(..., description="Overall risk score (0-100)")
    risk_level: str = Field(..., description="Risk level label (e.g., 'Low', 'Medium', 'High')")
    risk_color: str = Field(..., description="Color code for risk level")
    category_scores: Dict[str, RiskScoreCategory] = Field(..., description="Scores by risk category")
    scoring_method: str = Field(..., description="Method used for scoring (e.g., 'rule_based', 'machine_learning')")


class AiRecommendation(BaseModel):
    """Schema for AI-generated recommendations."""
    risk_assessment: str = Field(..., description="Overall risk assessment")
    recommendations: List[str] = Field(..., description="Security recommendations")
    prioritized_actions: List[str] = Field(..., description="Prioritized actions to take")


class DomainReputation(BaseModel):
    """Schema for domain reputation data."""
    domain: str = Field(..., description="Domain name")
    is_blacklisted: bool = Field(False, description="Whether domain is on any blacklists")
    has_malware_history: bool = Field(False, description="Whether domain has malware history")
    has_phishing_history: bool = Field(False, description="Whether domain has phishing history")
    risk_score: float = Field(0, description="Reputation risk score (0-100)")
    sources: Dict[str, Any] = Field({}, description="Data from reputation sources")
    malicious_indicators: int = Field(0, description="Number of malicious indicators")
    suspicious_indicators: int = Field(0, description="Number of suspicious indicators")
    summary: str = Field("", description="Summary of reputation findings")


class ScanResult(BaseModel):
    """Schema for complete scan results."""
    scan_id: str = Field(..., description="Unique identifier for the scan")
    url: str = Field(..., description="URL that was scanned")
    scan_date: datetime = Field(..., description="Date and time of the scan")
    summary: ScoreSummary = Field(..., description="Summary scores")
    findings: List[FindingItem] = Field([], description="Security findings")
    headers: List[HeaderItem] = Field([], description="HTTP header findings")
    ssl: List[SslItem] = Field([], description="SSL/TLS findings")
    content_analysis: Optional[ContentAnalysisResult] = Field(None, description="Content analysis results")
    server_info: Optional[ServerInfo] = Field(None, description="Server information")
    threat_detection: Optional[ThreatDetectionResult] = Field(None, description="Threat detection results")
    anomaly_detection: Optional[AnomalyDetectionResult] = Field(None, description="Anomaly detection results")
    risk_scoring: Optional[RiskScoringResult] = Field(None, description="Risk scoring results")
    ai_recommendations: Optional[AiRecommendation] = Field(None, description="AI-generated recommendations")
    domain_reputation: Optional[DomainReputation] = Field(None, description="Domain reputation data")

    class Config:
        schema_extra = {
            "example": {
                "scan_id": "scan_12345",
                "url": "https://example.com",
                "scan_date": "2023-01-01T12:00:00",
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
                ]
            }
        }


class AnalysisRequest(BaseModel):
    """Request schema for analyzing scan results."""
    scan_data: ScanResult = Field(..., description="Scan results to analyze")
    analysis_options: Optional[Dict[str, bool]] = Field(
        default={},
        description="Optional analysis options to enable/disable specific analysis features"
    )


class AnalysisResponse(BaseModel):
    """Response schema for analysis results."""
    scan_id: str = Field(..., description="ID of the analyzed scan")
    url: str = Field(..., description="URL that was analyzed")
    threat_detection: Optional[ThreatDetectionResult] = Field(None, description="Threat detection results")
    anomaly_detection: Optional[AnomalyDetectionResult] = Field(None, description="Anomaly detection results")
    risk_scoring: Optional[RiskScoringResult] = Field(None, description="Risk scoring results")
    ai_recommendations: Optional[AiRecommendation] = Field(None, description="AI-generated recommendations")
    domain_reputation: Optional[DomainReputation] = Field(None, description="Domain reputation data")
