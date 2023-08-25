import datetime
import sqlite3
import dateutil


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
        self.url = title
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
        cursor = get_cursor()
        subnodes = cursor.execute("select * from subnodes where title=?", [self.title])
        return [subnode_from_row(subnode) for subnode in subnodes]

    def __str__(self) -> str:
        return self.title

    def size(self):
        return len(self.subnodes())


class Subnode:
    def __init__(self, title, body, user, updated, type="text"):
        self.title = title
        self.body = body
        self.user = user
        self.type = type
        self.wikilink = title
        self.datetime = dateutil.parser.parse(updated)

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


def subnode_from_row(row):
    return Subnode(
        title=row["title"],
        body=row["body"],
        user=row["user"],
        updated=row["updated_at"],
    )


class User:
    def __init__(self, username):
        self.username = username
        self.uri = username
        self.url = "/@" + self.uri
        # get subnodes for user from database
        cursor = get_cursor()
        cursor.execute("select * from subnodes where user=?", [self.username])
        self.subnodes = [subnode_from_row(subnode) for subnode in cursor.fetchall()]

    def size(self):
        return len(self.subnodes)

    def __str__(self):
        return self.username


def build_node(title):
    print(title)
    node = Node(title)
    cursor = get_cursor()
    cursor.execute("select * from subnodes where title=?", [title])
    # search database for subnnodes that match title
    node.subnodes = [subnode_from_row(subnode) for subnode in cursor.fetchall()]
    return node


def subnodes_by_user(user, sort_by="mtime", mediatype=None, reverse=True):
    # lookup subnodes by user in database
    cursor = get_cursor()
    cursor.execute("select * from subnodes where user=?", [user])
    subnodes = [subnode_from_row(subnode) for subnode in cursor.fetchall()]
    return subnodes


def all_users():
    # get all users from database
    cursor = get_cursor()
    cursor.execute("select distinct user from subnodes")
    users = [User(subnode["user"]) for subnode in cursor.fetchall()]
    return users


def top():
    # get top nodes from database
    cursor = get_cursor()
    # add datetime to database
    cursor.execute("select distinct title from subnodes  limit 1000")
    return [Node(subnode["title"]) for subnode in cursor.fetchall()]
