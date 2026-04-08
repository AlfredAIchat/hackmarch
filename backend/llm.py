"""
Mistral client helper — shared across all agents.
"""

from __future__ import annotations

import os
import time
from typing import Optional

from dotenv import load_dotenv
from mistralai.client import Mistral

# Load .env from backend/ directory (where API keys live)
_backend_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(_backend_dir, ".env"))
# Also try project root .env.local as fallback
load_dotenv(os.path.join(_backend_dir, "..", ".env.local"))

_client: Optional[Mistral] = None


def get_mistral_client() -> Mistral:
    global _client
    if _client is None:
        api_key = os.getenv("MISTRAL_API_KEY", "").strip()
        if not api_key:
            raise RuntimeError(
                "MISTRAL_API_KEY is missing on the server. Set it in Vercel Environment Variables."
            )
        _client = Mistral(api_key=api_key)
    return _client


def chat(messages: list[dict], temperature: float = 0.3, model: str = "mistral-small-latest") -> str:
    """Convenience wrapper: returns the assistant content string.
    Includes retry logic for rate limit (429) errors."""
    max_retries = 3
    base_delay = 2  # seconds
    
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
            
            # Handle authentication errors (don't retry)
            if "401" in message or "Unauthorized" in message or "authentication" in message.lower():
                raise RuntimeError(
                    "Mistral authentication failed (401). Verify MISTRAL_API_KEY in Vercel env settings."
                ) from exc
            
            # Handle rate limit errors (429) with exponential backoff
            if "429" in message or "capacity exceeded" in message.lower():
                if attempt < max_retries - 1:
                    wait_time = base_delay * (2 ** attempt)  # 2s, 4s, 8s
                    print(f"⚠️ Rate limited (429). Retrying in {wait_time}s... (attempt {attempt + 1}/{max_retries})")
                    time.sleep(wait_time)
                    continue
                else:
                    raise RuntimeError(
                        "Mistral API rate limited (429). Service tier capacity exceeded. "
                        "Upgrade your Mistral plan at https://console.mistral.ai"
                    ) from exc
            
            # Other errors
            raise RuntimeError(f"LLM request failed: {message}") from exc
    
    raise RuntimeError("Max retries exceeded")
