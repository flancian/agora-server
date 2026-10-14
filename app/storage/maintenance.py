import time
import sqlite3
import json
from contextlib import closing
import os
from flask import current_app
from app.graph import Graph
from app.storage.sqlite_engine import create_tables, update_last_index_time, get_db, save_cached_query, SCHEMA_TEMPLATES
import app.storage.api as api
from app import git_utils

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
    subnodes_trigram_table = "subnodes_trigram_new"

    with closing(sqlite3.connect(db_path)) as db:
        with db:  # This ensures the whole block is a single transaction.
            app.logger.info("Creating new temporary tables...")
            db.execute(f"DROP TABLE IF EXISTS {subnodes_table}")
            db.execute(f"DROP TABLE IF EXISTS {links_table}")
            
            if app.config.get('ENABLE_FTS', False):
                db.execute(f"DROP TABLE IF EXISTS {subnodes_fts_table}")
                db.execute(SCHEMA_TEMPLATES['subnodes_fts'].format(table_name=subnodes_fts_table))
                db.execute(f"DROP TABLE IF EXISTS {subnodes_trigram_table}")
                db.execute(SCHEMA_TEMPLATES['subnodes_trigram'].format(table_name=subnodes_trigram_table))

            # Schema must match sqlite_engine.py
            db.execute(SCHEMA_TEMPLATES['subnodes'].format(table_name=subnodes_table))
            db.execute(SCHEMA_TEMPLATES['links'].format(table_name=links_table))

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
            try:
                db.execute(f"CREATE INDEX IF NOT EXISTS idx_{subnodes_table}_node ON {subnodes_table}(node);")
            except sqlite3.OperationalError as e:
                app.logger.warning(f"Could not create index on {subnodes_table}: {e}")

            if app.config.get('ENABLE_FTS', False) and fts_to_insert:
                app.logger.info(f"Populating {subnodes_fts_table} & {subnodes_trigram_table}...")
                db.executemany(
                    f"INSERT INTO {subnodes_fts_table} (path, content) VALUES (?, ?)",
                    fts_to_insert
                )
                db.executemany(
                    f"INSERT INTO {subnodes_trigram_table} (path, content) VALUES (?, ?)",
                    fts_to_insert
                )
                app.logger.info(f"Inserted {len(fts_to_insert)} FTS & Trigram entries.")

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
    Uses an exclusive transaction and 30s busy timeout so web readers never see missing tables.
    """
    app.logger.info("Deploying cache...")
    db_path = get_db_path(app)
    
    max_retries = 10
    for attempt in range(max_retries):
        try:
            with closing(sqlite3.connect(db_path)) as db:
                db.execute("PRAGMA busy_timeout = 30000;")
                db.execute("BEGIN EXCLUSIVE TRANSACTION;")
                app.logger.info(f"Swapping tables (attempt {attempt+1})...")
                
                # Verify that temporary tables exist before touching live tables
                cursor = db.cursor()
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='subnodes_new'")
                if not cursor.fetchone():
                    raise RuntimeError("subnodes_new temporary table missing. Aborting swap.")

                # Atomic swap sequence inside single exclusive transaction
                db.execute("DROP TABLE IF EXISTS subnodes;")
                db.execute("ALTER TABLE subnodes_new RENAME TO subnodes;")
                try:
                    db.execute("CREATE INDEX IF NOT EXISTS idx_subnodes_node ON subnodes(node);")
                except sqlite3.OperationalError as e:
                    app.logger.warning(f"Could not recreate index on subnodes: {e}")
                
                db.execute("DROP TABLE IF EXISTS links;")
                db.execute("ALTER TABLE links_new RENAME TO links;")
                
                if app.config.get('ENABLE_FTS', False):
                    db.execute("DROP TABLE IF EXISTS subnodes_fts;")
                    db.execute("ALTER TABLE subnodes_fts_new RENAME TO subnodes_fts;")
                    db.execute("DROP TABLE IF EXISTS subnodes_trigram;")
                    db.execute("ALTER TABLE subnodes_trigram_new RENAME TO subnodes_trigram;")

                db.commit()
                app.logger.info("Cache tables swapped successfully.")
                return True
            
        except (RuntimeError, sqlite3.OperationalError) as e:
            if attempt < max_retries - 1:
                app.logger.warning(f"Swap failed due to lock/error ({e}). Retrying in 2s...")
                time.sleep(2)
            else:
                app.logger.error(f"Swap failed after {max_retries} attempts: {e}")
                return False

    app.logger.info("Cache deployed.")

def regenerate_expensive_cache(app):
    """
    Regenerates expensive cached queries immediately.
    Must be called within an app context.
    """
    app.logger.info("Regenerating expensive query cache...")
    db = get_db()
    if not db:
        app.logger.error("Could not get DB connection for query regeneration.")
        return

    # Keys to invalidate
    keys = ['latest_1000', 'top', 'all_users', 'latest_per_user']
    
    try:
        with db:
            # Delete existing cache entries to force regeneration
            placeholders = ','.join(['?'] * len(keys))
            db.execute(f"DELETE FROM query_cache WHERE key IN ({placeholders})", keys)
            
        # Trigger regeneration by calling the API functions
        # 1. Latest
        start = time.time()
        api.latest(1000)
        app.logger.info(f"Regenerated /latest (rss) in {time.time() - start:.2f}s")
        
        # 2. Top/Nodes
        start = time.time()
        api.top()
        app.logger.info(f"Regenerated /nodes (top) in {time.time() - start:.2f}s")
        
        # 3. Users
        start = time.time()
        api.all_users()
        app.logger.info(f"Regenerated /users in {time.time() - start:.2f}s")

        # 4. Latest per user (git based)
        start = time.time()
        # This function is not exposed in api.py for caching purposes in the same way,
        # so we call git_utils directly and save to cache manually, mimicking agora.py.
        latest_changes = git_utils.get_latest_changes_per_repo(
            agora_path=current_app.config['AGORA_PATH'],
            logger=current_app.logger
        )
        save_cached_query('latest_per_user', json.dumps(latest_changes), time.time())
        app.logger.info(f"Regenerated /latest (git) in {time.time() - start:.2f}s")
        
        app.logger.info("Expensive queries regenerated.")
    except Exception as e:
        app.logger.error(f"Error regenerating expensive queries: {e}")



def update_vectors(app):
    """
    Incrementally updates semantic embeddings for all subnodes.
    """
    if not app.config.get('ENABLE_SEMANTIC_SEARCH', False):
        return

    from app import semantic
    from app.storage.sqlite_engine import get_db
    
    app.logger.info("Semantic: Starting incremental vector update...")
    start_time = time.time()
    
    db = get_db()
    if not db:
        return

    # Ensure table exists if not already created
    db.execute("""
        CREATE TABLE IF NOT EXISTS subnode_vectors (
            path TEXT PRIMARY KEY,
            embedding BLOB NOT NULL,
            model TEXT NOT NULL,
            timestamp INTEGER NOT NULL
        );
    """)

    # 1. Get current subnodes and their mtimes
    cursor = db.execute("SELECT path, mtime FROM subnodes")
    current_subnodes = dict(cursor.fetchall())
    
    # 2. Get existing vectors and their timestamps
    cursor = db.execute("SELECT path, timestamp FROM subnode_vectors")
    existing_vectors = dict(cursor.fetchall())
    
    # 3. Determine work
    to_embed = []
    for path, mtime in current_subnodes.items():
        if path not in existing_vectors or mtime > existing_vectors[path]:
            to_embed.append(path)
            
    to_delete = [path for path in existing_vectors if path not in current_subnodes]
    
    if not to_embed and not to_delete:
        app.logger.info("Semantic: All vectors up to date.")
        return

    # 4. Process deletions
    if to_delete:
        app.logger.info(f"Semantic: Removing {len(to_delete)} stale vectors...")
        with db:
            db.executemany("DELETE FROM subnode_vectors WHERE path = ?", [(p,) for p in to_delete])

    # 5. Process embeddings
    if to_embed:
        app.logger.info(f"Semantic: Generating {len(to_embed)} new embeddings...")
        agora_path = app.config['AGORA_PATH']
        
        # Load model once
        model = semantic.get_model()
        if not model:
            app.logger.error("Semantic: Failed to load model for worker.")
            return
            
        count = 0
        batch_size = 50
        batch_data = []
        
        for path in to_embed:
            abs_path = os.path.join(agora_path, path)
            try:
                with open(abs_path, 'r', encoding='utf-8', errors='replace') as f:
                    content = f.read(65536)
                    
                # If note content is empty, use the node title from the filename
                if not content.strip():
                    content = os.path.splitext(os.path.basename(path))[0]
                    
                # We embed the content (the model handles truncation)
                vector = semantic.embed(content)
                if vector is not None:
                    # Store as bytes for SQLite BLOB
                    batch_data.append((path, vector.tobytes(), 'nomic-embed-text-v1.5', int(time.time())))
                    count += 1
                    
                if len(batch_data) >= batch_size:
                    with db:
                        db.executemany(
                            "REPLACE INTO subnode_vectors (path, embedding, model, timestamp) VALUES (?, ?, ?, ?)",
                            batch_data
                        )
                    batch_data = []
                    elapsed = time.time() - start_time
                    rate = count / elapsed if elapsed > 0 else 0
                    eta_sec = (len(to_embed) - count) / rate if rate > 0 else 0
                    app.logger.info(f"Semantic: Processed {count}/{len(to_embed)} ({count*100/len(to_embed):.1f}%) in {elapsed:.0f}s ({rate:.1f} notes/s, ETA {eta_sec/60:.1f}m)...")
                    
            except Exception as e:
                app.logger.error(f"Semantic: Error embedding {path}: {e}")
                
        # Final batch
        if batch_data:
            with db:
                db.executemany(
                    "REPLACE INTO subnode_vectors (path, embedding, model, timestamp) VALUES (?, ?, ?, ?)",
                    batch_data
                )

        app.logger.info(f"Semantic: Finished generating {count} embeddings in {time.time() - start_time:.2f}s.")


def run_full_reindex(app=None):
    """
    Main entry point for running a full re-index.
    Acquires a lock to prevent concurrent runs.
    """
    if app is None:
        app = current_app._get_current_object()
        
    start_time = time.time()
    
    # We need to get the db engine from the app context to use locking
    with app.app_context():
        from app.storage import sqlite_engine
        worker_id = f"worker-{os.getpid()}"
        
        if not sqlite_engine.try_acquire_lock(worker_id):
            app.logger.warning("Could not acquire maintenance lock. Another worker is running.")
            return

        try:
            if build_cache(app):
                deploy_cache(app)
                # Update timestamp and regenerate queries
                update_last_index_time()
                
                # Update git mtimes (new!)
                if app.config.get('USE_GIT_MTIME', False):
                    db = sqlite_engine.get_db()
                    git_utils.update_git_mtimes_batch(app.config['AGORA_PATH'], db)
                else:
                    app.logger.info("Git mtime update skipped (USE_GIT_MTIME=False).")
                
                regenerate_expensive_cache(app)

                # Update semantic vectors. When a dedicated embedder service
                # owns the model (EMBEDDER_URL set), it also owns incremental
                # vector indexing, so the periodic worker skips this to avoid
                # loading torch here and racing the embedder.
                if app.config.get('EMBEDDER_URL'):
                    app.logger.info("Semantic: skipping vector update (dedicated embedder owns indexing).")
                else:
                    update_vectors(app)
        except Exception as e:
            app.logger.error(f"Maintenance re-index failed: {e}")
        finally:
            sqlite_engine.release_lock(worker_id)
        
    duration = time.time() - start_time
    app.logger.info(f"Full maintenance re-index finished in {duration:.2f} seconds.")
