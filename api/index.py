"""
Vercel serverless function entry point for FastAPI backend.
This file enables the backend to work with Vercel's runtime.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

# Import your main FastAPI app
from backend.main import app as alfred_app

# Get the environment
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Update CORS for Vercel deployment
alfred_app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Export for Vercel
app = alfred_app
