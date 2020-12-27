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

import cachetools.func
import glob
import re
import os
from . import config
from . import util
from collections import defaultdict
from fuzzywuzzy import fuzz
from operator import attrgetter


# TODO: move action extractor regex here as well.
RE_WIKILINKS = re.compile('\[\[(.*?)\]\]')
FUZZ_FACTOR = 95


# URIs are ids. 
# - In the case of nodes, their [[wikilink]].
#   - Example: 'foo', meaning the node that is rendered when you click on [[foo]] somewhere.
# - In the case of subnodes, a relative path within the Agora.
#   - Example: 'garden/flancian/README.md', meaning an actual file called README.md.
#   - Note the example subnode above gets rendered in node [[README]], so fetching node with uri README would yield it (and others).

# TODO: implement.
class Graph:
    def __init__(self):
        # Revisit.
        pass

    def edge(self, n0, n1):
        pass

    def edges(self):
        pass

    def node(self, uri):
        # looks up a node by uri (essentially [[wikilink]]).
        # horrible
        nodes = self.nodes()
        return nodes_by_wikilink(uri)[0]

    def nodes(self, include_journals=True):
        # returns a list of all nodes

        # first we fetch all subnodes, put them in a dict {wikilink -> [subnode]}.
        # hack hack -- there's something in itertools better than this.
        wikilink_to_subnodes = defaultdict(list)

        for subnode in self.subnodes():
          wikilink_to_subnodes[subnode.wikilink].append(subnode)
        
        # then we iterate over its values and construct nodes for each list of subnodes.
        nodes = []
        for wikilink in wikilink_to_subnodes:
            node = Node(wikilink)
            node.subnodes = wikilink_to_subnodes[wikilink]
            nodes.append(node)

        # remove journals if so desired.
        if not include_journals:
            nodes = [node for node in nodes if not util.is_journal(node.wikilink)]

        # TODO: experiment with other ranking.
        # return sorted(nodes, key=lambda x: -x.size())
        return sorted(nodes, key=lambda x: x.wikilink.lower())

    # does this belong here?
    @cachetools.func.ttl_cache(maxsize=1, ttl=20)
    def subnodes(self, sort=lambda x: x.uri.lower()):
        subnodes = [Subnode(f) for f in glob.glob(os.path.join(config.AGORA_PATH, '**/*.md'), recursive=True)]
        if sort:
            return sorted(subnodes, key=sort)
        else:
            return subnodes


G = Graph()

class Node:
    """Nodes map 1:1 to wikilinks.
    They resolve to a series of subnodes when being rendered (see below).
    It maps to a particular file in the Agora repository, stored (relative to 
    the Agora root) in the attribute 'uri'."""
    def __init__(self, wikilink):
        # Use a node's URI as its identifier.
        # Subnodes are attached to the node matching their wikilink.
        # i.e. if two users contribute subnodes titled [[foo]], they both show up when querying node [[foo]].
        self.wikilink = wikilink
        self.uri = wikilink
        # ensure wikilinks to journal entries are all shown in iso format
        # (important to do it after self.uri = wikilink to avoid breaking
        # links)
        if util.is_journal(wikilink):
            self.wikilink = util.canonical_wikilink(wikilink)
        self.url = '/node/' + self.uri
        self.subnodes = []

    def size(self):
        return len(self.subnodes)

    def go(self):
        # There's surely a much better way to do this. Alas :)
        links = []
        for subnode in self.subnodes:
            links.extend(subnode.go())
        return links 

    def forward_links(self):
        links = []
        for subnode in self.subnodes:
            links.extend(subnode.forward_links)
        return sorted(set(links))

    # Pattern: (subject).action_object.
    # Could be modeled with RDF?
    def pull_nodes(self):
        nodes = []
        for subnode in self.subnodes:
            nodes.extend(subnode.pull_nodes())
        return sorted(set(nodes))

    def push_links(self):
        links = []
        for subnode in self.subnodes:
            links.extend(subnode.push_links())
        return sorted(set(links))


