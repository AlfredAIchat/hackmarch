"""
LLM client helper — supports both NVIDIA (free) and Mistral.
Default: NVIDIA API (free tier)
Fallback: Mistral (requires paid plan)
"""

from __future__ import annotations

import os
import time
from typing import Optional

from dotenv import load_dotenv

# Load .env from backend/ directory (where API keys live)
_backend_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(_backend_dir, ".env"))
# Also try project root .env.local as fallback
load_dotenv(os.path.join(_backend_dir, "..", ".env.local"))

# Determine which LLM provider to use
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "nvidia").lower()  # "nvidia" or "mistral"

# NVIDIA API client (lazy loaded)
try:
    import httpx
    _nvidia_client: Optional[httpx.AsyncClient] = None
except ImportError:
    _nvidia_client = None

# Mistral API client (lazy loaded)
try:
    from mistralai.client import Mistral
    _mistral_client: Optional[Mistral] = None
except ImportError:
    _mistral_client = None


def get_nvidia_api_key() -> str:
    """Get NVIDIA API key from environment."""
    api_key = os.getenv("NVIDIA_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError(
            "NVIDIA_API_KEY is missing. Get free access at https://build.nvidia.com/ "
            "and set NVIDIA_API_KEY in environment variables."
        )
    return api_key


def get_mistral_client() -> object:
    """Get Mistral client."""
    global _mistral_client
    if _mistral_client is None:
        api_key = os.getenv("MISTRAL_API_KEY", "").strip()
        if not api_key:
            raise RuntimeError(
                "MISTRAL_API_KEY is missing on the server. Set it in Vercel Environment Variables."
            )
        _mistral_client = Mistral(api_key=api_key)
    return _mistral_client


def chat(messages: list[dict], temperature: float = 0.3, model: str = None) -> str:
    """
    Convenience wrapper: returns the assistant content string.
    Supports both NVIDIA (free) and Mistral APIs with automatic retry logic.
    
    Args:
        messages: List of message dicts with 'role' and 'content'
        temperature: Temperature for generation (0-1)
        model: Model name (auto-selected based on provider if None)
    """
    provider = LLM_PROVIDER
    
    # Auto-select default model based on provider
    if model is None:
        model = "meta/llama2-70b" if provider == "nvidia" else "mistral-small-latest"
    
    if provider == "nvidia":
        return _chat_nvidia(messages, temperature, model)
    elif provider == "mistral":
        return _chat_mistral(messages, temperature, model)
    else:
        raise RuntimeError(f"Unknown LLM_PROVIDER: {provider}. Use 'nvidia' or 'mistral'.")


def _chat_nvidia(messages: list[dict], temperature: float, model: str) -> str:
    """Call NVIDIA API (free)."""
    import httpx
    import json
    
    api_key = get_nvidia_api_key()
    url = "https://integrate.api.nvidia.com/v1/chat/completions"
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    
    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "top_p": 1.0,
        "max_tokens": 1024,
    }
    
    max_retries = 3
    base_delay = 2
    
    for attempt in range(max_retries):
        try:
            with httpx.Client(timeout=30.0) as client:
                resp = client.post(url, headers=headers, json=payload)
                
                if resp.status_code == 200:
                    data = resp.json()
                    return data["choices"][0]["message"]["content"].strip()
                
                error_msg = resp.text
                
                # Handle auth errors
                if resp.status_code == 401:
                    raise RuntimeError(
                        f"NVIDIA API authentication failed (401). "
                        f"Get free access at https://build.nvidia.com/"
                    )
                
                # Handle rate limits with retry
                if resp.status_code in (429, 503):
                    if attempt < max_retries - 1:
                        wait_time = base_delay * (2 ** attempt)
                        print(f"⚠️ Rate limited ({resp.status_code}). Retrying in {wait_time}s...")
                        time.sleep(wait_time)
                        continue
                    else:
                        raise RuntimeError(
                            f"NVIDIA API rate limited ({resp.status_code}). "
                            f"Please try again in a few minutes."
                        )
                
                raise RuntimeError(f"NVIDIA API error ({resp.status_code}): {error_msg}")
        
        except httpx.RequestError as e:
            if attempt < max_retries - 1:
                wait_time = base_delay * (2 ** attempt)
                print(f"⚠️ Connection error. Retrying in {wait_time}s...")
                time.sleep(wait_time)
                continue
            raise RuntimeError(f"NVIDIA API request failed: {str(e)}") from e
    
    raise RuntimeError("Max retries exceeded")


def _chat_mistral(messages: list[dict], temperature: float, model: str) -> str:
    """Call Mistral API (requires paid plan)."""
    max_retries = 3
    base_delay = 2
    
    for attempt in range(max_retries):
        try:
            client = get_mistral_client()
            resp = client.chat.complete(
                model=model,
                messages=messages,
                temperature=temperature,
            )
            return resp.choices[0].message.content.strip()
        except Exception as exc:
            message = str(exc)
            
            # Handle auth errors (don't retry)
            if "401" in message or "Unauthorized" in message:
                raise RuntimeError(
                    "Mistral authentication failed (401). Verify MISTRAL_API_KEY in Vercel env settings."
                ) from exc
            
            # Handle rate limits with retry
            if "429" in message or "capacity exceeded" in message.lower():
                if attempt < max_retries - 1:
                    wait_time = base_delay * (2 ** attempt)
                    print(f"⚠️ Mistral rate limited (429). Retrying in {wait_time}s...")
                    time.sleep(wait_time)
                    continue
                else:
                    raise RuntimeError(
                        "Mistral API rate limited. Upgrade plan at https://console.mistral.ai"
                    ) from exc
            
            # Other errors
            raise RuntimeError(f"Mistral request failed: {message}") from exc
    
    raise RuntimeError("Max retries exceeded")
