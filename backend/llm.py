"""
Mistral client helper — shared across all agents.
"""

from __future__ import annotations

import os
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
    """Convenience wrapper: returns the assistant content string."""
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
        if "401" in message or "Unauthorized" in message or "authentication" in message.lower():
            raise RuntimeError(
                "Mistral authentication failed (401). Verify MISTRAL_API_KEY in Vercel env settings."
            ) from exc
        raise RuntimeError(f"LLM request failed: {message}") from exc
