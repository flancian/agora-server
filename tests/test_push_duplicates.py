import pytest
import os
from app.graph import G

def test_push_duplicates(test_agora):
    """
    Tests for duplicate pushed subnodes.
    """
    agora_path = test_agora.application.config['AGORA_PATH']
    user_path = os.path.join(agora_path, "garden", "user1")

    # Case 1: Single push
    with open(os.path.join(user_path, "pusher.md"), "w") as f:
        f.write("- [[push]] [[target]]")
    
    # Needs to reload graph or ensure G picks up new files
    # The current G implementation (without SQLite) scans on demand or startup?
    # G.node() usually scans.
    # In test_graph.py, it seems it just works because G.node calls logic that reads files.
    # BUT, G loads everything at startup in monolithic mode.
    # The fixture creates files BEFORE app creation.
    # Here I am creating files AFTER app creation. This might fail if G caches heavily.
    # But let's try. If it fails to find node, I'll know.
    
    # Actually, the fixture yields `app.test_client()`.
    # `G` is imported from `app.graph`.
    # If G was initialized at import time or app creation, it might have stale data.
    # app/graph.py: `G = Graph()` is at module level.
    # But G's state depends on `AGORA_PATH` which is config.
    # `create_app` sets config.
    
    # If I add files *during* the test, G might not see them if it pre-loaded.
    # I should add files to the fixture or force a reload.
    
def clear_g_caches():
    from app.graph import Graph, G, Subnode
    from app import git_utils
    for cls in [Graph, G, Subnode, git_utils]:
        for name in dir(cls):
            try:
                attr = getattr(cls, name, None)
                if hasattr(attr, 'cache'):
                    attr.cache.clear()
                if hasattr(attr, 'cache_clear'):
                    attr.cache_clear()
                if hasattr(attr, '__func__') and hasattr(attr.__func__, 'cache'):
                    attr.__func__.cache.clear()
            except Exception:
                pass

@pytest.fixture
def test_agora_push_duplicates(request):
    import tempfile
    import shutil
    from app import create_app

    temp_dir = tempfile.mkdtemp()
    agora_path = temp_dir
    user1_garden_path = os.path.join(agora_path, "garden", "user1")
    os.makedirs(user1_garden_path)

    # 1. Single push
    with open(os.path.join(user1_garden_path, "single_push.md"), "w") as f:
        f.write("- [[push]] [[target_one]]\n")

    # 2. Multiple pushes on separate lines
    with open(os.path.join(user1_garden_path, "multi_push_lines.md"), "w") as f:
        f.write("- [[push]] [[target_two]]\n- [[push]] [[target_two]]\n")

    # 3. Multiple pushes on same line
    with open(os.path.join(user1_garden_path, "multi_push_line.md"), "w") as f:
        f.write("- [[push]] [[target_three]] and [[push]] [[target_three]]\n")

    # 4. Implicit push (new syntax)
    with open(os.path.join(user1_garden_path, "implicit_push.md"), "w") as f:
        f.write("- [[target_four]]!\n")

    # 5. Implicit push multiple times
    with open(os.path.join(user1_garden_path, "implicit_push_multi.md"), "w") as f:
        f.write("- [[target_five]]! and [[target_five]]!\n")

    # Dummy sources
    with open(os.path.join(agora_path, "sources.yaml"), "w") as f:
        f.write("- target: garden/user1\n  url: http://example.com/user1\n")

    app = create_app()
    app.config.update({
        "TESTING": True,
        "AGORA_PATH": agora_path,
        "ENABLE_SQLITE": False,
        "ENABLE_LAZY_LOAD": False, # Ensure monolithic behavior if that's what's used
    })

    with app.app_context():
        clear_g_caches()
        yield app

    shutil.rmtree(temp_dir)

