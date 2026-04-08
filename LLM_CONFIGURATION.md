# Groq LLM Configuration

This project uses **Groq** via its official Python SDK — completely free, no hassle.

## Setup

### 1. Get Free Groq API Key
1. Go to [https://console.groq.com/](https://console.groq.com/)
2. Sign up (completely free, no credit card)
3. Go to "API keys" section
4. Create and copy your API key

### 2. Set Environment Variable

Add your API key to your environment:

**Local Development** - Add to `.env`:
```
GROQ_API_KEY=your_api_key_here
```

**Vercel Deployment** - Settings → Environment Variables:
```
GROQ_API_KEY=<your_api_key>
```

The Groq SDK automatically reads from `GROQ_API_KEY` environment variable.

## Usage

```python
from backend.llm import chat

messages = [
    {"role": "user", "content": "Hello, how are you?"}
]

# Use default model (Llama 4 Scout)
response = chat(messages)

# Or specify a different model
response = chat(
    messages,
    model="llama-3.3-70b-specdec",
    temperature=0.7
)

print(response)
```

## Available Models

Current popular Groq models:
- `meta-llama/llama-4-scout-17b-16e-instruct` (default)
- `meta-llama/llama-3.3-70b-specdec`
- `qwen-qwq-32b`
- `gemma-7b-it`

Check https://console.groq.com/docs/models for the latest list.

## API Reference

```python
chat(messages, temperature=0.3, model="meta-llama/llama-4-scout-17b-16e-instruct")
```

- **messages** (list): Message dictionaries with `role` and `content`
- **temperature** (float): Generation temperature, 0-2. Default: 0.3
- **model** (str): Model ID to use. Default: Llama 4 Scout

## Support
- Groq Docs: https://console.groq.com/docs
- Groq Discord: https://discord.gg/groq



