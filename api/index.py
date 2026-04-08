"""
Vercel Python entry point for FastAPI backend.
"""
import sys
import os

# Add project root to Python path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import FastAPI app
from backend.main import app

# Expose as ASGI application for Vercel
asgi_app = app




