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
import re
from flask import current_app, g

def regexp(expr, item):
    """
    Custom SQLite REGEXP function using Python's re module.
    """
    try:
        reg = re.compile(expr, re.IGNORECASE)
        return reg.search(item) is not None
    except Exception as e:
        # Log invalid regex errors but don't crash the query
        return False

def get_db():
    """
    Returns a database connection for the current request context.
    If a connection is not yet established for this context, it is created.
    Handles read-only filesystems gracefully.
    """
    if 'sqlite_db' not in g:
        # The URI is in the format 'sqlite:///path/to/database.db?query_params'
        # We need to extract the path part.
        uri = current_app.config.get('SQLALCHEMY_DATABASE_URI')
        if not uri or not uri.startswith('sqlite:///'):
            current_app.logger.error("SQLALCHEMY_DATABASE_URI is not configured correctly for SQLite.")
            g.sqlite_db = None
            return None

        # Extract path: remove 'sqlite:///' prefix and any query parameters.
        db_path = uri.split('?')[0][10:]
        
        # Ensure the directory for the database exists.
        db_dir = os.path.dirname(db_path)
        if not os.path.exists(db_dir):
            try:
                os.makedirs(db_dir)
            except OSError as e:
                current_app.logger.error(f"Could not create database directory at {db_dir}: {e}")
                g.sqlite_db = None
                return None

        try:
            conn = sqlite3.connect(f"file:{db_path}?mode=rwc", uri=True)
            conn.execute("PRAGMA journal_mode=WAL;")
            # Register the REGEXP function
            conn.create_function("REGEXP", 2, regexp)
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
                        g.sqlite_db.create_function("REGEXP", 2, regexp)
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
        SCHEMA = {
            'subnodes': """
                CREATE TABLE IF NOT EXISTS subnodes (
                    path TEXT PRIMARY KEY,
                    user TEXT NOT NULL,
                    node TEXT NOT NULL,
                    mtime INTEGER NOT NULL
                );
            """,
            'links': """
                CREATE TABLE IF NOT EXISTS links (
                    source_path TEXT NOT NULL,
                    target_node TEXT NOT NULL,
                    type TEXT NOT NULL,
                    PRIMARY KEY (source_path, target_node, type)
                );
            """,
            'ai_generations': """
                CREATE TABLE IF NOT EXISTS ai_generations (
                    prompt TEXT NOT NULL,
                    provider TEXT NOT NULL,
                    content TEXT NOT NULL,
                    timestamp INTEGER NOT NULL,
                    PRIMARY KEY (prompt, provider)
                );
            """,
            'query_cache': """
                CREATE TABLE IF NOT EXISTS query_cache (
                    key TEXT PRIMARY KEY,
                    value TEXT,
                    timestamp INTEGER
                );
            """,
            'starred_subnodes': """
                CREATE TABLE IF NOT EXISTS starred_subnodes (
                    subnode_uri TEXT PRIMARY KEY
                );
            """,
            'starred_nodes': """
                CREATE TABLE IF NOT EXISTS starred_nodes (
                    node_uri TEXT PRIMARY KEY
                );
            """,
            'graph_cache': """
                CREATE TABLE IF NOT EXISTS graph_cache (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL,
                    timestamp INTEGER NOT NULL
                );
            """,
            'git_repo_state': """
                CREATE TABLE IF NOT EXISTS git_repo_state (
                    repo_path TEXT PRIMARY KEY,
                    last_commit_hash TEXT NOT NULL
                );
            """,
            'followers': """
                CREATE TABLE IF NOT EXISTS followers (
                    user_uri TEXT NOT NULL,
                    follower_uri TEXT NOT NULL,
                    PRIMARY KEY (user_uri, follower_uri)
                );
            """,
            'starred_external': """
                CREATE TABLE IF NOT EXISTS starred_external (
                    url TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    source TEXT NOT NULL,
                    node TEXT,
                    timestamp INTEGER
                );
            """,
            'maintenance_lock': """
                CREATE TABLE IF NOT EXISTS maintenance_lock (
                    id INTEGER PRIMARY KEY CHECK (id = 1),
                    worker_id TEXT,
                    timestamp INTEGER
                );
            """,
            'reactions': """
                CREATE TABLE IF NOT EXISTS reactions (
                    id TEXT PRIMARY KEY,
                    type TEXT NOT NULL,
                    actor TEXT NOT NULL,
                    object TEXT NOT NULL,
                    content TEXT,
                    timestamp INTEGER NOT NULL
                );
            """,
            'federated_subnodes': """
                CREATE TABLE IF NOT EXISTS federated_subnodes (
                    subnode_uri TEXT PRIMARY KEY
                );
            """
        }

        # Add FTS5 table if enabled
        if current_app.config.get('ENABLE_FTS', False):
            SCHEMA['subnodes_fts'] = """
                CREATE VIRTUAL TABLE IF NOT EXISTS subnodes_fts USING fts5(
                    path, 
                    content, 
                    tokenize='porter'
                );
            """

        # Check all tables in the schema.
        for table, query in SCHEMA.items():
            db.execute(query)

        # Migration: Add the source_node column to the links table if it doesn't exist.
        try:
            db.execute("ALTER TABLE links ADD COLUMN source_node TEXT;")
        except sqlite3.OperationalError:
            # This will fail if the column already exists, which is fine.
            pass

        # Migration: Add the full_prompt column to the ai_generations table if it doesn't exist.
        try:
            db.execute("ALTER TABLE ai_generations ADD COLUMN full_prompt TEXT;")
        except sqlite3.OperationalError:
            # This will fail if the column already exists, which is fine.
            pass

        # Migration: Add the git_mtime column to the subnodes table if it doesn't exist.
        try:
            db.execute("ALTER TABLE subnodes ADD COLUMN git_mtime INTEGER;")
        except sqlite3.OperationalError:
            # This will fail if the column already exists, which is fine.
            pass

