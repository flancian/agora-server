#!/usr/bin/env python3
# Copyright 2026 Google LLC & The Agora Authors
#
# Deep-dive traffic & pattern analysis for production Agora uWSGI logs:
#   - Top concept nodes (aggregated across direct, /node, /context, /graph)
#   - Top user gardens (@user) and top user subnodes (@user/node)
#   - Search queries and live search patterns (?q=..., /fullsearch/..., /api/search/live)
#   - Top client IPs and crawler vs human traffic profile
#   - Tool / exec calls (/exec/wt, etc.)
#   - Response statuses and slowest node renders
#
# Usage:
#   python scripts/debug/analyze_top_patterns.py [logfile]
#
import sys
import os
import re
from urllib.parse import unquote, parse_qs, urlparse
from collections import Counter, defaultdict


STATIC_AND_SYSTEM_ROUTES = {
    '', 'index', 'today', 'latest', 'users', 'nodes', 'journals',
    'federation', 'settings', 'static', 'api', 'exec', 'fullsearch',
    'search', 'jump', 'go', 'wander', 'random', 'pull', 'raw',
    'subnode', 'node', 'context', 'graph', 'feed', 'u', 'user',
    'push', 'lucky', 'favicon.ico', 'robots.txt', 'sitemap.xml',
    'css', 'js', 'fonts', 'img', 'images', 'health', 'ping', 'asset'
}


def canonical_node_name(name):
    clean = unquote(name).strip().lower()
    clean = re.sub(r'\.(md|org|txt|html|myco)$', '', clean)
    clean = re.sub(r'[\s_]+', ' ', clean).strip()
    return clean


