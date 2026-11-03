import json
from unittest.mock import patch, MagicMock
import pytest
from app.graph import G

def test_index_route(test_agora):
    """
    Tests that the index page renders successfully and contains site identity.
    """
    response = test_agora.get("/")
    assert response.status_code == 200
    assert b"Agora" in response.data

def test_node_route(test_agora):
    """
    Tests that a populated node page loads correctly and displays subnode contents.
    """
    # foo is created in conftest.py
    response = test_agora.get("/node/foo")
    assert response.status_code == 200
    assert b"This is foo" in response.data
    assert b"user1" in response.data

def test_empty_node_route(test_agora):
    """
    Tests that an empty node page renders the 'This location is empty' state with HTTP 404.
    """
    response = test_agora.get("/node/emptyplace")
    assert response.status_code == 404
    assert b"empty" in response.data
    assert b"play a minigame" in response.data

def test_user_node_route(test_agora):
    """
    Tests that user-specific subnode pages load properly.
    """
    # The main page /@user1/foo uses progressive/async loading
    response = test_agora.get("/@user1/foo")
    assert response.status_code == 200
    assert b"async-content" in response.data
    assert b"foo?user=user1" in response.data

    # The actual content is fetched asynchronously by the client
    content_res = test_agora.get("/node/foo?user=user1")
    assert content_res.status_code == 200
    assert b"This is foo" in content_res.data


def test_nodeinfo_endpoint(test_agora):
    """
    Tests that the NodeInfo JSON endpoint serves correct configuration metadata.
    """
    response = test_agora.get("/nodeinfo/2.0")
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data["metadata"]["maintainer"]["name"] == "flancian"
    assert "bluesky" in data["metadata"]["services"]

def test_random_redirect(test_agora):
    """
    Tests that /random performs a redirect (302) to another node.
    """
    response = test_agora.get("/random")
    assert response.status_code == 302
    assert "Location" in response.headers

def test_go_redirect_fallback(test_agora):
    """
    Tests that /go/<node> redirects to Google search if no go link exists.
    """
    response = test_agora.get("/go/nonexistent_go_node")
    assert response.status_code == 302
    assert "https://www.google.com/search?q=nonexistent_go_node" in response.headers["Location"]

def test_lucky_redirect(test_agora):
    """
    Tests that /lucky/<node> resolves Google I'm Feeling Lucky and redirects to target.
    """
    mock_resp = MagicMock()
    mock_resp.status_code = 302
    mock_resp.headers = {"Location": "https://www.google.com/url?q=https://flancia.org/"}
    with patch("requests.get", return_value=mock_resp):
        response = test_agora.get("/lucky/flancia")
        assert response.status_code == 302
        assert response.headers["Location"] == "https://flancia.org/"

def test_lucky_redirect_fallback(test_agora):
    """
    Tests that /lucky/<node> falls back to Google search on network/lookup error.
    """
    with patch("requests.get", side_effect=Exception("network error")):
        response = test_agora.get("/lucky/flancia")
        assert response.status_code == 302
        assert "https://www.google.com/search?q=flancia" in response.headers["Location"]

def test_rss_feeds(test_agora):
    """
    Tests that RSS feed endpoints return valid XML feed data.
    """
    # 1. Latest changes feed
    res_latest = test_agora.get("/feed/latest")
    assert res_latest.status_code == 200
    assert "xml" in res_latest.content_type or "rss" in res_latest.content_type
    assert b"latest updates" in res_latest.data
    assert b"flancian@flancia.org" in res_latest.data  # Configured default email

    # 2. Node-specific feed
    res_node = test_agora.get("/feed/foo")
    assert res_node.status_code == 200
    assert b"Agora feed for node [[foo]]" in res_node.data

    # 3. User-specific feed
    res_user = test_agora.get("/feed/@user1")
    assert res_user.status_code == 200
    assert b"Agora feed for user @user1" in res_user.data


def test_vote_route(test_agora):
    """
    Tests that /vote and /vote/<node> render the dashboard and deliberation views.
    """
    # 1. Bare /vote renders the Agora Deliberation & Voting Dashboard
    res_dash = test_agora.get("/vote")
    assert res_dash.status_code == 200
    assert b"Agora Deliberation" in res_dash.data
    assert b"Active Ballots" in res_dash.data

    # 2. Bare /vote JSON API
    res_dash_json = test_agora.get("/vote", headers={"Accept": "application/json"})
    assert res_dash_json.status_code == 200
    dash_data = json.loads(res_dash_json.data)
    assert "topics" in dash_data
    assert "total_topics" in dash_data

    # 3. Topic HTML view test
    res = test_agora.get("/vote/foo")
    assert res.status_code == 200
    assert b"Deliberation &amp; Voting on" in res.data or b"Deliberation & Voting on" in res.data
    assert b"For / Assent" in res.data
    assert b"Against / Block" in res.data
    assert b"Node" in res.data  # Transcluded matching node

    # 4. Topic JSON API view test
    res_json = test_agora.get("/vote/foo", headers={"Accept": "application/json"})
    assert res_json.status_code == 200
    data = json.loads(res_json.data)
    assert data["node"] == "foo"
    assert "counts" in data
    assert "for" in data["counts"]
    assert "against" in data["counts"]

    # 5. Executable subnode route /exec/vote
    res_exec = test_agora.get("/exec/vote/foo")
    assert res_exec.status_code == 200
    assert b"Deliberation on" in res_exec.data


