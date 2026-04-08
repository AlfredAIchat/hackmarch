"""
WSGI entry point for Vercel deployment.
"""
import os
import sys

_backend_dir = os.path.dirname(os.path.abspath(__file__))
_project_root = os.path.dirname(_backend_dir)
if _project_root not in sys.path:
	sys.path.insert(0, _project_root)

from backend.main import app

# Vercel will call this
application = app
