from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List, Dict, Any, Optional
import logging

from app.schemas.analysis import (
    AnalysisRequest,
    AnalysisResponse
)
from app.services.ai_analysis import generate_recommendations
from app.services.threat_intelligence import get_threat_intelligence
from app.models.anomaly_detection.isolation_forest import detect_anomalies

# Set up logger
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

@router.post(
    "/analyze",
    response_model=AnalysisResponse,
    summary="Analyze security scan results",
    description="Analyze security scan results and provide AI-enhanced recommendations"
)
async def analyze_security_scan(
    request: AnalysisRequest,
    background_tasks: BackgroundTasks
):
    """
    Analyze security scan results and provide AI-enhanced security recommendations
    """
    try:
        logger.info(f"Analyzing security scan for URL: {request.url}")
        
        # Prepare scan data for processing
        scan_data = {
            "url": str(request.url),
            "summary": request.summary.dict(),
            "findings": [finding.dict() for finding in request.findings],
            "headers": [header.dict() for header in request.headers],
            "ssl": [ssl.dict() for ssl in request.ssl]
        }
        
        # Run anomaly detection
        anomalies_detected = detect_anomalies(scan_data)
        logger.debug(f"Anomaly detection result: {anomalies_detected}")
        
        # Get threat intelligence in background
        # We don't want to block the response for this
        threat_intel_task = background_tasks.add_task(
            get_threat_intelligence,
            str(request.url)
        )
        
        # Generate AI recommendations
        ai_analysis = await generate_recommendations(scan_data)
        
        # Prepare response
        response = AnalysisResponse(
            recommendations=ai_analysis.get("recommendations", []),
            risk_assessment=ai_analysis.get("risk_assessment", ""),
            prioritized_actions=ai_analysis.get("prioritized_actions", []),
            anomalies_detected=anomalies_detected,
            # Threat intelligence will be empty initially since it's running in background
            threat_intelligence={}
        )
        
        logger.info(f"Analysis completed for URL: {request.url}")
        return response
        
    except Exception as e:
        logger.error(f"Error analyzing security scan: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )

@router.post(
    "/analyze/threats",
    response_model=Dict[str, Any],
    summary="Get threat intelligence",
    description="Get threat intelligence data for a URL"
)
async def get_threat_intelligence_for_url(url: str):
    """
    Get threat intelligence data for a URL from external sources
    """
    try:
        logger.info(f"Getting threat intelligence for URL: {url}")
        threat_intel = await get_threat_intelligence(url)
        return threat_intel or {}
    except Exception as e:
        logger.error(f"Error getting threat intelligence: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get threat intelligence: {str(e)}"
        )