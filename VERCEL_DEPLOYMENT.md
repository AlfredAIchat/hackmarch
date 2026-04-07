# Vercel Deployment Guide - Alfred AI

## Overview
Your project is now configured for **single-click deployment** on Vercel with:
- ✅ Next.js frontend (TypeScript)
- ✅ FastAPI backend (Python)
- ✅ Automatic rebuilds on git push
- ✅ Environment-based configuration

---

## Pre-Deployment Checklist

### ✅ Code Preparation (DONE)
- [x] Git repository initialized and pushed
- [x] `vercel.json` configured with build commands
- [x] `.vercelignore` created to optimize builds
- [x] `api/index.py` serverless handler created
- [x] Next.js API routes updated for backend routing
- [x] Python dependencies in `backend/requirements.txt`

---

## Deployment Steps

### Step 1: Create Vercel Account (One-time)
1. Go to **https://vercel.com/signup**
2. Sign up with GitHub (recommended)
3. Click **"Install Now"** for GitHub integration

---

### Step 2: Import Your Project

1. Go to **https://vercel.com/dashboard**
2. Click **"Add New"** → **"Project"**
3. Find and select your GitHub repo: **AlfredAIchat/hackmarch**
4. Click **"Import"**

> Vercel will auto-detect:
> - **Framework**: Next.js ✓
> - **Build Command**: `npm install && pip install -r backend/requirements.txt && npm run build`
> - **Output Directory**: `.next`

---

### Step 3: Set Environment Variables

In Vercel Dashboard → Your Project → **Settings** → **Environment Variables**:

Add these variables (repeat for Production, Preview, Development):

```
OPENAI_API_KEY = [your-openai-api-key]
ALLOWED_ORIGINS = https://your-project.vercel.app
BACKEND_URL = /_/backend
```

| Variable | Example Value | Environments |
|----------|---------------|--------------|
| `OPENAI_API_KEY` | `sk-...` | All ✓ |
| `ALLOWED_ORIGINS` | `https://alfred-ai.vercel.app` | Production |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | Development |
| `BACKEND_URL` | `/_/backend` | Production |
| `BACKEND_URL` | `http://localhost:8000` | Development |

---

### Step 4: Deploy

1. Click the **"Deploy"** button
2. Wait for build to complete (5-10 minutes)
3. You'll see both services building:
   ```
   ✓ Frontend (.next) - Next.js build
   ✓ Backend (api/) - Python serverless
   ```

---

### Step 5: Verify Deployment

Once deployed, test these URLs:

| URL | Expected | Notes |
|-----|----------|-------|
| `https://your-project.vercel.app` | Landing page | Frontend working |
| `https://your-project.vercel.app/_/backend` | FastAPI Swagger UI | Backend working |
| `https://your-project.vercel.app/api/quiz` | 400 Bad Request | API endpoint reachable |

---

## Project Structure for Vercel

```
/
├── src/                    # Next.js frontend
│   ├── app/
│   │   ├── api/           # Next.js API routes (proxy to backend)
│   │   └── ...
│   └── components/
├── api/                    # Python serverless functions
│   └── index.py           # FastAPI handler
├── backend/               # FastAPI backend code
│   ├── main.py
│   ├── agents/
│   ├── requirements.txt
│   └── ...
├── public/                # Static files
├── package.json           # Frontend dependencies
├── vercel.json            # Vercel config ⭐
├── .vercelignore          # Files to exclude from build
└── build.sh               # Custom build script
```

---

## Architecture

```
User Browser
    ↓
[https://your-project.vercel.app/]
    ↓
Vercel Edge Network
    ├─→ /              → Next.js (Frontend)
    ├─→ /api/*         → Next.js API Routes (proxy)
    └─→ /_/backend/*   → FastAPI (Python backend)
```

**Key Point**: Frontend and backend are on the **same domain**, eliminating CORS issues!

---

## Customization

### Add New Environment Variables
1. Go to **Settings** → **Environment Variables**
2. Add variable and select environments
3. Redeploy or the change auto-applies to new deployments

### Update Build Command
Edit `vercel.json` buildCommand if needed:
```json
"buildCommand": "npm install && pip install -r backend/requirements.txt && npm run build"
```

### Monitor Deployments
- Go to **Deployments** tab to see build logs
- Check **Logs** for runtime errors
- Use **Analytics** to monitor performance

---

## Troubleshooting

### Build Fails
1. Check **Deployment Logs** in Vercel dashboard
2. Verify `backend/requirements.txt` has all dependencies
3. Ensure `package.json` dependencies are compatible

### Backend 404 Errors
- Verify `BACKEND_URL=/_/backend` in environment variables
- Check `api/index.py` exists and imports correctly
- Verify `backend/main.py` FastAPI routes are correct

### Frontend Can't Reach Backend
- Check CORS settings in `backend/main.py`
- Verify `ALLOWED_ORIGINS` includes your Vercel domain
- Use browser DevTools → Network tab to inspect requests

### Python Import Errors
- Ensure all imports in `backend/` use relative imports
- Check `backend/__init__.py` exists
- Verify `backend/requirements.txt` has all dependencies

---

## Local Testing (Before Deployment)

Test everything locally first:

```bash
# Terminal 1: Backend
cd backend
pip install -r requirements.txt
ALLOWED_ORIGINS="http://localhost:3000" python -m uvicorn main:app --reload

# Terminal 2: Frontend
npm run dev
# Visit http://localhost:3000
```

---

## What Happens on Each Git Push

1. **Detect**: Vercel detects new commits to `main` branch
2. **Build**: 
   - Installs Node dependencies: `npm install`
   - Installs Python dependencies: `pip install -r backend/requirements.txt`
   - Builds frontend: `npm run build`
   - Creates serverless functions from `api/`
3. **Deploy**: Automatically deploys to production
4. **Monitor**: View deployment progress in Vercel dashboard

---

## Next Steps

1. ✅ Configure Vercel account and project
2. ✅ Add environment variables
3. ✅ Click Deploy
4. ✅ Share your live URL: `https://your-project.vercel.app`

**Your app will be live in minutes!** 🚀

---

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **FastAPI Docs**: https://fastapi.tiangolo.com
- **GitHub Issues**: Check repository for troubleshooting
