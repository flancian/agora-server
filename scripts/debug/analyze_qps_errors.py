import collections
import re
import sys

def analyze(log_file):
    requests_per_second = collections.Counter()
    status_codes = collections.Counter()
    total_requests = 0
    total_errors = 0
    
    print(f"Parsing {log_file} for QPS and errors. This may take a moment...")
    
    with open(log_file, 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            if '=> generated' in line:
                total_requests += 1
                # Format is roughly: ... [Date] GET /path => generated N bytes in M msecs (HTTP/1.1 200) ...
                # Let's extract the date and status code
                
                # Extract date
                date_match = re.search(r'\[([^\]]+)\] (?:GET|POST|HEAD|OPTIONS|PUT|DELETE)', line)
                if date_match:
                    date_str = date_match.group(1)
                    requests_per_second[date_str] += 1
                
                # Extract status
                status_match = re.search(r'\(HTTP/1\.[01] (\d{3})\)', line)
                if status_match:
                    status = status_match.group(1)
                    status_codes[status] += 1
                    if status.startswith('5'):
                        total_errors += 1
    
    if not total_requests:
        print("No requests parsed.")
        return

    qps_values = list(requests_per_second.values())
    if not qps_values:
        print("Could not parse dates.")
        return
        
    avg_qps = sum(qps_values) / len(qps_values)
    max_qps = max(qps_values)
    
    print(f"\n--- QPS Stats ---")
    print(f"Total Requests: {total_requests}")
    print(f"Total Seconds Active: {len(qps_values)}")
    print(f"Average QPS: {avg_qps:.2f}")
    print(f"Peak QPS: {max_qps}")
    
    print(f"\n--- Error Rates ---")
    print(f"Total 5xx Errors: {total_errors}")
    error_rate = (total_errors / total_requests) * 100
    print(f"Overall 5xx Error Rate: {error_rate:.4f}%")
    
    print(f"\nStatus Code Breakdown:")
    for code, count in status_codes.most_common():
        percentage = (count / total_requests) * 100
        print(f"  HTTP {code}: {count} ({percentage:.2f}%)")

if __name__ == '__main__':
    log_file = sys.argv[1] if len(sys.argv) > 1 else 'uwsgi.log'
    analyze(log_file)
