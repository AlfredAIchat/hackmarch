# Groq LLM Configuration

This project uses **Groq** for LLM inference — completely free, no deposit required.

## Setup

### 1. Get Free Groq API Key
1. Go to [https://console.groq.com/](https://console.groq.com/)
2. Sign up (completely free, no credit card)
3. Go to "API keys" section
4. Create and copy your API key

### 2. Set Environment Variables

#### Local Development
Add to `.env`:
```
GROQ_API_KEY=your_key_here
GROQ_MODEL=qwen-qwq-32b
```

#### Vercel Deployment
Settings → Environment Variables:
- `GROQ_API_KEY=<your_api_key>`
- `GROQ_MODEL=qwen-qwq-32b`

## Using in Code

### Default Model (from GROQ_MODEL env var)
```python
from backend.llm import chat

messages = [{"role": "user", "content": "Hello"}]
response = chat(messages)
```

### Custom Model
```python
response = chat(messages, model="llama-3.3-70b-specdec")
```

### Temperature Control
```python
response = chat(messages, temperature=0.7)
```

## Available Groq Models

Check https://console.groq.com/ for current list. Popular models:
- `qwen-qwq-32b` (default, reasoning-focused)
- `llama-3.3-70b-specdec`
- `gemma-7b-it`

**Note**: Groq deprecates models frequently. Set `GROQ_MODEL` env var to switch models without code changes.

## Support
- Groq Docs: https://console.groq.com/docs
- Groq Discord: https://discord.gg/groq


