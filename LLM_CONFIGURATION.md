# Configuring LLM Models

This guide shows how to use different models with your application.

## How to Use Any Model

### 1. In Code (Direct)
```python
from backend.llm import chat

# Use a custom model
response = chat(
    messages,
    model="meta-llama/llama-4-scout-17b-16e-instruct"
)
```

### 2. Via Environment Variable (Default)

For **Groq**:
```
LLM_PROVIDER=groq
GROQ_MODEL=qwen-qwq-32b
```

For **Together.ai**:
```
LLM_PROVIDER=together
TOGETHER_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
```

For **Mistral**:
```
LLM_PROVIDER=mistral
MISTRAL_MODEL=mistral-small-latest
```

Then in code, just use:
```python
from backend.llm import chat
response = chat(messages)  # Uses the model from env var
```

## Example: Using Llama 4 Scout

To use `meta-llama/llama-4-scout-17b-16e-instruct`:

### Local Development
Add to `.env`:
```
LLM_PROVIDER=together
TOGETHER_API_KEY=your_key_here
TOGETHER_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
```

### Vercel Deployment
Go to Settings → Environment Variables and add:
- `LLM_PROVIDER=together`
- `TOGETHER_API_KEY=<your_key>`
- `TOGETHER_MODEL=meta-llama/llama-4-scout-17b-16e-instruct`

### In Code
```python
from backend.llm import chat

messages = [{"role": "user", "content": "Hello"}]
response = chat(messages)  # Uses TOGETHER_MODEL from env
```

## Available Model Formats

- **Together.ai models**: `meta-llama/...`, `mistralai/...`, etc.
- **Groq models**: `qwen-qwq-32b`, `mixtral-...`, etc.
- **Mistral models**: `mistral-small-latest`, `mistral-large-latest`, etc.

## Switching Providers

To change which provider you use, just change `LLM_PROVIDER`:

```bash
# Use Together.ai
export LLM_PROVIDER=together
export TOGETHER_API_KEY=your_key

# Or use Groq
export LLM_PROVIDER=groq
export GROQ_API_KEY=your_key

# Or use Mistral
export LLM_PROVIDER=mistral
export MISTRAL_API_KEY=your_key
```

## Getting API Keys

- **Groq**: https://console.groq.com/ (completely free)
- **Together.ai**: https://www.together.ai/ (requires $5+ deposit initially)
- **Mistral**: https://console.mistral.ai/ (paid plans only)


