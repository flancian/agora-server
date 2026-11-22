import os
import shutil
import tempfile
from unittest.mock import patch

import pytest

from app import create_app
from app.storage import api, file_engine, maintenance, sqlite_engine


def _clear_caches():
    from app.graph import Graph, G, Node, Subnode
    from app import git_utils

    for target in (Graph, G, Node, Subnode, git_utils):
        for name in dir(target):
            try:
                attr = getattr(target, name, None)
                if hasattr(attr, "cache"):
                    attr.cache.clear()
                if hasattr(attr, "cache_clear"):
                    attr.cache_clear()
                if hasattr(attr, "__func__") and hasattr(attr.__func__, "cache"):
                    attr.__func__.cache.clear()
            except Exception:
                pass


def _create_journal_agora(with_sqlite=True, reindex=True):
    temp_dir = tempfile.mkdtemp()
    user1_dir = os.path.join(temp_dir, "garden", "user1")
    user2_dir = os.path.join(temp_dir, "garden", "user2")
    os.makedirs(user1_dir)
    os.makedirs(user2_dir)

    # Text journal subnodes across multiple dates and users
    files = {
        os.path.join(user1_dir, "2025-05-01.md"): "User1 May 1 entry.",
        os.path.join(user1_dir, "2025-05-03.md"): "User1 May 3 entry.",
        os.path.join(user2_dir, "2025-05-02.md"): "User2 May 2 entry.",
        os.path.join(user2_dir, "2025-05-03.md"): "User2 May 3 entry.",
        os.path.join(user1_dir, "2025-05-04.org"): "* User1 May 4 org entry.",
        os.path.join(user1_dir, "2099-01-01.md"): "Future journal entry.",
        os.path.join(user1_dir, "regular-note.md"): "Not a journal.",
    }
    for path, content in files.items():
        with open(path, "w") as f:
            f.write(content)

    # Non-text / binary file with a journal-like date name (should be skipped)
    with open(os.path.join(user1_dir, "2025-05-05.png"), "wb") as f:
        f.write(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR")

    # Corrupted binary bytes inside a .md file (should not crash)
    with open(os.path.join(user2_dir, "2025-04-30.md"), "wb") as f:
        f.write(b"\xff\xfe\x00\x00invalid utf8")

    with open(os.path.join(temp_dir, "sources.yaml"), "w") as f:
        f.write("- target: garden/user1\n  url: http://example.com/user1\n")

    app = create_app()
    app.config.update(
        {
            "TESTING": True,
            "AGORA_PATH": temp_dir,
            "ENABLE_SQLITE": with_sqlite,
            "ENABLE_LAZY_LOAD": True,
            "ENABLE_FTS": False,
            "SQLALCHEMY_DATABASE_URI": "sqlite:///" + os.path.join(temp_dir, "agora.db"),
        }
    )

    if with_sqlite and reindex:
        with app.app_context():
            _clear_caches()
            maintenance.run_full_reindex(app)

    return app, temp_dir


@pytest.fixture
def sqlite_journal_app():
    app, temp_dir = _create_journal_agora(with_sqlite=True, reindex=True)
    with app.app_context():
        _clear_caches()
        yield app
    shutil.rmtree(temp_dir)


@pytest.fixture
def fallback_journal_app():
    app, temp_dir = _create_journal_agora(with_sqlite=False, reindex=False)
    with app.app_context():
        _clear_caches()
        yield app
    shutil.rmtree(temp_dir)


def test_all_journals_sqlite_fast_path_sorts_and_slices_before_subnode_init(sqlite_journal_app):
    """
    SQLite fast path returns journals sorted descending, skips non-text/future entries,
    does not invoke file_engine.all_journals(), and only instantiates Subnode objects
    for the requested slice.
    """
    real_subnode_cls = api.SubnodeClass
    constructed_paths = []

    def tracking_subnode(path, *args, **kwargs):
        constructed_paths.append(path)
        return real_subnode_cls(path, *args, **kwargs)

    with patch("app.storage.api.file_engine.all_journals", side_effect=AssertionError("Should not fall back")), \
         patch("app.storage.api.SubnodeClass", side_effect=tracking_subnode):
        journals = api.all_journals(entries=3)

    assert len(journals) == 3
    assert len(constructed_paths) == 3
    assert [j.wikilink for j in journals] == ["2025-05-04", "2025-05-03", "2025-05-03"]
    assert all(j.mediatype.startswith("text") for j in journals)


def test_all_journals_sqlite_skips_missing_and_binary_files(sqlite_journal_app):
    """
    Missing files still present in SQLite and non-text files are skipped cleanly
    without crashing or short-changing the requested entry count.
    """
    agora_path = sqlite_journal_app.config["AGORA_PATH"]
    # Delete the newest text journal from disk after SQLite indexing
    os.remove(os.path.join(agora_path, "garden", "user1", "2025-05-04.org"))

    with patch("app.storage.api.file_engine.all_journals", side_effect=AssertionError("Should not fall back")):
        journals = api.all_journals(entries=3)

    assert len(journals) == 3
    wikilinks = [j.wikilink for j in journals]
    assert "2025-05-05" not in wikilinks  # .png skipped
    assert "2025-05-04" not in wikilinks  # deleted file skipped
    assert wikilinks == ["2025-05-03", "2025-05-03", "2025-05-02"]

    # Non-UTF8 .md file should load cleanly without raising
    all_past = api.all_journals()
    assert any(j.wikilink == "2025-04-30" for j in all_past)
    assert not any(j.wikilink == "2099-01-01" for j in all_past)


def test_all_journals_sqlite_skip_future_false(sqlite_journal_app):
    journals = api.all_journals(skip_future=False, entries=2)
    assert len(journals) == 2
    assert journals[0].wikilink == "2099-01-01"


def test_all_journals_zero_or_negative_entries(sqlite_journal_app):
    assert api.all_journals(entries=0) == []
    assert api.all_journals(entries=-5) == []


def test_all_journals_fallback_when_sqlite_disabled(fallback_journal_app):
    """
    When ENABLE_SQLITE is False, api.all_journals() falls back to file_engine.all_journals().
    """
    with patch("app.storage.api.file_engine.all_journals", wraps=file_engine.all_journals) as spy_fe:
        journals = api.all_journals(entries=3)
        assert spy_fe.called

    assert len(journals) == 3
    assert [j.wikilink for j in journals] == ["2025-05-04", "2025-05-03", "2025-05-03"]


def test_all_journals_fallback_when_sqlite_empty():
    """
    When ENABLE_SQLITE is True but the subnodes table is empty, api.all_journals()
    gracefully falls back to file_engine.all_journals().
    """
    app, temp_dir = _create_journal_agora(with_sqlite=True, reindex=False)
    try:
        with app.app_context():
            _clear_caches()
            # Ensure tables exist and subnodes is empty
            assert sqlite_engine.get_subnode_count() == 0
            with patch("app.storage.api.file_engine.all_journals", wraps=file_engine.all_journals) as spy_fe:
                journals = api.all_journals(entries=2)
                assert spy_fe.called

            assert len(journals) == 2
            assert [j.wikilink for j in journals] == ["2025-05-04", "2025-05-03"]
    finally:
        shutil.rmtree(temp_dir)


def test_journals_routes_sqlite(sqlite_journal_app):
    """
    /journals/<entries>, /journals/, and /journals/all render cleanly using SQLite
    without triggering file_engine.all_journals().
    """
    client = sqlite_journal_app.test_client()

    with patch("app.storage.api.file_engine.all_journals", side_effect=AssertionError("Should not fall back")):
        resp_5 = client.get("/journals/5")
        assert resp_5.status_code == 200
        assert b"Journal entries in the last 5 days" in resp_5.data
        assert b"2025-05-04" in resp_5.data
        assert b"2025-05-03" in resp_5.data
        assert b"2025-05-02" in resp_5.data
        assert b"2025-05-01" in resp_5.data
        assert b"2099-01-01" not in resp_5.data
        assert b"2025-05-05" not in resp_5.data

        resp_365 = client.get("/journals/365")
        assert resp_365.status_code == 200
        assert b"Journal entries in the last 365 days" in resp_365.data
        assert b"2025-05-01" in resp_365.data

        resp_default = client.get("/journals")
        assert resp_default.status_code == 200

        resp_all = client.get("/journals/all")
        assert resp_all.status_code == 200

        resp_redirect = client.get("/journals/nonexistent")
        assert resp_redirect.status_code == 302


def test_journals_routes_fallback(fallback_journal_app):
    client = fallback_journal_app.test_client()
    resp_5 = client.get("/journals/5")
    assert resp_5.status_code == 200
    assert b"Journal entries in the last 5 days" in resp_5.data
    assert b"2025-05-03" in resp_5.data
    assert b"2025-05-01" in resp_5.data
