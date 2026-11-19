import os
import shutil
import tempfile
import pytest
from app import create_app, util
from app.graph import Graph, G, Subnode, User, subnodes_by_user
from app.storage import file_engine


@pytest.fixture
def container_agora():
    temp_dir = tempfile.mkdtemp()

    # 1. Standard garden with a topical subdirectory (NOT multiuser)
    os.makedirs(os.path.join(temp_dir, "garden", "alice", "journal"))
    with open(os.path.join(temp_dir, "garden", "alice", "journal", "hello.md"), "w") as f:
        f.write("Alice's note in a subfolder.")

    # 2. Friends mount (friends/<source>/<file>.md)
    os.makedirs(os.path.join(temp_dir, "friends", "hackuarium"))
    with open(os.path.join(temp_dir, "friends", "hackuarium", "Foldscope.md"), "w") as f:
        f.write("DIY paper microscope from Hackuarium.")

    os.makedirs(os.path.join(temp_dir, "friends", "gaudilabs"))
    with open(os.path.join(temp_dir, "friends", "gaudilabs", "OpenDrop.md"), "w") as f:
        f.write("Digital microfluidics from GaudiLabs.")

    # 3. Multiuser container repo (Christopher Alexander book club / patterning)
    os.makedirs(os.path.join(temp_dir, "garden", "patterning", "Simon"))
    os.makedirs(os.path.join(temp_dir, "garden", "patterning", "Jonathan"))
    os.makedirs(os.path.join(temp_dir, "garden", "patterning", "images"))
    with open(os.path.join(temp_dir, "garden", "patterning", "README.md"), "w") as f:
        f.write("Reading Christopher Alexander together.")
    with open(os.path.join(temp_dir, "garden", "patterning", "Simon", "window-place.md"), "w") as f:
        f.write("Simon's thoughts on window place.")
    with open(os.path.join(temp_dir, "garden", "patterning", "Jonathan", "window-place.md"), "w") as f:
        f.write("Jonathan's thoughts on window place.")
    with open(os.path.join(temp_dir, "garden", "patterning", "images", "diagram.md"), "w") as f:
        f.write("Asset note in ignored directory.")

    sources_config = [
        {"target": "garden/alice", "url": "https://example.com/alice"},
        {
            "target": "friends/hackuarium",
            "url": "https://wiki.hackuarium.ch/api.php",
            "web": "https://wiki.hackuarium.ch/w/{slug}",
            "format": "mediawiki",
        },
        {
            "target": "friends/gaudilabs",
            "url": "https://www.gaudi.ch/GaudiLabs/",
            "web": "https://www.gaudi.ch/GaudiLabs/{slug}",
            "format": "website",
        },
        {
            "target": "garden/patterning",
            "url": "https://github.com/JonathanLorand/patterning.git",
            "format": "stoa",
            "multiuser": True,
        },
    ]

    app = create_app()
    app.config.update({
        "TESTING": True,
        "AGORA_PATH": temp_dir,
        "ENABLE_SQLITE": False,
        "SOURCES_CONFIG": sources_config,
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


def test_friends_mount_attribution_and_web_links(container_agora):
    agora_path = container_agora.config["AGORA_PATH"]
    path = os.path.join(agora_path, "friends", "hackuarium", "Foldscope.md")

    assert util.path_to_user(path) == "hackuarium@friends"
    assert util.path_to_garden_relative(path, agora_path) == "Foldscope.md"

    sn = Subnode(path)
    assert sn.user == "hackuarium@friends"
    assert sn.web == "https://wiki.hackuarium.ch/w/Foldscope"

    u = User("hackuarium@friends")
    assert u.container == "friends"
    assert u.repo_url == "https://wiki.hackuarium.ch/api.php"


def test_standard_garden_subdirs_remain_single_user(container_agora):
    agora_path = container_agora.config["AGORA_PATH"]
    path = os.path.join(agora_path, "garden", "alice", "journal", "hello.md")

    assert util.path_to_user(path) == "alice"
    assert util.path_to_garden_relative(path, agora_path) == "journal/hello.md"


def test_multiuser_container_attribution(container_agora):
    agora_path = container_agora.config["AGORA_PATH"]
    simon_path = os.path.join(agora_path, "garden", "patterning", "Simon", "window-place.md")
    jonathan_path = os.path.join(agora_path, "garden", "patterning", "Jonathan", "window-place.md")
    readme_path = os.path.join(agora_path, "garden", "patterning", "README.md")
    ignored_dir_path = os.path.join(agora_path, "garden", "patterning", "images", "diagram.md")

    assert util.path_to_user(simon_path) == "Simon@patterning"
    assert util.path_to_user(jonathan_path) == "Jonathan@patterning"
    assert util.path_to_user(readme_path) == "patterning"
    assert util.path_to_user(ignored_dir_path) == "patterning"


def test_container_aggregation_and_routes(container_agora):
    all_u = {u.uri for u in file_engine.all_users()}
    assert "friends" in all_u
    assert "hackuarium@friends" in all_u
    assert "gaudilabs@friends" in all_u
    assert "patterning" in all_u
    assert "Simon@patterning" in all_u
    assert "Jonathan@patterning" in all_u
    assert "images@patterning" not in all_u

    friends_user = User("friends")
    member_uris = [m.uri for m in friends_user.members()]
    assert member_uris == ["gaudilabs@friends", "hackuarium@friends"]
    assert len(subnodes_by_user("friends")) == 2

    client = container_agora.test_client()

    # Container page /@friends shows members and aggregated contributions
    resp = client.get("/@friends")
    assert resp.status_code == 200
    assert b"hackuarium@friends" in resp.data
    assert b"gaudilabs@friends" in resp.data
    assert b"Foldscope" in resp.data
    assert b"OpenDrop" in resp.data

    # Member page /@hackuarium@friends shows backlink to @friends container
    resp_member = client.get("/@hackuarium@friends")
    assert resp_member.status_code == 200
    assert b"Container:" in resp_member.data
    assert b"/@friends" in resp_member.data

    # Multiuser container node projection /node/@patterning/window-place shows both Simon and Jonathan
    resp_proj = client.get("/node/@patterning/window-place")
    assert resp_proj.status_code == 200
    assert b"Simon@patterning" in resp_proj.data
    assert b"Jonathan@patterning" in resp_proj.data
    assert b"thoughts on window place." in resp_proj.data
