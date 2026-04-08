"""
Groq LLM client helper — free, fastest inference.
"""

from __future__ import annotations

import os
import time

from dotenv import load_dotenv

# Load .env from backend/ directory (where API keys live)
_backend_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(_backend_dir, ".env"))
# Also try project root .env.local as fallback
load_dotenv(os.path.join(_backend_dir, "..", ".env.local"))


def get_groq_api_key() -> str:
    """Get Groq API key from environment."""
    api_key = os.getenv("GROQ_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError(
            "GROQ_API_KEY is missing. Get free access at https://console.groq.com/ "
            "and set GROQ_API_KEY in environment variables."
        )
    return api_key


def chat(messages: list[dict], temperature: float = 0.3, model: str = None) -> str:
    """
    Call Groq API for chat completions.
    
    Args:
        messages: List of message dicts with 'role' and 'content'
        temperature: Temperature for generation (0-1)
        model: Model name (defaults to GROQ_MODEL env var or qwen-qwq-32b)
    
    Returns:
        The assistant's response text
    """
    # Auto-select default model from environment variable
    if model is None:
        model = os.getenv("GROQ_MODEL", "qwen-qwq-32b")
    
    return _chat_groq(messages, temperature, model)


def _chat_groq(messages: list[dict], temperature: float, model: str) -> str:
    """Call Groq API (free, fastest)."""
    import httpx
    
    api_key = get_groq_api_key()
    url = "https://api.groq.com/openai/v1/chat/completions"
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    
    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
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
                        f"Groq authentication failed (401). "
                        f"Get free API key at https://console.groq.com/"
                    )
                
                # Handle rate limits with retry
                if resp.status_code in (429, 500, 502, 503):
                    if attempt < max_retries - 1:
                        wait_time = base_delay * (2 ** attempt)
                        status_text = 'rate limited' if resp.status_code == 429 else 'temporarily unavailable'
                        print(f"⚠️ Groq {status_text} ({resp.status_code}). Retrying in {wait_time}s...")
                        time.sleep(wait_time)
                        continue
                    else:
                        raise RuntimeError(
                            f"Groq API error ({resp.status_code}). Please try again in a moment."
                        )
                
                raise RuntimeError(f"Groq API error ({resp.status_code}): {error_msg}")
        
        except httpx.RequestError as e:
            if attempt < max_retries - 1:
                wait_time = base_delay * (2 ** attempt)
                print(f"⚠️ Connection error. Retrying in {wait_time}s...")
                time.sleep(wait_time)
                continue
            raise RuntimeError(f"Groq request failed: {str(e)}") from e
    
    raise RuntimeError("Max retries exceeded")
