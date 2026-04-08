# NVIDIA API Setup (FREE)

## Why Switch to NVIDIA?
- ✅ **Completely FREE** - No rate limits on free tier
- ✅ **High performance models** - Llama 3, Mixtral, etc.
- ✅ **Easy setup** - Just get an API key

## Setup Steps

### 1. Get NVIDIA API Key
1. Go to [https://build.nvidia.com/](https://build.nvidia.com/)
2. Sign up (free account)
3. Click on your profile → "API keys"
4. Create a new API key
5. Copy the key

### 2. Set Environment Variables

#### Local Development
Add to `.env` or `.env.local`:
```
LLM_PROVIDER=nvidia
NVIDIA_API_KEY=your_key_here
```

#### Vercel Deployment
1. Go to your Vercel project settings
2. Environment Variables
3. Add:
   - `LLM_PROVIDER=nvidia`
   - `NVIDIA_API_KEY=<your_api_key>`

### 3. Test the Connection
```bash
cd /Users/mohammedshakeeb/Desktop/ALFRED
python3 << 'EOF'
from backend.llm import chat

messages = [
    {"role": "user", "content": "Say hello"}
]
response = chat(messages)
print(f"✓ Response: {response}")
EOF
```

## Available NVIDIA Models
- `meta/llama2-70b` (default)
- `meta/llama3-70b`
- `meta/llama3-8b`
- `mistralai/mixtral-8x7b-instruct-v0.1`
- `mistralai/mistral-7b-instruct-v0.2`
- And more at https://build.nvidia.com/

## How to Use in Code

### Default (Auto-select NVIDIA Llama 2)
```python
from backend.llm import chat
response = chat(messages)
```

### Specific Model
```python
response = chat(messages, model="meta/llama3-70b")
```

### Specify Temperature
```python
response = chat(messages, temperature=0.7, model="meta/llama3-70b")
```

## Switching Back to Mistral
If needed, set `LLM_PROVIDER=mistral` and add `MISTRAL_API_KEY`.

## Support
- NVIDIA: https://build.nvidia.com/docs
- Mistral: https://docs.mistral.ai/
