# Vercel Agent Loading Issue - Diagnosis & Solution

## 🚨 Current Error (April 8, 2026)

```
2026-04-08 06:05:33.886 [error] DEBUG: Attempting to load agents...
2026-04-08 06:05:33.886 [error] DEBUG: Python path: ['/var', '/var/task', '/var/task/_vendor']
2026-04-08 06:05:33.886 [error] DEBUG: CWD: /var/task
2026-04-08 06:05:33.886 [error] DEBUG: Project root: /var
2026-04-08 06:05:33.886 [error] DEBUG: Checking for backend at: /var/backend
2026-04-08 06:05:33.886 [error] DEBUG: Backend exists: False
2026-04-08 06:05:33.886 [error] DEBUG: Cannot import backend: No module named 'backend'
2026-04-08 06:05:33.886 [error] ✗ FATAL: Agent loading system failed: No module named 'backend'
2026-04-08 06:05:33.886 [error] Traceback (most recent call last):
2026-04-08 06:05:33.887 [error] File "/var/task/main.py", line 110, in _load_agents
    import backend
2026-04-08 06:05:33.887 [error] ModuleNotFoundError: No module named 'backend'
```

---

## 📊 Root Cause Analysis

### Problem 1: Wrong Project Root Detection
**Error shows:** `Project root: /var` (WRONG!)  
**Should be:** `Project root: /var/task`

The old code's `_find_project_root()` checked paths in the wrong priority order:
1. ❌ `__file__` calculation first → fails on Vercel because `backend/main.py` may be deployed as `/var/task/main.py`
2. ❌ Hard-coded `/var/task` check second → but only if `backend/` subdirectory exists there
3. ❌ Falls back to `/var` → WRONG! This is what's happening now

### Problem 2: Vercel's Python Bundler Behavior
Vercel's Python serverless runtime has two possible behaviors:

**Option A: Preserves Structure** (with `.vc-config.json`)
```
/var/task/
├── api/
│   └── index.py
└── backend/          ← backend/ preserved as a package
    ├── __init__.py
    ├── main.py
    └── agents/
        └── *.py
```
**Imports:** `from backend.agents.intent_guard import ...` ✅

**Option B: Flattens Structure** (default behavior)
```
/var/task/
├── api/
│   └── index.py
├── main.py          ← backend/main.py promoted to root
├── agents/          ← backend/agents/ flattened
│   └── *.py
└── llm.py
```
**Imports:** `from agents.intent_guard import ...` ✅

The code needs to handle **BOTH** scenarios.

### Problem 3: Old Code Still Deployed
The error traceback shows:
```
File "/var/task/main.py", line 110, in _load_agents
    import backend
```

But the current `backend/main.py` in the repo has this fixed code at lines ~135-143:
```python
try:
    import backend as _backend_mod
    print(f"DEBUG: backend package found at {_backend_mod.__file__}", file=sys.stderr)
except ImportError as e:
    print(f"DEBUG: backend not a top-level package (Vercel flat layout): {e}", file=sys.stderr)
    # ... handle flat layout ...
```

**Conclusion:** Vercel is running an **OLD VERSION** of the code!

---

## ✅ Fixes Already Applied (Commit 6cb68e4)

### Fix #1: Improved `_find_project_root()` Priority Order

**Location:** `backend/main.py` lines 26-65

**New Priority Order:**
1. ✅ **CWD first** → Most reliable on Vercel (`/var/task`)
2. ✅ **Scan existing sys.path entries** → Find already-loaded paths
3. ✅ **Hard-coded Vercel paths** → `/var/task`, `/var`
4. ✅ **`__file__` calculation** → Works locally, unreliable on Vercel
5. ✅ **Last resort** → `/var/task`

```python
def _find_project_root():
    """Find the project root — the directory that contains the 'backend/' package."""
    # Priority 1: CWD (most reliable on Vercel — CWD is /var/task)
    cwd = os.getcwd()
    if os.path.isdir(os.path.join(cwd, "backend")):
        return cwd

    # Priority 2: Scan already-populated sys.path
    for _sp in sys.path:
        if _sp and os.path.isdir(os.path.join(_sp, "backend")):
            return _sp

    # Priority 3: Known Vercel serverless paths
    for _candidate in ["/var/task", "/var"]:
        if os.path.isdir(os.path.join(_candidate, "backend")):
            return _candidate

    # Priority 4: __file__-based calculation (works locally)
    # ...

    # Last resort: standard Vercel serverless root
    return "/var/task"
```

