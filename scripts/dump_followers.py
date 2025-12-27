#!/usr/bin/env -S uv run
# scripts/dump_followers.py
import sqlite3
import sys
import os
from contextlib import closing

# Add project root
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, project_root)

from app import create_app

def dump_followers(app):
    with app.app_context():
        uri = app.config.get('SQLALCHEMY_DATABASE_URI')
        if not uri or not uri.startswith('sqlite:///'):
            print("Error: SQLite not configured.")
            return

        db_path = uri.split('?')[0][10:]
        
        with closing(sqlite3.connect(db_path)) as db:
            cursor = db.execute("SELECT user_uri, follower_uri FROM followers")
            rows = cursor.fetchall()
            if not rows:
                print("No followers found in database.")
            else:
                print(f"Found {len(rows)} followers:")
                for user, follower in rows:
                    print(f"  User: {user} <- Follower: {follower}")

if __name__ == "__main__":
    app = create_app()
    dump_followers(app)
