# app/semantic.py
import numpy as np
from flask import current_app
import logging

# Global model cache
_model = None

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
