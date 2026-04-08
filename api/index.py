"""
Vercel Python handler - Minimal wrapper.
"""
import sys
import os

# Setup path for serverless environment
_file = os.path.abspath(__file__)  # /var/task/api/index.py
_dir = os.path.dirname(_file)       # /var/task/api (backend/ is now inside here!)
_root = os.path.dirname(_dir)       # /var/task (for backwards compatibility)

# DEBUG: Print filesystem info BEFORE anything else
print("=" * 60, file=sys.stderr)
print("VERCEL DEPLOYMENT FILESYSTEM DEBUG", file=sys.stderr)
print("=" * 60, file=sys.stderr)
print(f"__file__: {_file}", file=sys.stderr)
print(f"_dir (api/): {_dir}", file=sys.stderr)
print(f"_root (project): {_root}", file=sys.stderr)
print(f"CWD: {os.getcwd()}", file=sys.stderr)
print(f"", file=sys.stderr)

# List contents of _dir (api/) - backend should be HERE now!
if os.path.isdir(_dir):
    print(f"Contents of {_dir} (api/):", file=sys.stderr)
    try:
        items = os.listdir(_dir)
        for item in sorted(items):
            item_path = os.path.join(_dir, item)
            if os.path.isdir(item_path):
                print(f"  [DIR]  {item}/", file=sys.stderr)
            else:
                print(f"  [FILE] {item}", file=sys.stderr)
    except Exception as e:
        print(f"  ERROR listing: {e}", file=sys.stderr)
print(f"", file=sys.stderr)

# Check for backend folder in LOCAL api/ directory (PLAN B approach)
backend_path_local = os.path.join(_dir, "backend")
print(f"backend/ exists at {backend_path_local} (LOCAL): {os.path.isdir(backend_path_local)}", file=sys.stderr)
if os.path.isdir(backend_path_local):
    print(f"Contents of api/backend/:", file=sys.stderr)
    try:
        for item in sorted(os.listdir(backend_path_local))[:20]:
            print(f"  {item}", file=sys.stderr)
    except Exception as e:
        print(f"  ERROR: {e}", file=sys.stderr)
print(f"", file=sys.stderr)

# Also check parent directory for backwards compatibility
backend_path_parent = os.path.join(_root, "backend")
print(f"backend/ exists at {backend_path_parent} (PARENT): {os.path.isdir(backend_path_parent)}", file=sys.stderr)
print(f"", file=sys.stderr)

print(f"sys.path (first 5):", file=sys.stderr)
for p in sys.path[:5]:
    print(f"  {p}", file=sys.stderr)
print("=" * 60, file=sys.stderr)

# Add paths to sys.path - prioritize _dir (api/) since backend is now inside it
for p in [_dir, _root, os.getcwd(), "/var/task"]:
    if p not in sys.path:
        sys.path.insert(0, p)

# Try to import and use backend app directly
try:
    from backend.main import app
    print("✓ Successfully imported backend.main.app", file=sys.stderr)
except Exception as e:
    # If backend fails, create fallback
    import traceback
    print(f"✗ FATAL: Could not import backend.main: {e}", file=sys.stderr)
    traceback.print_exc(file=sys.stderr)

    from fastapi import FastAPI
    from fastapi.responses import JSONResponse
    from fastapi.middleware.cors import CORSMiddleware

    app = FastAPI()
    app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

    @app.get("/health")
    def health():
        return {"status": "error", "error": str(e)}

    @app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"])
    def fallback(path: str):
        return JSONResponse({"error": "Backend not available", "details": str(e)}, 503)