def test_push_counts(test_agora_push_duplicates):
    # This test function uses the custom fixture
    app = test_agora_push_duplicates
    
    with app.app_context():
        clear_g_caches()
        
        target_one = G.node("target_one")
        assert len(target_one.pushed_subnodes()) == 1, "Single push should result in 1 pushed subnode"

        target_two = G.node("target_two")
        assert len(target_two.pushed_subnodes()) == 1, "Two identical lines pushing should result in 1 deduplicated pushed subnode"

    target_three = G.node("target_three")
    # 1 line, two pushes. Should be 1?
    # Same line = same block. Deduplicated.
    assert len(target_three.pushed_subnodes()) == 1, "Two pushes on one line should result in 1 pushed subnode (same block)"

    target_four = G.node("target_four")
    # Implicit push [[target_four]]!
    assert len(target_four.pushed_subnodes()) == 1, "Implicit push should result in 1 pushed subnode"

    target_five = G.node("target_five")
    # Implicit push twice on same line
    assert len(target_five.pushed_subnodes()) == 1, "Double implicit push on same line should result in 1 pushed subnode"


def test_sqlite_push_index_and_fallback(tmp_path, monkeypatch):
    """
    Tests that maintenance indexes type='push' links into SQLite and Node.pushing_nodes()
    uses the SQLite push index without scanning back_nodes(), while falling back cleanly
    on legacy DBs that have no push rows yet.
    """
    import sqlite3
    from app import create_app
    from app.storage import maintenance, sqlite_engine

    agora_path = tmp_path
    user_path = agora_path / "garden" / "user1"
    user_path.mkdir(parents=True)

    (user_path / "pusher.md").write_text("- [[push]] [[target]]\n- [[second-node]]!\n")
    (user_path / "mentioner.md").write_text("Just mentioning [[target]] without pushing.\n")
    (user_path / "target.md").write_text("Target node.\n")
    (agora_path / "sources.yaml").write_text("- target: garden/user1\n  url: http://example.com/user1\n")

    app = create_app()
    db_path = agora_path / "agora.db"
    app.config.update({
        "TESTING": True,
        "AGORA_PATH": str(agora_path),
        "SQLALCHEMY_DATABASE_URI": f"sqlite:///{db_path}?check_same_thread=false",
        "ENABLE_SQLITE": True,
        "ENABLE_LAZY_LOAD": True,
        "ENABLE_FTS": False,
    })

    with app.app_context():
        clear_g_caches()
        assert maintenance.build_cache(app)
        assert maintenance.deploy_cache(app)

        # Verify 'push' rows and indexes exist in SQLite
        with sqlite3.connect(db_path) as conn:
            push_rows = conn.execute(
                "SELECT source_node, target_node FROM links WHERE type = 'push' ORDER BY target_node"
            ).fetchall()
            assert ("pusher", "second node") in push_rows
            assert ("pusher", "target") in push_rows
            assert all(src != "mentioner" for src, _ in push_rows)

            indexes = {
                row[0]
                for row in conn.execute(
                    "SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'links'"
                ).fetchall()
            }
            assert "idx_links_target_type" in indexes
            assert "idx_links_type" in indexes

        # Ensure pushing_nodes() uses SQLite push index directly and does NOT call back_nodes()
        def fail_if_called(self):
            raise AssertionError("back_nodes() should not be called when SQLite push index is available")

        monkeypatch.setattr("app.graph.Node.back_nodes", fail_if_called)

        target = G.node("target")
        pushers = target.pushing_nodes()
        assert [n.wikilink for n in pushers] == ["pusher"]
        pushed = target.pushed_subnodes()
        assert len(pushed) == 1
        assert pushed[0].virtual_wikilink == "pusher"

        # Hyphenated URI lookup should also resolve canonical push target
        other_target = G.node("second-node")
        assert [n.wikilink for n in other_target.pushing_nodes()] == ["pusher"]

        # Memoization check: second call returns cached list
        assert target.pushed_subnodes() is pushed

        # Legacy DB fallback check: delete 'push' rows and verify fallback via back_nodes() still works
        monkeypatch.undo()
        db = sqlite_engine.get_db()
        with db:
            db.execute("DELETE FROM links WHERE type = 'push'")

        target_legacy = G.node("target")
        assert [n.wikilink for n in target_legacy.pushing_nodes()] == ["pusher"]
        assert len(target_legacy.pushed_subnodes()) == 1


