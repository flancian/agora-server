import sys
import os
from flask import current_app

# Add the project root to the Python path.
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
sys.path.insert(0, project_root)

from app import create_app
from app.storage import api

def summarize_node(node_name):
    app = create_app()
    with app.app_context():
        node = api.build_node(node_name)
        print(f"\n{'='*40}")
        print(f"Node: [[{node_name}]]")
        print(f"{'='*40}")
        
        if not node.subnodes:
            print("No subnodes found.")
            return
            
        for i, subnode in enumerate(node.subnodes[:3]):
            print(f"\n--- Subnode {i+1} by @{subnode.user} ---")
            
            # Print first 5 lines
            content = getattr(subnode, 'content', '')
            if isinstance(content, bytes):
                content = content.decode('utf-8', errors='ignore')
                
            lines = content.split('\n')
            for line in lines[:5]:
                print(line.strip())
            if len(lines) > 5:
                print("...")

if __name__ == "__main__":
    nodes = ["sondages liste", "ende gelande", "think about what you re claiming for a second", "moloch", "contract"]
    for n in nodes:
        summarize_node(n)
