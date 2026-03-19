import collections
import re
import sys
from urllib.parse import unquote
from datetime import datetime

def analyze(log_file):
    print(f"Parsing {log_file} for day-to-day comparison...")
    
    day1_counter = collections.Counter()
    day2_counter = collections.Counter()
    
    with open(log_file, 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            if '=> generated' in line:
                # Extract date and path
                date_match = re.search(r'\[([^\]]+)\] (?:GET|POST|HEAD|OPTIONS|PUT|DELETE) (/[^? \n]+)', line)
                if date_match:
                    date_str = date_match.group(1)
                    path = date_match.group(2)
                    
                    if path.startswith('/node/') or path.startswith('/context/') or path.startswith('/raw/') or path.startswith('/subnode/') or path.startswith('/@'):
                        parts = path.split('/')
                        node_name = ""
                        if path.startswith('/@'):
                            if len(parts) > 2:
                                node_name = '/'.join(parts[2:])
                        else:
                            if len(parts) > 2:
                                node_name = '/'.join(parts[2:])
                        
                        if node_name:
                            node_name = unquote(node_name).lower()
                            
                            # Just look at the date string string: 'Tue Mar 17' vs 'Wed Mar 18'
                            if 'Mar 17' in date_str:
                                day1_counter[node_name] += 1
                            elif 'Mar 18' in date_str:
                                day2_counter[node_name] += 1

    print(f"\n--- Top 20 Nodes: March 17 (out of {sum(day1_counter.values())} requests) ---")
    for node, count in day1_counter.most_common(20):
        print(f"{count:6d}x [[{node.replace('.md', '').replace('.org', '')}]]")

    print(f"\n--- Top 20 Nodes: March 18 (out of {sum(day2_counter.values())} requests) ---")
    for node, count in day2_counter.most_common(20):
        print(f"{count:6d}x [[{node.replace('.md', '').replace('.org', '')}]]")

if __name__ == '__main__':
    log_file = sys.argv[1] if len(sys.argv) > 1 else 'uwsgi.log'
    analyze(log_file)
