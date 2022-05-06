import sqlite3
from . import regexes
from . import util

con = sqlite3.connect('agora.db', check_same_thread=False)

def subnodes(node):
    cur = con.cursor()
    subnodes = []
    for row in cur.execute("SELECT * FROM subnodes WHERE node = ?", (node)):
        subnode = Subnode(user=row[0], content=row[1], node=row[2])
        subnodes.append(subnode)
    return subnodes


def all_subnodes():
    cur = con.cursor()
    subnodes = []
    for row in cur.execute("SELECT * FROM subnodes"):
        subnode = Subnode(user=row[1], content=row[2], node=row[3])
        subnodes.append(subnode)
    return subnodes


def content_to_forward_links(content):
    match = regexes.WIKILINK.findall(content)
    links = []
    if match:
        # TODO: make link parsing format-aware.
        links = []
        for m in match:
            # Work around broken forward links due to org mode convention I didn't think of.
            if '][' not in m:
                links.append(util.canonical_wikilink(m))
            else:
                continue
    return links