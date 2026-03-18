import re
import sys
import collections

def analyze(log_file):
    print(f"Parsing {log_file} for traffic type analysis based on IP frequency...")
    
    ip_counter = collections.Counter()
    total_requests = 0
    
    with open(log_file, 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            if '=> generated' in line:
                # Extract IP. Example log snippet: ... [pid: 9861|app: 0|req: 672/20746026] 43.173.175.120 () ...
                ip_match = re.search(r'\] ([\d\.]+) \(', line)
                if ip_match:
                    ip = ip_match.group(1)
                    ip_counter[ip] += 1
                    total_requests += 1
    
    if not total_requests:
        print("No requests found.")
        return

    # Heuristics for a ~20 hour log:
    # Extremely High volume (> 5000 requests) -> Definitely Bot/Scraper/AI Crawler
    # High volume (500 - 5000 requests) -> Likely Bot/Syndication
    # Normal volume (< 500 requests) -> Likely Organic (Human)
    
    organic = 0
    likely_bot = 0
    definite_bot = 0
    
    for ip, count in ip_counter.items():
        if count > 5000:
            definite_bot += count
        elif count > 500:
            likely_bot += count
        else:
            organic += count

    print(f"\n--- Traffic Estimation (Total: {total_requests} requests) ---")
    print("Based on IP request frequency heuristics over the log duration:")
    print(f"Definite Bot / Crawler (>5000 reqs/IP) : {definite_bot:7d} ({(definite_bot/total_requests)*100:.1f}%)")
    print(f"Likely Bot / Aggregator (>500 reqs/IP) : {likely_bot:7d} ({(likely_bot/total_requests)*100:.1f}%)")
    print(f"Likely Organic / Human  (<500 reqs/IP) : {organic:7d} ({(organic/total_requests)*100:.1f}%)")

    print(f"\nTop 10 most active IPs:")
    for ip, count in ip_counter.most_common(10):
        print(f"  {ip:15} : {count} requests")

if __name__ == '__main__':
    log_file = sys.argv[1] if len(sys.argv) > 1 else 'uwsgi.log'
    analyze(log_file)