def get_subnode_count():
    """
    Returns the number of rows in the subnodes table.
    Returns 0 if table doesn't exist or error.
    """
    db = get_db()
    if not db:
        return 0
    try:
        cursor = db.execute("SELECT COUNT(*) FROM subnodes")
        return cursor.fetchone()[0]
    except sqlite3.OperationalError:
        return 0

def get_active_users(days=30):
    """
    Returns the number of unique users who have modified subnodes in the last X days.
    """
    db = get_db()
    if not db:
        return 0
    try:
        import time
        cutoff = int(time.time()) - (days * 86400)
        cursor = db.execute("SELECT COUNT(DISTINCT user) FROM subnodes WHERE mtime > ?", (cutoff,))
        return cursor.fetchone()[0]
    except sqlite3.OperationalError:
        return 0

def get_node_count():
    """
    Returns the number of unique nodes in the subnodes table.
    """
    db = get_db()
    if not db:
        return 0
    try:
        cursor = db.execute("SELECT COUNT(DISTINCT node) FROM subnodes")
        return cursor.fetchone()[0]
    except sqlite3.OperationalError:
        return 0

def get_link_count():
    """
    Returns the total number of links.
    """
    db = get_db()
    if not db:
        return 0
    try:
        cursor = db.execute("SELECT COUNT(*) FROM links")
        return cursor.fetchone()[0]
    except sqlite3.OperationalError:
        return 0

#
# Reactions (Fediverse)
#
def add_reaction(id, type, actor, object, content, timestamp):
    """
    Adds a reaction (Like, Reply/Note) from the Fediverse.
    """
    db = get_db()
    if not db:
        return

    try:
        with db:
            db.execute(
                "INSERT OR REPLACE INTO reactions (id, type, actor, object, content, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
                (id, type, actor, object, content, timestamp)
            )
    except sqlite3.OperationalError as e:
        if 'read-only database' in str(e):
            pass
        else:
            current_app.logger.error(f"Database write error while adding reaction: {e}")

