import datetime
import sqlite3


def dict_factory(cursor, row):
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d


def get_cursor():
    conn = sqlite3.connect("garden.db")
    conn.row_factory = dict_factory
    cur = conn.cursor()
    return cur


class Node:
    def __init__(self, title):
        self.title = title
        self.qstr = title
        self.uri = title
        self.wikilink = title

    def pushed_subnodes(self):
        return []

    def pull_nodes(self):
        return []

    def auto_pull_nodes(self):
        return []

    def related(self):
        return []

    def subnodes(self):
        return []

    def __str__(self) -> str:
        return self.title


class Subnode:
    def __init__(self, title, body, user, type="text"):
        self.title = title
        self.body = body
        self.user = user
        self.type = type
        self.wikilink = title
        self.datetime = datetime.datetime.now()

    def render(self):
        return self.body

    def mediatype(self):
        return self.type

    def __str__(self) -> str:
        return self.title


class Graph:
    def __init__(self):
        pass

    def node(self, title):
        return build_node(title)


class User:
    def __init__(self, username):
        self.username = username
        self.uri = username
        self.url = "/@" + self.uri
        # get subnodes for user from database
        self.subnodes = [sample_subnode]

    def size(self):
        return len(self.subnodes)

    def __str__(self):
        return self.username


sample_subnode = Subnode("test title", "testing body", "testuser")


def build_node(title):
    print(title)
    node = Node(title)
    cursor = get_cursor()
    cursor.execute("select * from subnodes where title=?", [title])
    # search database for subnnodes that match title
    node.subnodes = [
        Subnode(subnode["title"], subnode["body"], subnode["user"])
        for subnode in cursor.fetchall()
    ]
    return node


def subnodes_by_user(user, sort_by="mtime", mediatype=None, reverse=True):
    # lookup subnodes by user in database
    cursor = get_cursor()
    cursor.execute("select * from subnodes where user=?", [user])
    subnodes = [
        Subnode(subnode["title"], subnode["body"], subnode["user"])
        for subnode in cursor.fetchall()
    ]
    print(subnodes)
    return subnodes


def all_users():
    # get all users from database
    return [User("testuser")]
