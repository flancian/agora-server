import json
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
    Tests that an empty node page renders the 'This location is empty' state.
    """
    response = test_agora.get("/node/emptyplace")
    assert response.status_code == 200
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

