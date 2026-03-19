import collections
import re
import sys
from urllib.parse import unquote

def analyze(log_file):
    print(f"Parsing {log_file} for most accessed nodes/subnodes...")
    
    node_counter = collections.Counter()
    total_requests = 0
    
    with open(log_file, 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            if '=> generated' in line:
                # Look for GET requests to node-like paths
                # e.g., GET /node/foo => generated...
                # e.g., GET /context/foo => ...
                # e.g., GET /@user/foo => ...
                
                m = re.search(r'\] GET (/[^? \n]+)', line)
                if m:
                    path = m.group(1)
                    
                    # Check if it's a node, context, subnode, raw, or user path
                    if path.startswith('/node/') or path.startswith('/context/') or path.startswith('/raw/') or path.startswith('/subnode/') or path.startswith('/@'):
                        
                        # Extract the actual node/subnode name
                        parts = path.split('/')
                        if path.startswith('/@'):
                            # /@user/node -> parts: ['', '@user', 'node']
                            if len(parts) > 2:
                                node_name = '/'.join(parts[2:])
                                node_name = unquote(node_name).lower()
                                node_counter[node_name] += 1
                        else:
                            # /node/foo -> parts: ['', 'node', 'foo']
                            if len(parts) > 2:
                                node_name = '/'.join(parts[2:])
                                node_name = unquote(node_name).lower()
                                node_counter[node_name] += 1
                                
                    total_requests += 1

    if not node_counter:
        print("No node requests found.")
        return

    print(f"\n--- Top 50 Most Accessed Nodes (out of {sum(node_counter.values())} node-related requests) ---")
    for node, count in node_counter.most_common(50):
        # Clean up the output a bit
        display_name = node.replace('.md', '').replace('.org', '')
        print(f"{count:6d}x [[{display_name}]]")

if __name__ == '__main__':
    log_file = sys.argv[1] if len(sys.argv) > 1 else 'uwsgi.log'
    analyze(log_file)
