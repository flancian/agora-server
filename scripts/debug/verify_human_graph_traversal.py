#!/usr/bin/env python3
"""
verify_human_graph_traversal.py

Analyzes Nginx access logs against the Agora knowledge graph (from SQLite agora.db)
to determine whether visitors with browser User-Agents are genuinely navigating
the Agora knowledge graph (following forward links, backlinks, subnodes) vs.
behaving as automated scrapers, scanners, or bots.

Usage:
    python3 scripts/debug/verify_human_graph_traversal.py [log_file] [db_file]
"""

import sys
import os
import re
import sqlite3
from urllib.parse import unquote, urlparse
from collections import defaultdict, Counter
from datetime import datetime

DEFAULT_LOG = "logs/nginx_access_20261008.log"
DEFAULT_DB = "/home/flancian/agora/agora.db"

KNOWN_BOT_SUBSTRINGS = [
    "bot", "crawler", "spider", "slurp", "facebookexternalhit",
    "whatsapp", "telegram", "slackbot", "twitterbot", "applebot",
    "semrush", "ahrefs", "dotbot", "petalbot", "linkupbot",
    "bytespider", "baiduspider", "sogou", "amazonbot", "yandex",
    "bingpreview", "reflectionbot", "deepscan", "censys", "netcraft",
    "python", "curl", "wget", "httpclient", "go-http-client", "aiohttp",
    "headlesschrome", "scrapy", "node-fetch", "libredtail"
]

FEDIVERSE_SUBSTRINGS = [
    "mastodon", "akkoma", "pleroma", "misskey", "activitypub", "hypothesis"
]

SCANNER_EXTENSIONS = (
    ".php", ".asp", ".aspx", ".env", ".git", ".yaml", ".yml",
    ".bak", ".sql", ".ini", ".conf", ".action", ".do", ".cgi"
)

SPECIAL_AGORA_HUBS = {
    "", "index", "agora", "flancia", "latest", "nodes", "random",
    "search", "journals", "stats", "help", "about", "users"
}

def normalize_slug(slug: str) -> str:
    if not slug:
        return ""
    slug = unquote(slug).lower().strip()
    slug = slug.lstrip("/").lstrip("@")
    slug = re.sub(r"[\s\-_/]+", " ", slug).strip()
    return slug

def is_bot_ua(ua: str) -> bool:
    ua_lower = ua.lower()
    return any(b in ua_lower for b in KNOWN_BOT_SUBSTRINGS)

def is_fediverse_ua(ua: str) -> bool:
    ua_lower = ua.lower()
    return any(b in ua_lower for b in FEDIVERSE_SUBSTRINGS)

def is_scanner_path(path: str) -> bool:
    path_lower = path.lower()
    return any(path_lower.endswith(ext) or ext + "?" in path_lower or ext + "/" in path_lower for ext in SCANNER_EXTENSIONS)

def extract_node_from_path(path: str):
    path_clean = path.split("?")[0].split("#")[0]
    
    if any(path_clean.endswith(ext) for ext in [".css", ".js", ".png", ".jpg", ".jpeg", ".ico", ".svg", ".woff", ".woff2", ".ttf"]):
        return None, False, True, False
    if path_clean.startswith("/static/"):
        return None, False, True, False

    if path_clean.startswith("/context/"):
        node = path_clean[len("/context/"):]
        return normalize_slug(node), False, False, True
    if path_clean.startswith("/exec/") or path_clean.startswith("/api/") or path_clean.startswith("/graph/json/"):
        return None, False, False, True

    if is_scanner_path(path_clean):
        return None, False, False, False

    if path_clean.startswith("/node/"):
        return normalize_slug(path_clean[6:]), True, False, False
    if path_clean.startswith("/raw/"):
        return normalize_slug(path_clean[5:]), True, False, False
    
    parts = path_clean.strip("/").split("/")
    if len(parts) == 1:
        return normalize_slug(parts[0]), True, False, False
    elif len(parts) == 2 and parts[0].startswith("@"):
        return normalize_slug(parts[1]), True, False, False
    elif len(parts) >= 2:
        return normalize_slug(parts[-1]), True, False, False

    return normalize_slug(path_clean), True, False, False