def get_reactions(object_uri):
    """
    Retrieves all reactions for a given object URI.
    Returns a list of dicts.
    """
    db = get_db()
    if not db:
        return []
    
    cursor = db.cursor()
    cursor.execute("SELECT id, type, actor, content, timestamp FROM reactions WHERE object = ? ORDER BY timestamp DESC", (object_uri,))
    return [
        {'id': row[0], 'type': row[1], 'actor': row[2], 'content': row[3], 'timestamp': row[4]}
        for row in cursor.fetchall()
    ]

def get_recent_reactions(limit=20):
    """
    Retrieves the most recent reactions globally.
    Returns a list of dicts including the object URI.
    """
    db = get_db()
    if not db:
        return []
    
    cursor = db.cursor()
    cursor.execute("SELECT id, type, actor, object, content, timestamp FROM reactions ORDER BY timestamp DESC LIMIT ?", (limit,))
    return [
        {'id': row[0], 'type': row[1], 'actor': row[2], 'object': row[3], 'content': row[4], 'timestamp': row[5]}
        for row in cursor.fetchall()
    ]

import time

def try_acquire_lock(worker_id, ttl_seconds=60):
    """
    Attempts to acquire the maintenance lock.
    Returns True if acquired, False otherwise.
    Auto-expires lock if older than ttl_seconds.
    """
    db = get_db()
    if not db:
        return False
    
    now = int(time.time())
    
    try:
        with db:
            # Check existing lock
            cursor = db.execute("SELECT worker_id, timestamp FROM maintenance_lock WHERE id = 1")
            row = cursor.fetchone()
            
            if row:
                existing_worker, timestamp = row
                if now - timestamp < ttl_seconds:
                    # Lock is held and valid
                    if existing_worker == worker_id:
                        # We already hold it, refresh timestamp
                        db.execute("UPDATE maintenance_lock SET timestamp = ? WHERE id = 1", (now,))
                        return True
                    return False
                else:
                    # Lock expired, steal it
                    current_app.logger.warning(f"Stealing expired lock from {existing_worker}")
            
            # Acquire lock (Insert or Replace)
            db.execute("REPLACE INTO maintenance_lock (id, worker_id, timestamp) VALUES (1, ?, ?)", (worker_id, now))
            return True
            
    except sqlite3.OperationalError as e:
        current_app.logger.error(f"Lock error: {e}")
        return False

def release_lock(worker_id):
    """
    Releases the lock if held by this worker.
    """
    db = get_db()
    if not db:
        return

    try:
        with db:
            db.execute("DELETE FROM maintenance_lock WHERE id = 1 AND worker_id = ?", (worker_id,))
    except sqlite3.OperationalError:
        pass

def is_locked():
    """
    Returns True if the lock is currently held and valid.
    """
    db = get_db()
    if not db:
        return False
    
    try:
        cursor = db.execute("SELECT timestamp FROM maintenance_lock WHERE id = 1")
        row = cursor.fetchone()
        if row:
            # We could check TTL here too, but simple existence is a good enough check for waiters
            return True
        return False
    except sqlite3.OperationalError:
        return False


def get_all_git_mtimes():
    """
    Retrieves all git_mtime values from the database.
    Returns a dictionary of {path: git_mtime}.
    """
    db = get_db()
    if not db:
        return {}
    
    cursor = db.cursor()
    cursor.execute("SELECT path, git_mtime FROM subnodes WHERE git_mtime IS NOT NULL")
    return dict(cursor.fetchall())

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

