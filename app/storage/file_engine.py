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
import random
import re

# For executable nodes. Fun -- but caveat emptor, this gives control of the Agora to its gardeners :)
import subprocess

import time
import os

from flask import current_app, request
from . import feed
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

# Import the Graph classes and global instance
from ..graph import Graph, Node, Subnode, User, VirtualSubnode, ExecutableSubnode, G
from ..graph import FUZZ_FACTOR_EQUIVALENT, FUZZ_FACTOR_RELATED, CACHE_TTL
from ..graph import path_to_uri, path_to_garden_relative, path_to_user, path_to_wikilink, path_to_basename
from ..graph import subnodes_by_wikilink, subnodes_by_user, subnodes_by_outlink
from ..graph import build_node, build_multinode, content_to_forward_links, content_to_obsidian_embeds
from ..graph import subnode_to_actions, subnode_to_taglink, subnode_to_pushes

# URIs are ids.
# - In the case of nodes, their [[wikilink]].
#   - Example: 'foo', meaning the node that is rendered when you click on [[foo]] somewhere.
# - In the case of subnodes, a relative path within the Agora.
#   - Example: 'garden/flancian/README.md', meaning an actual file called README.md.
#   - Note the example subnode above gets rendered in node [[README]], so fetching node with uri README would yield it (and others).

# TODO: implement.

def latest(max=False):
    if max:
        return sorted(G.subnodes(), key=lambda x: -x.mtime)[:max]
    else:
        return sorted(G.subnodes(), key=lambda x: -x.mtime)


def top():
    return sorted(G.nodes(only_canonical=True).values(), key=lambda x: -x.size())


def stats():
    stats = {}

    stats["nodes"] = len(G.nodes(only_canonical=True))
    stats["subnodes"] = len(G.subnodes())
    stats["edges"] = G.n_edges()
    stats["users"] = len(all_users())

    return stats


def all_users():
    denylist = ['.git']
    users = os.listdir(os.path.join(current_app.config["AGORA_PATH"], "garden"))
    try:
        # hack hack -- we treat all of gardens, streams and stoas as users -- does that make sense?
        # ...maybe yes.
        users += os.listdir(os.path.join(current_app.config["AGORA_PATH"], "stream"))
        users += os.listdir(os.path.join(current_app.config["AGORA_PATH"], "stoa"))
    except:
        current_app.logger.info(f"Some of: streams, stoas not found.")
    return sorted([User(u) for u in users if u not in denylist], key=lambda x: x.uri.lower())


def user_journals(user):
    subnodes = [
        subnode
        for subnode in subnodes_by_user(user)
        if util.is_journal(subnode.wikilink) and subnode.mediatype == "text/plain"
    ]
    return sorted(subnodes, key=attrgetter("wikilink"))


def all_journals(skip_future=True):
    """
    Returns a list of all journal Subnode objects, sorted by date descending.
    This is the correct implementation that returns Subnodes, not Nodes.
    """
    subnodes = [
        subnode
        for subnode in G.subnodes()
        if util.is_journal(subnode.wikilink) and subnode.mediatype == "text/plain"
    ]

    def datekey(x):
        # Extracts a sortable date string from the wikilink.
        return re.sub(r"[-_ ]", "", x.wikilink)

    ret = sorted(subnodes, key=datekey, reverse=True)

    if skip_future:
        def quiet_strptime(s, format):
            try:
                return datetime.datetime.strptime(s, format)
            except ValueError:
                return None

        now = datetime.datetime.now() + datetime.timedelta(days=1)
        ret = [
            subnode
            for subnode in ret
            if quiet_strptime(subnode.wikilink, "%Y-%m-%d")
            and quiet_strptime(subnode.wikilink, "%Y-%m-%d") < now
        ]
    return ret


def consolidate_nodes(nodes) -> Node:
    node = Node("journals")
    for n in nodes:
        node.subnodes.extend(n.subnodes)
    return node


def random_node():
    nodes = list(G.nodes().values())
    return random.choice(nodes)


# Deprecated.


def nodes_by_wikilink(wikilink):
    nodes = [node for node in G.nodes().values() if node.wikilink == wikilink]
    return nodes


# Deprecated.


def wikilink_to_node(node):
    try:
        return nodes_by_wikilink(node)[0]
    except (KeyError, IndexError):
        # We'll handle 404 in the template, as we want to show backlinks to non-existent nodes.
        # Return an empty.
        return Node(node)




def search_subnodes(query):
    current_app.logger.debug(f"query: {query}, searching subnodes.")
    subnodes = [
        subnode
        for subnode in G.subnodes()
        if subnode.mediatype == "text/plain"
        and re.search(re.escape(query), subnode.content, re.IGNORECASE)
    ]
    current_app.logger.debug(f"query: {query}, searched subnodes.")
    return subnodes


def search_subnodes_by_user(query, user):
    subnodes = [
        subnode
        for subnode in G.subnodes()
        if subnode.user == username
        and re.search(re.escape(query), subnode.content, re.IGNORECASE)
    ]
    return subnodes




def user_readmes(user):
    # hack hack
    # fix duplication.
    subnodes = [
        subnode
        for subnode in G.subnodes()
        if subnode.mediatype == "text/plain"
        and subnode.user == user
        and re.search("readme", subnode.wikilink, re.IGNORECASE)
    ]
    return subnodes


def subnode_by_uri(uri):
    subnode = [subnode for subnode in G.subnodes() if subnode.uri == uri]
    if subnode:
        return subnode[0]
    else:
        # Return None if no subnode is found.
        return None


def nodes_by_outlink(wikilink):
    nodes = [
        node
        for node in G.nodes(only_canonical=True).values()
        if wikilink in node.forward_links()
    ]
    return sorted(nodes, key=attrgetter("wikilink"))




