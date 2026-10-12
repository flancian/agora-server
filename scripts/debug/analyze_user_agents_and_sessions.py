#!/usr/bin/env python3
# Copyright 2026 Google LLC & The Agora Authors
#
# User-Agent classification and Human Clickstream / Session Reconstruction
# for Nginx access logs.
#
# Analyzes:
#   - User-Agent breakdown (Human Desktop/Mobile vs AI Bots vs Search Crawlers vs CLI)
#   - Real human browsing sessions (dwell time, pages per session, click paths)
#   - Entry nodes & landing pages
#   - External referral sources (Fediverse, Bluesky, Search, Direct)
#   - Multi-step traversal trails across nodes
#
# Usage:
#   python scripts/debug/analyze_user_agents_and_sessions.py [nginx_access_log]
#
import sys
import os
import re
from datetime import datetime
from urllib.parse import unquote, urlparse
from collections import Counter, defaultdict


def classify_user_agent(ua_str):
    ua = ua_str.lower()
    
    # 1. AI / LLM Bots
    if any(b in ua for b in ('gptbot', 'chatgpt', 'claudebot', 'anthropic', 'bytespider', 'ccbot', 'diffbot', 'perplexity', 'cohere', 'meta-externalagent')):
        return 'AI / LLM Crawler'
    
    # 2. Major Search Engine Crawlers
    if 'googlebot' in ua:
        return 'Googlebot'
    if 'bingbot' in ua or 'msnbot' in ua:
        return 'Bingbot'
    if 'baiduspider' in ua:
        return 'Baiduspider'
    if 'yandex' in ua:
        return 'Yandex'
    if any(b in ua for b in ('duckduckbot', 'sogou', 'slurp', 'qwantify', 'applebot')):
        return 'Other Search Engine'
    
    # 3. SEO / Commercial Scrapers
    if any(b in ua for b in ('semrushbot', 'ahrefsbot', 'dotbot', 'mj12bot', 'blexbot', 'petalbot', 'dataforseo')):
        return 'SEO / Commercial Scraper'
    
    # 4. CLI / Scripts / Libraries
    if any(b in ua for b in ('curl', 'wget', 'python', 'go-http-client', 'aiohttp', 'httpx', 'urllib', 'postman', 'scrapy')):
        return 'CLI / Script / Feed Reader'
    
    # 5. Fediverse / ActivityPub / Social Fetchers
    if any(b in ua for b in ('mastodon', 'pleroma', 'misskey', 'gotosocial', 'lemmy', 'matrix', 'bluesky')):
        return 'Fediverse / Social Instance'

    # 6. Real Human Browsers (Desktop vs Mobile)
    is_mobile = any(m in ua for m in ('mobile', 'android', 'iphone', 'ipad', 'ipod'))
    
    if 'firefox' in ua:
        return 'Human Browser (Mobile Firefox)' if is_mobile else 'Human Browser (Desktop Firefox)'
    if 'edg/' in ua or 'edge/' in ua:
        return 'Human Browser (Mobile Edge)' if is_mobile else 'Human Browser (Desktop Edge)'
    if 'chrome' in ua or 'crios' in ua:
        return 'Human Browser (Mobile Chrome)' if is_mobile else 'Human Browser (Desktop Chrome)'
    if 'safari' in ua and 'chrome' not in ua:
        return 'Human Browser (Mobile Safari)' if is_mobile else 'Human Browser (Desktop Safari)'

    # Catch-all
    if 'bot' in ua or 'crawl' in ua or 'spider' in ua:
        return 'Generic Bot / Crawler'

    return 'Other Browser / Client'


