import httpx
import logging
from typing import Dict, Any, Optional
import time
from urllib.parse import urlparse

from app.core.config import settings

# Set up logger
logger = logging.getLogger(__name__)

async def get_threat_intelligence(url: str) -> Optional[Dict[str, Any]]:
    """
    Get threat intelligence for a URL from external sources
    
    Args:
        url: The URL to check
        
    Returns:
        Dictionary with threat intelligence data or None if error
    """
    try:
        # Parse domain from URL
        domain = _extract_domain(url)
        logger.info(f"Getting threat intelligence for domain: {domain}")
        
        # Initialize results
        results = {
            "domain": domain,
            "sources": {},
            "timestamp": int(time.time()),
            "malicious_indicators": 0,
            "suspicious_indicators": 0
        }
        
        # Get data from VirusTotal
        if settings.VIRUSTOTAL_API_KEY:
            vt_data = await _query_virustotal(domain)
            if vt_data:
                results["sources"]["virustotal"] = vt_data
                # Update indicators
                if vt_data.get("malicious", 0) > 0:
                    results["malicious_indicators"] += 1
        
        # Get data from Shodan
        if settings.SHODAN_API_KEY:
            shodan_data = await _query_shodan(domain)
            if shodan_data:
                results["sources"]["shodan"] = shodan_data
                # Update indicators
                if shodan_data.get("vulns", {}):
                    results["suspicious_indicators"] += 1
        
        # Calculate overall risk score
        results["risk_score"] = _calculate_risk_score(results)
        
        # Generate summary
        results["summary"] = _generate_summary(results)
        
        return results
    except Exception as e:
        logger.error(f"Error retrieving threat intelligence: {str(e)}", exc_info=True)
        return None

def _extract_domain(url: str) -> str:
    """
    Extract domain from URL
    """
    try:
        parsed_url = urlparse(url)
        domain = parsed_url.netloc
        
        # Remove port if present
        if ":" in domain:
            domain = domain.split(":")[0]
        
        # Remove www if present
        if domain.startswith("www."):
            domain = domain[4:]
        
        return domain
    except Exception as e:
        logger.error(f"Error extracting domain from URL {url}: {str(e)}")
        # Return the original URL as fallback
        return url

async def _query_virustotal(domain: str) -> Optional[Dict[str, Any]]:
    """
    Query VirusTotal API for domain reputation
    """
    try:
        if not settings.VIRUSTOTAL_API_KEY:
            logger.warning("VirusTotal API key not configured")
            return None
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"https://www.virustotal.com/api/v3/domains/{domain}",
                headers={"x-apikey": settings.VIRUSTOTAL_API_KEY}
            )
            
            if response.status_code == 200:
                data = response.json()
                attributes = data.get("data", {}).get("attributes", {})
                last_analysis_stats = attributes.get("last_analysis_stats", {})
                
                return {
                    "malicious": last_analysis_stats.get("malicious", 0),
                    "suspicious": last_analysis_stats.get("suspicious", 0),
                    "harmless": last_analysis_stats.get("harmless", 0),
                    "reputation": attributes.get("reputation", 0),
                    "categories": attributes.get("categories", {}),
                    "last_analysis_date": attributes.get("last_analysis_date", 0)
                }
            elif response.status_code == 404:
                logger.info(f"Domain {domain} not found in VirusTotal")
                return {
                    "malicious": 0,
                    "suspicious": 0,
                    "harmless": 0,
                    "reputation": 0,
                    "categories": {},
                    "last_analysis_date": 0
                }
            else:
                logger.error(f"VirusTotal API error: {response.status_code} - {response.text}")
                return None
    except Exception as e:
        logger.error(f"Error querying VirusTotal: {str(e)}", exc_info=True)
        return None

async def _query_shodan(domain: str) -> Optional[Dict[str, Any]]:
    """
    Query Shodan API for domain information
    """
    try:
        if not settings.SHODAN_API_KEY:
            logger.warning("Shodan API key not configured")
            return None
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"https://api.shodan.io/shodan/host/search",
                params={
                    "key": settings.SHODAN_API_KEY,
                    "query": f"hostname:{domain}",
                    "minify": True
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                matches = data.get("matches", [])
                
                result = {
                    "total": data.get("total", 0),
                    "ports": [],
                    "vulns": {},
                    "services": []
                }
                
                # Extract information from matches
                for match in matches:
                    if "port" in match and match["port"] not in result["ports"]:
                        result["ports"].append(match["port"])
                    
                    if "product" in match and match["product"] not in result["services"]:
                        result["services"].append(match["product"])
                    
                    if "vulns" in match:
                        for vuln_id, vuln_info in match["vulns"].items():
                            if vuln_id not in result["vulns"]:
                                result["vulns"][vuln_id] = vuln_info
                
                return result
            elif response.status_code == 404:
                logger.info(f"Domain {domain} not found in Shodan")
                return {
                    "total": 0,
                    "ports": [],
                    "vulns": {},
                    "services": []
                }
            else:
                logger.error(f"Shodan API error: {response.status_code} - {response.text}")
                return None
    except Exception as e:
        logger.error(f"Error querying Shodan: {str(e)}", exc_info=True)
        return None

def _calculate_risk_score(results: Dict[str, Any]) -> int:
    """
    Calculate a risk score based on threat intelligence
    
    Args:
        results: Threat intelligence results
        
    Returns:
        Risk score (0-100)
    """
    score = 0
    
    # Check VirusTotal results
    vt_data = results.get("sources", {}).get("virustotal", {})
    if vt_data:
        # If any engine marks as malicious, add points
        malicious = vt_data.get("malicious", 0)
        if malicious > 0:
            if malicious >= 5:
                score += 50
            else:
                score += malicious * 10
        
        # If negative reputation, add points
        reputation = vt_data.get("reputation", 0)
        if reputation < 0:
            score += min(abs(reputation), 20)
    
    # Check Shodan results
    shodan_data = results.get("sources", {}).get("shodan", {})
    if shodan_data:
        # If vulnerabilities found, add points
        vulns = shodan_data.get("vulns", {})
        if vulns:
            score += min(len(vulns) * 10, 30)
        
        # If unusual ports open, add points
        common_ports = {80, 443, 22, 21, 25, 110, 143, 993, 995}
        unusual_ports = [p for p in shodan_data.get("ports", []) if p not in common_ports]
        if unusual_ports:
            score += min(len(unusual_ports) * 5, 20)
    
    # Cap at 100
    return min(score, 100)

def _generate_summary(results: Dict[str, Any]) -> str:
    """
    Generate a summary of threat intelligence findings
    
    Args:
        results: Threat intelligence results
        
    Returns:
        Summary text
    """
    risk_score = results.get("risk_score", 0)
    
    if risk_score >= 70:
        risk_level = "High"
    elif risk_score >= 40:
        risk_level = "Medium"
    elif risk_score >= 10:
        risk_level = "Low"
    else:
        risk_level = "Minimal"
    
    summary = f"Domain {results.get('domain')} has a {risk_level.lower()} risk score of {risk_score}/100."
    
    # Add details about malicious indicators
    vt_data = results.get("sources", {}).get("virustotal", {})
    if vt_data and vt_data.get("malicious", 0) > 0:
        summary += f" Found {vt_data.get('malicious')} malicious indicators in VirusTotal."
    
    # Add details about vulnerabilities
    shodan_data = results.get("sources", {}).get("shodan", {})
    if shodan_data and shodan_data.get("vulns", {}):
        summary += f" Detected {len(shodan_data.get('vulns', {}))} vulnerabilities via Shodan."
    
    return summary