def test_outbox_endpoint(test_agora):
    """
    Tests that the global /outbox endpoint returns a valid ActivityPub OrderedCollection.
    """
    response = test_agora.get("/outbox")
    assert response.status_code == 200
    assert "application/activity+json" in response.headers.get("Content-Type", "")
    data = json.loads(response.data)
    assert data["@context"] == "https://www.w3.org/ns/activitystreams"
    assert data["type"] == "OrderedCollection"
    assert data["totalItems"] == 0
    assert data["orderedItems"] == []


def test_rss_feeds_sanitization(test_agora):
    """
    Tests that RSS generation sanitizes control characters and null bytes without raising ValueError.
    """
    from app.storage.feed import sanitize_xml, node_rss
    # 1. Direct test of sanitize_xml
    dirty = "Hello\x00 World\x08!\x0c\x1fValid\n\tText"
    clean = sanitize_xml(dirty)
    assert clean == "Hello World!Valid\n\tText"
    assert "\x00" not in clean
    assert "\x08" not in clean
    assert "\x0c" not in clean
    assert "\x1f" not in clean

    # 2. Test node_rss with a subnode containing illegal XML control characters
    mock_subnode = MagicMock()
    mock_subnode.uri = "@testuser/bad-chars\x00.md"
    mock_subnode.user = "testuser"
    mock_subnode.node = "bad-node"
    mock_subnode.wikilink = "bad-node"
    mock_subnode.content = "Broken\x00 content\x0b with\x0c control\x1e chars"

    mock_node = MagicMock()
    mock_node.wikilink = "bad-node"
    mock_node.subnodes = [mock_subnode]

    rss_xml = node_rss(mock_node)
    assert isinstance(rss_xml, (str, bytes))
    if isinstance(rss_xml, bytes):
        assert b"Broken content with control chars" in rss_xml
        assert b"\x00" not in rss_xml
    else:
        assert "Broken content with control chars" in rss_xml
        assert "\x00" not in rss_xml

def test_subnode_heading_anchors(test_agora):
    """Verifies that markdown headings render with an anchor and slug ID."""
    from app import render
    output = render.markdown("# The Quiet Revolution\n## Chapter One")
    assert 'id="the-quiet-revolution"' in output
    assert 'class="heading-anchor"' in output
    assert 'href="#the-quiet-revolution"' in output
    assert 'id="chapter-one"' in output
    assert 'href="#chapter-one"' in output

def test_subnode_maximize_button(test_agora):
    """Verifies subnode maximize button and embed ancillary zippy are present."""
    response = test_agora.get("/node/foo")
    assert response.status_code == 200
    content = response.data.decode("utf-8")
    assert "subnode-maximize-btn" in content
    
    # Check embed view has the ancillary zippy
    embed_response = test_agora.get("/embed/foo")
    assert embed_response.status_code == 200
    embed_content = embed_response.data.decode("utf-8")
    assert "embed-ancillary-zippy" in embed_content

def test_navbar_autoscroll_and_action_bar_buttons(test_agora):
    """Verifies navbar autoscroll toggle and dynamic action bar buttons."""
    response = test_agora.get("/foo")
    assert response.status_code == 200
    content = response.data.decode("utf-8")

    # Autoscroll navbar switch
    assert "autoscroll-switch" in content
    assert 'id="autoscroll-checkbox"' in content

    # Action bar presence and dynamic classes
    assert 'id="mini-cli-exec"' in content
    assert 'id="mini-cli-go"' in content
    assert 'id="expand-all"' in content
    assert 'id="collapse-all"' in content
    assert 'id="mini-cli-write"' in content
    assert 'id="mini-cli-pull" class="action-bar-btn-dynamic"' in content
    assert 'id="mini-cli-synthesize" class="action-bar-btn-dynamic"' in content
    assert 'id="mini-cli-look-around" class="action-bar-btn-dynamic"' in content
    assert 'id="mini-cli-wander" class="action-bar-btn-dynamic"' in content
    assert 'id="mini-cli-go-beyond" class="action-bar-btn-dynamic"' in content
    assert 'id="mini-cli-play" class="action-bar-btn-dynamic"' in content
    assert 'id="mini-cli-meditate" class="action-bar-btn-dynamic"' in content
    assert 'id="mini-cli-join" class="action-bar-btn-dynamic"' in content

    # Button order: search -> go -> go beyond -> expand -> collapse -> look -> wander -> synthesize -> write -> join -> meditate -> play
    search_pos = content.find('id="mini-cli-exec"')
    go_pos = content.find('id="mini-cli-go"')
    beyond_pos = content.find('id="mini-cli-go-beyond"')
    expand_pos = content.find('id="expand-all"')
    collapse_pos = content.find('id="collapse-all"')
    look_pos = content.find('id="mini-cli-look-around"')
    wander_pos = content.find('id="mini-cli-wander"')
    synthesize_pos = content.find('id="mini-cli-synthesize"')
    write_pos = content.find('id="mini-cli-write"')
    join_pos = content.find('id="mini-cli-join"')
    meditate_pos = content.find('id="mini-cli-meditate"')
    play_pos = content.find('id="mini-cli-play"')

    # Emojis and titles
    assert "🏃‍♀️ Auto Scroll" in content
    assert "🧘 Meditate" in content
    assert "🧘 Agora Meditation" in content
    assert "⊞ expand" in content
    assert "⊟ collapse" in content

    # Navbar toggle sequence: theme -> music -> autoscroll
    theme_pos = content.find('class="theme-switch"')
    music_pos = content.find('class="music-switch"')
    autoscroll_pos = content.find('class="autoscroll-switch"')
    assert theme_pos < music_pos < autoscroll_pos

    assert search_pos < go_pos < beyond_pos < expand_pos < collapse_pos < look_pos < wander_pos < synthesize_pos < write_pos < join_pos < meditate_pos < play_pos



