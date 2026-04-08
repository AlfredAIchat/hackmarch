# 🚀 Quick Start: Deploy to Vercel in 3 Minutes

## What's Ready ✅
- Code is pushed to GitHub
- `vercel.json` configured
- `backend/requirements.txt` has all Python dependencies
- Next.js frontend optimized for Vercel
- FastAPI backend ready as serverless functions

---

## 3 Simple Steps

### 1️⃣ Go to Vercel
```
https://vercel.com/new
```
(or click "New Project" on dashboard)

### 2️⃣ Import GitHub Repo
- Select: `AlfredAIchat/hackmarch`
- Click: **Import**
- Vercel auto-detects everything ✓

### 3️⃣ Add Environment Variables
In **Environment Variables** section, add:

```
OPENAI_API_KEY       = [your-api-key]
ALLOWED_ORIGINS      = https://[your-project].vercel.app
BACKEND_URL          = /_/backend
```

Then click: **Deploy** 🎉

---

## After Deployment

✅ Your site is live at: `https://[your-project].vercel.app`

✅ Backend API at: `https://[your-project].vercel.app/_/backend`

✅ Visit and share with friends!

---

## Need Help?
See [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) for detailed guidance.
