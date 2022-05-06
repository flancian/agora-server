import sqlite3
from . import regexes
from . import util

con = sqlite3.connect('agora.db', check_same_thread=False)

class Subnode():
    def __init__(self, user, node, content, type='text/markdown'):

        # Need to reconfigure these
        self.uri = node
        self.url = node
        self.wikilink = node
        self.canonical_wikilink = node
        self.forward_links = content_to_forward_links(content)

        self.user = user
        self.node = node
        self.content = content
        self.mediatype = type

    def __str__(self):
        return {'user': self.user, 'node': self.node, 'content': self.content}

    def pull_nodes(self):
        return self.forward_links
    def auto_pull_nodes(self):
        return self.forward_links
    def render(self):
        return self.content

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
        print(row)
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