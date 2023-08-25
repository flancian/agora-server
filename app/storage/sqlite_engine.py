import datetime


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
    node = Node(title)
    # search database for subnnodes that match title
    node.subnodes = [sample_subnode]
    return node


def subnodes_by_user(user, sort_by="mtime", mediatype=None, reverse=True):
    # lookup users by subnode in database
    return [sample_subnode]


def all_users():
    # get all users from database
    return [User("testuser")]
