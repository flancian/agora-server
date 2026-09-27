import re
import sys
import collections
from datetime import datetime, timedelta

def analyze(log_file, hours=6):
    print(f"Parsing {log_file} for the last {hours} hours...")

    # Find the cutoff time
    try:
        with open(log_file, 'rb') as f:
            f.seek(0, 2)
            f.seek(max(0, f.tell() - 50000))
            last_lines = f.read().decode('utf-8', 'ignore').splitlines()
            
            last_dt = None
            for line in reversed(last_lines):
                # 2026-03-18 22:44:27,502
                m = re.match(r'^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})', line)
                if m:
                    last_dt = datetime.strptime(m.group(1), '%Y-%m-%d %H:%M:%S')
                    break
            
            if not last_dt:
                print("Could not parse latest date.")
                return
                
            cutoff = last_dt - timedelta(hours=hours)
            print(f"Latest log time: {last_dt}")
            print(f"Cutoff time: {cutoff}")
    except Exception as e:
        print(f"Error finding cutoff: {e}")
        return

    level_counts = collections.Counter()
    warning_types = collections.Counter()
    error_types = collections.Counter()
    
    slow_nodes = []
    
    with open(log_file, 'r', encoding='utf-8', errors='ignore') as f:
        writing = False
        for line in f:
            if not writing:
                m = re.match(r'^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})', line)
                if m:
                    try:
                        dt = datetime.strptime(m.group(1), '%Y-%m-%d %H:%M:%S')
                        if dt >= cutoff:
                            writing = True
                    except:
                        pass
            
            if writing:
                # 2026-03-18 22:45:16,495 WARNING app uWSGIWorker10Core0 : Slow node load for [[gpt 4 summary]]: Total=10.009s
                m = re.match(r'^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d+\s+([A-Z]+)\s+app\s+\w+\s+:\s+(.*)', line)
                if m:
                    level = m.group(1)
                    msg = m.group(2)
                    
                    level_counts[level] += 1
                    
                    if level == 'WARNING':
                        if 'Slow node load' in msg:
                            warning_types['Slow node load'] += 1
                            
                            # Extract details
                            # Slow node load for [[gpt 4 summary]]: Total=10.009s | Build=9.731s | Filter=0.000s | StarDB=0.027s | Render=0.251s
                            node_m = re.search(r'for (\[\[.*?\]\]): Total=([\d\.]+)s', msg)
                            if node_m:
                                node = node_m.group(1)
                                total_time = float(node_m.group(2))
                                slow_nodes.append((total_time, node, msg))
                        else:
                            # Classify other warnings
                            prefix = msg.split(':')[0] if ':' in msg else msg[:50]
                            warning_types[prefix.strip()] += 1
                    elif level == 'ERROR':
                        prefix = msg.split(':')[0] if ':' in msg else msg[:50]
                        error_types[prefix.strip()] += 1

    print("\n--- Log Levels ---")
    for level, count in level_counts.most_common():
        print(f"{level:10}: {count}")

    print("\n--- Top Warnings ---")
    for warn, count in warning_types.most_common(10):
        print(f"{count:6d}x {warn}")

    print("\n--- Top Errors ---")
    for err, count in error_types.most_common(10):
        print(f"{count:6d}x {err}")
        
    print("\n--- Top 10 Slowest Nodes ---")
    slow_nodes.sort(reverse=True, key=lambda x: x[0])
    for time, node, full_msg in slow_nodes[:10]:
        print(f"{time:7.2f}s | {node:30} | {full_msg}")

if __name__ == '__main__':
    log_file = sys.argv[1] if len(sys.argv) > 1 else 'agora.log'
    analyze(log_file)
