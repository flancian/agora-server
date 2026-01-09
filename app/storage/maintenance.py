import time
import sqlite3
from contextlib import closing
import os
from flask import current_app
from app.graph import Graph
from app.storage.sqlite_engine import create_tables, update_last_index_time

def get_db_path(app):
    """
    Extracts the SQLite database path from the Flask app's configuration.
    """
    with app.app_context():
        uri = app.config.get('SQLALCHEMY_DATABASE_URI')
        if not uri or not uri.startswith('sqlite:///'):
            raise ValueError("SQLALCHEMY_DATABASE_URI is not configured correctly for SQLite.")
        # Remove 'sqlite:///' prefix and any query parameters.
        db_path = uri.split('?')[0][10:]
        return db_path

def build_cache(app):
    """
    Builds the graph cache from the filesystem and stores it in new SQLite tables.
    """
    app.logger.info("Starting maintenance cache build...")
    start_time = time.time()

    db_path = get_db_path(app)
    
    # Ensure the database and base tables are created if they don't exist.
    with closing(sqlite3.connect(db_path)) as db:
        create_tables(db)

    # Build the graph from the filesystem.
    # We must use a fresh Graph object and force filesystem load.
    with app.app_context():
        # Store original state
        original_sqlite = app.config.get('ENABLE_SQLITE', False)
        
        # Force filesystem scan by temporarily disabling SQLite for graph loading.
        app.config['ENABLE_SQLITE'] = False
        try:
            g = Graph()
            # Force load
            _ = g.nodes() 
            all_nodes = list(g.nodes().values())
        finally:
            # Restore original config
            app.config['ENABLE_SQLITE'] = original_sqlite
            
    app.logger.info(f"Graph built from filesystem in {time.time() - start_time:.2f} seconds.")

    # We will write to temporary tables first to avoid disrupting the live application.
    subnodes_table = "subnodes_new"
    links_table = "links_new"
    subnodes_fts_table = "subnodes_fts_new"

    with closing(sqlite3.connect(db_path)) as db:
        with db:  # This ensures the whole block is a single transaction.
            app.logger.info("Creating new temporary tables...")
            db.execute(f"DROP TABLE IF EXISTS {subnodes_table}")
            db.execute(f"DROP TABLE IF EXISTS {links_table}")
            
            if app.config.get('ENABLE_FTS', False):
                db.execute(f"DROP TABLE IF EXISTS {subnodes_fts_table}")
                db.execute(f"CREATE VIRTUAL TABLE {subnodes_fts_table} USING fts5(path, content, tokenize='porter')")

            # Schema must match sqlite_engine.py
            db.execute(f"""
                CREATE TABLE {subnodes_table} (
                    path TEXT PRIMARY KEY,
                    user TEXT NOT NULL,
                    node TEXT NOT NULL,
                    mtime INTEGER NOT NULL
                )
            """)
            db.execute(f"""
                CREATE TABLE {links_table} (
                    source_path TEXT NOT NULL,
                    target_node TEXT NOT NULL,
                    type TEXT NOT NULL,
                    source_node TEXT,
                    PRIMARY KEY (source_path, target_node, type)
                )
            """)

            app.logger.info(f"Populating {subnodes_table}...")
            subnodes_to_insert = []
            fts_to_insert = []
            for node in all_nodes:
                for subnode in node.subnodes:
                    subnodes_to_insert.append((
                        subnode.uri,
                        subnode.user,
                        node.uri,
                        subnode.mtime
                    ))
                    if app.config.get('ENABLE_FTS', False):
                        content = subnode.content
                        if isinstance(content, bytes):
                            content = ""
                        fts_to_insert.append((subnode.uri, content))

            db.executemany(
                f"INSERT INTO {subnodes_table} (path, user, node, mtime) VALUES (?, ?, ?, ?)",
                subnodes_to_insert
            )
            app.logger.info(f"Inserted {len(subnodes_to_insert)} subnodes.")

            if app.config.get('ENABLE_FTS', False) and fts_to_insert:
                app.logger.info(f"Populating {subnodes_fts_table}...")
                db.executemany(
                    f"INSERT INTO {subnodes_fts_table} (path, content) VALUES (?, ?)",
                    fts_to_insert
                )
                app.logger.info(f"Inserted {len(fts_to_insert)} FTS entries.")

            app.logger.info(f"Populating {links_table}...")
            links_to_insert = []
            for node in all_nodes:
                for link in node.forward_links():
                    for subnode in node.subnodes:
                        links_to_insert.append((subnode.uri, node.uri, link, 'wikilink'))
            
            db.executemany(
                f"REPLACE INTO {links_table} (source_path, source_node, target_node, type) VALUES (?, ?, ?, ?)",
                links_to_insert
            )
            app.logger.info(f"Inserted {len(links_to_insert)} links.")

    app.logger.info(f"Cache build complete in {time.time() - start_time:.2f} seconds.")
    return True

def deploy_cache(app):
    """
    Atomically swaps the newly built cache tables into place.
    """
    app.logger.info("Deploying cache...")
    db_path = get_db_path(app)
    subnodes_table = "subnodes"
    links_table = "links"
    subnodes_fts_table = "subnodes_fts"
    
    subnodes_new_table = "subnodes_new"
    links_new_table = "links_new"
    subnodes_fts_new_table = "subnodes_fts_new"

    with closing(sqlite3.connect(db_path)) as db:
        with db: # Transaction
            app.logger.info("Swapping tables...")
            db.execute(f"DROP TABLE IF EXISTS {subnodes_table}")
            db.execute(f"ALTER TABLE {subnodes_new_table} RENAME TO {subnodes_table}")
            db.execute(f"DROP TABLE IF EXISTS {links_table}")
            db.execute(f"ALTER TABLE {links_new_table} RENAME TO {links_table}")
            
            if app.config.get('ENABLE_FTS', False):
                db.execute(f"DROP TABLE IF EXISTS {subnodes_fts_table}")
                db.execute(f"ALTER TABLE {subnodes_fts_new_table} RENAME TO {subnodes_fts_table}")

    app.logger.info("Cache deployed.")

def run_full_reindex(app=None):
    """
    Main entry point for running a full re-index.
    """
    if app is None:
        app = current_app._get_current_object()
        
    start_time = time.time()
    if build_cache(app):
        deploy_cache(app)
        # Update timestamp inside an app context (which deploy_cache might not be, but here we passed app object)
        # But update_last_index_time uses 'get_db()' which relies on 'g' and 'current_app'.
        # So we need an app context.
        with app.app_context():
            update_last_index_time()
        
    duration = time.time() - start_time
    app.logger.info(f"Full maintenance re-index finished in {duration:.2f} seconds.")