def load_graph_edges(db_path: str):
    print(f"[*] Loading knowledge graph edges from {db_path}...")
    if not os.path.exists(db_path):
        print(f"[!] Warning: DB path {db_path} does not exist.")
        return defaultdict(set), defaultdict(set), set()

    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute("SELECT DISTINCT source_node, target_node FROM links WHERE source_node IS NOT NULL AND source_node != ''")
    
    forward_links = defaultdict(set)
    back_links = defaultdict(set)
    all_nodes = set()

    for src, dst in c.fetchall():
        s_norm = normalize_slug(src)
        d_norm = normalize_slug(dst)
        if s_norm and d_norm:
            forward_links[s_norm].add(d_norm)
            back_links[d_norm].add(s_norm)
            all_nodes.add(s_norm)
            all_nodes.add(d_norm)

    conn.close()
    print(f"[+] Loaded {len(all_nodes):,} distinct nodes and {sum(len(v) for v in forward_links.values()):,} directed edges.")
    return forward_links, back_links, all_nodes

def parse_log_line(line: str):
    m = re.match(r'^(\S+) \S+ \S+ \[([^\]]+)\] "([A-Z]+) (.*?) HTTP/[0-9.]+" (\d+) \d+ "([^"]*)" "([^"]*)"', line)
    if not m:
        return None
    ip, ts_str, method, path, status, referer, ua = m.groups()
    try:
        ts = datetime.strptime(ts_str.split()[0], "%d/%b/%Y:%H:%M:%S")
    except Exception:
        ts = None
    return {
        "ip": ip,
        "ts": ts,
        "method": method,
        "path": path,
        "status": int(status),
        "referer": referer,
        "ua": ua
    }

