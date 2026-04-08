"""
Vercel Python handler - Minimal wrapper.
"""
import sys
import os

# Setup path for serverless environment
_file = os.path.abspath(__file__)  # /var/task/api/index.py
_dir = os.path.dirname(_file)       # /var/task/api
_root = os.path.dirname(_dir)       # /var/task

for p in [_root, _dir, os.getcwd(), "/var/task"]:
    if p not in sys.path:
        sys.path.insert(0, p)

# Try to import and use backend app directly
try:
    from backend.main import app
except Exception as e:
    # If backend fails, create fallback
    import traceback
    print(f"FATAL: Could not import backend: {e}", file=sys.stderr)
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














