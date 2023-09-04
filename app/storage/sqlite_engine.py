import datetime
import sqlite3
import dateutil
from app.storage import render
import os


def dict_factory(cursor, row):
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d


def get_cursor():
    GARDEN_DATABASE = os.environ.get("GARDEN_DATABASE", "garden.db")
    conn = sqlite3.connect(GARDEN_DATABASE)
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
        cursor = get_cursor()
        cursor.execute("select * from subnodes where title=?", [title])
        # search database for subnnodes that match title
        self.subnodes = [subnode_from_row(subnode) for subnode in cursor.fetchall()]

    def pushed_subnodes(self):
        cursor = get_cursor()
        cursor.execute(
            "select * from subnodes where pushes like ?", [f"%{self.title}%"]
        )
        return [subnode_from_row(subnode) for subnode in cursor.fetchall()]

    def pull_nodes(self):
        return []

    def auto_pull_nodes(self):
        return []

    def related(self):
        return []

    # def subnodes(self):
    #     cursor = get_cursor()
    #     subnodes = cursor.execute("select * from subnodes where title=?", [self.title])
    #     return [subnode_from_row(subnode) for subnode in subnodes]

    def __str__(self) -> str:
        return self.title

    def size(self):
        cursor = get_cursor()
        cursor.execute("select count(*) from subnodes where title=?", [self.title])
        return cursor.fetchone()["count(*)"]


class Subnode:
    def __init__(self, title, body, user, updated, type="text"):
        self.title = title
        self.body = body
        self.user = user
        self.type = type
        self.mediatype = type
        self.content = body
        self.uri = f"{user}/{title}"
        self.url = self.uri
        self.wikilink = title
        self.basename = title
        self.datetime = dateutil.parser.parse(updated)

    def render(self):
        content = render.preprocess(self.content, subnode=self)
        content = render.markdown(content)
        return content

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
        updated=row["updatedAt"],
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
    cursor.execute(
        "select distinct title from subnodes order by updated_at desc limit 1000"
    )
    return [Node(subnode["title"]) for subnode in cursor.fetchall()]


def all_journals():
    current_year = datetime.datetime.now().year
    current_month = datetime.datetime.now().strftime("%m")
    current_day = datetime.datetime.now().strftime("%d")
    dates = []
    for i in range(1, int(current_day) + 1):
        dates.append(f"'{current_year}-{current_month}-{str(i).zfill(2)}'")
    for i in range(1, 30):
        last_month = int(current_month) - 1
        dates.append(f"'{current_year}-{str(last_month).zfill(2)}-{str(i).zfill(2)}'")
    date_str = ",".join(dates)
    cursor = get_cursor()
    cursor.execute(
        f"select * from subnodes where title in ({date_str}) order by title desc"
    )
    nodes = [Node(subnode["title"]) for subnode in cursor.fetchall()]
    return nodes


def subnode_by_uri(uri):
    cursor = get_cursor()
    [user, title] = uri.split("/")
    cursor.execute("select * from subnodes where user=? and title=?", [user, title])
    return [subnode_from_row(subnode) for subnode in cursor.fetchall()][0]


def random_node():
    cursor = get_cursor()
    cursor.execute("select title from subnodes order by random() limit 1")
    return [Node(subnode["title"]) for subnode in cursor.fetchall()][0]


def latest(max):
    cursor = get_cursor()
    cursor.execute("select * from subnodes order by updated_at desc limit ?", [max])
    return [subnode_from_row(subnode) for subnode in cursor.fetchall()]