def update_subnodes_bulk(subnodes_to_update):
    """
    Updates or inserts a batch of subnodes and their associated links in the index.
    """
    db = get_db()
    if not db:
        current_app.logger.error("SQLite: Failed to get database connection in update_subnodes_bulk.")
        return
        
    if not subnodes_to_update:
        current_app.logger.debug("SQLite: No subnodes to update in bulk.")
        return

    # Deduplicate by path, keeping the last entry (most recent state)
    unique_updates = {s['path']: s for s in subnodes_to_update}
    subnodes_to_update = list(unique_updates.values())

    current_app.logger.info(f"SQLite: Bulk writing data for {len(subnodes_to_update)} subnodes.")
    
    subnode_data = []
    link_data = []
    fts_data = []
    paths_to_update = []

    for subnode in subnodes_to_update:
        paths_to_update.append(subnode['path'])
        subnode_data.append((subnode['path'], subnode['user'], subnode['node'], subnode['mtime']))
        if subnode['links']:
            unique_links = set(subnode['links'])
            for target in unique_links:
                link_data.append((subnode['path'], subnode['node'], target, 'wikilink'))
        
        # Handle FTS data if present
        if 'content' in subnode and subnode['content'] is not None:
            fts_data.append((subnode['path'], subnode['content']))

    try:
        with db:
            current_app.logger.debug(f"SQLite: Starting transaction for bulk update of {len(subnode_data)} subnodes.")
            
            # Update subnodes table
            db.executemany(
                "REPLACE INTO subnodes (path, user, node, mtime) VALUES (?, ?, ?, ?)",
                subnode_data
            )
            current_app.logger.debug("SQLite: Executed REPLACE INTO subnodes.")
            
            # Update FTS table if needed
            if fts_data and current_app.config.get('ENABLE_FTS', False):
                # We use REPLACE INTO for FTS as well? Or INSERT OR REPLACE?
                # FTS5 supports REPLACE (which does DELETE + INSERT).
                db.executemany(
                    "INSERT OR REPLACE INTO subnodes_fts (path, content) VALUES (?, ?)",
                    fts_data
                )
                current_app.logger.debug(f"SQLite: Updated {len(fts_data)} FTS entries.")

            # Update links table
            # Delete old links for all subnodes in the batch
            # Using a temporary table to pass the list of paths is safer and can be faster
            db.execute("CREATE TEMP TABLE paths_to_delete (path TEXT PRIMARY KEY)")
            db.executemany("INSERT INTO paths_to_delete (path) VALUES (?)", [(p,) for p in paths_to_update])
            db.execute("DELETE FROM links WHERE source_path IN (SELECT path FROM paths_to_delete)")
            db.execute("DROP TABLE paths_to_delete")
            current_app.logger.debug("SQLite: Deleted old links for updated subnodes.")

            # Insert new links
            if link_data:
                db.executemany("INSERT INTO links (source_path, source_node, target_node, type) VALUES (?, ?, ?, ?)", link_data)
                current_app.logger.debug(f"SQLite: Inserted {len(link_data)} new links.")
                
            current_app.logger.info("SQLite: Bulk update transaction committed successfully.")

    except sqlite3.OperationalError as e:
        if 'read-only database' in str(e):
            current_app.logger.warning(f"SQLite: Read-only database error during bulk update: {e}")
            pass
        else:
            current_app.logger.error(f"Database write error during bulk update: {e}")
    except Exception as e:
        current_app.logger.error(f"Unexpected error during bulk update: {e}")

def flush_index_queue(e=None):
    """
    Flushes any pending subnode updates to the database.
    Also closes the connection.
    To be registered as a teardown_appcontext handler.
    """
    try:
        if 'subnodes_to_index' in g and g.subnodes_to_index:
            # current_app.logger.debug(f"Flushing {len(g.subnodes_to_index)} subnodes to index.")
            update_subnodes_bulk(g.subnodes_to_index)
            g.subnodes_to_index = []
    except Exception as ex:
        # Logging here might be risky if logger is also tearing down, but typically ok in Flask.
        # Use print as fallback if needed, but app.logger is standard.
        current_app.logger.error(f"Error flushing index queue: {ex}")
    finally:
        close_db(e)


