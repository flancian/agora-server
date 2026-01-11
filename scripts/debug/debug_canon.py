from app.util import canonical_wikilink, is_journal

print(f"is_journal('2026-01-11'): {is_journal('2026-01-11')}")
print(f"canonical('2026-01-11'): '{canonical_wikilink('2026-01-11')}'")
print(f"canonical('2026 01 11'): '{canonical_wikilink('2026 01 11')}'")

print(f"I don't want -> '{canonical_wikilink("I don't want")}'")