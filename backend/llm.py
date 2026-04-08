"""
Groq LLM client helper — using Groq SDK directly.
"""

from __future__ import annotations

from groq import Groq


def chat(messages: list[dict], temperature: float = 0.3, model: str = "meta-llama/llama-4-scout-17b-16e-instruct") -> str:
    """
    Call Groq API for chat completions using the Groq SDK.
    
    Args:
        messages: List of message dicts with 'role' and 'content'
        temperature: Temperature for generation (0-1)
        model: Model name (defaults to meta-llama/llama-4-scout-17b-16e-instruct)
    
    Returns:
        The assistant's response text
    """
    client = Groq()  # API key is read from GROQ_API_KEY env var automatically
    
    try:
        completion = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=1024,
        )
        return completion.choices[0].message.content.strip()
    except Exception as exc:
        raise RuntimeError(f"Groq API request failed: {str(exc)}") from exc