### Fix #2: Dual Import Strategy (Nested + Flat)

**Location:** `backend/main.py` lines 160-183

**Strategy:** Try `backend.agents.X` first, fall back to `agents.X` if flattened

```python
def _try_import_module(module_path: str):
    """Import module_path; on ImportError also try the flat variant.
    
    Vercel's bundler may flatten 'backend/agents/foo.py' to
    '/var/task/agents/foo.py', making 'agents.foo' the correct path
    instead of 'backend.agents.foo'.
    """
    try:
        return importlib.import_module(module_path)
    except ImportError:
        # Strip 'backend.' prefix and retry (flat / Vercel layout).
        flat_path = (
            module_path[len("backend."):]
            if module_path.startswith("backend.")
            else module_path
        )
        if flat_path != module_path:
            print(f"DEBUG: Retrying as flat import '{flat_path}'", file=sys.stderr)
            return importlib.import_module(flat_path)
        raise
```

### Fix #3: Graceful `backend` Package Import

**Location:** `backend/main.py` lines 134-145

**Strategy:** Don't crash if `backend` package doesn't exist (flat layout)

```python
try:
    import backend as _backend_mod
    print(f"DEBUG: backend package found at {_backend_mod.__file__}", file=sys.stderr)
except ImportError as e:
    print(f"DEBUG: backend not a top-level package (Vercel flat layout): {e}", file=sys.stderr)
    # Flat layout: ensure /var/task is in path so 'agents.*' imports resolve.
    for _p in ["/var/task", os.getcwd()]:
        if _p not in sys.path:
            sys.path.insert(0, _p)
    print(f"DEBUG: updated sys.path: {sys.path[:5]}", file=sys.stderr)
```

### Fix #4: Dual LLM Import

**Location:** `backend/main.py` lines 218-226

```python
try:
    from backend.llm import chat
except ImportError:
    from llm import chat  # type: ignore[no-redef]  ← Flat layout fallback
_agents['chat'] = chat
```

---

## 🎯 Solution Steps

### Step 1: Verify Latest Code is on GitHub ✅

```bash
cd ALFRED
git log --oneline -1
# Should show: 6cb68e4 Use .vc-config.json for Python function configuration...
```

**Status:** ✅ Confirmed - Latest code IS on GitHub

### Step 2: Force Redeploy on Vercel

**Option A: Trigger via GitHub (Recommended)**
```bash
# Make a small change to force rebuild
cd ALFRED
echo "# Force rebuild $(date)" >> .vercel-rebuild
git add .vercel-rebuild
git commit -m "Force Vercel rebuild with latest agent loading fixes"
git push origin main
```

**Option B: Trigger via Vercel Dashboard**
1. Go to https://vercel.com/AlfredAIchat/hackmarch
2. Click "Deployments"
3. Find the latest deployment (commit `6cb68e4`)
4. Click "⋮" menu → "Redeploy"
5. Select "Use existing Build Cache: NO" ✅
6. Click "Redeploy"

**Option C: Trigger via Vercel CLI**
```bash
cd ALFRED
npm i -g vercel  # if not installed
vercel --prod --force
```

### Step 3: Monitor Deployment Logs

1. Go to https://vercel.com/AlfredAIchat/hackmarch/deployments
2. Click on the latest deployment
3. Watch the "Build Logs" section
4. Check for:
   ```
   ✓ Installing Python dependencies...
   ✓ Building Next.js...
   ✓ Deployment complete
   ```

### Step 4: Test the Fixed Deployment

**Test 1: Health Check**
```bash
curl https://hackmarch-tau.vercel.app/health
```
**Expected:**
```json
{
  "status": "ok",
  "service": "Alfred AI Pipeline",
  "llm": {"provider": "mistral", "key_present": true},
  "agents_loaded": false,
  "rate_limit": {"max_requests": 25, "window_seconds": 60}
}
```

