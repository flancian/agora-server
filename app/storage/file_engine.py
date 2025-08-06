# Copyright 2020 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# this breaks pull buttons.
# import bleach
import cachetools.func

import datetime
import glob
import itertools
import concurrent.futures
from flask import url_for, current_app, g as G

# For executable nodes. Fun -- but caveat emptor, this gives control of the Agora to its gardeners :)
import subprocess

import time
import os

from flask import current_app, request
from .. import config, regexes, render, util
from collections import defaultdict
from thefuzz import fuzz
from operator import attrgetter
from typing import Union
from pathlib import Path

# For [[push]] parsing, perhaps move elsewhere?
import lxml.html
import lxml.etree

import urllib
from copy import copy

import random

# This is, like, unmaintained :) I should reconsider; [[auto pull]] sounds like a better approach?
# https://anagora.org/auto-pull
FUZZ_FACTOR_EQUIVALENT = 95
FUZZ_FACTOR_RELATED = 75

# Spreading over a range prevents thundering herd affected by I/O throughput.
CACHE_TTL = random.randint(120, 240)

# URIs are ids.
# - In the case of nodes, their [[wikilink]].
#   - Example: 'foo', meaning the node that is rendered when you click on [[foo]] somewhere.
# - In the case of subnodes, a relative path within the Agora.
#   - Example: 'garden/flancian/README.md', meaning an actual file called README.md.
#   - Note the example subnode above gets rendered in node [[README]], so fetching node with uri README would yield it (and others).

# TODO: implement.


class FileEngine:
    def __init__(self, datadir='datadir/'):
        self.datadir = datadir
        self.nodes = {}

    def glob(self, pattern):
        """Globs for files in the datadir."""
        return glob.glob(os.path.join(self.datadir, pattern), recursive=True)

    def get(self, q, content=True):
        """Returns a node by its name.
        
        Args:
            q (str): the name of the node to get.
            content (bool): whether to read the content of the node or not.

        Returns:
            Node: the node object, or None if it does not exist.
        """
        from app.node import Node
        if self.exists(q):
            if content:
                return self.read(q)
            else:
                return Node(q)
        else:
            return None

    def search(self, q):
        """Search for nodes matching a query.

        Args:
            q (str): the query to search for.

        Returns:
            list[Node]: nodes matching the query.
        """
        from app.node import Node
        # TODO: this should probably be a search index.
        # currently it is a glob.
        results = []
        for n in self.glob(f"**/{q}*"):
            results.append(Node(n))
        return results

    def nodes_by_user(self, user):
        """Returns all nodes for a given user."""
        from app.node import Node
        # user is a string here.
        path = os.path.join('users', user, '**', '*')
        nodes = []
        # self.glob returns absolute paths, we need to make them relative to datadir for the Node name.
        for f in self.glob(path):
            if os.path.isdir(f):
                continue
            node_name = os.path.relpath(f, self.datadir)
            nodes.append(self.read(node_name)) # read to get content for forward_links
        return nodes

    def backlinks(self, node_name):
        """Returns all nodes that link to the given node."""
        from app.node import Node
        backlinks = []
        # This is inefficient, we have to walk the whole graph.
        # A search index would be better.
        for f in self.glob("**/*"):
             if os.path.isdir(f) or 'users' in f:
                continue
             # self.glob returns full paths, need to make them relative
             rel_path = os.path.relpath(f, self.datadir)
             node = self.read(rel_path)
             if node_name in node.wikilinks:
                 # we only need the name and uri, so no need to read content again.
                 backlinks.append(Node(rel_path))
        return backlinks

    def pull(self, user, since=0):
        """Pull changes from a user's garden.
        
        Args:
            user (User): the user to pull changes from.
            since (int): the timestamp to pull changes since.
        """
        from app.node import User
        # TODO: this is a placeholder.
        # This should probably use something like git.
        if not isinstance(user, User):
            user = User(user)
        print(f"Pulling changes from {user.name} since {since}.")

    def read(self, path):
        """Reads a node from the filesystem.
        
        Args:
            path (str): the path to the node to read.
            
        Returns:
            Node: the node object.
        """
        from app.node import Node
        with open(os.path.join(self.datadir, path), 'r') as f:
            content = f.read()
        return Node(path, content=content)

    def write(self, node):
        """Writes a node to the filesystem.
        
        Args:
            node (Node): the node to write.
        """
        from app.node import Node
        if not isinstance(node, Node):
            # This is probably a string.
            node = Node(node)
        os.makedirs(os.path.dirname(os.path.join(self.datadir, node.name)), exist_ok=True)
        with open(os.path.join(self.datadir, node.name), 'w') as f:
            f.write(node.content)

    def walk(self):
        """Walks the filesystem and yields all nodes.
        
        Yields:
            Node: all nodes in the filesystem.
        """
        from app.node import Node
        for n in self.glob("**/*"):
            # hack hack
            if 'users' in n:
                continue
            yield Node(n)

    def subnodes(self, path, subnode_name=None):
        """Yields all subnodes in a node, or gets a specific one."""
        from app.node import Subnode
        node = self.read(path)
        # This is a placeholder implementation.
        # It should probably parse the node content for subnodes.
        # For now, it just yields the lines of the content as subnodes.
        all_subnodes = []
        for i, line in enumerate(node.content.splitlines()):
            all_subnodes.append(Subnode(node, line, pre=i, post=None))

        if subnode_name:
            return next((s for s in all_subnodes if s.content == subnode_name), None)
        else:
            return all_subnodes

    def random(self):
        """Returns a random node.
        
        Returns:
            Node: a random node.
        """
        # TODO: this is a placeholder.
        # It should probably be more efficient.
        return self.search("*")[0]


