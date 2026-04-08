"""
WSGI entry point for Vercel deployment.
"""
from backend.main import app

# Vercel will call this
application = app
