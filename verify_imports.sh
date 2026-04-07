#!/bin/bash
# Verify Python imports work correctly

echo "Testing Python imports..."

python3 << 'PYTHON_SCRIPT'
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    print("✓ Importing backend.main...")
    from backend.main import app
    print("✓ FastAPI app imported successfully")
    
    print("✓ Checking routes...")
    for route in app.routes:
        print(f"  - {route.path}")
    
    print("\n✅ All imports working correctly!")
except Exception as e:
    print(f"❌ Import error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
PYTHON_SCRIPT
