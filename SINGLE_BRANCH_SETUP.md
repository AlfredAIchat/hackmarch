# ✅ Single Production Branch Setup

## Current Status
- ✅ **Production Branch**: `main` (ONLY)
- ✅ Local branches cleaned up
- ❌ **REQUIRED**: Change GitHub default branch from `master` to `main`

---

## What Was Fixed

### ✅ Completed
1. Deleted local branches: `master`, `deploy-sync`
2. Deleted remote branch: `deploy-sync`
3. Cleaned up local git tracking

### ⚠️ REQUIRED ON GITHUB

**You MUST complete this step on GitHub:**

1. Go to: https://github.com/AlfredAIchat/hackmarch/settings/branches
2. Find "Default branch" section
3. Change from `master` → `main`
4. Confirm the change

**Why?** GitHub requires the default branch to be set before it can be deleted. Once you change it, the `master` branch will be deletable.

---

## Deployment Configuration

### Branch Configuration
- **Production:** `main` only
- **Deployments:** All automatic deployments trigger on `main`
- **No manual syncing needed**

### Vercel Setup
- **Frontend:** Deployed from `main` at `/`
- **Backend:** Deployed from `main` at `/_/backend`
- **Config:** `vercel.json` (properly configured)

### Git Workflow Going Forward
```bash
# Only branch that matters:
git checkout main
git pull origin main

# Make changes
git add .
git commit -m "message"
git push origin main

# That's it! Deployment happens automatically.
```

---

## Files Ready for Deployment
- ✅ `vercel.json` - Build configuration
- ✅ `.vercelignore` - Exclusions list
- ✅ `package.json` - Dependencies
- ✅ `next.config.ts` - Next.js config
- ✅ `backend/requirements.txt` - Python dependencies
- ✅ `backend/main.py` - FastAPI app
- ✅ `backend/wsgi.py` - WSGI entry

---

## Cleanup Steps Already Done
```
✅ git branch -D master
✅ git branch -D deploy-sync
✅ git push origin --delete deploy-sync
```

---

## What You Need to Do RIGHT NOW

1. **Go to GitHub Settings** → Branches
2. **Set default to `main`**
3. **Return here when done**

After that, GitHub will automatically allow deletion of the `master` branch, and all deployments will work seamlessly from `main`.

---

## Verification Commands
```bash
# See current branches
git branch -a

# Verify on main
git status

# Check logs
git log --oneline -5
```

Current status:
- Local: `* main` ✅
- Remote: `origin/main` ✅
