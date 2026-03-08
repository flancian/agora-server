# app/semantic.py
import numpy as np
from flask import current_app
import logging
import time

# Global model and matrix cache
_model = None
_corpus_matrix = None
_corpus_paths = None
_corpus_timestamp = 0

def get_model():
    """
    Lazy loads the SentenceTransformer model.
    """
    global _model
    if _model:
        return _model
    
    if not current_app.config.get('ENABLE_SEMANTIC_SEARCH', False):
        return None

    try:
        from sentence_transformers import SentenceTransformer
        # Use a small, fast model.
        # 'all-MiniLM-L6-v2' is a good balance.
        current_app.logger.info("Semantic: Loading embedding model 'all-MiniLM-L6-v2'...")
        _model = SentenceTransformer('all-MiniLM-L6-v2')
        # Ensure CPU usage.
        _model.cpu()
        current_app.logger.info("Semantic: Model loaded.")
        return _model
    except ImportError:
        current_app.logger.error("Semantic: sentence_transformers not installed.")
        return None
    except Exception as e:
        current_app.logger.error(f"Semantic: Error loading model: {e}")
        return None

def embed(text):
    """
    Generates an embedding vector for the given text.
    Returns a numpy array (float32).
    """
    model = get_model()
    if not model:
        return None
    
    # Normalize text? (Strip, lowercase usually handled by model tokenizer but good to be clean)
    if not text or not isinstance(text, str):
        return None

    # Encode
    try:
        vector = model.encode(text, convert_to_numpy=True)
        return vector
    except Exception as e:
        current_app.logger.error(f"Semantic: Error embedding text: {e}")
        return None

def cosine_similarity(query_vec, corpus_mat):
    """
    Computes cosine similarity between a query vector (1D) and a corpus matrix (2D).
    Returns a 1D array of scores.
    """
    # Normalize query vector
    norm_query = np.linalg.norm(query_vec)
    if norm_query == 0:
        return np.zeros(len(corpus_mat))
    query_vec = query_vec / norm_query

    # Normalize corpus matrix (can be pre-computed/cached ideally)
    # Axis 1 = along rows (vectors).
    norm_corpus = np.linalg.norm(corpus_mat, axis=1)
    # Avoid division by zero
    norm_corpus[norm_corpus == 0] = 1e-10
    
    # Dot product
    dot_products = np.dot(corpus_mat, query_vec)
    
    # Cosine similarity
    return dot_products / norm_corpus

def ensure_corpus():
    """
    Loads vectors from SQLite into a Numpy matrix, refreshing every 5 minutes.
    """
    global _corpus_matrix, _corpus_paths, _corpus_timestamp
    
    if _corpus_matrix is not None and (time.time() - _corpus_timestamp < 300):
        return

    from app.storage.sqlite_engine import get_all_vectors
    rows = get_all_vectors()
    if not rows:
        _corpus_matrix = np.array([])
        _corpus_paths = []
        return

    paths = []
    vectors = []
    for path, blob in rows:
        paths.append(path)
        # Convert bytes back to numpy array (model outputs float32)
        vec = np.frombuffer(blob, dtype=np.float32)
        vectors.append(vec)

    _corpus_matrix = np.array(vectors)
    _corpus_paths = paths
    _corpus_timestamp = time.time()
    current_app.logger.info(f"Semantic: Loaded {len(paths)} vectors into memory matrix.")

def search(query, top_k=20):
    """
    Performs a semantic search for the query against the loaded corpus.
    Returns a list of tuples: [(path, score), ...]
    """
    if not current_app.config.get('ENABLE_SEMANTIC_SEARCH', False):
        return []

    query_vec = embed(query)
    if query_vec is None:
        return []

    ensure_corpus()
    if _corpus_matrix is None or len(_corpus_matrix) == 0:
        return []

    scores = cosine_similarity(query_vec, _corpus_matrix)
    
    # Get top K indices efficiently
    if len(scores) <= top_k:
        top_indices = np.argsort(scores)[::-1]
    else:
        # argpartition is faster than argsort for large arrays when you only need top K
        top_indices = np.argpartition(scores, -top_k)[-top_k:]
        # Sort just the top K to get them in descending order
        top_indices = top_indices[np.argsort(scores[top_indices])[::-1]]

    results = []
    # Lower threshold (e.g. 0.2) to filter out complete noise
    for idx in top_indices:
        score = scores[idx]
        if score > 0.2:
            results.append((_corpus_paths[idx], score))
            
    return results
