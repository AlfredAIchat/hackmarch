"""
LLM client helper — supports Groq (free, fastest), Together.ai, and Mistral.
Default: Groq (completely free, fastest LLM inference)
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
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "groq").lower()  # "groq", "together", or "mistral"

# Mistral API client (lazy loaded)
try:
    from mistralai.client import Mistral
    _mistral_client: Optional[Mistral] = None
except ImportError:
    _mistral_client = None


def get_groq_api_key() -> str:
    """Get Groq API key from environment."""
    api_key = os.getenv("GROQ_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError(
            "GROQ_API_KEY is missing. Get free access at https://console.groq.com/ "
            "and set GROQ_API_KEY in environment variables."
        )
    return api_key


def get_together_api_key() -> str:
    """Get Together.ai API key from environment."""
    api_key = os.getenv("TOGETHER_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError(
            "TOGETHER_API_KEY is missing. Get access at https://www.together.ai/ "
            "and set TOGETHER_API_KEY in environment variables."
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
    Supports Groq (free, fastest), Together.ai, and Mistral APIs.
    
    Args:
        messages: List of message dicts with 'role' and 'content'
        temperature: Temperature for generation (0-1)
        model: Model name (auto-selected based on provider if None)
    """
    provider = LLM_PROVIDER
    
    # Auto-select default model based on provider
    if model is None:
        if provider == "groq":
            model = "mixtral-8x7b-32768"  # Fast and capable
        elif provider == "together":
            model = "meta-llama/Llama-2-70b-chat-hf"
        else:
            model = "mistral-small-latest"
    
    if provider == "groq":
        return _chat_groq(messages, temperature, model)
    elif provider == "together":
        return _chat_together(messages, temperature, model)
    elif provider == "mistral":
        return _chat_mistral(messages, temperature, model)
    else:
        raise RuntimeError(f"Unknown LLM_PROVIDER: {provider}. Use 'groq', 'together', or 'mistral'.")


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
                        print(f"⚠️ Groq {"rate limited" if resp.status_code == 429 else "temporarily unavailable"} ({resp.status_code}). Retrying in {wait_time}s...")
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


def _chat_together(messages: list[dict], temperature: float, model: str) -> str:
    """Call Together.ai API (requires deposit)."""
    import httpx
    
    api_key = get_together_api_key()
    url = "https://api.together.xyz/v1/chat/completions"
    
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
                        f"Together.ai authentication failed (401). "
                        f"Check your API key at https://www.together.ai/"
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
                            f"Together.ai rate limited ({resp.status_code}). Please try again in a few minutes."
                        )
                
                raise RuntimeError(f"Together.ai API error ({resp.status_code}): {error_msg}")
        
        except httpx.RequestError as e:
            if attempt < max_retries - 1:
                wait_time = base_delay * (2 ** attempt)
                print(f"⚠️ Connection error. Retrying in {wait_time}s...")
                time.sleep(wait_time)
                continue
            raise RuntimeError(f"Together.ai request failed: {str(e)}") from e
    
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
