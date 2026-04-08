# Groq Setup (FREE - Recommended)

## Why Groq?
- ✅ **Completely FREE** - No deposit required
- ✅ **FASTEST LLM inference** - Designed for speed
- ✅ **Simple API** - Standard OpenAI-compatible format
- ✅ **No credit card needed** - Just sign up and get API key
- ✅ **Generous free tier** - No immediate rate limits

## Setup Steps

### 1. Get Groq API Key (FREE)
1. Go to [https://console.groq.com/](https://console.groq.com/)
2. Sign up (completely free, no credit card)
3. Go to "API keys" section
4. Create a new API key
5. Copy the key

### 2. Set Environment Variables

#### Local Development
Add to `.env` or `.env.local`:
```
LLM_PROVIDER=groq
GROQ_API_KEY=your_key_here
```

#### Vercel Deployment
1. Go to your Vercel project settings
2. Environment Variables
3. Add:
   - `LLM_PROVIDER=groq`
   - `GROQ_API_KEY=<your_api_key>`

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

## Available Groq Models
- `llama-3.3-70b-specdec` (default) - Latest, most capable and actively supported
- `llama-3.1-8b-instant` - Fast and lightweight (if still available)
- `qwen-qwq-32b` - Alternative reasoning model

**Note:** Groq frequently deprecates models. For the most current list, visit: https://console.groq.com/docs/models

## How to Use in Code

### Default (Auto-select Mixtral 8x7b)
```python
from backend.llm import chat
response = chat(messages)
```

### Specific Model
```python
response = chat(
    messages, 
    model="llama2-70b-4096"
)
```

### Specify Temperature
```python
response = chat(
    messages, 
    temperature=0.7,
    model="mixtral-8x7b-32768"
)
```

## Switching Between Providers

### Use Groq (FREE - Recommended)
```
LLM_PROVIDER=groq
GROQ_API_KEY=your_key
```

### Use Together.ai (Requires $5+ deposit)
```
LLM_PROVIDER=together
TOGETHER_API_KEY=your_key
```

### Use Mistral (Requires paid plan)
```
LLM_PROVIDER=mistral
MISTRAL_API_KEY=your_key
```

## Groq vs Other Providers
| Provider | Cost | Speed | Setup |
|----------|------|-------|-------|
| **Groq** | ✅ FREE | ⚡⚡⚡ Fastest | Simple |
| Together.ai | Requires $5+ deposit | Medium | Simple |
| Mistral | Paid plan only | Medium | Simple |

## Support
- Groq Docs: https://console.groq.com/docs
- Groq Community: https://discord.gg/groq


