import re
import sys
import collections

def analyze(log_file):
    print(f"Parsing {log_file} for latency analysis. This may take a moment...")
    
    total_requests = 0
    total_msecs = 0
    msec_values = []
    
    # Bins for histogram
    bins = collections.OrderedDict([
        ('< 10ms', 0),
        ('10 - 50ms', 0),
        ('50 - 100ms', 0),
        ('100 - 500ms', 0),
        ('500ms - 1s', 0),
        ('1s - 5s', 0),
        ('> 5s', 0)
    ])
    
    with open(log_file, 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            if '=> generated' in line:
                # Extract latency. Example log snippet: ... => generated 829 bytes in 446 msecs (HTTP/1.1 200) ...
                msec_match = re.search(r'in (\d+) msecs', line)
                if msec_match:
                    msecs = int(msec_match.group(1))
                    total_requests += 1
                    total_msecs += msecs
                    msec_values.append(msecs)
                    
                    if msecs < 10:
                        bins['< 10ms'] += 1
                    elif msecs < 50:
                        bins['10 - 50ms'] += 1
                    elif msecs < 100:
                        bins['50 - 100ms'] += 1
                    elif msecs < 500:
                        bins['100 - 500ms'] += 1
                    elif msecs < 1000:
                        bins['500ms - 1s'] += 1
                    elif msecs < 5000:
                        bins['1s - 5s'] += 1
                    else:
                        bins['> 5s'] += 1
    
    if not total_requests:
        print("No latencies found.")
        return
        
    msec_values.sort()
    
    p50 = msec_values[int(total_requests * 0.5)]
    p90 = msec_values[int(total_requests * 0.9)]
    p99 = msec_values[int(total_requests * 0.99)]
    p999 = msec_values[int(total_requests * 0.999)]
    p9999 = msec_values[int(total_requests * 0.9999)]
    avg = total_msecs / total_requests
    max_msecs = msec_values[-1]

    print(f"\n--- Latency Overview ({total_requests} requests) ---")
    print(f"Average Latency: {avg:.2f} ms")
    print(f"Median (p50)   : {p50} ms")
    print(f"90th %ile (p90): {p90} ms")
    print(f"99th %ile (p99): {p99} ms")
    print(f"99.9th %ile    : {p999} ms")
    print(f"99.99th %ile   : {p9999} ms")
    print(f"Max Latency    : {max_msecs} ms")
    
    print(f"\n--- Latency Histogram ---")
    max_count = max(bins.values())
    max_bar_length = 50
    
    for label, count in bins.items():
        bar_length = int((count / max_count) * max_bar_length) if max_count > 0 else 0
        bar = '█' * bar_length
        pct = (count / total_requests) * 100
        print(f"{label:12} | {count:7d} ({pct:5.1f}%) | {bar}")

if __name__ == '__main__':
    log_file = sys.argv[1] if len(sys.argv) > 1 else 'uwsgi.log'
    analyze(log_file)