def subnodes_by_user(username, sort_by="mtime", mediatype=None, reverse=True):
    try:
        path = os.path.join(G.datadir, "@" + username)
        subnodes = []
        for f in os.listdir(path):
            if f.startswith("."):
                continue
            subnodes.extend(G.subnodes(f))
        if sort_by == "mtime":
            subnodes.sort(key=lambda s: s.mtime, reverse=reverse)
        elif sort_by == "atime":
            subnodes.sort(key=lambda s: s.atime, reverse=reverse)
        return subnodes
    except FileNotFoundError as e:
        current_app.logger.warning(e)
        return []


def search_subnodes(query):
    # Ripgrep for the win.
    try:
        rg = subprocess.Popen(
            ["rg", "--json", "-i", query, G.datadir],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        out, err = rg.communicate()
        if rg.returncode != 0:
            current_app.logger.warning(err)
            return []
        results = json.loads(out)
        subnodes = [
            Subnode(
                None,
                result["data"]["path"],
                pre=result["data"]["line_number"],
                post=None,
            )
            for result in results
        ]
        return subnodes
    except Exception as e:
        current_app.logger.warning(e)
        return []


def search_subnodes_by_user(query, username):
    # Ripgrep for the win.
    try:
        rg = subprocess.Popen(
            ["rg", "--json", "-i", query, os.path.join(G.datadir, "@" + username)],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        out, err = rg.communicate()
        if rg.returncode != 0:
            current_app.logger.warning(err)
            return []
        results = json.loads(out)
        subnodes = [
            Subnode(
                None,
                result["data"]["path"],
                pre=result["data"]["line_number"],
                post=None,
            )
            for result in results
        ]
        return subnodes
    except Exception as e:
        current_app.logger.warning(e)
        return []


def latest(max=10):
    """Returns the latest subnodes."""
    from app.node import Subnode
    subnodes = []
    for f in G.glob("**/*"):
        if os.path.isdir(f) or 'users' in f:
            continue
        rel_path = os.path.relpath(f, G.datadir)
        node = G.read(rel_path)
        for s in node.subnodes:
            subnodes.append(Subnode(node, s.content, pre=s.pre, post=s.post))
    subnodes.sort(key=lambda s: s.mtime, reverse=True)
    return subnodes[:max]