def analyze(log_path: str, db_path: str):
    forward_links, back_links, all_nodes = load_graph_edges(db_path)

    print(f"[*] Processing Nginx log: {log_path}...")
    
    sessions = defaultdict(list)
    ip_daily_count = Counter()
    scanner_hits = 0
    total_lines = 0

    with open(log_path, "r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            total_lines += 1
            rec = parse_log_line(line)
            if not rec:
                continue
            
            ip = rec["ip"]
            ua = rec["ua"]
            path = rec["path"]
            ip_daily_count[ip] += 1

            if is_scanner_path(path):
                scanner_hits += 1
                continue

            sessions[(ip, ua)].append(rec)

    print(f"[+] Total log lines: {total_lines:,}")
    print(f"[+] Unique (IP, UA) streams: {len(sessions):,}")
    print(f"[+] Exploit / Scanner probes: {scanner_hits:,}")

    cat_summary = {
        "bot_declared_search_engines": 0,    # Google, Bing, Baidu, Sogou, Amazon
        "fediverse_instance": 0,             # Mastodon, Akkoma, Hypothesis
        "spoofed_high_volume_crawler": 0,    # Fake Chrome/Safari (>100 reqs/day)
        "human_single_hit_bounce": 0,        # 1 pageview human/social visitor
        "human_multi_step_graph_walk": 0,    # >=2 pageviews, followed Agora links!
        "stealth_unconnected_scraper": 0,    # Multi-step, but jumping randomly/no links
    }

    req_summary = {
        "bot_declared_search_engines": 0,
        "fediverse_instance": 0,
        "spoofed_high_volume_crawler": 0,
        "human_single_hit_bounce": 0,
        "human_multi_step_graph_walk": 0,
        "stealth_unconnected_scraper": 0,
    }

    verified_graph_walks = []
    unconnected_sessions = []
    dwell_times = []

    for (ip, ua), recs in sessions.items():
        total_session_reqs = len(recs)
        ip_total = ip_daily_count[ip]

        if is_bot_ua(ua):
            cat_summary["bot_declared_search_engines"] += 1
            req_summary["bot_declared_search_engines"] += total_session_reqs
            continue

        if is_fediverse_ua(ua):
            cat_summary["fediverse_instance"] += 1
            req_summary["fediverse_instance"] += total_session_reqs
            continue

        pageviews = []
        has_assets = False
        has_context = False

        for r in recs:
            node, is_pv, is_ast, is_ctx = extract_node_from_path(r["path"])
            if is_ast:
                has_assets = True
            if is_ctx:
                has_context = True
            if is_pv and node:
                pageviews.append({
                    "ts": r["ts"],
                    "node": node,
                    "path": r["path"],
                    "ref": r["referer"],
                    "status": r["status"]
                })

        if not pageviews:
            continue

        # If IP made > 100 requests per day or > 50 pageviews, it is an automated scraper spoofing browser UA
        if ip_total > 100 or len(pageviews) > 50:
            cat_summary["spoofed_high_volume_crawler"] += 1
            req_summary["spoofed_high_volume_crawler"] += total_session_reqs
            continue

        # Single page bounce
        if len(pageviews) == 1:
            cat_summary["human_single_hit_bounce"] += 1
            req_summary["human_single_hit_bounce"] += total_session_reqs
            continue

        # Multi-step session (> 1 pageview): Test graph traversal
        connected_steps = 0
        total_transitions = 0
        session_dwells = []
        walk_details = []

        for i in range(len(pageviews) - 1):
            p1 = pageviews[i]
            p2 = pageviews[i + 1]
            total_transitions += 1

            if p1["ts"] and p2["ts"]:
                dt = (p2["ts"] - p1["ts"]).total_seconds()
                if 0 <= dt <= 1800:
                    session_dwells.append(dt)
                    dwell_times.append(dt)

            n1 = p1["node"]
            n2 = p2["node"]

            is_fwd = n2 in forward_links.get(n1, set())
            is_back = n1 in forward_links.get(n2, set())
            is_same = (n1 == n2)
            is_hub = (n1 in SPECIAL_AGORA_HUBS or n2 in SPECIAL_AGORA_HUBS)
            ref_path = urlparse(p2["ref"]).path
            ref_node, _, _, _ = extract_node_from_path(ref_path) if p2["ref"] else (None, False, False, False)
            ref_matches = (ref_node == n1)

            is_connected = is_fwd or is_back or is_same or is_hub or ref_matches

            if is_connected:
                connected_steps += 1
                conn_type = "forward wikilink" if is_fwd else ("backlink" if is_back else ("same node/subnode" if is_same else ("hub navigation" if is_hub else "agora referer")))
            else:
                conn_type = "unconnected jump"

            walk_details.append((n1, n2, conn_type, session_dwells[-1] if session_dwells else None))

        connection_ratio = connected_steps / total_transitions if total_transitions > 0 else 0

        # Classification
        if connection_ratio >= 0.5:
            cat_summary["human_multi_step_graph_walk"] += 1
            req_summary["human_multi_step_graph_walk"] += total_session_reqs
            verified_graph_walks.append({
                "ip": ip,
                "ua": ua[:65],
                "steps": len(pageviews),
                "connection_ratio": connection_ratio,
                "walk": walk_details,
                "has_context": has_context,
                "has_assets": has_assets,
                "avg_dwell": sum(session_dwells)/len(session_dwells) if session_dwells else 0
            })
        else:
            cat_summary["stealth_unconnected_scraper"] += 1
            req_summary["stealth_unconnected_scraper"] += total_session_reqs
            unconnected_sessions.append({
                "ip": ip,
                "ua": ua[:65],
                "steps": len(pageviews),
                "nodes": [p["node"] for p in pageviews],
                "refs": [p["ref"] for p in pageviews]
            })

    print("\n" + "="*75)
    print("SESSION TRAVERSAL & HUMAN VERIFICATION RESULTS")
    print("="*75)
    total_sessions_counted = sum(cat_summary.values())
    total_reqs_counted = sum(req_summary.values())

    print(f"\nBreakdown by Session Count (Total Sessions: {total_sessions_counted:,}):")
    for cat, cnt in sorted(cat_summary.items(), key=lambda x: -x[1]):
        pct = (cnt / total_sessions_counted) * 100 if total_sessions_counted else 0
        print(f"  {cat:32}: {cnt:6,} sessions ({pct:5.2f}%)")

    print(f"\nBreakdown by Request Volume (Total Requests: {total_reqs_counted:,}):")
    for cat, cnt in sorted(req_summary.items(), key=lambda x: -x[1]):
        pct = (cnt / total_reqs_counted) * 100 if total_reqs_counted else 0
        print(f"  {cat:32}: {cnt:7,} requests ({pct:5.2f}%)")

    # Calculate true human bounds
    human_sessions_min = cat_summary['human_multi_step_graph_walk']
    human_sessions_max = cat_summary['human_multi_step_graph_walk'] + cat_summary['human_single_hit_bounce']
    pct_min = (human_sessions_min / total_sessions_counted) * 100
    pct_max = (human_sessions_max / total_sessions_counted) * 100

    human_reqs_min = req_summary['human_multi_step_graph_walk']
    human_reqs_max = req_summary['human_multi_step_graph_walk'] + req_summary['human_single_hit_bounce']
    req_pct_min = (human_reqs_min / total_reqs_counted) * 100
    req_pct_max = (human_reqs_max / total_reqs_counted) * 100

    print("\n" + "-"*75)
    print("TRUE HUMAN PROPORTION ESTIMATION:")
    print(f"  * Strict Multi-Step Graph Walkers: {human_sessions_min:,} sessions ({pct_min:.2f}%) | {human_reqs_min:,} requests ({req_pct_min:.2f}%)")
    print(f"  * Total Humans (including 1-hit bounces): {human_sessions_max:,} sessions ({pct_max:.2f}%) | {human_reqs_max:,} requests ({req_pct_max:.2f}%)")
    print(f"  * Automated Traffic (Bots + Scrapers): {total_reqs_counted - human_reqs_max:,} requests ({100 - req_pct_max:.2f}%)")
    print("-"*75)

    if dwell_times:
        dwell_times_sorted = sorted(dwell_times)
        median_dwell = dwell_times_sorted[len(dwell_times_sorted)//2]
        avg_dwell = sum(dwell_times) / len(dwell_times)
        print(f"\nHuman Graph Walk Dwell Time: Median = {median_dwell:.1f}s, Mean = {avg_dwell:.1f}s")

    print("\n" + "="*75)
    print("TOP VERIFIED HUMAN GRAPH WALKS (Sample Trajectories):")
    print("="*75)
    # Sort by steps, filtering for ones with context or clean human steps
    sample_walks = [w for w in verified_graph_walks if w["steps"] >= 3]
    for walk in sorted(sample_walks, key=lambda w: -w["steps"])[:6]:
        print(f"\nSession IP: {walk['ip']} | Steps: {walk['steps']} | Hydrated: {walk['has_context']}")
        print(f"UA: {walk['ua']}")
        print(f"Avg Dwell: {walk['avg_dwell']:.1f}s | Graph Connectivity: {walk['connection_ratio']*100:.0f}%")
        print("Path:")
        for s1, s2, ctype, dt in walk["walk"]:
            dt_str = f"({dt:.0f}s)" if dt is not None else ""
            print(f"   [[{s1}]] ---> [[{s2}]]  via {ctype} {dt_str}")

    print("\n" + "="*75)
    print("SAMPLE UNCONNECTED JUMPS (Stealth Scrapers / Disjoint Links):")
    print("="*75)
    for s in unconnected_sessions[:4]:
        print(f"\nIP: {s['ip']} | UA: {s['ua']}")
        print(f"Steps: {s['steps']} | Visited: {' -> '.join(s['nodes'][:5])}")
        print(f"Referrers: {s['refs'][:2]}")

if __name__ == "__main__":
    log_file = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_LOG
    db_file = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_DB
    analyze(log_file, db_file)
