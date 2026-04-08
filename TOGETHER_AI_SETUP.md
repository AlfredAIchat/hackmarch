# Together.ai Setup (FREE - Recommended)

## Why Together.ai?
- ✅ **Completely FREE** - No rate limits on free tier
- ✅ **Simple API** - Standard OpenAI-compatible format
- ✅ **250+ models** - Llama, Mistral, and many more
- ✅ **Easy setup** - Just get an API key
- ✅ **No credit card required**

## Setup Steps

### 1. Get Together.ai API Key (FREE)
1. Go to [https://www.together.ai/](https://www.together.ai/)
2. Sign up (completely free, no credit card needed)
3. Go to Settings → API keys
4. Create a new API key
5. Copy the key

### 2. Set Environment Variables

#### Local Development
Add to `.env` or `.env.local`:
```
LLM_PROVIDER=together
TOGETHER_API_KEY=your_key_here
```

#### Vercel Deployment
1. Go to your Vercel project settings
2. Environment Variables
3. Add:
   - `LLM_PROVIDER=together`
   - `TOGETHER_API_KEY=<your_api_key>`

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

## Available Together.ai Models
- `meta-llama/Llama-2-70b-chat-hf` (default) - Excellent quality
- `meta-llama/Llama-2-13b-chat-hf` - Faster, good quality
- `meta-llama/Llama-2-7b-chat-hf` - Fastest
- `mistralai/Mistral-7B-Instruct-v0.1` - Alternative
- And 250+ more models available

Full list at: https://www.together.ai/products#inference

## How to Use in Code

### Default (Auto-select Llama 2 70B)
```python
from backend.llm import chat
response = chat(messages)
```

### Specific Model
```python
response = chat(
    messages, 
    model="meta-llama/Llama-2-70b-chat-hf"
)
```

### Specify Temperature
```python
response = chat(
    messages, 
    temperature=0.7,
    model="meta-llama/Llama-2-70b-chat-hf"
)
```

## Switching Between Providers

### Use Together.ai (Free - Recommended)
```
LLM_PROVIDER=together
TOGETHER_API_KEY=your_key
```

### Use Mistral (Requires Paid Plan)
```
LLM_PROVIDER=mistral
MISTRAL_API_KEY=your_key
```

## Support
- Together.ai: https://www.together.ai/docs/inference/overview
- Together.ai Community: https://together.ai/community

