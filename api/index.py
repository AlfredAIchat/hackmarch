"""
Vercel Python serverless handler for FastAPI backend.
This file exports the app directly for Vercel's Python runtime.
"""
import sys
import os

# Add project root to Python path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    # Import FastAPI app
    from backend.main import app
except Exception as e:
    # If backend import fails, return error response
    print(f"ERROR: Failed to import backend: {e}", file=sys.stderr)
    import json
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse
    
    app = FastAPI()
    
    @app.get("/")
    async def health():
        return JSONResponse({"error": "Backend initialization failed"}, status_code=500)

# Vercel looks for 'app' directly for ASGI
# No need to explicitly export as 'asgi_app'




