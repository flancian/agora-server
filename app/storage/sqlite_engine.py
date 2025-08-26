# Copyright 2025 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import os
import sqlite3
from flask import current_app, g

def get_db():
    """
    Returns a database connection for the current request context.
    If a connection is not yet established for this context, it is created.
    Handles read-only filesystems gracefully.
    """
    if 'sqlite_db' not in g:
        db_path = os.path.join(current_app.instance_path, 'agora.db')
        try:
            # Try to connect in read-write mode and create the database if it doesn't exist.
            # The `uri=True` flag is necessary to use the `mode` parameter.
            conn = sqlite3.connect(f"file:{db_path}?mode=rwc", uri=True)
            # WAL mode allows multiple readers to coexist with a single writer,
            # which is perfect for a web app.
            conn.execute("PRAGMA journal_mode=WAL;")
            create_tables(conn)
            g.sqlite_db = conn
        except sqlite3.OperationalError as e:
            if 'unable to open database file' in str(e) or 'read-only database' in str(e):
                current_app.logger.warning(
                    "Database is in a read-only location or read-only. "
                    "Falling back to read-only mode if DB exists."
                )
                if os.path.exists(db_path):
                    try:
                        g.sqlite_db = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
                    except sqlite3.OperationalError as ro_e:
                        current_app.logger.error(f"Could not open database in read-only mode: {ro_e}")
                        g.sqlite_db = None
                else:
                    current_app.logger.warning("Database file does not exist in read-only location. SQLite engine disabled.")
                    g.sqlite_db = None
            else:
                # For other operational errors, re-raise them.
                raise e
    return g.sqlite_db

def close_db(e=None):
    """Closes the database connection at the end of the request."""
    db = g.pop('sqlite_db', None)
    if db is not None:
        db.close()

def create_tables(db):
    """
    Creates the necessary tables if they don't already exist.
    """
    with db:
        db.execute("""
            CREATE TABLE IF NOT EXISTS subnodes (
                path TEXT PRIMARY KEY,
                user TEXT NOT NULL,
                node TEXT NOT NULL,
                mtime INTEGER NOT NULL
            );
        """)
        db.execute("""
            CREATE TABLE IF NOT EXISTS links (
                source_path TEXT NOT NULL,
                target_node TEXT NOT NULL,
                type TEXT NOT NULL,
                PRIMARY KEY (source_path, target_node, type)
            );
        """)

def get_subnode_mtime(path):
    """
    Retrieves the last known modification time for a given subnode path.
    Returns None if the subnode is not in the index.
    """
    db = get_db()
    if not db:
        return None
    
    cursor = db.cursor()
    cursor.execute("SELECT mtime FROM subnodes WHERE path = ?", (path,))
    result = cursor.fetchone()
    return result[0] if result else None

def update_subnode(path, user, node, mtime, links):
    """
    Updates or inserts a subnode and its associated links in the index.
    This is the "write-through" part of the cache.
    Fails silently if the database is read-only.
    """
    db = get_db()
    if not db:
        return

    try:
        with db:
            # Update subnode metadata using REPLACE, which is an INSERT or UPDATE.
            db.execute(
                "REPLACE INTO subnodes (path, user, node, mtime) VALUES (?, ?, ?, ?)",
                (path, user, node, mtime)
            )
            
            # Clear old links for this path and insert the new ones.
            db.execute("DELETE FROM links WHERE source_path = ?", (path,))
            if links:
                # A subnode can link to the same node multiple times, but we only
                # need to store the relationship once.
                unique_links = set(links)
                link_data = [(path, target, 'wikilink') for target in unique_links]
                db.executemany("INSERT INTO links (source_path, target_node, type) VALUES (?, ?, ?)", link_data)
    except sqlite3.OperationalError as e:
        if 'read-only database' in str(e):
            # This is an expected and safe condition if the filesystem is read-only.
            pass
        else:
            # For other errors, log them as they might indicate a problem.
            current_app.logger.error(f"Database write error: {e}")

def get_backlinks(node_uri):
    """
    Retrieves all subnode paths that link to a given node.
    This is where the performance gain from the index is most significant.
    """
    db = get_db()
    if not db:
        return []

    cursor = db.cursor()
    cursor.execute("SELECT source_path FROM links WHERE target_node = ?", (node_uri,))
    return [row[0] for row in cursor.fetchall()]