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
            conn = sqlite3.connect(f"file:{db_path}?mode=rwc", uri=True)
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
    Also handles simple schema migrations like adding a column.
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
        # Migration: Add the source_node column to the links table if it doesn't exist.
        try:
            db.execute("ALTER TABLE links ADD COLUMN source_node TEXT;")
        except sqlite3.OperationalError:
            # This will fail if the column already exists, which is fine.
            pass

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
    The 'node' parameter is the source_node for the links.
    """
    db = get_db()
    if not db:
        return

    current_app.logger.debug(f"SQLite: Writing data for subnode [[{path}]]")
    try:
        with db:
            db.execute(
                "REPLACE INTO subnodes (path, user, node, mtime) VALUES (?, ?, ?, ?)",
                (path, user, node, mtime)
            )
            
            db.execute("DELETE FROM links WHERE source_path = ?", (path,))
            if links:
                unique_links = set(links)
                # Note the new 'node' field being inserted as source_node.
                link_data = [(path, node, target, 'wikilink') for target in unique_links]
                db.executemany("INSERT INTO links (source_path, source_node, target_node, type) VALUES (?, ?, ?, ?)", link_data)
    except sqlite3.OperationalError as e:
        if 'read-only database' in str(e):
            pass
        else:
            current_app.logger.error(f"Database write error: {e}")

def get_backlinking_nodes(node_uri):
    """
    Retrieves all unique source_node URIs that link to a given node.
    This is the optimized query that avoids file I/O.
    """
    db = get_db()
    if not db:
        return []

    # current_app.logger.debug(f"SQLite: Reading backlinks for node [[{node_uri}]] from index.")
    cursor = db.cursor()
    # We select the source_node directly and use DISTINCT to avoid duplicates.
    cursor.execute("SELECT DISTINCT source_node FROM links WHERE target_node = ?", (node_uri,))
    return [row[0] for row in cursor.fetchall()]
