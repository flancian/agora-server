#!/usr/bin/env python3
import sys
import os

# Add the project root to the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from app.storage import sqlite_engine

def main():
    app = create_app()
    with app.app_context():
        db_path = app.config.get('SQLALCHEMY_DATABASE_URI', 'unknown')
        print(f"Checking followers in database: {db_path}")
        
        followers = sqlite_engine.get_all_followers()
        if not followers:
            print("No followers found.")
        else:
            print(f"Found {len(followers)} followers:")
            for user, follower in followers:
                print(f"  User: {user} <- Follower: {follower}")

if __name__ == "__main__":
    main()
