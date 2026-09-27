import collections

def get_unique_contributors():
    log_file = "/home/flancian/.gemini/antigravity-cli/brain/e3dcc393-da06-4ee0-acb4-4fff333fac87/scratch/raw_authors.txt"
    with open(log_file, "r", encoding="utf-8") as f:
        authors = f.read().strip().split("\n")
        
    counts = collections.Counter(authors)
    sorted_authors = sorted(counts.items(), key=lambda x: x[1], reverse=True)
    
    print("ALL UNIQUE CONTRIBUTORS (Name <Email> - Commit Count):")
    for author, count in sorted_authors:
        print(f"- {author} ({count} commits)")

if __name__ == "__main__":
    get_unique_contributors()
