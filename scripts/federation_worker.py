#!/usr/bin/env -S uv run
# scripts/federation_worker.py
import time
import sys
import os
import argparse
import logging

# Add the project root to the Python path.
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, project_root)

from app import create_app
from app.agora import run_federation_pass

def main():
    parser = argparse.ArgumentParser(description="Agora Federation Worker")
    parser.add_argument('--once', action='store_true', help="Run a single pass and exit")
    parser.add_argument('--interval', type=int, default=300, help="Interval between passes in seconds (default: 300)")
    args = parser.parse_args()

    app = create_app()
    print(f"Federation Worker starting with URL_BASE: {app.config.get('URL_BASE')}")
    
    # Configure logging to stdout
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(logging.INFO)
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    app.logger.addHandler(handler)
    app.logger.setLevel(logging.INFO)
    
    if args.once:
        print("Running single federation pass...")
        with app.app_context():
            run_federation_pass()
        print("Done.")
    else:
        print(f"Starting federation loop (interval: {args.interval}s)...")
        while True:
            try:
                with app.app_context():
                    run_federation_pass()
                time.sleep(args.interval)
            except KeyboardInterrupt:
                print("Stopping worker...")
                break
            except Exception as e:
                print(f"Error in federation loop: {e}")
                time.sleep(60)

if __name__ == "__main__":
    main()
