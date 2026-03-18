import collections
import re
import sys
from datetime import datetime

def analyze(log_file):
    print(f"Parsing {log_file} for time analysis. This may take a moment...")
    
    requests_per_hour = collections.Counter()
    total_requests = 0
    
    with open(log_file, 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            if '=> generated' in line:
                total_requests += 1
                # Extract date, e.g., [Mon Mar 16 22:00:47 2026]
                date_match = re.search(r'\[([^\]]+)\] (?:GET|POST|HEAD|OPTIONS|PUT|DELETE)', line)
                if date_match:
                    date_str = date_match.group(1)
                    try:
                        # Parse the datetime
                        dt = datetime.strptime(date_str, '%a %b %d %H:%M:%S %Y')
                        # Group by hour (YYYY-MM-DD HH:00)
                        hour_key = dt.strftime('%Y-%m-%d %H:00')
                        requests_per_hour[hour_key] += 1
                    except ValueError:
                        pass
    
    if not requests_per_hour:
        print("No valid timestamps found.")
        return

    print(f"\n--- Request Histogram (by Hour) ---")
    
    max_requests = max(requests_per_hour.values())
    max_bar_length = 50
    
    for hour_key in sorted(requests_per_hour.keys()):
        count = requests_per_hour[hour_key]
        bar_length = int((count / max_requests) * max_bar_length) if max_requests > 0 else 0
        bar = '█' * bar_length
        print(f"{hour_key} | {count:6d} | {bar}")

if __name__ == '__main__':
    log_file = sys.argv[1] if len(sys.argv) > 1 else 'uwsgi.log'
    analyze(log_file)
