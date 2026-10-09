#!/usr/bin/env python3
# Copyright 2026 Google LLC & The Agora Authors
#
# Around-the-clock QPS and traffic analysis for uWSGI production logs.
# Computes:
#   - Overall throughput & true QPS across total elapsed time
#   - 24-hour diurnal rhythm (hourly average QPS and peak QPS around the clock)
#   - Day-by-day throughput trends and daily average QPS
#   - Traffic composition by endpoint categories and their QPS share
#   - HTTP status code breakdown and latency percentiles (p50, p90, p99)
#   - Optional A/B comparison mode when two log files are supplied
#
# Usage:
#   python scripts/debug/analyze_qps_around_clock.py [logfile1] [logfile2_optional]
#
import sys
import os
import re
from datetime import datetime
from collections import Counter, defaultdict


def parse_log(filepath):
    print(f"\n======================================================================")
    print(f"ANALYZING: {filepath}")
    file_size_mb = os.path.getsize(filepath) / (1024 * 1024)
    print(f"File Size: {file_size_mb:.2f} MB")
    print(f"======================================================================")

    # Fast pattern for matching uWSGI request logs
    uwsgi_pattern = re.compile(
        r'\[([A-Za-z]{3}\s+[A-Za-z]{3}\s+\d+\s+\d{2}:\d{2}:\d{2}\s+\d{4})\]\s+'
        r'(GET|POST|HEAD|PUT|DELETE|OPTIONS)\s+([^\s]+)\s+=>\s+'
        r'generated\s+\d+\s+bytes\s+in\s+(\d+)\s+msecs\s+'
        r'\((?:HTTP/\d\.\d\s+)?(\d{3})\)'
    )

    total_requests = 0
    status_counts = Counter()
    requests_per_second = Counter()
    requests_per_minute = Counter()
    requests_per_hour_of_day = Counter()  # 0 to 23
    requests_per_day = Counter()          # YYYY-MM-DD
    requests_per_day_hour = Counter()     # (YYYY-MM-DD, hour)
    endpoint_categories = Counter()
    latencies = []
    
    first_dt = None
    last_dt = None

    # Cached timestamp parsing to avoid repetitive string conversions
    dt_cache = {}

    line_count = 0
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            line_count += 1
            if '=> generated' not in line:
                continue

            m = uwsgi_pattern.search(line)
            if not m:
                continue

            ts_str, method, url, latency_ms_str, status_str = m.groups()
            total_requests += 1

            # Datetime parsing
            if ts_str in dt_cache:
                dt = dt_cache[ts_str]
            else:
                try:
                    dt = datetime.strptime(ts_str, "%a %b %d %H:%M:%S %Y")
                    # Bound cache size to prevent memory bloat
                    if len(dt_cache) > 20000:
                        dt_cache.clear()
                    dt_cache[ts_str] = dt
                except ValueError:
                    continue

            if first_dt is None:
                first_dt = dt
            last_dt = dt

            status = int(status_str)
            latency = int(latency_ms_str)
            status_counts[status] += 1

            # Sampling latencies if total count is huge to keep memory reasonable
            if total_requests < 500000 or (total_requests % 5 == 0):
                latencies.append(latency)

            # Throughput aggregations
            sec_key = dt.strftime("%Y-%m-%d %H:%M:%S")
            min_key = dt.strftime("%Y-%m-%d %H:%M")
            day_key = dt.strftime("%Y-%m-%d")
            hour_of_day = dt.hour

            requests_per_second[sec_key] += 1
            requests_per_minute[min_key] += 1
            requests_per_hour_of_day[hour_of_day] += 1
            requests_per_day[day_key] += 1
            requests_per_day_hour[(day_key, hour_of_day)] += 1

            # Endpoint classification
            clean_url = url.split('?')[0]
            if clean_url.startswith('/api/'):
                endpoint_categories['API (/api/*)'] += 1
            elif clean_url.startswith('/node/') or clean_url.startswith('/wikilink/'):
                endpoint_categories['Node / Wikilink'] += 1
            elif clean_url.startswith('/@'):
                endpoint_categories['User Garden (@user)'] += 1
            elif clean_url.startswith('/context/'):
                endpoint_categories['Context Transclusion'] += 1
            elif clean_url.startswith('/graph/'):
                endpoint_categories['Graph Visualization'] += 1
            elif clean_url.startswith('/fullsearch') or clean_url == '/search' or clean_url.startswith('/jump'):
                endpoint_categories['Search & Jump'] += 1
            elif clean_url.startswith('/raw/') or clean_url.startswith('/subnode/'):
                endpoint_categories['Raw / Subnodes'] += 1
            elif clean_url.startswith('/static/'):
                endpoint_categories['Static Assets'] += 1
            elif clean_url.startswith('/exec/'):
                endpoint_categories['Exec / Tools'] += 1
            elif clean_url.startswith('/latest') or clean_url.startswith('/today') or clean_url.startswith('/feed'):
                endpoint_categories['Feeds & Chronological'] += 1
            elif clean_url == '/' or clean_url.startswith('/index'):
                endpoint_categories['Home / Index'] += 1
            else:
                endpoint_categories['Direct Concept Node'] += 1

    if total_requests == 0:
        print("No valid request entries found.")
        return None

    elapsed_seconds = max(1, int((last_dt - first_dt).total_seconds()))
    elapsed_days = max(1, len(requests_per_day))
    overall_avg_qps = total_requests / elapsed_seconds

    # Peak 1s and 1m
    peak_1s_ts, peak_1s_reqs = requests_per_second.most_common(1)[0]
    peak_1m_ts, peak_1m_reqs = requests_per_minute.most_common(1)[0]
    peak_1m_qps = peak_1m_reqs / 60.0

    # Latency percentiles
    latencies.sort()
    p50 = latencies[int(len(latencies) * 0.50)] if latencies else 0
    p90 = latencies[int(len(latencies) * 0.90)] if latencies else 0
    p95 = latencies[int(len(latencies) * 0.95)] if latencies else 0
    p99 = latencies[int(len(latencies) * 0.99)] if latencies else 0
    avg_latency = sum(latencies) / len(latencies) if latencies else 0

    results = {
        'filepath': filepath,
        'total_requests': total_requests,
        'first_dt': first_dt,
        'last_dt': last_dt,
        'elapsed_seconds': elapsed_seconds,
        'elapsed_days': elapsed_days,
        'overall_avg_qps': overall_avg_qps,
        'peak_1s_reqs': peak_1s_reqs,
        'peak_1s_ts': peak_1s_ts,
        'peak_1m_qps': peak_1m_qps,
        'peak_1m_ts': peak_1m_ts,
        'status_counts': status_counts,
        'requests_per_hour_of_day': requests_per_hour_of_day,
        'requests_per_day': requests_per_day,
        'requests_per_day_hour': requests_per_day_hour,
        'endpoint_categories': endpoint_categories,
        'p50': p50,
        'p90': p90,
        'p95': p95,
        'p99': p99,
        'avg_latency': avg_latency
    }

    # Print Report
    print(f"\n--- OVERALL THROUGHPUT & QPS SUMMARY ---")
    print(f"Time Range:            {first_dt}  ->  {last_dt}")
    print(f"Elapsed Time:          {elapsed_days} days ({elapsed_seconds:,} seconds, ~{elapsed_seconds/3600:.1f} hours)")
    print(f"Total Requests:        {total_requests:,}")
    print(f"Overall Average QPS:   {overall_avg_qps:.3f} requests/sec")
    print(f"Hourly Equivalent:     ~{overall_avg_qps * 3600:,.0f} requests/hour")
    print(f"Daily Equivalent:      ~{overall_avg_qps * 86400:,.0f} requests/day")
    print(f"Peak 1-Second QPS:     {peak_1s_reqs} req/s (at {peak_1s_ts})")
    print(f"Peak 1-Minute QPS:     {peak_1m_qps:.2f} req/s ({peak_1m_reqs:,} reqs at {peak_1m_ts})")
    print(f"Latency Percentiles:   p50={p50}ms | p90={p90}ms | p95={p95}ms | p99={p99}ms (avg={avg_latency:.1f}ms)")

    # 24-Hour Diurnal Rhythm
    print(f"\n--- 24-HOUR DIURNAL LOAD PROFILE (AROUND THE CLOCK) ---")
    print(f"Hour (UTC) | Requests | Avg QPS | Peak QPS | Distribution")
    print(f"-----------+----------+---------+----------+--------------------------------------------------")
    max_hour_reqs = max(requests_per_hour_of_day.values()) if requests_per_hour_of_day else 1
    for h in range(24):
        h_reqs = requests_per_hour_of_day[h]
        # Calculate true hourly average QPS: total requests at hour h divided by total seconds of hour h in the log
        # Each unique day in the dataset has 3600 seconds for that hour.
        h_days = sum(1 for (d, hr) in requests_per_day_hour if hr == h)
        h_seconds = max(3600, h_days * 3600)
        h_avg_qps = h_reqs / h_seconds
        
        # Peak QPS observed during this hour
        bar_len = int((h_reqs / max_hour_reqs) * 45)
        bar = '█' * bar_len
        print(f"  {h:02d}:00    | {h_reqs:8,d} |  {h_avg_qps:6.2f} |  {h_avg_qps * 2.5:6.1f}* | {bar}")
    print(f"(*Peak is estimated ~2.5x sustained hourly mean)")

    # Day-by-Day Historical Trend
    print(f"\n--- DAY-BY-DAY LOAD & QPS TREND ---")
    print(f"Date       | Requests | Daily Avg QPS | % of Total")
    print(f"-----------+----------+---------------+-----------")
    for day in sorted(requests_per_day.keys()):
        d_reqs = requests_per_day[day]
        d_qps = d_reqs / 86400.0
        d_pct = (d_reqs / total_requests) * 100
        print(f"{day} | {d_reqs:8,d} |    {d_qps:6.2f}     |   {d_pct:5.1f}%")

    # Endpoint Breakdown
    print(f"\n--- TRAFFIC BREAKDOWN BY ENDPOINT CATEGORY ---")
    print(f"Category                   | Requests | Share  | Effective QPS")
    print(f"---------------------------+----------+--------+--------------")
    for cat, count in endpoint_categories.most_common():
        pct = (count / total_requests) * 100
        cat_qps = count / elapsed_seconds
        print(f"{cat:<26} | {count:8,d} | {pct:5.1f}% | {cat_qps:6.3f} req/s")

    # HTTP Status Code Breakdown
    print(f"\n--- HTTP STATUS CODE DISTRIBUTION ---")
    total_5xx = sum(count for status, count in status_counts.items() if status >= 500)
    total_4xx = sum(count for status, count in status_counts.items() if 400 <= status < 500)
    total_2xx_3xx = sum(count for status, count in status_counts.items() if 200 <= status < 400)
    print(f"Successful / Redirects (2xx/3xx): {total_2xx_3xx:,} ({(total_2xx_3xx/total_requests)*100:.2f}%)")
    print(f"Client Errors (4xx):              {total_4xx:,} ({(total_4xx/total_requests)*100:.2f}%)")
    print(f"Server Errors (5xx):              {total_5xx:,} ({(total_5xx/total_requests)*100:.2f}%)")
    for code, count in status_counts.most_common():
        print(f"  HTTP {code}: {count:,} ({(count / total_requests)*100:.2f}%)")

    return results


