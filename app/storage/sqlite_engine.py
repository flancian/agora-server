import datetime
import dateutil
from app.storage import render
import os
import app.storage.model as model


class Node:
    def __init__(self, title):
        self.title = title
        self.qstr = title
        self.uri = title
        self.url = title
        self.wikilink = title
        # search database for subnnodes that match title
        self.subnodes = [
            subnode_from_row(subnode) for subnode in model.subnodes_by_title(title)
        ]

    def pushed_subnodes(self):
        rows = model.pushed_subnodes(self.title)
        return [subnode_from_row(subnode) for subnode in rows]

    def pull_nodes(self):
        return []

    def auto_pull_nodes(self):
        return []

    def related(self):
        return []

    def __str__(self) -> str:
        return self.title

    def size(self):
        return model.size(self.title)


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
        self.datetime = updated

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
        title=row.title,
        body=row.body,
        user=row.user,
        updated=row.updated_at,
    )


class User:
    def __init__(self, username):
        self.username = username
        self.uri = username
        self.url = "/@" + self.uri
        # get subnodes for user from database
        rows = model.subnodes_by_username(username)
        self.subnodes = [subnode_from_row(subnode) for subnode in rows]

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
    rows = model.subnodes_by_username(user)
    subnodes = [subnode_from_row(subnode) for subnode in rows]
    return subnodes


def all_users():
    # get all users from database
    rows = model.users()
    users = [User(user) for user in rows]
    return users


def top():
    # get top nodes from database
    rows = model.top()
    return [Node(subnode.title) for subnode in rows]


def all_journals():
    current_year = datetime.datetime.now().year
    current_month = datetime.datetime.now().strftime("%m")
    current_day = datetime.datetime.now().strftime("%d")
    dates = []
    for i in range(1, int(current_day) + 1):
        dates.append(f"{current_year}-{current_month}-{str(i).zfill(2)}")
    for i in range(1, 30):
        last_month = int(current_month) - 1
        dates.append(f"{current_year}-{str(last_month).zfill(2)}-{str(i).zfill(2)}")
    date_str = ",".join(dates)
    rows = model.journals(dates)
    return [Node(subnode.title) for subnode in rows]


def subnode_by_uri(uri):
    subnode = model.subnode_by_uri(uri)
    return subnode_from_row(subnode)


def random_node():
    row = model.random_node()
    return Node(row.title)


def latest(max):
    rows = model.latest(max)
    return [subnode_from_row(subnode) for subnode in rows]
