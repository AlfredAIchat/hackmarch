"""
Vercel Python handler - Direct backend import.
"""

# Simple path setup
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# The backend.main module is the ASGI app
# Vercel will look for 'app' variable
from backend.main import app

# That's it! Handler is ready.










