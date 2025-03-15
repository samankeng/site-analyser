import httpx
import logging
from typing import Dict, List, Any, Optional
import json
import re

from app.core.config import settings

# Set up logger
logger = logging.getLogger(__name__)

async def generate_recommendations(scan_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate AI-powered security recommendations based on scan results
    
    Args:
        scan_data: Dictionary containing scan results
        
    Returns:
        Dictionary with recommendations, risk assessment, and prioritized actions
    """
    try:
        # Create prompt for the language model
        prompt = _create_analysis_prompt(scan_data)
        
        # Call Ollama for AI-generated analysis
        response = await _call_ollama(prompt)
        
        # Parse response
        parsed_response = _parse_llm_response(response)
        
        return parsed_response
    except Exception as e:
        logger.error(f"Error generating AI recommendations: {str(e)}", exc_info=True)
        # Return fallback recommendations
        return _get_fallback_recommendations()

def _create_analysis_prompt(scan_data: Dict[str, Any]) -> str:
    """
    Create a prompt for the language model based on scan data
    """
    url = scan_data.get("url", "unknown")
    overall_score = scan_data.get("summary", {}).get("overall", 0)
    
    prompt = f"""
    You are a cybersecurity expert analyzing a website security scan. 
    Based on the following scan results, provide:
    1. A risk assessment summary (2-3 sentences)
    2. Three specific recommendations to improve security
    3. Prioritized actions in order of importance
    
    URL: {url}
    Overall Security Score: {overall_score}/100
    
    Security Issues Found:
    """
    
    # Add findings to prompt
    for finding in scan_data.get("findings", []):
        prompt += f"\n- {finding.get('severity')} severity: {finding.get('title')} - {finding.get('description')}"
    
    for header in scan_data.get("headers", []):
        prompt += f"\n- Header issue ({header.get('severity')}): {header.get('title')} - {header.get('description')}"
    
    for ssl in scan_data.get("ssl", []):
        prompt += f"\n- SSL/TLS issue ({ssl.get('severity')}): {ssl.get('title')} - {ssl.get('description')}"
    
    prompt += """
    
    Format your response as follows:
    
    RISK ASSESSMENT:
    [Your assessment here]
    
    RECOMMENDATIONS:
    - [First recommendation]
    - [Second recommendation]
    - [Third recommendation]
    
    PRIORITIZED ACTIONS:
    - [First action]
    - [Second action]
    - [Third action]
    """
    
    return prompt

async def _call_ollama(prompt: str) -> str:
    """
    Call Ollama LLM API to generate text
    
    Args:
        prompt: The prompt to send to the LLM
        
    Returns:
        Generated text response
    """
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                settings.OLLAMA_ENDPOINT,
                json={
                    "model": settings.OLLAMA_MODEL,
                    "prompt": prompt,
                    "stream": False
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                return result.get("response", "")
            else:
                logger.error(f"Ollama API error: {response.status_code} - {response.text}")
                raise Exception(f"Ollama API returned status code {response.status_code}")
    except Exception as e:
        logger.error(f"Error calling Ollama: {str(e)}", exc_info=True)
        raise

def _parse_llm_response(response_text: str) -> Dict[str, Any]:
    """
    Parse the LLM response into structured data
    
    Args:
        response_text: Raw text response from the LLM
        
    Returns:
        Dictionary with recommendations, risk assessment, and prioritized actions
    """
    # Initialize result
    result = {
        "risk_assessment": "",
        "recommendations": [],
        "prioritized_actions": []
    }
    
    # Extract risk assessment
    risk_pattern = r"RISK ASSESSMENT:(.+?)(?=RECOMMENDATIONS:|$)"
    risk_match = re.search(risk_pattern, response_text, re.DOTALL)
    if risk_match:
        result["risk_assessment"] = risk_match.group(1).strip()
    
    # Extract recommendations
    rec_pattern = r"RECOMMENDATIONS:(.*?)(?=PRIORITIZED ACTIONS:|$)"
    rec_match = re.search(rec_pattern, response_text, re.DOTALL)
    if rec_match:
        recommendations = rec_match.group(1).strip()
        for line in recommendations.split('\n'):
            line = line.strip()
            if line.startswith('-') or line.startswith('*'):
                recommendation = line[1:].strip()
                if recommendation:
                    result["recommendations"].append(recommendation)
    
    # Extract prioritized actions
    act_pattern = r"PRIORITIZED ACTIONS:(.*?)(?=$)"
    act_match = re.search(act_pattern, response_text, re.DOTALL)
    if act_match:
        actions = act_match.group(1).strip()
        for line in actions.split('\n'):
            line = line.strip()
            if line.startswith('-') or line.startswith('*'):
                action = line[1:].strip()
                if action:
                    result["prioritized_actions"].append(action)
    
    # Ensure we have some values
    if not result["risk_assessment"]:
        result["risk_assessment"] = "Based on the scan results, the website has security vulnerabilities that should be addressed."
    
    # Limit to 3 recommendations and actions
    result["recommendations"] = result["recommendations"][:3]
    result["prioritized_actions"] = result["prioritized_actions"][:3]
    
    # If we don't have enough recommendations or actions, add defaults
    default_recommendations = [
        "Update SSL/TLS configuration to modern standards",
        "Implement proper security headers",
        "Address identified vulnerabilities in order of severity"
    ]
    
    default_actions = [
        "Fix critical vulnerabilities immediately",
        "Implement security headers",
        "Regular security assessments"
    ]
    
    while len(result["recommendations"]) < 3:
        result["recommendations"].append(default_recommendations[len(result["recommendations"])])
    
    while len(result["prioritized_actions"]) < 3:
        result["prioritized_actions"].append(default_actions[len(result["prioritized_actions"])])
    
    return result

def _get_fallback_recommendations() -> Dict[str, Any]:
    """
    Get fallback recommendations in case of an error
    """
    return {
        "risk_assessment": "Unable to generate AI analysis at this time. We recommend reviewing the scan findings manually.",
        "recommendations": [
            "Update SSL/TLS configuration to modern standards",
            "Implement proper security headers",
            "Address identified vulnerabilities in order of severity"
        ],
        "prioritized_actions": [
            "Fix critical vulnerabilities immediately",
            "Implement security headers",
            "Regular security assessments"
        ]
    }