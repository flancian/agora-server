# worker.py
import time
import sqlite3
from contextlib import closing
import os
import sys

# Add the project root to the Python path.
# This allows us to import from 'app' as a package.
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_root)

from app.graph import Graph
from app.storage.sqlite_engine import create_tables
from app import create_app

def get_db_path_from_instance():
    """
    Calculates the DB path without relying on a Flask app context.
    Assumes the script is run from the repo root.
    """
    return os.path.join(os.getcwd(), 'instance', 'agora.db')

def build_cache(app):
    """
    Builds the graph cache from the filesystem and stores it in new SQLite tables.
    """
    print("Starting cache build...")
    start_time = time.time()

    db_path = get_db_path_from_instance()
    
    # Ensure the database and base tables are created if they don't exist.
    # We connect directly to the db; this worker is independent of the Flask app.
    with closing(sqlite3.connect(db_path)) as db:
        create_tables(db)

    # Build the graph from the filesystem, which requires an app context.
    with app.app_context():
        g = Graph()
        all_nodes = list(g.nodes().values())
    print(f"Graph built from filesystem in {time.time() - start_time:.2f} seconds.")
    print(f"Found {len(all_nodes)} nodes to cache.")

    # We will write to temporary tables first to avoid disrupting the live application.
    subnodes_table = "subnodes_new"
    links_table = "links_new"

    with closing(sqlite3.connect(db_path)) as db:
        with db:  # This ensures the whole block is a single transaction.
            print("Creating new temporary tables...")
            db.execute(f"DROP TABLE IF EXISTS {subnodes_table}")
            db.execute(f"DROP TABLE IF EXISTS {links_table}")
            
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

            print(f"Populating {subnodes_table}...")
            subnodes_to_insert = []
            for node in all_nodes:
                for subnode in node.subnodes:
                    subnodes_to_insert.append((
                        subnode.uri,
                        subnode.user,
                        node.uri,
                        subnode.mtime
                    ))
            db.executemany(
                f"INSERT INTO {subnodes_table} (path, user, node, mtime) VALUES (?, ?, ?, ?)",
                subnodes_to_insert
            )
            print(f"Inserted {len(subnodes_to_insert)} subnodes.")

            print(f"Populating {links_table}...")
            links_to_insert = []
            for node in all_nodes:
                # Using .forward_links() as it's the most direct representation of [[links]] in files.
                for link in node.forward_links():
                    # We need to add one entry for each subnode in the source node.
                    for subnode in node.subnodes:
                        links_to_insert.append((subnode.uri, node.uri, link, 'wikilink'))
            
            # Using REPLACE to handle any potential duplicates gracefully, though there shouldn't be.
            db.executemany(
                f"REPLACE INTO {links_table} (source_path, source_node, target_node, type) VALUES (?, ?, ?, ?)",
                links_to_insert
            )
            print(f"Inserted {len(links_to_insert)} links.")

    print(f"Cache build complete in {time.time() - start_time:.2f} seconds.")
    return True

def deploy_cache():
    """
    Atomically swaps the newly built cache tables into place.
    """
    print("Deploying cache...")
    db_path = get_db_path_from_instance()
    subnodes_table = "subnodes"
    links_table = "links"
    subnodes_new_table = "subnodes_new"
    links_new_table = "links_new"

    with closing(sqlite3.connect(db_path)) as db:
        with db: # Transaction
            print("Swapping tables...")
            db.execute(f"DROP TABLE IF EXISTS {subnodes_table}")
            db.execute(f"ALTER TABLE {subnodes_new_table} RENAME TO {subnodes_table}")
            db.execute(f"DROP TABLE IF EXISTS {links_table}")
            db.execute(f"ALTER TABLE {links_new_table} RENAME TO {links_table}")
    print("Cache deployed.")

if __name__ == "__main__":
    app = create_app()
    main_start_time = time.time()
    if build_cache(app):
        deploy_cache()
    print(f"Worker finished in {time.time() - main_start_time:.2f} seconds.")