def canonical_node_target(path):
    p = path.split('?')[0].strip()
    if p in ('', '/', '/index', '/index.html'):
        return '[[index]]'
    if p.startswith('/static') or p.startswith('/favicon') or p.startswith('/apple-touch-icon'):
        return None
    # Strip prefixes
    for prefix in ('/node/', '/context/', '/graph/json/', '/graph/', '/push/', '/raw/'):
        if p.startswith(prefix):
            p = '/' + p[len(prefix):]
            break
    clean = unquote(p).strip().lower()
    clean = re.sub(r'\.(md|org|txt)$', '', clean)
    clean = re.sub(r'[\s_]+', ' ', clean).strip()
    return clean if clean and clean != '/' else None


def analyze(filepath):
    print(f"\n======================================================================")
    print(f"ANALYZING NGINX ACCESS LOG: {filepath}")
    file_size_mb = os.path.getsize(filepath) / (1024 * 1024)
    print(f"File Size: {file_size_mb:.2f} MB")
    print(f"======================================================================\n")

    # Combined Log Format:
    # $remote_addr - $remote_user [$time_local] "$request" $status $body_bytes_sent "$http_referer" "$http_user_agent"
    log_pattern = re.compile(
        r'^([0-9a-fA-F\.:]+)\s+-\s+\S+\s+\[([^\]]+)\]\s+"([A-Z]+)\s+([^"\s]+)\s+HTTP/[0-9\.]+"\s+(\d{3})\s+(\d+)\s+"([^"]*)"\s+"([^"]*)"'
    )

    ua_categories = Counter()
    external_referrers = Counter()
    total_lines = 0
    parsed_lines = 0

    # User sessions: key = (ip, ua_str) -> list of (dt, method, path, referer, status)
    human_hits_by_client = defaultdict(list)

    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            total_lines += 1
            m = log_pattern.match(line)
            if not m:
                continue
            
            parsed_lines += 1
            ip, time_str, method, uri, status_str, bytes_sent, referer, user_agent = m.groups()
            
            cat = classify_user_agent(user_agent)
            ua_categories[cat] += 1

            # External referrers
            if referer and referer != '-':
                parsed_ref = urlparse(referer)
                domain = parsed_ref.netloc.lower()
                if domain and not any(agora_domain in domain for agora_domain in ('anagora.org', 'flancia.org', 'localhost')):
                    external_referrers[domain] += 1

            # Track human browser hits for session & clickstream reconstruction
            if cat.startswith('Human Browser'):
                try:
                    # e.g., 08/Oct/2026:00:00:05 +0200
                    ts_clean = time_str.split()[0]
                    dt = datetime.strptime(ts_clean, "%d/%b/%Y:%H:%M:%S")
                    human_hits_by_client[(ip, user_agent)].append((dt, method, uri, referer, int(status_str)))
                except ValueError:
                    pass

    print(f"Total Requests Processed: {parsed_lines:,} (out of {total_lines:,} lines)")

    # 1. User Agent Breakdown
    print(f"\n======================================================================")
    print(f"USER-AGENT TRAFFIC BREAKDOWN")
    print(f"======================================================================")
    human_total = sum(c for k, c in ua_categories.items() if k.startswith('Human Browser'))
    bot_total = parsed_lines - human_total
    print(f"Real Human Browsers:     {human_total:8,d} ({human_total/parsed_lines*100:5.1f}%)")
    print(f"Automated Crawlers/Bots: {bot_total:8,d} ({bot_total/parsed_lines*100:5.1f}%)\n")

    for cat, count in ua_categories.most_common():
        pct = (count / parsed_lines) * 100
        print(f"  {cat:<32} : {count:8,d} ({pct:5.1f}%)")

    # 2. External Referrers
    print(f"\n======================================================================")
    print(f"TOP EXTERNAL REFERRAL SOURCES (Where people enter the Agora from)")
    print(f"======================================================================")
    for dom, count in external_referrers.most_common(20):
        print(f"  {count:6,d}x  {dom}")

    # 3. Session Reconstruction
    print(f"\n======================================================================")
    print(f"HUMAN BROWSING SESSION RECONSTRUCTION")
    print(f"======================================================================")

    SESSION_TIMEOUT_MINUTES = 30
    all_sessions = []
    landing_nodes = Counter()
    exit_nodes = Counter()
    session_depths = Counter()

    for (ip, ua), hits in human_hits_by_client.items():
        hits.sort(key=lambda x: x[0])
        current_session = []
        last_dt = None

        for dt, method, uri, referer, status in hits:
            if method != 'GET' or status >= 400:
                continue
            
            target = canonical_node_target(uri)
            if not target:
                continue

            if last_dt is not None:
                idle_minutes = (dt - last_dt).total_seconds() / 60.0
                if idle_minutes > SESSION_TIMEOUT_MINUTES:
                    if current_session:
                        all_sessions.append(current_session)
                    current_session = []

            # Deduplicate consecutive identical node views (e.g. iframe context + parent)
            if not current_session or current_session[-1][1] != target:
                current_session.append((dt, target, referer))

            last_dt = dt

        if current_session:
            all_sessions.append(current_session)

    # Analyze Sessions
    multi_page_sessions = []
    trail_counter = Counter()

    for sess in all_sessions:
        depth = len(sess)
        if depth == 1:
            session_depths['1 page (Single-Node Bounce)'] += 1
        elif 2 <= depth <= 5:
            session_depths['2 - 5 pages (Casual Browse)'] += 1
        elif 6 <= depth <= 15:
            session_depths['6 - 15 pages (Deep Reading)'] += 1
        else:
            session_depths['16+ pages (Rabbit Hole Expedition)'] += 1

        landing_nodes[sess[0][1]] += 1
        exit_nodes[sess[-1][1]] += 1

        if depth >= 2:
            multi_page_sessions.append(sess)
            # Create a path string: A -> B -> C (up to first 4 steps)
            trail_str = ' ➔ '.join(f"[[{step[1]}]]" for step in sess[:4])
            trail_counter[trail_str] += 1

    total_sess_count = len(all_sessions)
    print(f"Total Reconstructed Human Sessions: {total_sess_count:,}")
    print(f"Multi-Page Traversal Sessions:       {len(multi_page_sessions):,} ({len(multi_page_sessions)/max(1, total_sess_count)*100:.1f}%)")
    
    print("\nSession Depth Distribution:")
    for depth_cat, count in session_depths.most_common():
        pct = (count / max(1, total_sess_count)) * 100
        print(f"  {depth_cat:<36} : {count:6,d} ({pct:5.1f}%)")

    print("\nTop Landing / Entry Nodes:")
    for node, count in landing_nodes.most_common(12):
        print(f"  {count:5,d}x  [[{node}]]")

    print("\nTop Multi-Step Traversal Paths (How humans navigate from node to node):")
    for trail, count in trail_counter.most_common(15):
        if ' ➔ ' in trail:
            print(f"  {count:4,d}x  {trail}")

    # Sample detailed human journey with dwell time
    print("\n======================================================================")
    print("SAMPLE AUTHENTIC HUMAN BROWSING TRAILS (With Dwell Times)")
    print("======================================================================")
    printed = 0
    for sess in multi_page_sessions:
        if 3 <= len(sess) <= 7:
            # Check if duration makes human sense (e.g. 10s to 30m total)
            duration = (sess[-1][0] - sess[0][0]).total_seconds()
            if 30 <= duration <= 1800:
                print(f"\n--- Traversal Journey ({len(sess)} steps, total duration {duration/60:.1f} mins) ---")
                for i, (dt, node, ref) in enumerate(sess):
                    dwell = ""
                    if i < len(sess) - 1:
                        dwell_sec = int((sess[i+1][0] - dt).total_seconds())
                        dwell = f" (dwelled {dwell_sec}s)"
                    print(f"  {dt.strftime('%H:%M:%S')} ➔ [[{node}]]{dwell}")
                printed += 1
                if printed >= 4:
                    break


if __name__ == '__main__':
    log_file = sys.argv[1] if len(sys.argv) > 1 else 'logs/nginx_access_20261008.log'
    analyze(log_file)
