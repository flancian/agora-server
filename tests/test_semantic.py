import pytest
import numpy as np
from app import create_app
import app.semantic as semantic

@pytest.fixture
def test_semantic_app():
    app = create_app()
    app.config.update({
        "TESTING": True,
        "ENABLE_SEMANTIC_SEARCH": True,
        "ENABLE_SQLITE": True
    })
    return app

def test_semantic_model_loading(test_semantic_app):
    with test_semantic_app.app_context():
        model = semantic.get_model()
        assert model is not None

def test_semantic_embedding(test_semantic_app):
    with test_semantic_app.app_context():
        vec = semantic.embed("A digital garden node about stoicism and mutual aid.")
        assert vec is not None
        assert isinstance(vec, np.ndarray)
        assert vec.shape == (768,)

def test_semantic_cosine_similarity(test_semantic_app):
    with test_semantic_app.app_context():
        v_base = semantic.embed("mutual aid and community support")
        v_similar = semantic.embed("cooperatives and solidarity economics")
        v_different = semantic.embed("baking sourdough bread with wheat flour")
        
        corpus = np.array([v_similar, v_different])
        scores = semantic.cosine_similarity(v_base, corpus)
        
        assert len(scores) == 2
        # Similar concept should score noticeably higher than unrelated concept
        assert scores[0] > scores[1]
