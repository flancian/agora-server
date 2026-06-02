from app import create_app
from app.graph import G

app = create_app()
with app.app_context():
    n = G.node('tabs')
    print("pull_nodes count:", len(n.pull_nodes()))
    print("auto_pull_nodes count:", len(n.auto_pull_nodes()))
