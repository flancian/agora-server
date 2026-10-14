#!/usr/bin/env -S uv run
# embedder.py -- a long-running local service that owns the semantic embedding model.
#
# It exists so the uWSGI web workers never have to load torch/sentence-transformers:
#   * POST /embed   {"texts": ["...", ...]} -> {"embeddings": [[...], ...], ...}
#   * GET  /health  -> {"status": "ok", "model": ..., "vectors": N}
#
# It also owns incremental subnode vector indexing (see maintenance.update_vectors),
# so the periodic oneshot worker skips it when EMBEDDER_URL is configured.
import os
import sys
import time
import logging
import threading

# Add the project root to the Python path.
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, project_root)

# Ensure we are recognized as a worker, not the web app.
os.environ['AGORA_WORKER'] = 'true'

from flask import Flask, request, jsonify
from app import create_app
from app import semantic
from app.storage import maintenance

DEFAULT_PORT = 5020
DEFAULT_INDEX_INTERVAL = 600  # seconds between incremental vector updates

agora_app = create_app()

# The embedder always wants the model, regardless of the web-facing feature flag.
agora_app.config['ENABLE_SEMANTIC_SEARCH'] = True

# INFO logging to stdout, matching scripts/worker.py.
handler = logging.StreamHandler(sys.stdout)
handler.setLevel(logging.INFO)
handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
agora_app.logger.addHandler(handler)
agora_app.logger.setLevel(logging.INFO)

http = Flask("agora-embedder")

# Serialize encodes to avoid thrashing the CPU with concurrent batches.
_encode_lock = threading.Lock()


def _encode(texts):
    with agora_app.app_context():
        model = semantic.get_model()
        if model is None:
            raise RuntimeError("embedding model unavailable (is ENABLE_SEMANTIC_SEARCH set?)")
        with _encode_lock:
            vectors = model.encode(texts, convert_to_numpy=True, show_progress_bar=False)
    return vectors


@http.route("/health", methods=["GET"])
def health():
    with agora_app.app_context():
        try:
            from app.storage import sqlite_engine
            count = sqlite_engine.get_vector_count()
        except Exception:
            count = 0
    return jsonify({"status": "ok", "model": semantic.MODEL_NAME, "vectors": count})


@http.route("/embed", methods=["POST"])
def embed():
    payload = request.get_json(silent=True) or {}
    texts = payload.get("texts")
    if isinstance(payload.get("text"), str):
        texts = [payload["text"]]
    if not isinstance(texts, list) or not texts:
        return jsonify({"error": "expected a non-empty 'texts' list or 'text' string"}), 400

    start = time.time()
    try:
        vectors = _encode([str(t) for t in texts])
    except Exception as e:
        agora_app.logger.error(f"Embedder: encode failed: {e}")
        return jsonify({"error": str(e)}), 503

    agora_app.logger.info(f"Embedder: encoded {len(texts)} text(s) in {time.time() - start:.4f}s.")
    return jsonify({
        "model": semantic.MODEL_NAME,
        "dim": int(vectors.shape[1]) if len(vectors.shape) > 1 else len(vectors),
        "embeddings": vectors.tolist(),
    })


def _indexing_loop(interval):
    # Small initial delay so the service can start serving before heavy work.
    time.sleep(30)
    while True:
        try:
            with agora_app.app_context():
                maintenance.update_vectors(agora_app)
        except Exception as e:
            agora_app.logger.error(f"Embedder: vector indexing pass failed: {e}")
        time.sleep(interval)


if __name__ == "__main__":
    port = int(os.environ.get("AGORA_EMBEDDER_PORT", DEFAULT_PORT))
    interval = int(os.environ.get("AGORA_EMBEDDER_INDEX_INTERVAL", DEFAULT_INDEX_INTERVAL))
    agora_app.logger.info(f"Embedder: starting on 127.0.0.1:{port} (index interval {interval}s).")

    # Warm the model before accepting traffic so the first query isn't slow.
    try:
        with agora_app.app_context():
            semantic.get_model()
    except Exception as e:
        agora_app.logger.error(f"Embedder: model warmup failed: {e}")

    threading.Thread(target=_indexing_loop, args=(interval,), daemon=True).start()

    http.run(host="127.0.0.1", port=port, threaded=True)
