import pytest
import os
import tempfile
import shutil
from app import create_app
from app.storage import api, maintenance

@pytest.fixture
def test_search_app():
    temp_dir = tempfile.mkdtemp()
    agora_path = temp_dir
    user1_garden_path = os.path.join(agora_path, "garden", "user1")
    os.makedirs(user1_garden_path)

    # File 1: broad match (terms separated)
    with open(os.path.join(user1_garden_path, "broad_match.md"), "w") as f:
        f.write("The Agora has a python-based server.")

    # File 2: phrase match (consecutive terms)
    with open(os.path.join(user1_garden_path, "phrase_match.md"), "w") as f:
        f.write("We are building a free knowledge commons.")

    # File 3: stem leak (word variations)
    with open(os.path.join(user1_garden_path, "exact_stem_leak.md"), "w") as f:
        f.write("This is connecting the digital gardens.")

    # File 4: punctuation match (exact match with special characters)
    with open(os.path.join(user1_garden_path, "punctuation_match.md"), "w") as f:
        f.write("To enable FTS, set ENABLE_FTS=True in config.py.")

    # Dummy sources
    with open(os.path.join(agora_path, "sources.yaml"), "w") as f:
        f.write("- target: garden/user1\n  url: http://example.com/user1\n")

    app = create_app()
    app.config.update({
        "TESTING": True,
        "AGORA_PATH": agora_path,
        "ENABLE_SQLITE": True,
        "ENABLE_FTS": True,
        "ENABLE_LAZY_LOAD": False,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///" + os.path.join(agora_path, "agora.db")
    })

    with app.app_context():
        # Initialize and populate SQLite database
        maintenance.run_full_reindex(app)
        yield app

    shutil.rmtree(temp_dir)


def test_fuzzy_search_conjunction(test_search_app):
    """
    Test that Fuzzy (broad) mode matches terms in any order (conjunction) rather than phrase.
    """
    with test_search_app.app_context():
        # Query containing words separated by other tokens
        results = api.search_subnodes("agora server", mode="broad")
        result_wikilinks = [r.wikilink for r in results]
        assert "broad_match" in result_wikilinks


def test_phrase_search(test_search_app):
    """
    Test that Phrase (exact) mode requires words to be consecutive.
    """
    with test_search_app.app_context():
        # 'free knowledge' is consecutive in phrase_match.md
        results = api.search_subnodes("free knowledge", mode="exact")
        result_wikilinks = [r.wikilink for r in results]
        assert "phrase_match" in result_wikilinks

        # 'building commons' is present but not consecutive in phrase_match.md
        results_non_consec = api.search_subnodes("building commons", mode="exact")
        result_non_consec_wikilinks = [r.wikilink for r in results_non_consec]
        assert "phrase_match" not in result_non_consec_wikilinks


def test_phrase_search_stem_stemming(test_search_app):
    """
    Test that Phrase (exact) search stems tokens (leakage).
    Searching 'connecting' matches 'connecting' because of porter tokenizer.
    """
    with test_search_app.app_context():
        results = api.search_subnodes("connecting", mode="exact")
        result_wikilinks = [r.wikilink for r in results]
        assert "exact_stem_leak" in result_wikilinks


def test_literal_search(test_search_app):
    """
    Test that Literal (fs) search matches exact strings with punctuation and specific suffixes.
    """
    with test_search_app.app_context():
        # Query with punctuation
        results = api.search_subnodes("ENABLE_FTS=True", mode="fs")
        result_wikilinks = [r.wikilink for r in results]
        assert "punctuation_match" in result_wikilinks

        # Exact matching matches 'gardens' but searching 'gardening' should not match
        results_gardens = api.search_subnodes("gardens", mode="fs")
        assert "exact_stem_leak" in [r.wikilink for r in results_gardens]

        results_gardening = api.search_subnodes("gardening", mode="fs")
        assert "exact_stem_leak" not in [r.wikilink for r in results_gardening]
