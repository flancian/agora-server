#!/usr/bin/env python3
import sys
import os
import argparse

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from app.storage import sqlite_engine

def main():
    parser = argparse.ArgumentParser(description="Retry federation for a specific subnode.")
    parser.add_argument('uri', help="The URI of the subnode to retry (e.g., 'garden/flancian/test.md')")
    args = parser.parse_args()

    app = create_app()
    with app.app_context():
        # 1. Remove from federated_subnodes
        db = sqlite_engine.get_db()
        cursor = db.cursor()
        cursor.execute("DELETE FROM federated_subnodes WHERE subnode_uri = ?", (args.uri,))
        if cursor.rowcount > 0:
            print(f"Successfully removed '{args.uri}' from federated_subnodes.")
            db.commit()
        else:
            print(f"URI '{args.uri}' was not found in federated_subnodes (maybe it wasn't federated yet?).")

        # 2. Clear query cache to force re-scan
        # We only clear 'latest_per_user_v1' to be safe.
        cursor.execute("DELETE FROM query_cache WHERE key = 'latest_per_user_v1'")
        print("Cleared 'latest_per_user_v1' cache to force git re-scan.")
        db.commit()
        
        print(f"Ready! The next federation pass will pick up '{args.uri}' if it is in the recent changes.")

if __name__ == "__main__":
    main()