class Subnode:
    """A subnode is a note or media resource volunteered by a user of the Agora.
    It maps to a particular file in the Agora repository, stored (relative to 
    the Agora root) in the attribute 'uri'."""
    def __init__(self, path):
        # Use a subnode's URI as its identifier.
        self.uri = path_to_uri(path)
        self.url = '/subnode/' + path_to_uri(path)
        # Subnodes are attached to the node matching their wikilink.
        # i.e. if two users contribute subnodes titled [[foo]], they both show up when querying node [[foo]].
        self.wikilink = util.canonical_wikilink(path_to_wikilink(path))
        self.user = path_to_user(path)
        with open(path) as f:
            self.content = f.read()
        self.mtime = os.path.getmtime(path)
        self.forward_links = content_to_forward_links(self.content)
        self.node = self.wikilink
        # Initiate node for wikilink if this is the first subnode, append otherwise.
        # G.addsubnode(self)

    def __eq__(self, other):
        # hack hack
        if fuzz.ratio(self.wikilink, other.wikilink) > FUZZ_FACTOR:
            return True
        else:
            return False

    def __sub__(self, other):
        # hack hack
        return 100-fuzz.ratio(self.wikilink, other.wikilink)

    def distance(self, other):
        # hack hack
        return 100-fuzz.ratio(self.wikilink, other.wikilink)

    def go(self):
        """
        returns a set of go links contained in this subnode
        go links are blocks of the form:
        - [[go]] protocol://example.org/url
        protocol defaults to https.
        """
        golinks = subnode_to_actions(self, 'go')
        sanitized_golinks = []
        for golink in golinks:
            # should probably instead check for contains: //
            if golink.startswith('http'):
                sanitized_golinks.append(golink)
            else:
                # hack hack.
                sanitized_golinks.append('https://' + golink)
        return sanitized_golinks

    def pull_nodes(self):
        """
        returns a set of nodes pulled (anagora.org/node/pull) in this subnode
        pulls are blocks of the form:
        - [[pull]] [[node]]
        """

        # TODO: test.
        pull_blocks = subnode_to_actions(self, 'pull')
        pull_nodes = content_to_forward_links("\n".join(pull_blocks))
        return [G.node(node) for node in pull_nodes]

    def push_links(self):
        """
        returns a set of push links contained in this subnode
        push links are blocks of the form:
        - [[push]] [[node]]

        TODO: refactor with the above.
        """

        # TODO: test.
        push_links = subnode_to_actions(self, 'push')
        entities = content_to_forward_links("\n".join(push_links))
        return entities



def subnode_to_actions(subnode, action):
    # hack hack.
    action_regex ='\[\[' + action + '\]\] (.*?)$'
    content = subnode.content
    actions = []
    for line in content.splitlines():
        m = re.search(action_regex, line)
        if m:
            actions.append(m.group(1))
    return actions

class User:
    def __init__(self, user):
        self.uri = user
        self.url = '/user/' + self.uri
        self.subnodes = subnodes_by_user(user)

    def size(self):
        return len(self.subnodes)

def path_to_uri(path):
    return path.replace(config.AGORA_PATH + '/', '')

def path_to_user(path):
    m = re.search('garden/(.+?)/', path)
    if m:
        return m.group(1)
    else:
        return 'agora'

def path_to_wikilink(path):
    return os.path.splitext(os.path.basename(path))[0]

def content_to_forward_links(content):
    # hack hack.
    match = RE_WIKILINKS.findall(content)
    if match:
        return [util.canonical_wikilink(m) for m in match]
    else:
        return []

def latest():
    return sorted(G.subnodes(), key=lambda x: -x.mtime)

def all_users():
    # hack hack.
    users = os.listdir(os.path.join(config.AGORA_PATH, 'garden'))
    return sorted([User(u) for u in users], key=lambda x: x.uri.lower())

def all_journals():
    # hack hack.
    nodes = G.nodes()
    nodes = [node for node in nodes if util.is_journal(node.wikilink)]
    return sorted(nodes, key=attrgetter('wikilink'), reverse=True)

def nodes_by_wikilink(wikilink):
    nodes = [node for node in G.nodes() if node.wikilink == wikilink]
    return nodes

def wikilink_to_node(node):
    try:
        return nodes_by_wikilink(node)[0]
    except (KeyError, IndexError):
        # We'll handle 404 in the template, as we want to show backlinks to non-existent nodes.
        return False

def subnodes_by_wikilink(wikilink, fuzzy_matching=True):
    if fuzzy_matching:
        # TODO
        subnodes = [subnode for subnode in G.subnodes() if fuzz.ratio(subnode.wikilink, wikilink) > FUZZ_FACTOR]
    else:
        subnodes = [subnode for subnode in G.subnodes() if subnode.wikilink == wikilink]
    return subnodes

def search_subnodes(query):
    subnodes = [subnode for subnode in G.subnodes() if re.search(query, subnode.content, re.IGNORECASE)]
    return subnodes

def subnodes_by_user(user):
    subnodes = [subnode for subnode in G.subnodes() if subnode.user == user]
    return subnodes

def user_readmes(user):
    # hack hack
    # fix duplication.
    subnodes = [subnode for subnode in G.subnodes() if subnode.user == user and re.search('readme', subnode.wikilink, re.IGNORECASE)]
    return subnodes

def subnode_by_uri(uri):
    subnode = [subnode for subnode in G.subnodes() if subnode.uri == uri]
    if subnode:
        return subnode[0]
    else:
        # TODO: handle.
        return False

def nodes_by_outlink(wikilink):
    nodes = [node for node in G.nodes() if wikilink in node.forward_links()]
    return sorted(nodes, key=attrgetter('wikilink'))

def subnodes_by_outlink(wikilink):
    # This doesn't work. It matches too much/too little for some reason. Debug someday?
    # subnodes = [subnode for subnode in all_subnodes() if [wikilink for wikilink in subnode.forward_links if fuzz.ratio(subnode.wikilink, wikilink) > FUZZ_FACTOR]]
    subnodes = [subnode for subnode in G.subnodes() if util.canonical_wikilink(wikilink) in subnode.forward_links]
    return subnodes
