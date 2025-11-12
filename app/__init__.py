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
import os
from flask import Flask
from flask_compress import Compress
from werkzeug.middleware.proxy_fix import ProxyFix
from . import agora
from . import util
from app.exec import *
from flask_cors import CORS

# Import the new blueprint
from app.exec import web


def create_app():
    import os
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
    if config == "ProductionConfig":
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

    # uWSGI-specific blocking cache warming.
    # This runs in each worker after it has been forked, but before it can accept requests.
    try:
        import uwsgi
        from .graph import G
        import time

        # This check ensures this code only runs in the worker processes, not the master.
        # uwsgi.worker_id() will raise an exception if not running under a uWSGI worker.
        if uwsgi.worker_id() > 0:
            # We must create an application context to use current_app and other globals.
            with app.app_context():
                app.logger.info(f"Worker {uwsgi.worker_id()} starting cache warmup...")
                start_time = time.time()
                G.nodes()
                G.subnodes()
                duration = time.time() - start_time
                app.logger.info(f"Worker {uwsgi.worker_id()} cache warmup complete in {duration:.2f}s.")

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

    

    if app.config.get('ENABLE_BACKGROUND_INDEXING', False):
        import atexit
        import threading
        from .storage import sqlite_engine
        from .graph import G
        import os
        from flask import current_app
        import time

        def background_indexer(app):
            """
            This function runs in a background thread and is responsible for the slow,
            post-startup task of reading all subnode contents and indexing their links.
            """
            with app.app_context():
                worker_pid = os.getpid()
                current_app.logger.info(f"[Indexer PID {worker_pid}] Worker started, checking for indexing lock...")

                if sqlite_engine.acquire_lock('full_link_indexing', worker_pid):
                    current_app.logger.info(f"[Indexer PID {worker_pid}] Acquired lock, starting background indexing.")
                    try:
                        # Get all subnodes (this is fast as it doesn't read content)
                        all_subnodes = G.subnodes()
                        total_subnodes = len(all_subnodes)
                        current_app.logger.info(f"[Indexer PID {worker_pid}] Indexing links for {total_subnodes} subnodes.")
                        start_time = time.time()

                        for i, subnode in enumerate(all_subnodes):
                            # This is where the slow work happens: accessing .content reads the file.
                            links = subnode.forward_links
                            
                            # Update the database with the links.
                            sqlite_engine.update_subnode(
                                path=subnode.uri,
                                user=subnode.user,
                                node=subnode.canonical_wikilink,
                                mtime=subnode.mtime,
                                links=links
                            )

                            if i % 1000 == 0 and i > 0:
                                progress = (i / total_subnodes) * 100
                                current_app.logger.info(f"[Indexer PID {worker_pid}] Indexing progress: {progress:.0f}% complete ({i} / {total_subnodes} subnodes).")

                        duration = time.time() - start_time
                        current_app.logger.info(f"[Indexer PID {worker_pid}] Background indexing finished in {duration:.2f}s.")

                    finally:
                        current_app.logger.info(f"[Indexer PID {worker_pid}] Releasing lock.")
                        sqlite_engine.release_lock('full_link_indexing', worker_pid)
                else:
                    current_app.logger.info(f"[Indexer PID {worker_pid}] Another worker holds the lock. Standing by.")
        
        thread = threading.Thread(target=background_indexer, args=(app,))
        thread.daemon = True
        thread.start()

    return app
