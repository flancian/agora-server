#!/usr/bin/env python3
"""
analyze_production_logs.py

Analyzes production uWSGI and Agora logs (e.g. downloaded from thecla or /tmp).
Computes:
  - HTTP status code breakdown and percentages
  - Top 500 error routes
  - Slowest endpoints (>1s latency)
  - Agora application error and warning frequency breakdowns
  - Unhandled exception tracebacks
"""

import sys
import os
import re
from collections import Counter, defaultdict


def analyze_uwsgi_log(filepath):
    print(f"\n=== 1. UWSGI LOG ANALYSIS: {filepath} ===")
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return

    status_counts = Counter()
    slow_requests = []
    error_500_urls = Counter()

    uwsgi_pattern = re.compile(
        r'\[(.*?)\] (GET|POST|HEAD|PUT|DELETE) (.*?) => generated \d+ bytes in (\d+) msecs \((HTTP/\d\.\d (\d{3}))\)'
    )

    with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
        for line in f:
            m = uwsgi_pattern.search(line)
            if m:
                timestamp, method, url, latency_ms, http_ver, status = m.groups()
                latency = int(latency_ms)
                status_code = int(status)
                status_counts[status_code] += 1
                if status_code == 500:
                    clean_url = url.split('?')[0]
                    error_500_urls[clean_url] += 1
                if latency > 1000:
                    slow_requests.append((latency, method, url.split('?')[0], timestamp))

    total = sum(status_counts.values())
    if not total:
        print("No HTTP request lines found in file.")
        return

    print(f"Total parsed HTTP requests: {total}")
    print("HTTP Status Code Breakdown:")
    for code, count in status_counts.most_common():
        pct = (count / total) * 100
        print(f"  {code}: {count} ({pct:.2f}%)")

    print("\nTop 500 Internal Server Error Endpoints:")
    for url, count in error_500_urls.most_common(15):
        print(f"  {count}x  {url}")

    print("\nSlowest Endpoints (>1s):")
    slow_by_endpoint = defaultdict(list)
    for lat, method, url, ts in slow_requests:
        slow_by_endpoint[url].append(lat)

    slow_summary = []
    for url, lats in slow_by_endpoint.items():
        avg_lat = sum(lats) / len(lats)
        max_lat = max(lats)
        slow_summary.append((len(lats), avg_lat, max_lat, url))

    slow_summary.sort(key=lambda x: (x[0], x[2]), reverse=True)
    for count, avg_l, max_l, url in slow_summary[:20]:
        print(f"  {count}x requests > 1s (avg {avg_l:.0f}ms, max {max_l}ms): {url}")


def analyze_agora_log(filepath):
    print(f"\n=== 2. AGORA APP LOG ANALYSIS: {filepath} ===")
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return

    error_types = Counter()
    warning_types = Counter()
    tracebacks = defaultdict(list)
    current_tb = []
    current_error_key = None

    with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
        for line in f:
            if " ERROR " in line:
                clean_line = re.sub(r'^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d+ ERROR app \w+ : ', '', line.strip())
                if "Wiktionary" in clean_line:
                    error_types["Wiktionary Timeout / Error"] += 1
                elif "database is locked" in clean_line:
                    error_types["SQLite Database is locked"] += 1
                elif "Exception on " in clean_line:
                    route = clean_line.split("Exception on ")[-1]
                    error_types[f"Unhandled Exception on {route}"] += 1
                    current_error_key = f"Unhandled Exception on {route}"
                else:
                    error_types[clean_line[:60]] += 1
                    current_error_key = clean_line[:60]
            elif " WARNING " in line:
                clean_line = re.sub(r'^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d+ WARNING app \w+ : ', '', line.strip())
                if "Slow node load" in clean_line:
                    node = re.search(r'\[\[(.*?)\]\]', clean_line)
                    node_name = node.group(1) if node else "unknown"
                    warning_types[f"Slow node load [[{node_name}]]"] += 1
                elif "Could not read" in clean_line:
                    warning_types["Could not read secret/file"] += 1
                elif "SQLite" in clean_line:
                    warning_types["SQLite warning"] += 1
                else:
                    warning_types[clean_line[:60]] += 1

            if "Traceback (most recent call last):" in line:
                current_tb = [line]
            elif current_tb:
                current_tb.append(line)
                if line.startswith("2026-") and "Traceback" not in line:
                    if current_error_key and len(tracebacks[current_error_key]) < 2:
                        tracebacks[current_error_key].append("".join(current_tb[:-1]))
                    current_tb = []

    print("Top Error Categories:")
    for err, count in error_types.most_common(15):
        print(f"  {count}x  {err}")

    print("\nTop Warning Categories:")
    for w, count in warning_types.most_common(15):
        print(f"  {count}x  {w}")

    print("\nSample Tracebacks for Distinct Unhandled Exceptions:")
    for err_key, tbs in tracebacks.items():
        print(f"\n--- {err_key} ---")
        for tb in tbs[:1]:
            print(tb.strip())


if __name__ == "__main__":
    uwsgi_file = sys.argv[1] if len(sys.argv) > 1 else "/tmp/thecla_uwsgi.log"
    agora_file = sys.argv[2] if len(sys.argv) > 2 else "/tmp/thecla_agora.log"

    analyze_uwsgi_log(uwsgi_file)
    analyze_agora_log(agora_file)
