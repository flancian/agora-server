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
        # Force reload if G needs it?
        # In monolithic mode, G.nodes() loads everything.
        # But we access G.node(uri) or similar.
        yield app

    shutil.rmtree(temp_dir)

def test_push_counts(test_agora_push_duplicates):
    # This test function uses the custom fixture
    app = test_agora_push_duplicates
    
    from app.graph import G
    # Clear caches to force reload
    # G.nodes() calls _get_all_nodes_cached
    if hasattr(G._get_all_nodes_cached, 'cache_clear'):
        G._get_all_nodes_cached.cache_clear()
    
    # G.node(uri) is also cached
    if hasattr(G.node, 'cache_clear'):
        G.node.cache_clear()

    # We also need to clear G.subnodes() cache if it exists, or internal caches
    # But usually _get_all_nodes_cached is the source of truth for monolithic load.
    
    target_one = G.node("target_one")
    assert len(target_one.pushed_subnodes()) == 1, "Single push should result in 1 pushed subnode"

    target_two = G.node("target_two")
    # 2 lines, each pushing. 
    # Since the content of the lines is IDENTICAL, the serialized HTML block is identical.
    # Therefore, they are deduplicated.
    # If the user wants 2 blocks, they should differ in content.
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


