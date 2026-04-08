#!/bin/bash
set -e

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r backend/requirements.txt

# Build Next.js frontend
echo "Building Next.js frontend..."
npm run build

echo "Build completed successfully!"
