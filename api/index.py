"""
Vercel Python serverless handler for FastAPI backend.
"""
import sys
import os

# Add project root to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    # Try to import the FastAPI app from backend
    from backend.main import app
except Exception as e:
    # Fallback: Create minimal app if backend fails
    print(f"WARNING: Backend initialization failed: {e}", file=sys.stderr)
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse
    
    app = FastAPI()
    
    @app.get("/health")
    async def health():
        return JSONResponse({"status": "error", "message": str(e)}, status_code=500)