def search_subnodes_fts(query):
    """
    Searches for subnodes containing the given query using FTS5.
    Returns a list of paths.
    """
    db = get_db()
    if not db:
        return []

    if not current_app.config.get('ENABLE_FTS', False):
        return []

    cursor = db.cursor()
    try:
        # We use the FTS MATCH operator.
        # We also need to sanitize the query to prevent syntax errors in FTS5 match expression.
        # Simple sanitization: remove non-alphanumeric chars except spaces, or just quote it.
        # FTS5 standard query syntax allows phrases in quotes.
        # Let's try passing it as a phrase parameter.
        # SEARCH ALL COLUMNS (path + content) by targeting the table name.
        cursor.execute("SELECT path FROM subnodes_fts WHERE subnodes_fts MATCH ? ORDER BY rank", (query,))
        return [row[0] for row in cursor.fetchall()]
    except sqlite3.OperationalError as e:
        current_app.logger.error(f"SQLite FTS search error: {e}")
        return []


def search_nodes_by_regex(regex):
    """
    Searches for nodes whose wikilink matches the given regex.
    Returns a list of unique node wikilinks.
    """
    db = get_db()
    if not db:
        return []

    cursor = db.cursor()
    # We select DISTINCT node to avoid duplicates if multiple subnodes belong to the same node.
    # The REGEXP operator works because we registered the python function in get_db.
    try:
        cursor.execute("SELECT DISTINCT node FROM subnodes WHERE node REGEXP ?", (regex,))
        return [row[0] for row in cursor.fetchall()]
    except sqlite3.OperationalError as e:
        current_app.logger.error(f"SQLite regex search error: {e}")
        return []

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

def get_random_node():
    """
    Retrieves a single random node wikilink from the index.
    Returns a string (wikilink) or None.
    """
    db = get_db()
    if not db:
        return None
    
    cursor = db.cursor()
    cursor.execute("SELECT node FROM subnodes ORDER BY RANDOM() LIMIT 1")
    result = cursor.fetchone()
    return result[0] if result else None

def get_subnodes_by_node(node_uri):
    """
    Retrieves all subnodes associated with a specific node.
    Returns a list of dicts: {'path': ..., 'user': ..., 'mtime': ...}
    """
    db = get_db()
    if not db:
        return []
    
    cursor = db.cursor()
    cursor.execute("SELECT path, user, mtime FROM subnodes WHERE node = ?", (node_uri,))
    results = []
    for row in cursor.fetchall():
        results.append({
            'path': row[0],
            'user': row[1],
            'mtime': row[2]
        })
    return results

def get_ai_generation(prompt, provider):
    """
    Retrieves a cached AI generation for a given prompt and provider.
    Returns a tuple of (full_prompt, content, timestamp) or (None, None, None) if not found.
    For backward compatibility, returns (None, content, timestamp) if full_prompt is not in the DB.
    """
    db = get_db()
    if not db:
        return None, None, None
    
    cursor = db.cursor()
    try:
        cursor.execute(
            "SELECT full_prompt, content, timestamp FROM ai_generations WHERE prompt = ? AND provider = ?",
            (prompt, provider)
        )
        result = cursor.fetchone()
        return (result[0], result[1], result[2]) if result else (None, None, None)
    except sqlite3.OperationalError:
        # Fallback for old schema without full_prompt
        cursor.execute(
            "SELECT content, timestamp FROM ai_generations WHERE prompt = ? AND provider = ?",
            (prompt, provider)
        )
        result = cursor.fetchone()
        return (None, result[0], result[1]) if result else (None, None, None)

def save_ai_generation(prompt, provider, full_prompt, content, timestamp):
    """
    Saves or updates a cached AI generation.
    """
    db = get_db()
    if not db:
        return

    try:
        with db:
            db.execute(
                "REPLACE INTO ai_generations (prompt, provider, full_prompt, content, timestamp) VALUES (?, ?, ?, ?, ?)",
                (prompt, provider, full_prompt, content, timestamp)
            )
    except sqlite3.OperationalError as e:
        if 'read-only database' in str(e):
            pass
        else:
            current_app.logger.error(f"Database write error: {e}")

