import datetime


class Node:
    def __init__(self, title):
        self.title = title
        self.qstr = title

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


class Subnode:
    def __init__(self, body):
        self.body = body
        self.datetime = datetime.datetime.now()

    def render(self):
        return self.body


sample_subnode = Subnode("testing")


def build_node(title):
    node = Node(title)
    node.subnodes = [sample_subnode]
    return node
