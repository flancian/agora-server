#!/usr/bin/env -S uv run
# worker.py
import time
import os
import sys

# Add the project root to the Python path.
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, project_root)

from app import create_app
from app.storage import maintenance

if __name__ == "__main__":
    app = create_app()
    with app.app_context():
        maintenance.run_full_reindex(app)