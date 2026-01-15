#!/usr/bin/env -S uv run
# worker.py
import time
import os
import sys
import logging

# Add the project root to the Python path.
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, project_root)

from app import create_app
from app.storage import maintenance

if __name__ == "__main__":
    # Ensure we are recognized as a worker
    os.environ['AGORA_WORKER'] = 'true'
    
    app = create_app()
    
    # Force INFO level logging to stdout for the worker
    # This overrides the file-only WARNING default in ProductionConfig
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(logging.INFO)
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    
    app.logger.addHandler(handler)
    app.logger.setLevel(logging.INFO)
    
    with app.app_context():
        maintenance.run_full_reindex(app)