#!/usr/bin/env -S uv run
# scripts/reset_federation.py
import sqlite3
import sys
import os
from contextlib import closing

# Add project root
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, project_root)

from app import create_app

def reset_federation(app):
    with app.app_context():
        uri = app.config.get('SQLALCHEMY_DATABASE_URI')
        if not uri or not uri.startswith('sqlite:///'):
            print("Error: SQLite not configured.")
            return

        db_path = uri.split('?')[0][10:]
        
        print(f"Connecting to {db_path}...")
        with closing(sqlite3.connect(db_path)) as db:
            with db:
                print("Clearing federated_subnodes table...")
                try:
                    db.execute("DELETE FROM federated_subnodes")
                    print("Federated subnodes cleared.")
                except sqlite3.OperationalError as e:
                    print(f"Error clearing federated_subnodes (table might not exist): {e}")

                print("Clearing latest_per_user_v1 from query_cache...")
                try:
                    db.execute("DELETE FROM query_cache WHERE key = 'latest_per_user_v1'")
                    print("Cache cleared.")
                except sqlite3.OperationalError as e:
                    print(f"Error clearing cache: {e}")

if __name__ == "__main__":
    app = create_app()
    reset_federation(app)
