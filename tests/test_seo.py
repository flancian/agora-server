import pytest
from app import create_app

def test_sitemap_xml(test_agora):
    response = test_agora.get("/sitemap.xml")
    assert response.status_code == 200
    assert "application/xml" in response.headers["Content-Type"]
    content = response.data.decode("utf-8")
    assert "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">" in content
    assert "</urlset>" in content
    assert "foo" in content
    assert "bar" in content

def test_empty_node_returns_404_and_noindex(test_agora):
    response = test_agora.get("/nonexistent_node_xyz", follow_redirects=True)
    assert response.status_code == 404
    content = response.data.decode("utf-8")
    assert "noindex, follow" in content
    assert "rel=\"canonical\"" in content

def test_empty_async_node_returns_404(test_agora):
    response = test_agora.get("/node/nonexistent_node_xyz")
    assert response.status_code == 404

def test_production_existing_node_has_no_noindex(test_agora):
    # Under anagora.org (production), real nodes should be indexed
    test_agora.application.config["URI_BASE"] = "anagora.org"
    response = test_agora.get("/foo")
    assert response.status_code == 200
    content = response.data.decode("utf-8")
    assert "<link rel=\"canonical\" href=\"https://anagora.org/foo\" />" in content
    assert "noindex" not in content

def test_canonical_uri_base_override(test_agora):
    # Under a mirror like 0.anagora.org, canonical should point to anagora.org and 0 should have noindex
    test_agora.application.config["URI_BASE"] = "0.anagora.org"
    test_agora.application.config["CANONICAL_URI_BASE"] = "anagora.org"
    response = test_agora.get("/foo")
    assert response.status_code == 200
    content = response.data.decode("utf-8")
    assert "<link rel=\"canonical\" href=\"https://anagora.org/foo\" />" in content
    assert "<meta name=\"robots\" content=\"noindex, follow\" />" in content
