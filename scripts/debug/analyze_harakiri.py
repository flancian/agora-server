import collections
import re
import sys

def analyze(log_file):
    harakiris = []
    with open(log_file, 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            if 'HARAKIRI [core 0]' in line:
                m = re.search(r'(?:GET|POST|HEAD|OPTIONS|PUT|DELETE) (/[^? \n]+)', line)
                if m:
                    path = m.group(1)
                    prefix = path.split('/')[1] if len(path) > 1 else ''
                    harakiris.append(prefix)

    c = collections.Counter(harakiris)
    print(f'Total Harakiris parsed: {len(harakiris)}')
    print('Top 20 Harakiris by prefix:')
    for k, v in c.most_common(20):
        print(f'{v}x /{k}')

if __name__ == '__main__':
    log_file = sys.argv[1] if len(sys.argv) > 1 else 'uwsgi.log'
    analyze(log_file)