def get_cached_query(key):
    """
    Retrieves a cached query result.
    Returns a tuple of (value, timestamp) or (None, None) if not found.
    """
    db = get_db()
    if not db:
        return None, None
    
    cursor = db.cursor()
    cursor.execute(
        "SELECT value, timestamp FROM query_cache WHERE key = ?", (key,)
    )
    result = cursor.fetchone()
    return (result[0], result[1]) if result else (None, None)

def save_cached_query(key, value, timestamp):
    """
    Saves or updates a cached query result.
    """
    db = get_db()
    if not db:
        return

    try:
        with db:
            db.execute(
                "REPLACE INTO query_cache (key, value, timestamp) VALUES (?, ?, ?)",
                (key, value, timestamp)
            )
    except sqlite3.OperationalError as e:
        if 'read-only database' in str(e):
            pass
        else:
            current_app.logger.error(f"Database write error: {e}")

def get_random_ai_generation():
    """
    Retrieves a single random AI generation from the cache.
    Returns a tuple of (prompt, content) or (None, None) if the table is empty.
    """
    db = get_db()
    if not db:
        return None, None
    
    cursor = db.cursor()
    cursor.execute(
        "SELECT prompt, content FROM ai_generations ORDER BY RANDOM() LIMIT 1"
    )
    result = cursor.fetchone()
    return (result[0], result[1]) if result else (None, None)

#
# Starred Subnodes
#
def star_subnode(subnode_uri):
    db = get_db()
    if db:
        db.execute("INSERT INTO starred_subnodes (subnode_uri) VALUES (?)", (subnode_uri,))
        db.commit()

def unstar_subnode(subnode_uri):
    db = get_db()
    if db:
        db.execute("DELETE FROM starred_subnodes WHERE subnode_uri = ?", (subnode_uri,))
        db.commit()

def get_all_starred_subnodes():
    db = get_db()
    if db is None:
        return set()
    try:
        cursor = db.execute("SELECT subnode_uri FROM starred_subnodes")
        return {row[0] for row in cursor.fetchall()}
    except sqlite3.OperationalError as e:
        # This can happen if the table doesn't exist yet.
        current_app.logger.warning(f"Could not fetch starred subnodes, table might not exist yet: {e}")
        return set()

#
# Starred Nodes
#
def star_node(node_uri):
    db = get_db()
    if db:
        db.execute("INSERT INTO starred_nodes (node_uri) VALUES (?)", (node_uri,))
        db.commit()

def unstar_node(node_uri):
    db = get_db()
    if db:
        db.execute("DELETE FROM starred_nodes WHERE node_uri = ?", (node_uri,))
        db.commit()

def get_all_starred_nodes():
    db = get_db()
    if db is None:
        return set()
    try:
        cursor = db.execute("SELECT node_uri FROM starred_nodes")
        return {row[0] for row in cursor.fetchall()}
    except sqlite3.OperationalError as e:
        current_app.logger.warning(f"Could not fetch starred nodes, table might not exist yet: {e}")
        return set()

def get_cached_graph(key):
    """
    Retrieves a cached graph object (e.g., subnodes, nodes).
    Returns a tuple of (value, timestamp) or (None, None) if not found.
    """
    db = get_db()
    if not db:
        return None, None
    
    cursor = db.cursor()
    cursor.execute(
        "SELECT value, timestamp FROM graph_cache WHERE key = ?", (key,)
    )
    result = cursor.fetchone()
    return (result[0], result[1]) if result else (None, None)

def save_cached_graph(key, value, timestamp):
    """
    Saves or updates a cached graph object.
    """
    db = get_db()
    if not db:
        return

    try:
        with db:
            db.execute(
                "REPLACE INTO graph_cache (key, value, timestamp) VALUES (?, ?, ?)",
                (key, value, timestamp)
            )
    except sqlite3.OperationalError as e:
        if 'read-only database' in str(e):
            pass
        else:
            current_app.logger.error(f"Database write error: {e}")

