from app.graph import G

def test_node_creation_and_links(test_agora):
    """
    Tests that a node is created correctly from the test fixture's files,
    and that its forward links are parsed correctly.
    """
    # The test_agora fixture provides a client, but for this test,
    # we'll interact directly with the global G object, which is
    # configured by the app context set up in the fixture.

    # 1. Fetch the node for [[foo]]
    foo_node = G.node("foo")

    # 2. Assert that the node exists and has the correct number of subnodes
    assert foo_node is not None
    assert len(foo_node.subnodes) == 1

    # 3. Assert that the subnode has the correct content
    subnode = foo_node.subnodes[0]
    assert "This is foo" in subnode.content
    assert subnode.user == "user1"

    # 4. Assert that the forward link to [[bar]] is correctly parsed
    assert "bar" in foo_node.forward_links()

    # 5. Test the linked node as well
    bar_node = G.node("bar")
    assert bar_node is not None
    assert len(bar_node.subnodes) == 1
    assert "This is bar" in bar_node.subnodes[0].content
    assert len(bar_node.forward_links()) == 0 # bar.md has no links

    # 6. Test edges count (should have 1 edge: foo -> bar)
    assert G.n_edges() == 1

    # 7. Test backlinks (bar should have a backlink from foo)
    assert len(bar_node.back_links()) == 1
    assert "foo" in bar_node.back_links()

    # 8. Test node size
    assert foo_node.size() > 0

    # 9. Test subnode render behavior
    rendered = subnode.render()
    assert "href" in rendered  # Wikilink [[bar]] should render as a hyperlink

