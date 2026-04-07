"""
Vercel serverless function handler for FastAPI.
Routes all requests to the FastAPI application.
"""
import sys
import os

# Ensure backend module can be imported
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.main import app

# For Vercel serverless
handler = app