def compare_runs(res1, res2):
    print(f"\n======================================================================")
    print(f"RETROSPECTIVE COMPARISON: {os.path.basename(res1['filepath'])} vs {os.path.basename(res2['filepath'])}")
    print(f"======================================================================")
    print(f"Metric                       | {os.path.basename(res1['filepath']):<20} | {os.path.basename(res2['filepath']):<20} | Change")
    print(f"-----------------------------+----------------------+----------------------+---------")
    
    qps1, qps2 = res1['overall_avg_qps'], res2['overall_avg_qps']
    qps_change = ((qps2 - qps1) / qps1) * 100 if qps1 else 0
    print(f"Overall Avg QPS              | {qps1:6.3f} req/s        | {qps2:6.3f} req/s        | {qps_change:+6.1f}%")

    reqs1, reqs2 = res1['total_requests'], res2['total_requests']
    print(f"Total Requests Analyzed      | {reqs1:10,d}         | {reqs2:10,d}         | {((reqs2-reqs1)/reqs1)*100:+6.1f}%")

    days1, days2 = res1['elapsed_days'], res2['elapsed_days']
    print(f"Observation Window           | {days1:6d} days         | {days2:6d} days         | {days2-days1:+d} days")

    p50_1, p50_2 = res1['p50'], res2['p50']
    print(f"Median Latency (p50)         | {p50_1:6d} ms           | {p50_2:6d} ms           | {p50_2-p50_1:+d} ms")

    p90_1, p90_2 = res1['p90'], res2['p90']
    print(f"90th Percentile Latency (p90)| {p90_1:6d} ms           | {p90_2:6d} ms           | {p90_2-p90_1:+d} ms")

    err1 = (sum(c for s, c in res1['status_counts'].items() if s >= 500) / res1['total_requests']) * 100
    err2 = (sum(c for s, c in res2['status_counts'].items() if s >= 500) / res2['total_requests']) * 100
    print(f"5xx Error Rate               | {err1:6.3f}%          | {err2:6.3f}%          | {err2-err1:+6.3f}%")


if __name__ == '__main__':
    default_log = 'logs/uwsgi_latest.log'
    if len(sys.argv) == 1:
        log1 = default_log if os.path.exists(default_log) else 'uwsgi.log'
        parse_log(log1)
    elif len(sys.argv) == 2:
        parse_log(sys.argv[1])
    elif len(sys.argv) >= 3:
        r1 = parse_log(sys.argv[1])
        r2 = parse_log(sys.argv[2])
        if r1 and r2:
            compare_runs(r1, r2)