def add_follower(user_uri, follower_uri):
    """
    Adds a follower to a user's list of followers.
    """
    db = get_db()
    if not db:
        return

    try:
        with db:
            db.execute(
                "INSERT OR IGNORE INTO followers (user_uri, follower_uri) VALUES (?, ?)",
                (user_uri, follower_uri)
            )
    except sqlite3.OperationalError as e:
        if 'read-only database' in str(e):
            pass
        else:
            current_app.logger.error(f"Database write error while adding follower: {e}")

def get_followers(user_uri):
    """
    Retrieves all followers for a given user.
    """
    db = get_db()
    if not db:
        return []
    
    current_app.logger.info(f"SQLite: Querying followers for {user_uri}")
    cursor = db.cursor()
    cursor.execute("SELECT follower_uri FROM followers WHERE user_uri = ?", (user_uri,))
    results = [row[0] for row in cursor.fetchall()]
    current_app.logger.info(f"SQLite: Found {len(results)} followers for {user_uri}")
    return results

def get_all_followers():
    """
    Retrieves ALL followers (user_uri, follower_uri) tuples.
    For debugging purposes.
    """
    db = get_db()
    if not db:
        return []
    
    cursor = db.cursor()
    cursor.execute("SELECT user_uri, follower_uri FROM followers")
    return cursor.fetchall()

def get_all_starred_nodes():
    db = get_db()
    if db is None:
        return set()
    try:
        cursor = db.execute("SELECT node_uri FROM starred_nodes")
        return {row[0] for row in cursor.fetchall()}
    except sqlite3.OperationalError as e:
        current_app.logger.warning(f"Could not fetch starred nodes, table might not exist yet: {e}")
        return set()

#
# Federated Subnodes
#
def add_federated_subnode(subnode_uri):
    """
    Adds a subnode URI to the set of subnodes that have been federated.
    """
    db = get_db()
    if not db:
        return

    try:
        with db:
            db.execute(
                "INSERT OR IGNORE INTO federated_subnodes (subnode_uri) VALUES (?)",
                (subnode_uri,)
            )
    except sqlite3.OperationalError as e:
        if 'read-only database' in str(e):
            pass
        else:
            current_app.logger.error(f"Database write error while adding federated subnode: {e}")

def is_subnode_federated(subnode_uri):
    """
    Checks if a subnode has already been federated.
    """
    db = get_db()
    if not db:
        return False
    
    cursor = db.cursor()
    cursor.execute("SELECT 1 FROM federated_subnodes WHERE subnode_uri = ?", (subnode_uri,))
    return cursor.fetchone() is not None

#
# Starred External
#
def star_external(url, title, source):
    db = get_db()
    if db:
        import time
        timestamp = int(time.time())
        db.execute(
            "REPLACE INTO starred_external (url, title, source, timestamp) VALUES (?, ?, ?, ?)",
            (url, title, source, timestamp)
        )
        db.commit()

def unstar_external(url):
    db = get_db()
    if db:
        db.execute("DELETE FROM starred_external WHERE url = ?", (url,))
        db.commit()

def get_all_starred_external():
    """
    Returns a list of dicts: {'url': ..., 'title': ..., 'source': ..., 'timestamp': ...}
    """
    db = get_db()
    if db is None:
        return []
    try:
        cursor = db.execute("SELECT url, title, source, timestamp FROM starred_external ORDER BY timestamp DESC")
        return [
            {'url': row[0], 'title': row[1], 'source': row[2], 'timestamp': row[3]}
            for row in cursor.fetchall()
        ]
    except sqlite3.OperationalError as e:
        current_app.logger.warning(f"Could not fetch starred external, table might not exist yet: {e}")
        return []

def get_all_starred_external_urls():
    """
    Returns a set of all starred external URLs for quick lookup.
    """
    db = get_db()
    if db is None:
        return set()
    try:
        cursor = db.execute("SELECT url FROM starred_external")
        return {row[0] for row in cursor.fetchall()}
    except sqlite3.OperationalError as e:
        return set()
