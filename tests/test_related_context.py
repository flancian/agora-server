import os
import shutil
import tempfile
import pytest
from app import create_app, util
from app.graph import Graph, G, Subnode


@pytest.fixture
def related_agora():
    temp_dir = tempfile.mkdtemp()
    garden = os.path.join(temp_dir, "garden", "alice")
    os.makedirs(garden)

    with open(os.path.join(garden, "waterfall charts.md"), "w") as f:
        f.write("# Waterfall Charts\n")

    with open(os.path.join(garden, "waterfall chart.md"), "w") as f:
        f.write("# Waterfall Chart\n- [[go]] https://en.wikipedia.org/wiki/Waterfall_chart\n")

    with open(os.path.join(garden, "bar.md"), "w") as f:
        f.write("Links to [[foo]].\n")

    with open(os.path.join(garden, "foo.md"), "w") as f:
        f.write("A foo node.\n")

    with open(os.path.join(temp_dir, "sources.yaml"), "w") as f:
        f.write("- target: garden/alice\n  url: https://example.com/alice\n")

    app = create_app()
    app.config.update({
        "TESTING": True,
        "AGORA_PATH": temp_dir,
        "ENABLE_SQLITE": False,
        "ENABLE_LAZY_LOAD": False,
    })

    with app.app_context():
        for cls in [Graph, G, Subnode]:
            for name in dir(cls):
                try:
                    attr = getattr(cls, name, None)
                    if hasattr(attr, "cache"):
                        attr.cache.clear()
                    if hasattr(attr, "cache_clear"):
                        attr.cache_clear()
                    if hasattr(attr, "__func__") and hasattr(attr.__func__, "cache"):
                        attr.__func__.cache.clear()
                except Exception:
                    pass
        yield app

    shutil.rmtree(temp_dir)


def test_singular_plural_variants():
    assert "waterfall chart" in util.singular_plural_variants("waterfall charts")
    assert "waterfall charts" in util.singular_plural_variants("waterfall chart")
    assert "city" in util.singular_plural_variants("cities")
    assert "cities" in util.singular_plural_variants("city")
    assert "box" in util.singular_plural_variants("boxes")
    assert "boxes" in util.singular_plural_variants("box")
    # Short words should not be mangled by stripping trailing 's'
    assert "ga" not in util.singular_plural_variants("gas")
    assert "bu" not in util.singular_plural_variants("bus")


def test_waterfall_charts_context_and_forward_links_label(related_agora):
    client = related_agora.test_client()
    resp = client.get("/context/waterfall-charts")
    assert resp.status_code == 200
    assert b"No context found." not in resp.data
    assert b"Forward links" in resp.data
    assert b"Outlinks" not in resp.data
    assert b"Related" in resp.data
    assert b"waterfall chart" in resp.data


def test_graph_json_emits_related_edges(related_agora):
    client = related_agora.test_client()
    resp = client.get("/graph/json/waterfall-charts")
    assert resp.status_code == 200
    data = resp.get_json()

    node_ids = {n["id"]: n for n in data["nodes"]}
    assert "waterfall charts" in node_ids
    assert "related" in node_ids
    assert "waterfall chart" in node_ids
    assert node_ids["related"]["group"] == 9
    assert node_ids["waterfall chart"]["group"] == 10

    related_edges = [e for e in data["links"] if e.get("type") == "related"]
    assert {"source": "waterfall charts", "target": "related", "type": "related"} in related_edges
    assert {"source": "related", "target": "waterfall chart", "type": "related"} in related_edges
