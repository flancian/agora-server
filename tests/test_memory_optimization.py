import pytest
from app import create_app
from app.graph import Graph

@pytest.fixture
def graph():
    """Fixture to provide a Graph instance."""
    # We use a mocked or minimal config to ensure we test the logic, 
    # but for this specific test we rely on the default behavior of Graph 
    # which should use the optimized loading path if populated.
    # Ideally, we would mock the filesystem, but here we just check the contract.
    app = create_app()
    with app.app_context():
        g = Graph()
        yield g

def test_subnode_identity_sharing(graph):
    """
    CRITICAL TEST: Verifies that Subnode objects are deduplicated in memory.
    
    The Graph architecture (in Monolithic/Production mode) relies on sharing 
    Subnode object instances between G.subnodes() and G.nodes() to save RAM.
    
    If this test fails, it means we are creating duplicate objects for the same 
    file, which will likely cause Out Of Memory (OOM) errors in production 
    (RSS > 3GB).
    """
    
    # 1. Get a node that definitely exists and has subnodes.
    # We use 'agora' or 'flancian' as they are core to the test corpus usually.
    # If the test environment is empty, we skip.
    try:
        node = graph.node('agora')
    except Exception:
        pytest.skip("Could not load node 'agora', graph might be empty.")

    if not node or not node.subnodes:
        pytest.skip("Node 'agora' has no subnodes in this environment.")

    # 2. Pick a subnode from that node
    subnode_from_node = node.subnodes[0]
    uri = subnode_from_node.uri

    # 3. Fetch the same subnode directly via the global subnode lookup
    # Graph doesn't have a direct lookup method for subnodes, so we iterate.
    # This simulates how the graph is built internally (grouping by node).
    all_subnodes = graph.subnodes()
    subnode_direct = next((s for s in all_subnodes if s.uri == uri), None)

    # 4. ASSERT: They must be the EXACT SAME python object (same memory address)
    assert subnode_direct is not None, f"Could not find subnode {uri} in G.subnodes()"
    assert subnode_from_node is subnode_direct, \
        f"MEMORY LEAK DETECTED: Subnode {uri} is duplicated! id(node.sub)={id(subnode_from_node)}, id(direct)={id(subnode_direct)}"

def test_is_journal_cache_bounded():
    """
    Verifies that we aren't using unbounded lru_cache for high-cardinality inputs.
    """
    from app.util import is_journal
    import functools
    
    # Check if the function is wrapped with a cache
    if hasattr(is_journal, 'cache_info'):
        info = is_journal.cache_info()
        # If maxsize is None, it's unbounded -> BAD.
        assert info.maxsize is not None, "is_journal cache is unbounded! This causes memory leaks."
