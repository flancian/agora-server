# Copyright 2020 Google LLC
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

import bleach
import logging
import os
import sys
import subprocess
import time
from flask import Flask
from flask_compress import Compress
from werkzeug.middleware.proxy_fix import ProxyFix
from . import agora
from . import util
from app.exec import *
from flask_cors import CORS

# Import the new blueprint
from app.exec import web

def ensure_db_populated(app, sqlite_engine):
    # Auto-index if DB is empty and Lazy Load is on.
    # We skip this if we are running as the worker itself (AGORA_WORKER=true).
    if app.config.get('ENABLE_LAZY_LOAD', False) and not os.environ.get('AGORA_WORKER'):
         # Use a simple in-memory cache to avoid hitting the DB count on every request
        now = time.time()
        # Check at most once every 60 seconds
        if hasattr(app, 'last_db_check') and (now - app.last_db_check < 60):
            return

        # Check if DB is empty
        if sqlite_engine.get_subnode_count() == 0:
            app.logger.warning("Runtime Check: SQLite index is empty. Attempting to acquire lock for indexing...")
            
            # Simple PID-based worker ID
            worker_id = str(os.getpid())
            
            if sqlite_engine.try_acquire_lock(worker_id):
                try:
                    app.logger.info("Lock acquired. Starting worker subprocess to build index...")
                    start_time = time.time()
                    
                    # Prepare environment for the subprocess to prevent recursion
                    env = os.environ.copy()
                    env['AGORA_WORKER'] = 'true'
                    
                    # Determine path to worker script
                    # Assuming app/__init__.py is in app/, so we go up one level and into scripts/
                    base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                    worker_script = os.path.join(base_path, 'scripts', 'worker.py')
                    
                    # Run the worker synchronously using 'uv run'
                    result = subprocess.run(
                        ['uv', 'run', worker_script],
                        cwd=base_path,
                        env=env,
                        capture_output=True,
                        text=True
                    )
                    
                    if result.returncode == 0:
                        duration = time.time() - start_time
                        app.logger.info(f"Worker finished successfully in {duration:.2f}s.")
                        # app.logger.debug(f"Worker Output:\n{result.stdout}")
                    else:
                        app.logger.error(f"Worker failed with return code {result.returncode}.")
                        app.logger.error(f"Worker Stderr:\n{result.stderr}")
                        
                except Exception as e:
                    app.logger.error(f"Failed to spawn worker: {e}")
                finally:
                    sqlite_engine.release_lock(worker_id)
            else:
                app.logger.info("Could not acquire lock. Another worker is indexing. Waiting...")
                # Wait loop
                attempts = 0
                while sqlite_engine.is_locked() and attempts < 60:
                    time.sleep(1)
                    attempts += 1
                    if attempts % 5 == 0:
                        app.logger.info(f"Still waiting for index build ({attempts}s)...")
                
                if attempts >= 60:
                    app.logger.warning("Timed out waiting for index build. Proceeding with potentially empty DB.")
                else:
                    app.logger.info("Index build finished (lock released). Proceeding.")
        
        # Update last check time
        app.last_db_check = now


def create_app():

    # create and configure the app
    app = Flask(__name__, instance_relative_config=True)
    
    # Add ProxyFix middleware to handle X-Forwarded-Proto headers
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)

    config = os.environ.get("AGORA_CONFIG", "DevelopmentConfig")
    app.config.from_object("app.config." + config)
    CORS(app)
    
    # Enable gzip compression for large responses
    Compress(app)

    # there's probably a better way to make this distinction, but this works.
    if config in ["ProductionConfig", "AlphaConfig"]:
        logging.basicConfig(
            filename="agora.log",
            level=logging.WARNING,
            format="%(asctime)s %(levelname)s %(name)s %(threadName)s : %(message)s",
        )
    else:
        logging.basicConfig(
            level=logging.DEBUG,
            format="%(asctime)s %(levelname)s %(name)s %(threadName)s : %(message)s",
        )
        logging.getLogger("urllib3").setLevel(logging.WARNING)

    # ensure the instance folder exists
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    # Add blueprints here.
    app.register_blueprint(agora.bp)
    # Actions (mounted under "exec").
    app.register_blueprint(default.bp)
    app.register_blueprint(web.bp)
    app.add_url_rule("/", endpoint="index")

    # Register the teardown function for the database
    from .storage import sqlite_engine
    app.teardown_appcontext(sqlite_engine.close_db)

    # Run check once on startup
    with app.app_context():
        ensure_db_populated(app, sqlite_engine)

    # Register before_request to run the check periodically
    @app.before_request
    def before_request_check():
        ensure_db_populated(app, sqlite_engine)



    # uWSGI-specific blocking cache warming.
    # This runs in each worker after it has been forked, but before it can accept requests.
    try:
        import uwsgi
        from .graph import G
        import time

        # This check ensures this code only runs in the worker processes, not the master.
        # uwsgi.worker_id() will raise an an exception if not running under a uWSGI worker.
        if uwsgi.worker_id() > 0:
            # We must create an application context to use current_app and other globals.
            with app.app_context():
                # Only warm the cache if lazy loading is NOT enabled.
                if not app.config.get('ENABLE_LAZY_LOAD', False):
                    app.logger.info(f"Worker {uwsgi.worker_id()} starting cache warmup...")
                    start_time = time.time()
                    G.nodes()
                    G.subnodes()
                    duration = time.time() - start_time
                    app.logger.info(f"Worker {uwsgi.worker_id()} cache warmup complete in {duration:.2f}s.")
                else:
                    app.logger.info(f"Worker {uwsgi.worker_id()}: Lazy loading enabled, skipping cache warmup.")

    except (ImportError, AttributeError):
        # This will fail if not running under uWSGI, which is fine for dev.
        pass

    @app.context_processor
    def css_versions():
        versions = {}
        dark_css_path = os.path.join(app.static_folder, 'css/screen-dark.css')
        if os.path.exists(dark_css_path):
            versions['dark_css_version'] = int(os.path.getmtime(dark_css_path))

        light_css_path = os.path.join(app.static_folder, 'css/screen-light.css')
        if os.path.exists(light_css_path):
            versions['light_css_version'] = int(os.path.getmtime(light_css_path))
        
        return {'css_versions': versions}

    @app.template_filter("linkify")
    def linkify(s):
        return bleach.linkify(s)

    @app.template_filter("datetimeformat")
    def datetimeformat(s, format="%Y-%m-%d %H:%M"):
        return util.format_datetime(s, format)

    @app.template_filter("node_url")
    def node_url(node_uri):
        return f"/{node_uri}"
    
    return app
