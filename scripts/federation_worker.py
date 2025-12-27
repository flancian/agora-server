#!/usr/bin/env -S uv run
# scripts/federation_worker.py
import time
import sys
import os
import argparse

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
    
    with app.app_context():
        if args.once:
            print("Running single federation pass...")
            run_federation_pass()
            print("Done.")
        else:
            print(f"Starting federation loop (interval: {args.interval}s)...")
            while True:
                try:
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
