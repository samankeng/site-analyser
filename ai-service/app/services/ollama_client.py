import httpx
import logging
import json
from typing import Dict, Any, Optional, List, Union
import asyncio
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from app.core.config import settings
from app.core.errors import ExternalServiceError

# Set up logger
logger = logging.getLogger(__name__)

class OllamaClient:
    """Client for interacting with Ollama API for LLM inference."""
    
    def __init__(
        self, 
        endpoint: Optional[str] = None, 
        model: Optional[str] = None,
        timeout: float = 60.0
    ):
        """
        Initialize the Ollama client
        
        Args:
            endpoint: Ollama API endpoint URL
            model: Default model to use
            timeout: Request timeout in seconds
        """
        self.endpoint = endpoint or settings.OLLAMA_ENDPOINT
        self.model = model or settings.OLLAMA_MODEL
        self.timeout = timeout
        
        # Validate configuration
        if not self.endpoint:
            logger.warning("Ollama endpoint not configured")
        if not self.model:
            logger.warning("Ollama model not configured")
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        retry=retry_if_exception_type((httpx.HTTPError, asyncio.TimeoutError)),
        reraise=True
    )
    async def generate(
        self, 
        prompt: str,
        model: Optional[str] = None,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        stop_sequences: Optional[List[str]] = None,
        stream: bool = False,
        raw_response: bool = False
    ) -> Union[str, Dict[str, Any]]:
        """
        Generate text using the Ollama API
        
        Args:
            prompt: The prompt to send to the LLM
            model: Model to use (overrides default)
            system_prompt: System prompt to set context
            temperature: Sampling temperature (0.0-1.0)
            max_tokens: Maximum number of tokens to generate
            stop_sequences: Sequences that stop generation when reached
            stream: Whether to stream the response
            raw_response: Whether to return the raw API response
            
        Returns:
            Generated text string, or raw API response if raw_response=True
        
        Raises:
            ExternalServiceError: If API call fails
        """
        try:
            # Prepare request payload
            payload = {
                "model": model or self.model,
                "prompt": prompt,
                "stream": stream
            }
            
            # Add optional parameters if provided
            if system_prompt:
                payload["system"] = system_prompt
            
            if temperature is not None:
                payload["temperature"] = temperature
            
            if max_tokens is not None:
                payload["num_predict"] = max_tokens
            
            if stop_sequences:
                payload["stop"] = stop_sequences
            
            # Log request (but truncate prompt for brevity)
            log_payload = payload.copy()
            if "prompt" in log_payload:
                log_payload["prompt"] = log_payload["prompt"][:100] + "..." if len(log_payload["prompt"]) > 100 else log_payload["prompt"]
            logger.debug(f"Ollama request: {json.dumps(log_payload)}")
            
            # Make API call
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    self.endpoint,
                    json=payload
                )
                
                # Handle HTTP errors
                response.raise_for_status()
                
                # Parse response
                result = response.json()
                
                if raw_response:
                    return result
                
                # Extract and return generated text
                if stream:
                    # This would need to be handled differently for streaming
                    # Returning a generator or using callback pattern
                    raise NotImplementedError("Streaming not yet implemented")
                else:
                    return result.get("response", "")
        
        except httpx.HTTPStatusError as e:
            logger.error(f"Ollama API HTTP error: {e.response.status_code} - {e.response.text}")
            raise ExternalServiceError(f"Ollama API returned status code {e.response.status_code}")
        
        except httpx.RequestError as e:
            logger.error(f"Ollama API request error: {str(e)}")
            raise ExternalServiceError(f"Ollama API request failed: {str(e)}")
        
        except Exception as e:
            logger.error(f"Unexpected error calling Ollama: {str(e)}", exc_info=True)
            raise ExternalServiceError(f"Unexpected error: {str(e)}")
    
    async def chat(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        raw_response: bool = False
    ) -> Union[str, Dict[str, Any]]:
        """
        Use the chat completion API with Ollama
        
        Args:
            messages: List of message dictionaries with 'role' and 'content'
            model: Model to use (overrides default)
            temperature: Sampling temperature (0.0-1.0)
            max_tokens: Maximum number of tokens to generate
            raw_response: Whether to return the raw API response
            
        Returns:
            Generated text string or raw API response if raw_response=True
        
        Raises:
            ExternalServiceError: If API call fails
        """
        try:
            # Prepare request payload
            payload = {
                "model": model or self.model,
                "messages": messages,
                "stream": False
            }
            
            # Add optional parameters if provided
            if temperature is not None:
                payload["temperature"] = temperature
            
            if max_tokens is not None:
                payload["num_predict"] = max_tokens
            
            # Make API call to chat endpoint
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    self.endpoint.replace("/generate", "/chat"),
                    json=payload
                )
                
                # Handle HTTP errors
                response.raise_for_status()
                
                # Parse response
                result = response.json()
                
                if raw_response:
                    return result
                
                # Extract and return generated text
                if "message" in result:
                    return result["message"].get("content", "")
                else:
                    return result.get("response", "")
        
        except httpx.HTTPStatusError as e:
            logger.error(f"Ollama chat API HTTP error: {e.response.status_code} - {e.response.text}")
            raise ExternalServiceError(f"Ollama chat API returned status code {e.response.status_code}")
        
        except httpx.RequestError as e:
            logger.error(f"Ollama chat API request error: {str(e)}")
            raise ExternalServiceError(f"Ollama chat API request failed: {str(e)}")
        
        except Exception as e:
            logger.error(f"Unexpected error calling Ollama chat: {str(e)}", exc_info=True)
            raise ExternalServiceError(f"Unexpected error: {str(e)}")
    
    async def get_model_info(self, model: Optional[str] = None) -> Dict[str, Any]:
        """
        Get information about a model
        
        Args:
            model: Name of the model to get info for (uses default if None)
            
        Returns:
            Dictionary with model information
            
        Raises:
            ExternalServiceError: If API call fails
        """
        try:
            model_name = model or self.model
            
            # Make API call to the model info endpoint
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    self.endpoint.replace("/generate", f"/show"),
                    params={"name": model_name}
                )
                
                # Handle HTTP errors
                response.raise_for_status()
                
                # Parse response
                return response.json()
        
        except httpx.HTTPStatusError as e:
            logger.error(f"Ollama model info API HTTP error: {e.response.status_code} - {e.response.text}")
            raise ExternalServiceError(f"Ollama model info API returned status code {e.response.status_code}")
        
        except httpx.RequestError as e:
            logger.error(f"Ollama model info API request error: {str(e)}")
            raise ExternalServiceError(f"Ollama model info API request failed: {str(e)}")
        
        except Exception as e:
            logger.error(f"Unexpected error getting model info: {str(e)}", exc_info=True)
            raise ExternalServiceError(f"Unexpected error: {str(e)}")
    
    async def list_models(self) -> List[Dict[str, Any]]:
        """
        List available models
        
        Returns:
            List of dictionaries with model information
            
        Raises:
            ExternalServiceError: If API call fails
        """
        try:
            # Make API call to list models
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    self.endpoint.replace("/generate", "/tags")
                )
                
                # Handle HTTP errors
                response.raise_for_status()
                
                # Parse response
                result = response.json()
                return result.get("models", [])
        
        except httpx.HTTPStatusError as e:
            logger.error(f"Ollama list models API HTTP error: {e.response.status_code} - {e.response.text}")
            raise ExternalServiceError(f"Ollama list models API returned status code {e.response.status_code}")
        
        except httpx.RequestError as e:
            logger.error(f"Ollama list models API request error: {str(e)}")
            raise ExternalServiceError(f"Ollama list models API request failed: {str(e)}")
        
        except Exception as e:
            logger.error(f"Unexpected error listing models: {str(e)}", exc_info=True)
            raise ExternalServiceError(f"Unexpected error: {str(e)}")


# Create a default client instance
ollama_client = OllamaClient()

# Simple function wrappers for the client for easier imports
async def generate_text(
    prompt: str,
    model: Optional[str] = None,
    system_prompt: Optional[str] = None,
    temperature: float = 0.7,
    max_tokens: Optional[int] = None,
    stop_sequences: Optional[List[str]] = None
) -> str:
    """Wrapper function for generating text with Ollama"""
    return await ollama_client.generate(
        prompt=prompt,
        model=model,
        system_prompt=system_prompt,
        temperature=temperature,
        max_tokens=max_tokens,
        stop_sequences=stop_sequences
    )

async def chat_completion(
    messages: List[Dict[str, str]],
    model: Optional[str] = None,
    temperature: float = 0.7,
    max_tokens: Optional[int] = None
) -> str:
    """Wrapper function for chat completion with Ollama"""
    return await ollama_client.chat(
        messages=messages,
        model=model,
        temperature=temperature,
        max_tokens=max_tokens
    )
