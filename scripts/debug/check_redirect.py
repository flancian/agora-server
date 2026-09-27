import requests

for i in range(100):
    res = requests.head('http://localhost:5017/random', allow_redirects=True)
    if 'anagora.org' not in res.url and 'localhost' not in res.url:
        print("Found external URL:", res.url)
    elif 'doc.anagora.org' in res.url:
        print("Found doc.anagora.org URL:", res.url)

print("Done")
