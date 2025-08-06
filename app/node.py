"""
The Node object and its graph-related friends.
"""

import os
import re
import glob
import json
from datetime import datetime
from pathlib import Path
import logging
import functools
import itertools
import concurrent.futures

# There is a circular dependency between this module and app.storage.file_engine.
# We could break it by moving url_for to a third module, but for now we'll
# just import it here and have file_engine import it locally.
from flask import url_for, current_app, g as G

wikilink_regex = re.compile(r'\[\[(.*?)\]\]')

class Node:
    def __init__(self, name, content=''):
        self.name = name
        self.content = content
        self.path = os.path.join(G.datadir, name)
        self.uri = url_for('render.render', path=name)

    def __str__(self):
        return self.name

    def __repr__(self):
        return f"<Node {self.name}>"

    def __eq__(self, other):
        return self.name == other.name

    def __hash__(self):
        return hash(self.name)

    @property
    def wikilinks(self):
        return wikilink_regex.findall(self.content)

    @property
    def backlinks(self):
        """Returns a list of nodes that link to this node."""
        return G.graph().backlinks(self.name)

    def render(self, **kwargs):
        # This is a placeholder.
        # The actual implementation will depend on the rendering engine.
        return self.content

    def related(self, max_subnodes=100):
        try:
            return storage.related(self.qstr, max_subnodes=max_subnodes)
        except Exception as e:
            current_app.logger.warning(e)
            return []

    def pull_nodes(self, max_subnodes=100):
        try:
            return storage.pull_nodes(self.qstr, max_subnodes=max_subnodes)
        except Exception as e:
            current_app.logger.warning(e)
            return []

    def pushed_subnodes(self, max_subnodes=100):
        try:
            return storage.pushed_subnodes(self.qstr, max_subnodes=max_subnodes)
        except Exception as e:
            current_app.logger.warning(e)
            return []

    def auto_pull_nodes(self, max_subnodes=100):
        try:
            return storage.auto_pull_nodes(self.qstr, max_subnodes=max_subnodes)
        except Exception as e:
            current_app.logger.warning(e)
            return []

    def subnodes(self, max_subnodes=100):
        try:
            return storage.subnodes(self.qstr, max_subnodes=max_subnodes)
        except Exception as e:
            current_app.logger.warning(e)
            return []

    def size(self):
        try:
            return storage.size(self.qstr)
        except Exception as e:
            current_app.logger.warning(e)
            return 0

    def mtime(self):
        try:
            return storage.mtime(self.qstr)
        except Exception as e:
            current_app.logger.warning(e)
            return 0

class Subnode:
    def __init__(self, node, content, pre, post):
        self.node = node
        self.content = content
        self.pre = pre
        self.post = post
        self.uri = url_for('render.render', path=node.name, subnode=self.content)

    def __str__(self):
        return self.content

    def __repr__(self):
        return f"<Subnode {self.content} of {self.node.name}>"

class User:
    def __init__(self, name):
        self.name = name
        self.path = os.path.join(G.datadir, 'users', name)
        self.uri = url_for('render.render', path=f"users/{name}")

    def __str__(self):
        return self.name

    def __repr__(self):
        return f"<User {self.name}>"

class Graph:
    def __init__(self, datadir=None, engine=None):
        if not engine:
            from app.storage.file_engine import FileEngine
            if datadir:
                engine = FileEngine(datadir=datadir)
            else:
                engine = FileEngine()
        self.engine = engine

    def __getitem__(self, name):
        return self.engine.get(name)

    def __contains__(self, name):
        return self.engine.exists(name)

    def search(self, query):
        return self.engine.search(query)

    def random(self):
        return self.engine.random()

    def write(self, node):
        return self.engine.write(node)

    def subnodes(self, path, subnode_name=None):
        return self.engine.subnodes(path, subnode_name=subnode_name)

    def nodes_by_user(self, user):
        return self.engine.nodes_by_user(user)

    def backlinks(self, node_name):
        return self.engine.backlinks(node_name)
