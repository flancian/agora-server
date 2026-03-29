from app.util import canonical_wikilink

def check_idempotence(text):
    c1 = canonical_wikilink(text)
    c2 = canonical_wikilink(c1)
    print(f"'{text}' -> '{c1}' -> '{c2}'")
    if c1 != c2:
        print("FAIL: Not idempotent")

check_idempotence("2026 01 11")
check_idempotence("I don't")
check_idempotence("Foo-Bar")
check_idempotence(" foo  bar ")