def analyze(filepath):
    print(f"\n======================================================================")
    print(f"ANALYZING TRAFFIC PATTERNS: {filepath}")
    file_size_mb = os.path.getsize(filepath) / (1024 * 1024)
    print(f"File Size: {file_size_mb:.2f} MB")
    print(f"======================================================================\n")

    # Pattern matches:
    # [pid: ...|req: ...] <IP> () {vars} [<Date>] <Method> <URI> => generated <bytes> in <latency> msecs (<status>)
    line_pattern = re.compile(
        r'\]\s+([0-9a-fA-F\.:]+)\s+\(\)\s+\{[^}]*\}\s+'
        r'\[([A-Za-z]{3}\s+[A-Za-z]{3}\s+\d+\s+\d{2}:\d{2}:\d{2}\s+\d{4})\]\s+'
        r'(GET|POST|HEAD|PUT|DELETE|OPTIONS)\s+([^\s]+)\s+=>\s+'
        r'generated\s+(\d+)\s+bytes\s+in\s+(\d+)\s+msecs\s+'
        r'\((?:HTTP/\d\.\d\s+)?(\d{3})\)'
    )

    node_counter = Counter()
    user_counter = Counter()
    subnode_counter = Counter()
    search_queries = Counter()
    live_searches = Counter()
    exec_tools = Counter()
    ip_counter = Counter()
    slow_nodes = defaultdict(list)
    
    total_parsed = 0

    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            if '=> generated' not in line:
                continue

            m = line_pattern.search(line)
            if not m:
                continue

            ip, ts_str, method, uri, bytes_gen, latency_ms, status_str = m.groups()
            total_parsed += 1
            status = int(status_str)
            latency = int(latency_ms)

            ip_counter[ip] += 1

            parsed_uri = urlparse(uri)
            path = parsed_uri.path
            query_str = parsed_uri.query

            # Check search queries in query param
            if query_str:
                qs = parse_qs(query_str)
                if 'q' in qs:
                    for q_val in qs['q']:
                        q_clean = q_val.strip()
                        if q_clean:
                            search_queries[q_clean.lower()] += 1

            # Categorize path
            parts = [p for p in path.split('/') if p]

            if path.startswith('/api/search/live'):
                if query_str:
                    qs = parse_qs(query_str)
                    if 'q' in qs:
                        for q_val in qs['q']:
                            if q_val.strip():
                                live_searches[q_val.strip().lower()] += 1
                continue

            if path.startswith('/fullsearch'):
                if len(parts) > 1:
                    term = unquote(parts[1]).strip().lower()
                    if term:
                        search_queries[term] += 1
                continue

            if path.startswith('/exec/'):
                if len(parts) > 1:
                    tool_name = parts[1]
                    target = '/'.join(parts[2:]) if len(parts) > 2 else ''
                    exec_tools[tool_name] += 1
                    if target:
                        c_target = canonical_node_name(target)
                        if c_target:
                            node_counter[c_target] += 1
                continue

            if path.startswith('/@'):
                # User garden path: /@user or /@user/node
                if parts:
                    user_part = parts[0][1:] # remove @
                    user_counter[user_part] += 1
                    if len(parts) > 1:
                        sn_name = canonical_node_name('/'.join(parts[1:]))
                        if sn_name:
                            subnode_counter[f"@{user_part}/{sn_name}"] += 1
                            node_counter[sn_name] += 1
                continue

            if path.startswith('/node/') or path.startswith('/context/') or path.startswith('/push/'):
                if len(parts) > 1:
                    n_name = canonical_node_name('/'.join(parts[1:]))
                    if n_name:
                        node_counter[n_name] += 1
                        if latency > 1000 and status == 200:
                            slow_nodes[n_name].append(latency)
                continue

            if path.startswith('/graph/'):
                # /graph/<node> or /graph/json/<node>
                if len(parts) > 2 and parts[1] == 'json':
                    n_name = canonical_node_name('/'.join(parts[2:]))
                    if n_name:
                        node_counter[n_name] += 1
                elif len(parts) > 1:
                    n_name = canonical_node_name('/'.join(parts[1:]))
                    if n_name:
                        node_counter[n_name] += 1
                continue

            if path.startswith('/raw/') or path.startswith('/subnode/'):
                if len(parts) > 1:
                    sn_part = '/'.join(parts[1:])
                    # Subnode can be @user/node or just node
                    if sn_part.startswith('@'):
                        sub_parts = sn_part.split('/')
                        u_name = sub_parts[0][1:]
                        user_counter[u_name] += 1
                        if len(sub_parts) > 1:
                            subnode_counter[f"@{u_name}/{canonical_node_name('/'.join(sub_parts[1:]))}"] += 1
                    n_name = canonical_node_name(parts[-1])
                    if n_name:
                        node_counter[n_name] += 1
                continue

            # Direct concept node: GET /<node>
            if len(parts) == 1:
                first_part = parts[0].lower()
                if first_part not in STATIC_AND_SYSTEM_ROUTES and not first_part.startswith('.'):
                    c_name = canonical_node_name(parts[0])
                    if c_name:
                        node_counter[c_name] += 1
                        if latency > 1000 and status == 200:
                            slow_nodes[c_name].append(latency)

    print(f"Total Requests Processed: {total_parsed:,}")
    print(f"Unique Concept Nodes Requested: {len(node_counter):,}")
    print(f"Unique User Gardens Requested: {len(user_counter):,}")
    print(f"Unique Specific Subnodes Requested: {len(subnode_counter):,}")
    print(f"Unique Search Queries: {len(search_queries):,}")
    print(f"Unique Client IPs: {len(ip_counter):,}")

    # 1. Top 50 Concept Nodes
    print(f"\n======================================================================")
    print(f"TOP 50 MOST ACCESSED CONCEPT NODES (Across all views)")
    print(f"======================================================================")
    for idx, (node, count) in enumerate(node_counter.most_common(50), 1):
        print(f" {idx:2d}. {count:7,d}x  [[{node}]]")

    # 2. Top 25 User Gardens
    print(f"\n======================================================================")
    print(f"TOP 25 USER DIGITAL GARDENS (Contributor Profiles)")
    print(f"======================================================================")
    for idx, (user, count) in enumerate(user_counter.most_common(25), 1):
        print(f" {idx:2d}. {count:7,d}x  @{user}")

    # 3. Top 35 Specific Subnodes
    print(f"\n======================================================================")
    print(f"TOP 35 SPECIFIC SUBNODES (@user/node)")
    print(f"======================================================================")
    for idx, (sn, count) in enumerate(subnode_counter.most_common(35), 1):
        print(f" {idx:2d}. {count:7,d}x  {sn}")

    # 4. Top Search Queries
    print(f"\n======================================================================")
    print(f"TOP 40 SEARCH QUERIES & MINI-CLI SEARCHES")
    print(f"======================================================================")
    for idx, (query, count) in enumerate(search_queries.most_common(40), 1):
        print(f" {idx:2d}. {count:6,d}x  \"{query}\"")

    if live_searches:
        print(f"\n--- TOP LIVE SEARCH (MINI-CLI KEYSTROKE) QUERIES ---")
        for idx, (query, count) in enumerate(live_searches.most_common(20), 1):
            print(f" {idx:2d}. {count:6,d}x  \"{query}\"")

    # 5. Tool / Exec Usage
    print(f"\n======================================================================")
    print(f"TOOL & EXEC INVOCATIONS (/exec/*)")
    print(f"======================================================================")
    for tool, count in exec_tools.most_common():
        print(f"  {tool:<20} : {count:7,d} requests")

    # 6. Top Client IPs / Crawlers
    print(f"\n======================================================================")
    print(f"TOP 25 CLIENT IPS (Crawlers, Bots & User Concentration)")
    print(f"======================================================================")
    for idx, (ip, count) in enumerate(ip_counter.most_common(25), 1):
        pct = (count / total_parsed) * 100
        # Simple heuristic classification
        crawler_type = "Unknown"
        if ip.startswith("66.249."):
            crawler_type = "Googlebot"
        elif ip.startswith("116.179.") or ip.startswith("220.181.") or ip.startswith("180.76."):
            crawler_type = "Baiduspider"
        elif ip.startswith("40.77.") or ip.startswith("157.55.") or ip.startswith("20.171."):
            crawler_type = "Bingbot"
        elif ip.startswith("199.16.") or ip.startswith("54.") or ip.startswith("3.") or ip.startswith("18."):
            crawler_type = "AWS / Cloud / Bot"
        elif ip.startswith("51.68.") or ip.startswith("51.89."):
            crawler_type = "OVH Crawler / Host"
        elif ip.startswith("127.0.0.1") or ip == "::1":
            crawler_type = "Localhost"
        
        print(f" {idx:2d}. {ip:<18} : {count:7,d} reqs ({pct:4.1f}%) [{crawler_type}]")

    # 7. Slowest Nodes to Render (>1s)
    if slow_nodes:
        print(f"\n======================================================================")
        print(f"TOP 15 SLOWEST NODES TO RENDER (>1s)")
        print(f"======================================================================")
        slow_summary = []
        for node, lats in slow_nodes.items():
            slow_summary.append((len(lats), sum(lats)/len(lats), max(lats), node))
        slow_summary.sort(key=lambda x: (x[0], x[2]), reverse=True)
        for count, avg_lat, max_lat, node in slow_summary[:15]:
            print(f"  {count:4d}x >1s (avg: {avg_lat:.0f}ms, max: {max_lat}ms)  [[{node}]]")


if __name__ == '__main__':
    log_file = sys.argv[1] if len(sys.argv) > 1 else 'logs/uwsgi_latest.log'
    analyze(log_file)