**Test 2: Session Start (Triggers Agent Loading)**
```bash
curl -X POST https://hackmarch-tau.vercel.app/session/start \
  -H "Content-Type: application/json" \
  -d '{"query": "What is blockchain?"}'
```

**Expected Success:**
```json
{
  "session_started": {
    "session_id": "uuid-here",
    "is_continuation": false
  }
}
```

**Expected Failure (if still broken):**
```json
{
  "detail": "Agent system unavailable"
}
```

### Step 5: Check New Deployment Logs

After the fix is deployed, the logs should show:

**✅ Good Logs:**
```
DEBUG: Attempting to load agents...
DEBUG: Python path: ['/var/task', '/var/task/api', '/var/task/_vendor']
DEBUG: CWD: /var/task
DEBUG: Project root: /var/task  ← CORRECT!
DEBUG: backend/ exists: True
DEBUG: backend/agents/ exists: True
DEBUG: Successfully imported backend package from /var/task/backend/__init__.py
✓ intent_guard loaded
✓ answer_agent loaded
✓ hallucination_checker loaded
...
✓ Loaded 12 modules successfully
```

**OR (if flat layout):**
```
DEBUG: Project root: /var/task  ← CORRECT!
DEBUG: backend/ exists: False
DEBUG: agents/ (flat) exists: True
DEBUG: backend not a top-level package (Vercel flat layout): No module named 'backend'
DEBUG: Retrying as flat import 'agents.intent_guard'
✓ intent_guard loaded
...
```

---

## 🔍 Debugging If Still Broken

### Check 1: Which Code Version is Running?
Look for the line number in the error:
```
File "/var/task/main.py", line 110, in _load_agents
    import backend  ← If you see this, OLD CODE is running
```

**OLD CODE (line ~110):** Direct `import backend` without try/except  
**NEW CODE (line ~135):** `try: import backend as _backend_mod` with fallback

### Check 2: Verify .vc-config.json is Deployed
```bash
# In Vercel deployment logs, search for:
"Detected .vc-config.json"
"includeFiles: ../backend/**"
```

### Check 3: Check Actual Filesystem on Vercel
Add this temporary debug endpoint to `backend/main.py`:

```python
@app.get("/debug/filesystem")
async def debug_filesystem():
    import os
    return {
        "cwd": os.getcwd(),
        "files_in_cwd": os.listdir(os.getcwd())[:20],
        "backend_exists": os.path.isdir("backend"),
        "agents_exists": os.path.isdir("agents"),
        "var_task_contents": os.listdir("/var/task")[:20] if os.path.isdir("/var/task") else "N/A",
        "sys_path": sys.path[:5],
    }
```

Then visit: `https://hackmarch-tau.vercel.app/debug/filesystem`

---

## 📋 Verification Checklist

After redeployment:

- [ ] Latest commit `6cb68e4` or newer is deployed
- [ ] Build logs show "✓ Installing Python dependencies" completed
- [ ] Build logs show "✓ Building Next.js" completed  
- [ ] No build errors or warnings
- [ ] Health endpoint returns 200 OK
- [ ] Session/start returns data (not 503 error)
- [ ] Deployment logs show "✓ Loaded X modules successfully"
- [ ] No "ModuleNotFoundError: No module named 'backend'" errors

---

## 🎯 Expected Outcome

After successful redeployment with the latest code:

1. **Project root detected correctly:** `/var/task` (not `/var`)
2. **Agents load successfully** via one of:
   - `backend.agents.*` imports (if structure preserved)
   - `agents.*` imports (if structure flattened)
3. **All 12 modules loaded:** 11 agents + 1 llm/chat
4. **Session endpoints work** without 503 errors
5. **Full pipeline functional** from query → answer

---

## 📞 If You Need More Help

1. Share the latest Vercel deployment logs
2. Share the output of the `/health` endpoint
3. Share the output of the `/debug/filesystem` endpoint (if added)
4. Check if commit `6cb68e4` is actually deployed (Vercel dashboard shows commit hash)

**The code is fixed. We just need Vercel to deploy it!** 🚀