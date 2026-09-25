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


def test_live_search_short_query(test_search_app):
    client = test_search_app.test_client()
    resp = client.get("/api/search/live?q=a")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["results"] == []

    resp_empty = client.get("/api/search/live?q=")
    assert resp_empty.status_code == 200
    assert resp_empty.get_json()["results"] == []


def test_live_search_node_title(test_search_app):
    client = test_search_app.test_client()
    resp = client.get("/api/search/live?q=broad")
    assert resp.status_code == 200
    data = resp.get_json()
    results = data["results"]
    assert len(results) >= 1
    assert any(r["node"] == "broad match" and r["type"] == "node" for r in results)


def test_live_search_content_fallback(test_search_app):
    client = test_search_app.test_client()
    # "commons" appears in phrase_match content, but not in any node name
    resp = client.get("/api/search/live?q=commons")
    assert resp.status_code == 200
    data = resp.get_json()
    results = data["results"]
    assert len(results) >= 1
    match = next((r for r in results if r["node"] == "phrase match"), None)
    assert match is not None
    assert match["type"] == "content"
    assert "commons" in match["snippet"].lower()


def test_live_search_user(test_search_app):
    client = test_search_app.test_client()
    resp = client.get("/api/search/live?q=@user1")
    assert resp.status_code == 200
    data = resp.get_json()
    results = data["results"]
    assert len(results) >= 1
    assert results[0]["type"] == "user"
    assert results[0]["node"] == "user1"


def test_live_search_fallback(test_search_app):
    # Disable SQLite to exercise in-memory fallback
    test_search_app.config["ENABLE_SQLITE"] = False
    try:
        client = test_search_app.test_client()
        resp = client.get("/api/search/live?q=broad")
        assert resp.status_code == 200
        data = resp.get_json()
        assert any(r["node"] == "broad match" for r in data["results"])
    finally:
        test_search_app.config["ENABLE_SQLITE"] = True


def test_live_search_pagination_sqlite(test_search_app):
    client = test_search_app.test_client()
    # There are multiple notes in test garden: broad_match, phrase_match, exact_stem_leak, punctuation_match
    # Search for "match" which matches broad_match, phrase_match, punctuation_match
    resp_p1 = client.get("/api/search/live?q=match&limit=1&page=1")
    assert resp_p1.status_code == 200
    data_p1 = resp_p1.get_json()
    assert data_p1["page"] == 1
    assert data_p1["has_prev"] is False
    assert data_p1["has_more"] is True
    assert len(data_p1["results"]) == 1

    resp_p2 = client.get("/api/search/live?q=match&limit=1&page=2")
    assert resp_p2.status_code == 200
    data_p2 = resp_p2.get_json()
    assert data_p2["page"] == 2
    assert data_p2["has_prev"] is True
    assert len(data_p2["results"]) == 1
    assert data_p2["results"][0]["node"] != data_p1["results"][0]["node"]

    # Invalid page handling
    resp_invalid = client.get("/api/search/live?q=match&limit=1&page=-5")
    assert resp_invalid.status_code == 200
    assert resp_invalid.get_json()["page"] == 1


def test_live_search_pagination_fallback(test_search_app):
    test_search_app.config["ENABLE_SQLITE"] = False
    try:
        client = test_search_app.test_client()
        resp_p1 = client.get("/api/search/live?q=match&limit=1&page=1")
        assert resp_p1.status_code == 200
        data_p1 = resp_p1.get_json()
        assert data_p1["page"] == 1
        assert data_p1["has_prev"] is False
        assert data_p1["has_more"] is True
        assert len(data_p1["results"]) == 1

        resp_p2 = client.get("/api/search/live?q=match&limit=1&page=2")
        assert resp_p2.status_code == 200
        data_p2 = resp_p2.get_json()
        assert data_p2["page"] == 2
        assert data_p2["has_prev"] is True
        assert len(data_p2["results"]) == 1
        assert data_p2["results"][0]["node"] != data_p1["results"][0]["node"]
    finally:
        test_search_app.config["ENABLE_SQLITE"] = True



