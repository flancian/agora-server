from app import create_app
from app.graph import G

app = create_app()
with app.app_context():
    n = G.node('tabs')
    print("--- Diagnostics for 'tabs' ---")
    print("Subnodes:", len(n.subnodes))
    print("Backlinks:", len(n.back_links()))
    print("Forward links:", len(n.forward_links()))
    print("Pull nodes:", len(n.pull_nodes()))
    print("Auto-pull nodes:", len(n.auto_pull_nodes()))
    
    # Let's count how many iframes might be generated
    subnodes = [s for s in G.subnodes() if s.node == 'tabs']
    print(f"Total subnodes globally claiming node='tabs': {len(subnodes)}")
