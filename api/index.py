"""
Vercel Python handler with fallback support.
Works even if backend module fails to load.
"""
import sys
import os

# Setup Python path for serverless environment
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

# Create the app first
app = FastAPI(title="Alfred AI Pipeline")

# Add CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health endpoint - always works
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "Alfred AI Pipeline",
        "agents_loaded": False
    }

# Try to import backend and merge its routes
backend_loaded = False
try:
    from backend.main import app as backend_app
    
    # Successfully imported - mount all backend routes
    for route in backend_app.routes:
        # Skip duplicates
        if not any(r.path == route.path and r.methods == route.methods for r in app.routes):
            app.routes.append(route)
    
    backend_loaded = True
    print("✓ Backend module loaded successfully", file=sys.stderr)

except ImportError as e:
    print(f"✗ Failed to import backend: {e}", file=sys.stderr)
    import traceback
    traceback.print_exc()

except Exception as e:
    print(f"✗ Error loading backend: {e}", file=sys.stderr)
    import traceback
    traceback.print_exc()

# Provide helpful error responses for backend endpoints if backend isn't loaded
if not backend_loaded:
    @app.post("/session/start")
    async def error_start(body: dict = None):
        return JSONResponse({
            "error": "Backend not initialized",
            "status": "Please check server logs"
        }, 500)
    
    @app.post("/session/select-term")
    async def error_select(body: dict = None):
        return JSONResponse({"error": "Backend not available"}, 503)
    
    @app.post("/session/quiz")
    async def error_quiz(body: dict = None):
        return JSONResponse({"error": "Backend not available"}, 503)
    
    @app.post("/session/upload")
    async def error_upload(body: dict = None):
        return JSONResponse({"error": "Backend not available"}, 503)
    
    @app.get("/session/report/{session_id}")
    async def error_report(session_id: str):
        return JSONResponse({"error": "Backend not available"}, 503)











