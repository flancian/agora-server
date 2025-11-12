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
import datetime
import glob
import itertools
import os
import random
import re
import subprocess
import time
import urllib
import json
import orjson
from collections import defaultdict
from copy import copy
from operator import attrgetter
from pathlib import Path
from typing import Union, List, Dict, Optional, Any
import sys

import lxml.etree
import lxml.html
from flask import current_app, request, g
from thefuzz import fuzz
from functools import wraps

from . import config, regexes, render, util
from .storage import feed, sqlite_engine

GRAPH_INSTANCE_COUNTER = 0

def _is_sqlite_enabled():
    """Checks if the SQLite engine is enabled in the config."""
    try:
        return current_app.config.get('ENABLE_SQLITE', False)
    except RuntimeError:
        # This can happen if we're running outside of a Flask app context.
        return False

def log_cache_hits(func):
    """
    A decorator to log cache hits for a cachetools-cached function.
    It deduplicates logs on a per-request basis to avoid spam.
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        key = cachetools.keys.hashkey(*args, **kwargs)
        if hasattr(func, 'cache') and key in func.cache:
            try:
                # Use Flask's request-local 'g' object to store a set of functions
                # for which we've already logged a cache hit during this request.
                if 'logged_cache_hits' not in g:
                    g.logged_cache_hits = set()

                if func.__name__ not in g.logged_cache_hits:
                    path = request.path
                    current_app.logger.info(f"CACHE HIT (in-memory) for request '{path}': Using cached data for {func.__name__}.")
                    # Add the function name to the set to suppress future logs in this request.
                    g.logged_cache_hits.add(func.__name__)

            except RuntimeError:
                # This will happen if we're not in a request context (e.g. startup).
                # In this case, we log without deduplication.
                current_app.logger.info(f"CACHE HIT (in-memory): Using cached data for {func.__name__}.")
        
        return func(*args, **kwargs)
    return wrapper

# This is, like, unmaintained :) I should reconsider; [[auto pull]] sounds like a better approach?
# https://anagora.org/auto-pull
FUZZ_FACTOR_EQUIVALENT = 95
FUZZ_FACTOR_RELATED = 85

# Content-based TTL strategy for better performance
def get_cache_ttl(content_type: str = "default") -> int:
    """Get appropriate cache TTL based on content type and cost."""
    ttls = {
        "graph_json": 7200,      # 2 hours - very expensive graph visualization data
        "graph_rdf": 7200,       # 2 hours - expensive RDF turtle data
        "node_data": 1800,       # 30 min - moderately expensive node data
        "search": 300,           # 5 min - changes frequently
        "subnodes": 900,         # 15 min - file content changes occasionally
        "default": random.randint(120, 240)  # Keep existing for compatibility
    }
    return ttls.get(content_type, ttls["default"])

# Legacy constant for backwards compatibility  
CACHE_TTL = get_cache_ttl("default")

# URIs are ids.
# - In the case of nodes, their [[wikilink]].
#   - Example: 'foo', meaning the node that is rendered when you click on [[foo]] somewhere.
# - In the case of subnodes, a relative path within the Agora.
#   - Example: 'garden/flancian/README.md', meaning an actual file called README.md.
#   - Note the example subnode above gets rendered in node [[README]], so fetching node with uri README would yield it (and others).

# TODO: implement.


def _default_subnode_sort(subnode):
    """Default sort key for subnodes."""
    return subnode.uri.lower()


class Graph:
    def __init__(self):
        # Revisit.
        pass

    @cachetools.func.ttl_cache(ttl=CACHE_TTL)
    def edges(self):
        pass

    @cachetools.func.ttl_cache(ttl=CACHE_TTL)
    def n_edges(self) -> int:
        subnodes = G.subnodes()
        edges = sum([len(subnode.forward_links) for subnode in subnodes])
        return edges

    @cachetools.func.ttl_cache(ttl=CACHE_TTL)
    def node(self, uri: str) -> 'Node':
        # looks up a node by uri (essentially [[wikilink]]).
        # this used to be even worse :)
        try:
            node = self.nodes()[uri.lower()]
            return node
        except (KeyError, IndexError):
            # We'll handle 404 in the template, as we want to show backlinks to non-existent nodes.
            # Return an empty.
            return Node(uri)

    def existing_permutations(self, uri, max_length=4):
        # looks up nodes matching a permutation of the tokenized uri.
        #
        # example use: if [[server-agora]] does not exist, serve [[agora-server]]
        #
        # this is, of course, a terrible implementation and dangerous :)
        # only enable up to 4 tokens as 24 permutations is manageable.
        tokens = uri.split("-")
        permutations = itertools.permutations(tokens, max_length)
        permutations = ["-".join(permutation) for permutation in permutations]
        nodes = [
            node
            for node in G.nodes(only_canonical=True).values()
            if node.wikilink in permutations and node.subnodes
        ]
        return nodes

    def match(self, regex):
        # returns a list of nodes reasonably matching a regex.
        current_app.logger.debug(f"*** Looking for nodes matching {regex}.")
        nodes = [
            node
            for node in G.nodes(only_canonical=True).values()
            if
            # has some content
            node.subnodes and
            # its wikilink matches the regex
            re.match(regex, node.wikilink)
        ]
        # current_app.logger.debug(f"*** Found related nodes: {nodes}.")
        return nodes

    def search(self, regex):
        # returns a list of nodes reasonably freely matching a regex.
        current_app.logger.debug(f"*** Looking for nodes matching {regex} freely.")
        nodes = [
            node
            for node in G.nodes(only_canonical=True).values()
            if
            # has some content
            node.subnodes and
            # its wikilink matches the regex
            re.search(regex, node.wikilink)
        ]
        # current_app.logger.debug(f"*** Found related nodes: {nodes}.")
        return nodes

    # @cache.memoize(timeout=30)
    def nodes(self, include_journals: bool = True, only_canonical: bool = True) -> Dict[str, 'Node']:
        full_nodes, canonical_nodes = self._get_all_nodes_cached()
        if only_canonical:
            return canonical_nodes
        else:
            return full_nodes

    @log_cache_hits
    @cachetools.func.ttl_cache(maxsize=1, ttl=get_cache_ttl("node_data"))
    def _get_all_nodes_cached(self):
        if _is_sqlite_enabled():
            cache_key = 'all_nodes_v2'
            ttl = get_cache_ttl('node_data')
            cached_value, timestamp = sqlite_engine.get_cached_graph(cache_key)

            if cached_value and (time.time() - timestamp < ttl):
                current_app.logger.info(f"CACHE HIT (sqlite): Using cached data for nodes.")
                current_app.logger.info("CACHE WARMING (in-memory): Starting deserialization of nodes from SQLite.")
                start_time = time.time()

                cached_data = orjson.loads(cached_value)
                
                # This is the full map, equivalent to only_canonical=False
                full_nodes = {}
                node_to_subnodes = cached_data['node_to_subnodes']
                node_to_executable_subnodes = cached_data['node_to_executable_subnodes']

                for node_wikilink in node_to_subnodes:
                    n = Node(node_wikilink)
                    n.subnodes = [Subnode(s['path'], s['mediatype']) for s in node_to_subnodes[node_wikilink]]
                    n.executable_subnodes = [ExecutableSubnode(s['path']) for s in node_to_executable_subnodes.get(node_wikilink, [])]
                    full_nodes[node_wikilink] = n
                
                # Create the filtered, canonical-only version
                canonical_nodes = {
                    k: v for k, v in full_nodes.items()
                    if k == util.canonical_wikilink(k)
                }

                duration = time.time() - start_time
                current_app.logger.info(f"CACHE WARMING (in-memory): Finished deserialization of {len(full_nodes)} nodes in {duration:.2f}s.")
                
                return full_nodes, canonical_nodes

        current_app.logger.info("CACHE MISS (sqlite): Recomputing all nodes.")
        begin = datetime.datetime.now()
        current_app.logger.debug("*** Loading nodes at {begin}.")

        node_to_subnodes = defaultdict(list)
        node_to_executable_subnodes = defaultdict(list)

        # Note: the 'not only_canonical' logic is tricky here.
        # We build the *full* map first, then filter.
        for subnode in self.subnodes():
            node_to_subnodes[subnode.node].append(subnode)
            if subnode.canonical_wikilink != subnode.wikilink:
                node_to_subnodes[subnode.wikilink].append(subnode)

        for executable_subnode in self.executable_subnodes():
            node_to_executable_subnodes[executable_subnode.node].append(executable_subnode)
            if executable_subnode.canonical_wikilink != executable_subnode.wikilink:
                node_to_executable_subnodes[executable_subnode.wikilink].append(executable_subnode)

        if _is_sqlite_enabled():
            serializable_node_map = {
                key: [{'path': s.path, 'mediatype': s.mediatype} for s in value]
                for key, value in node_to_subnodes.items()
            }
            serializable_exec_map = {
                key: [{'path': s.path, 'mediatype': s.mediatype} for s in value]
                for key, value in node_to_executable_subnodes.items()
            }
            data_to_cache = {
                'node_to_subnodes': serializable_node_map,
                'node_to_executable_subnodes': serializable_exec_map
            }
            sqlite_engine.save_cached_graph(cache_key, orjson.dumps(data_to_cache), time.time())
            current_app.logger.info(f"CACHE WRITE (sqlite): Saved all_nodes to persistent cache.")

        full_nodes = {}
        all_node_wikilinks = set(node_to_subnodes.keys()) | set(node_to_executable_subnodes.keys())
        for node_wikilink in all_node_wikilinks:
            n = Node(node_wikilink)
            n.subnodes = node_to_subnodes.get(node_wikilink, [])
            n.executable_subnodes = node_to_executable_subnodes.get(node_wikilink, [])
            full_nodes[node_wikilink] = n
        
        canonical_nodes = {
            k: v for k, v in full_nodes.items()
            if k == util.canonical_wikilink(k)
        }

        end = datetime.datetime.now()
        current_app.logger.debug(f"*** Nodes loaded from {begin} to {end}.")
        return full_nodes, canonical_nodes

    # The following method is unused; it is far too slow given the current control flow.
    # Running something like this would be ideal eventually though.
    # It might also work better once all pulling/pushing logic moves to Graph, where it belongs,
    # and can make use of more sensible algorithms.
    # @cache.memoize(timeout=30)
    def compute_transclusion(self, include_journals=True):
        # Add artisanal virtual subnodes (resulting from transclusion/[[push]]) to all nodes.
        for node in self.nodes():
            pushed_subnodes = node.pushed_subnodes()
            node.subnodes.extend(pushed_subnodes)

    # does this belong here?
    # @cache.memoize(timeout=30)
    @log_cache_hits
    @cachetools.func.ttl_cache(ttl=get_cache_ttl("subnodes"))
    def subnodes(self, sort=_default_subnode_sort) -> List['Subnode']:
        if _is_sqlite_enabled():
            cache_key = 'all_subnodes_v1'
            ttl = get_cache_ttl('subnodes')
            cached_value, timestamp = sqlite_engine.get_cached_graph(cache_key)

            if cached_value and (time.time() - timestamp < ttl):
                current_app.logger.info(f"CACHE HIT (sqlite): Using cached data for subnodes.")
                current_app.logger.info("CACHE WARMING (in-memory): Starting deserialization of subnodes from SQLite.")
                start_time = time.time()

                subnode_data = orjson.loads(cached_value)
                # Subnode objects are reconstructed from cached metadata.
                # The Subnode constructor is relatively cheap as it doesn't do file I/O
                # when content is not accessed. We defer content loading.
                subnodes = [Subnode(s['path'], s['mediatype']) for s in subnode_data]
                
                duration = time.time() - start_time
                current_app.logger.info(f"CACHE WARMING (in-memory): Finished deserialization of {len(subnodes)} subnodes in {duration:.2f}s.")

                # Manually populate the in-memory cache for this request.
                key = cachetools.keys.hashkey(self, sort=sort)
                self.subnodes.cache[key] = subnodes

                if sort:
                    return sorted(subnodes, key=sort)
                return subnodes

        # The following block is executed on a cache miss (in-memory or sqlite).
        current_app.logger.info("CACHE MISS (sqlite): Scanning filesystem for all subnodes.")
        start_time = time.time()
        begin = datetime.datetime.now()
        current_app.logger.debug(f"*** Loading subnodes at {begin}.")
        base = current_app.config["AGORA_PATH"]
        
        # The logic to find all files remains the same.
        current_app.logger.debug(f"*** Loading subnodes: markdown.")
        subnodes = [
            Subnode(f) for f in glob.glob(os.path.join(base, "**/*.md"), recursive=True)
        ]
        current_app.logger.debug(f"*** Loading subnodes: org mode and mycomarkup.")
        subnodes.extend(
            [
                Subnode(f)
                for f in glob.glob(
                    os.path.join(base, "garden", "**/*.org"), recursive=True
                )
            ]
        )
        subnodes.extend(
            [
                Subnode(f)
                for f in glob.glob(
                    os.path.join(base, "garden", "**/*.myco"), recursive=True
                )
            ]
        )
        current_app.logger.debug(f"*** Loading subnodes: images.")
        subnodes.extend(
            [
                Subnode(f, mediatype="image/jpg")
                for f in glob.glob(os.path.join(base, "**/*.jpg"), recursive=True)
            ]
        )
        subnodes.extend(
            [
                Subnode(f, mediatype="image/jpg")
                for f in glob.glob(os.path.join(base, "**/*.jpeg"), recursive=True)
            ]
        )
        subnodes.extend(
            [
                Subnode(f, mediatype="image/png")
                for f in glob.glob(os.path.join(base, "**/*.png"), recursive=True)
            ]
        )
        subnodes.extend(
            [
                Subnode(f, mediatype="image/gif")
                for f in glob.glob(os.path.join(base, "**/*.gif"), recursive=True)
            ]
        )
        subnodes.extend(
            [
                Subnode(f, mediatype="image/webp")
                for f in glob.glob(os.path.join(base, "**/*.webp"), recursive=True)
            ]
        )
        current_app.logger.debug(f"*** Loading subnodes: executable.")
        subnodes.extend(
            [
                Subnode(f, mediatype="text/x-python")
                for f in glob.glob(os.path.join(base, "**/*.py"), recursive=True)
            ]
        )

        if _is_sqlite_enabled():
            # After scanning, save the result to the SQLite cache.
            # We only need to store the path and mediatype to reconstruct the object.
            subnode_data = [{'path': s.path, 'mediatype': s.mediatype} for s in subnodes]
            sqlite_engine.save_cached_graph(cache_key, orjson.dumps(subnode_data), time.time())
            current_app.logger.info(f"CACHE WRITE (sqlite): Saved all_subnodes to persistent cache.")

        duration = time.time() - start_time
        current_app.logger.info(f"CACHE MISS (filesystem): Scanned and loaded {len(subnodes)} subnodes in {duration:.2f}s.")
        end = datetime.datetime.now()
        current_app.logger.debug(f"*** Loaded subnodes from {begin} to {end}.")
        if sort:
            return sorted(subnodes, key=sort)
        else:
            return subnodes

    @log_cache_hits
    @cachetools.func.ttl_cache(ttl=get_cache_ttl("subnodes"))
    def executable_subnodes(self):
        """Executable subnodes: subnodes that require execution to produce a resource.

        I feel this is one of the most anarchistic bits of the Agora and I like it a lot, let's see what happens in practice though ;)

        Good luck!

        -- [[flancian]] 2023-09-24.
        """

        begin = datetime.datetime.now()
        current_app.logger.debug(f'*** Looking for executable subnodes at {begin}.')
        base = current_app.config['AGORA_PATH']
        current_app.logger.debug(f'*** Looking for executable subnodes: Python.')
        # Scan user gardens
        subnodes = [ExecutableSubnode(f) for f in glob.glob(os.path.join(base, '**/*.py'), recursive=True)]
        # Scan built-in executables
        builtin_path = os.path.join(current_app.root_path, 'exec')
        subnodes.extend([ExecutableSubnode(f) for f in glob.glob(os.path.join(builtin_path, '*.py'))])
        return subnodes


G = Graph()


class Node:
    """Nodes map 1:1 to wikilinks.
    They resolve to a series of subnodes when being rendered (see below).
    It maps to a particular file in the Agora repository, stored (relative to
    the Agora root) in the attribute 'uri'."""

    def __init__(self, wikilink: str) -> None:
        # Use a node's URI as its identifier.
        # Subnodes are attached to the node matching their wikilink.
        # i.e. if two users contribute subnodes titled [[foo]], they both show up when querying node [[foo]].
        self.wikilink = wikilink
        # TODO(flancian): check where this is used and fix.
        self.uri = wikilink
        # Handy with interfacing with systems that cannot accept arbitrary-enough text as ID; most stoas can safely accept this-format.
        self.slug = util.slugify(wikilink)
        # hack hack
        # TODO: revamp the whole notion of wikilink; it should default to free form text, with slugs being generated
        # explicitly. will probably require coalescing different takes on what the 'canonical' description for a
        # node should be, and perhaps having some precedence rules.
        # DEPRECATED -- use {qstr} in rendering code as needed (for now?).
        self.description = wikilink.replace("-", " ")
        # LOL, this is *not* a uri.
        # ensure wikilinks to journal entries are all shown in iso format
        # (important to do it after self.uri = wikilink to avoid breaking
        # links)
        if util.is_journal(wikilink):
            self.wikilink = util.canonical_wikilink(wikilink)
        # Yikes, I really did whatever I wanted here. This is clearly not a full url. More like a 'url_path'.
        self.url = "/node/" + self.uri
        self.actual_uri = current_app.config["URI_BASE"] + "/" + self.uri
        # This will be filled in by G as it generates all nodes.
        self.subnodes = []
        # Same here.
        self.executable_subnodes = []

    def __lt__(self, other):
        return self.wikilink.lower() < other.wikilink.lower()

    def __gt__(self, other):
        return self.wikilink.lower() > other.wikilink.lower()

    def __hash__(self):
        return hash(self.wikilink)

    def __str__(self):
        return self.wikilink.lower()

    def __repr__(self):
        return "node: {}".format(self.wikilink.lower())

    def size(self) -> int:
        return len(self.subnodes)

    def go(self):
        # There's surely a much better way to do this. Alas :)
        links = []
        # worried about pushed_subnodes() speed -- perhaps measure?
        # for subnode in self.subnodes + self.pushed_subnodes():
        for subnode in self.subnodes:
            links.extend(subnode.go())
        return links

    def meet(self):
        links = []
        for subnode in self.subnodes:
            links.extend(subnode.meet())
        return links

    def filter(self, other):
        # There's surely a much better way to do this. Alas :)
        current_app.logger.debug(f"filter {self}, {other}")
        links = []
        for subnode in self.subnodes:
            links.extend(subnode.filter(other))
            current_app.logger.debug(f"subnode {subnode.uri}, {links}")
        return links

    # The following section is particularly confusing.
    # Some functions return wikilinks, some return full blown nodes.
    # We probably want to converge on the latter.
    # TODO: fix.
    def forward_links(self) -> List[str]:
        links = []
        for subnode in self.subnodes:
            links.extend(subnode.forward_links)
        return sorted(set(links))

    def forward_nodes(self) -> List['Node']:
        return [G.node(x) for x in self.forward_links()]

    # Pattern: (subject).action_object.
    # Could be modeled with RDF?
    def pull_nodes(self) -> List['Node']:
        # the nodes *being pulled* by this node.
        nodes = []
        for subnode in self.subnodes:
            nodes.extend(subnode.pull_nodes())
        return sorted(set(nodes), key=lambda x: x.uri)

    def auto_pull_nodes(self):
        # note that this essentially does [[node ranking]].
        # for [[user ranking]], see util.py and agora.py.
        banned_nodes = ["agora", "go", "pull", "push"]
        nodes = []
        # TODO: check that this includes [[virtual subnodes]].
        # auto pull any subnode-specific includes.
        for subnode in self.subnodes:
            nodes.extend(subnode.auto_pull_nodes())
        # there are too many of these often, let's try without being so aggressive for a bit.
        # note you need to 'build' these here as back_links currently returns links and not nodes.
        # for node in self.back_links():
        #     nodes.append(G.node(node))

        # too noisy and full text search seems to provide more utility on my use cases, disabling for now.
        # nodes = [node for node in nodes if node not in self.pull_nodes() and node.uri not in banned_nodes]

        # this should add at least things like equivalent dates.
        nodes.extend(self.equivalent())

        # bug: for some reason set() doesn't dedup here, even though I've checked and the hash from duplicate nodes is identical (!).
        # test case: [[hypha]].
        ret = sorted(set(nodes), key=lambda x: x.uri)
        return ret

    def related_nodes(self):
        # note that this essentially does [[node ranking]].
        # for [[user ranking]], see util.py and agora.py.
        banned_nodes = ["agora", "go", "pull", "push"]
        nodes = []
        # there are too many of these often, let's try without being so aggressive for a bit.
        # note you need to 'build' these here as back_links currently returns links and not nodes.
        # for node in self.back_links():
        #     nodes.append(G.node(node))

        # this should add at least things like equivalent dates.
        nodes.extend(self.related())

        # I think [[push]] and [[pull]] are fair game as they mean an [[agora]] user has thought these were strongly related.
        nodes.extend(self.pushing_nodes())
        nodes.extend(self.pulling_nodes())

        # bug: for some reason set() doesn't dedup here, even though I've checked and the hash from duplicate nodes is identical (!).
        # test case: [[hypha]].
        ret = sorted(set(nodes), key=lambda x: x.uri)
        return ret

    def pulling_nodes(self):
        # the nodes pulling *this* node.
        # compare with: pull_nodes.
        nodes = []
        for n in self.back_nodes():
            if self.wikilink in [n.wikilink for n in n.pull_nodes()]:
                nodes.append(n)
        return nodes

    def equivalent(self):
        # nodes that are really pretty much "the same as" this one, e.g. different representations for the same date/time or edit distance (within a useful window)
        nodes = []
        # too aggressive
        # regex = '.*' + re.escape(uri.replace('-', '.*')) + '.*'

        # the slug/uri assumption here is a hack, points in the direction of cleanup.
        # this should probably work based on tokens, which are available... somewhere?
        # hmm, probably providers.py.
        # too much for 'equivalence'? probably somewhere in 'related': prefix match.
        # regex = re.escape(uri.replace('-', '.*')) + '.*'
        # should cover different date formats :)
        regex = re.sub(r"[-_ ]", ".?", self.uri) + "$"
        try:
            nodes.extend([node for node in G.match(regex) if node.uri != self.uri])
        except re.error:
            # sometimes node names might contain invalid regexes.
            pass
        return nodes

    def related(self):
        # nodes that are probably heavily related; right now it does:
        #
        # suffix/prefix matching
        # levenshtein distance
        #
        # same caveats as for equivalent() :)
        #
        l = []
        regex = re.sub(r"[-_ ]", ".*", self.uri)
        try:
            l.extend(
                [
                    node
                    for node in G.search(regex)
                    if node.uri != self.uri
                    and node.uri not in [x.uri for x in self.pull_nodes()]
                ]
            )
        except re.error:
            # sometimes node names might contain invalid regexes.
            pass

        l.extend(
            [
                node for node in G.search('.*') 
                if fuzz.ratio(node.uri, self.uri) > FUZZ_FACTOR_RELATED 
                and node.uri != self.uri
            ]
        )

        return sorted(set(l), key=lambda x: x.uri)

    def push_nodes(self) -> List['Node']:
        # nodes pushed to from this node.
        links = []
        for subnode in self.subnodes:
            links.extend(subnode.push_nodes())
        return sorted(set(links))

    def pushing_nodes(self):
        # the nodes pushing to *this* node.
        # compare with: push_nodes.
        nodes = []
        for n in self.back_nodes():
            if self.wikilink == n.wikilink:
                # ignore nodes pushing to themselves.
                continue
            if self.wikilink != n.wikilink and self.wikilink in [
                n.wikilink for n in n.push_nodes()
            ]:
                nodes.append(n)
        return nodes

    def pushing(self, other):
        # returns the blocks that this node pushes to one other as "virtual subnodes"
        # [[push]] as in anagora.org/node/push.
        #
        # arg other should be a Node.
        # TODO: actually add type annotations, this is 2021.
        #
        # TLDR:
        # - [[push]] [[other]]
        # pushes all children (indented subitems) to [[other]].
        #
        # TODO: implement also:
        # - [[push]] [[other]] foo
        # pushes foo to [[other]]
        #
        # Congratulations! You've gotten to the hackiest place in the [[agora]].
        # ...as of the time of writing :)
        subnodes = []
        if other.wikilink in [n.wikilink for n in self.push_nodes()]:
            for subnode in self.subnodes:
                if subnode.mediatype != "text/plain":
                    continue
                try:
                    # I tried parsing the marko tree but honestly this seemed easier/simpler.
                    html = render.markdown(subnode.content)
                except AssertionError:
                    pass
                except KeyError:
                    current_app.logger.debug(f"Error parsing subnode {subnode}.")
                    html = 'There was an error parsing this subnode.'
                try:
                    tree = lxml.html.fromstring(html)
                except (lxml.etree.ParserError, lxml.etree.XMLSyntaxError):
                    # We run a best-effort shop over here... ;)
                    continue

                for link in tree.iterlinks():
                    # link is of the form (element, attribute, link, pos) -- see https://lxml.de/3.1/lxmlhtml.html.
                    if link[2] == "push":
                        # ugly, but hey, it works... for now.
                        # this is *flaky* as it depends on an exact number of html elements to separate
                        # [[push]] and its [[target node]].
                        # could be easily improved by just looking for the next <a>.
                        try:
                            argument = (
                                link[0].getnext().getnext().getnext().text_content()
                            )
                            if re.search(
                                other.wikilink, argument, re.IGNORECASE
                            ) or re.search(
                                other.wikilink.replace("-", " "),
                                argument,
                                re.IGNORECASE,
                            ):
                                # go one level up to find the <li>
                                parent = link[0].getparent()
                                # the block to be pushed is this level and its children.
                                # TODO: replace [[push]] [[other]] with something like [[pushed from]] [[node]], which makes more sense in the target.
                                block = lxml.etree.tostring(parent)
                                subnodes.append(VirtualSubnode(subnode, other, block))
                        except AttributeError:
                            # Better luck next time -- or when I fix this code :)
                            pass

                    # New as of 2023-12-04. Try to support [[foo]]! and [[foo]]: syntax for pushes.
                    if other.wikilink in link[2] or other.wikilink.replace('-', ' ') in link[2]:
                        parent = link[0].getparent()
                        block = lxml.etree.tostring(parent)
                        subnodes.append(VirtualSubnode(subnode, other, block))
                        # subnodes.append(
                        #    VirtualSubnode(
                        #        subnode,
                        #        other,
                        #        f"<em>Experimental push. Not expected to work (yet :).</em>.",
                        #    )
                        #)

        if not subnodes:
            # could be a failure in parsing, as of the time of writing #push isn't well supported.
            subnodes.append(
                VirtualSubnode(
                    subnode,
                    other,
                    f"<em>Couldn't parse #push. See source for content</em>.",
                )
            )
        return subnodes

    def exec(self):
        # returns the blocks (subnodes/resources) that this node *execution* outputs if any.
        # This means node-specific code contributed as ({exec,bin}/<node>.py) by users in high-trust Agoras.
        # TODO: do we call this? Or instead just call render()?
        subnodes = []

        for subnode in self.executable_subnodes:
            # Note as of 2023-09 we don't support #push (or other actions?) from executable subnodes.
            if parameters:
                subnodes.append(VirtualSubnode(subnode, self.wikilink, subnode.exec(parameters)))

        return subnodes

    def back_nodes(self) -> List['Node']:
        # The on-demand indexing for SQLite backlinks is flawed and misses links until the source nodes are viewed.
        # Reverting to the file-based method for now to ensure correctness.
        # TODO: Implement a full index backfill/update strategy for SQLite backlinks.
        if _is_sqlite_enabled():
            # Fast path: get backlinking node URIs directly from the index.
            # This is extremely fast as it requires no file I/O.
            backlinking_node_uris = sqlite_engine.get_backlinking_nodes(self.wikilink)
            nodes = [G.node(uri) for uri in backlinking_node_uris if uri != self.wikilink]
            return sorted(nodes)

        # Slow path: fall back to the file-based method if SQLite is disabled.
        return sorted(
            [x for x in nodes_by_outlink(self.wikilink) if x.wikilink != self.wikilink]
        )

    def back_links(self) -> List[str]:
        return sorted([x.wikilink for x in self.back_nodes()])

    def pushed_subnodes(self):
        # This returns a list of VirtualSubnodes representing the pushed or executed blocks.
        # Returning long lists here makes the Agora slow as each of these requires processing.
        # Better to only call this in async paths to keep basic node rendering fast.
        subnodes = []
        # these are blocks that senders have published to the current location, which in Agora node/feed parlance is [[subnodes pushed to this node]] from another.
        for node in self.pushing_nodes():
            for subnode in node.pushing(self):
                current_app.logger.debug(
                    f"in pushed_subnodes, found subnode ({subnode.uri}"
                )
                subnodes.append(subnode)

        # These are arbitrary code execution for scripts clearly marked as such by users in their gardens :D
        # These can be expensive ;) You can call /exec on these and a [[high-trust Agora]] will try to execute them.
        for subnode in self.executable_subnodes:
            current_app.logger.debug(f"In pushed_subnodes, found virtual subnode ({subnode.uri}.")
            subnodes.append(subnode)

        return subnodes

    def annotations(self):
        annotations = feed.get_by_uri(self.actual_uri)
        return annotations


class Subnode:
    """A subnode is a note or media resource volunteered by a user of the Agora.
    It maps to a particular file in the Agora repository, stored (relative to
    the Agora root) in the attribute 'uri'."""

    def __init__(self, path: str, mediatype: str = "text/plain") -> None:
        self.path = path
        # Use a subnode's URI as its identifier.
        self.uri: str = path_to_uri(path)
        self.garden_relative: str = path_to_garden_relative(path)
        self.url = "/subnode/" + self.uri
        self.basename: str = path_to_basename(path)

        # Subnodes are attached to the node matching their wikilink.
        # i.e. if two users contribute subnodes titled [[foo]], they both show up when querying node [[foo]].
        # will often have spaces; not lossy (or as lossy as the filesystem)
        self.wikilink = path_to_wikilink(path)
        # essentially a slug but without '-' -- close to what the user would intuitively write in a search engine, all lower case.
        self.canonical_wikilink = util.canonical_wikilink(self.wikilink)
        self.user = path_to_user(path)
        self.user_config = User(self.user).config
        if self.user_config:
            self.load_user_config()

        self.mediatype = mediatype

        if self.mediatype == "text/plain":
            self.load_text_subnode()
            self.type = "text"
        elif self.mediatype.startswith("image"):
            self.load_image_subnode()
            self.type = "image"
        elif self.mediatype.startswith("text/x-python"):
            self.load_text_subnode()
            self.type = "text"
        else:
            raise ValueError

        try:
            self.mtime = os.path.getmtime(path)
        except FileNotFoundError:
            # Perhaps it makes sense to treat this as a 'virtual file'? give it now() as mtime?
            self.mtime = datetime.datetime.timestamp(datetime.datetime.now())
        self.datetime = datetime.datetime.fromtimestamp(self.mtime).replace(
            microsecond=0
        )

        if _is_sqlite_enabled():
            # Get the last known modification time from our index.
            stored_mtime = sqlite_engine.get_subnode_mtime(self.uri)

            # If the file is new or has been updated since the last time we saw it...
            if stored_mtime is None or self.mtime > stored_mtime:
                # ...then we update its index entry.
                # This function handles both the 'subnodes' and 'links' tables.
                current_app.logger.info(f"INDEX: Re-indexing changed subnode: {self.uri}")
                sqlite_engine.update_subnode(
                    path=self.uri,
                    user=self.user,
                    node=self.canonical_wikilink,
                    mtime=self.mtime,
                    links=self.forward_links
                )

        self.node = self.canonical_wikilink

    def __repr__(self):
        return f"<Subnode: {self.uri} ({self.mediatype})>"

    def load_text_subnode(self):
        try:
            with open(self.path) as f:
                self.content = f.read()
                # Marko raises IndexError on render if the file doesn't terminate with a newline.
                if not self.content.endswith("\n"):
                    self.content = self.content + "\n"
                self.forward_links = content_to_forward_links(self.content)
        except IsADirectoryError:
            self.content = "(A directory).\n"
            self.forward_links = []
        except FileNotFoundError:
            self.content = "(File not found).\n"
            self.forward_links = []
            current_app.logger.exception(
                f"Could not read file due to FileNotFoundError in Subnode __init__ (Heisenbug)."
            )
        except OSError:
            self.content = "(File could not be read).\n"
            self.forward_links = []
            current_app.logger.exception(
                f"Could not read file due to OSError in Subnode __init__ (Heisenbug)."
            )
        except:
            self.content = "(Unhandled exception when trying to read).\n"
            self.forward_links = []
            current_app.logger.exception(
                f"Could not read file due to unhandled exception in Subnode __init__ (Heisenbug)."
            )

    def load_image_subnode(self):
        with open(self.path, "rb") as f:
            self.content = f.read()
            self.forward_links = []

    def load_user_config(self):
        try:
            self.edit_path = os.path.join(*self.uri.split("/")[2:])
        except TypeError:
            current_app.logger.debug(f"{self.uri} resulted in no edit_path")
        self.support = self.user_config.get("support", False)
        self.edit: Union[str, False] = self.user_config.get("edit", False)
        self.web: Union[str, False] = self.user_config.get("web", False)
        if self.edit:
            # for edit paths with {path}
            self.edit = self.edit.replace("{path}", self.edit_path)
            # for edit paths with {slug}
            # hack hack, the stoa doesn't expect an .md extension so we just cut out the extension from the path for now.
            self.edit = self.edit.replace(
                "{slug}", str(Path(self.edit_path).with_suffix(""))
            )
        if self.web:
            # same as the above but for views
            # for web paths with {path}
            self.web = self.web.replace("{path}", self.edit_path)
            # for web paths with {slug}
            self.web = self.web.replace(
                "{slug}", str(Path(self.edit_path).with_suffix(""))
            )

    def __hash__(self):
        return hash(self.uri)

    def __eq__(self, other):
        # hack hack
        if fuzz.ratio(self.wikilink, other.wikilink) > FUZZ_FACTOR_EQUIVALENT:
            return True
        else:
            return False

    def __sub__(self, other):
        # hack hack
        return 100 - fuzz.ratio(self.wikilink, other.wikilink)

    def distance(self, other):
        # hack hack
        return 100 - fuzz.ratio(self.wikilink, other.wikilink)

    def render(self, argument=''):
        if self.mediatype not in ["text/plain", "text/html", 'text/x-python']:
            # hack hack
            return '<br /><img src="/raw/{}" style="display: block; margin-left: auto; margin-right: auto; max-width: 100%" /> <br />'.format(
                self.uri
            )
        if "subnode/virtual" in self.url:
            # virtual subnodes should come pre-rendered (as they were extracted post-rendering from other subnodes)
            return self.content
        # this breaks pull buttons
        # content = bleach.clean(content)
        content = '<mark>Content not supported. If you see this, there is a bug in the Agora :). Please report it <a href="https://anagora.org/go/agora/bug">here</a>, thank you!)'
        if self.uri.endswith("md") or self.uri.endswith("MD"):
            try:
                content = render.preprocess(self.content, subnode=self)
                content = render.markdown(content)
            except:
                # which exception exactly? this should be improved.
                # as of 2022-04-20, this seems to be AttributeError most of the time.
                # caused by: 'BlankLine' object has no attribute 'children' in html_renderer.py:84 in marko.
                current_app.logger.exception(
                    f"Subnode {self.uri} could not be rendered, retrying once (Heisenbug)."
                )
                try:
                    # try reloading on demand, working around caches.
                    self.load_text_subnode()
                    content = render.preprocess(self.content, subnode=self)
                    content = render.markdown(content)
                except:
                    content = "<strong>There was an error loading or rendering this subnode. You can try refreshing, which will retry this operation.</strong>"
                    current_app.logger.exception(
                        f"Subnode {self.uri} could not be rendered even after retrying read (Heisenbug)."
                    )
        if self.uri.endswith("org") or self.uri.endswith("ORG"):
            if current_app.config["ENABLE_ORGORA"]:
                # YOLO :)
                from orgorapython import parse_string as orgmode
                content = render.preprocess(self.content, subnode=self)
                content = orgmode(content)
            else:
                try:
                    import orgpython
                    content = render.preprocess(self.content, subnode=self)
                    content = orgpython.to_html(content)
                except:
                    pass
        # note we might parse [[mycorrhiza]] as Markdown if the [[mycomarkup]] binary is not found.
        if self.uri.endswith("myco") or self.uri.endswith("MYCO"):
            content = render.preprocess(self.content, subnode=self)
            content = render.mycomarkup(content)
        if self.uri.endswith("py") or self.uri.endswith("PY"):
            content = '<br /><em>(Python code, output might appear as a push if this Agora supports it.)</em><br /><br />'
        ret = render.postprocess(content)
        return ret

    def raw(self):
        return self.content

    def parse(self):
        """Try to extract structured information from the subnode in question,
        for example by parsing action blocks or included front matter (YAML).
        """
        # not really finished nor tested.
        raise NotImplementedError
        import yaml

        front_matter = re.search("---(\n.*)*---", self.content, flags=re.MULTILINE)
        if front_matter:
            front_matter = re.sub("---", "", front_matter[0])
            return yaml.safe_load(front_matter)
        return None

    def go(self):
        """
        returns a set of go links contained in this subnode
        go links are blocks of one of two forms. A simple one:

        - [[go]] https://example.org
        - #go https://example.org

        Or a transitive form:

        - [[foo]] protocol://example.org
        - #go [[foo]]

        (protocol defaults to https.)
        """
        # Currently this only applies to non-Virtual subnodes. Virtual subnodes override.
        current_app.logger.debug(f"in subnode go ({self.uri}")
        golinks = subnode_to_actions(self, "go")
        # TODO change this to something better after we figure out [[agora actions]] in [[agora proposals]]
        golinks.extend(subnode_to_taglink(self, "go"))
        golinks.extend(subnode_to_taglink(self, "go-link"))
        sanitized_golinks = []
        for golink in golinks:
            # looks like a proper URL (includes a protocol)
            if "://" in golink:
                sanitized_golinks.append(golink)
            # looks like a transitive go link (case two in the docstring)
            elif "[[" in golink:
                match = re.search(r"\[\[(.+?)\]\]", golink)
                if match:
                    action = match.group(1)
                    # hack hack
                    transitive_links = subnode_to_actions(self, action)
                    if transitive_links:
                        sanitized_golinks.append(transitive_links[0])
            else:
                # hack hack.
                sanitized_golinks.append("https://" + golink)
        return sanitized_golinks

    def meet(self):
        """
        returns a set of meet links contained in this subnode
        meet links are blocks of the form:
        - #meet https://example.org
        """
        current_app.logger.debug(f"in subnode meet ({self.uri}")
        meetlinks = subnode_to_taglink(self, "meet", blocks_only=True)
        sanitized_meetlinks = []
        for meetlink in meetlinks:
            if "://" in meetlink:
                sanitized_meetlinks.append(meetlink)
            else:
                # hack hack.
                sanitized_meetlinks.append("https://" + meetlink)
        return sanitized_meetlinks

    def filter(self, other):
        """
        other is a string.
        returns a set of links contained in this subnode
        in blocks of the form:
        - [[other]] protocol://example.org/url

        protocol defaults to https.
        might pick up magic like resolving social network issues later :)
        """
        current_app.logger.debug(f"in subnode filter({self.uri}, {other}")
        links = subnode_to_actions(self, other, blocks_only=False)
        links += subnode_to_taglink(self, other, blocks_only=False)
        current_app.logger.debug(f"links {links}")
        sanitized_links = []
        for link in links:
            if "://" in link:
                sanitized_links.append(link)
            else:
                # hack hack.
                sanitized_links.append("https://" + link)
        return sanitized_links

    @cachetools.func.ttl_cache(ttl=CACHE_TTL)
    def pull_nodes(self) -> List['Node']:
        """
        returns a set of nodes pulled (see [[pull]]) in this subnode
        pulls are blocks of the form:
        - [[pull]] [[node]]
        - #pull [[node]]
        """
        pull_blocks = subnode_to_actions(self, "pull")
        pull_blocks += subnode_to_taglink(self, "pull")
        # current_app.logger.debug(f'in pull_nodes for {self.uri}')
        # hack hack
        pull_nodes = content_to_forward_links("\n".join(pull_blocks))

        return [G.node(node) for node in pull_nodes]

    def auto_pull_nodes(self):
        """
        volunteers nodes beyond the explicitly pulled (as per the above).
        """
        nodes = []
        # default policy used to be all links -- now disabled.
        # nodes.extend(self.pull_nodes())
        return nodes

    @cachetools.func.ttl_cache(ttl=CACHE_TTL)
    def push_nodes(self) -> List['Node']:
        """
        returns a set of push links contained in this subnode
        push links are blocks of the form:
        - [[push]] [[node]]
        - #push [[node]]
        - [[node]]!
        - [[node]]:

        TODO: refactor with the above.
        """

        # TODO: test.
        push_blocks = subnode_to_actions(self, "push")
        push_blocks += subnode_to_taglink(self, "push")
        push_blocks += subnode_to_pushes(self)
        push_nodes = content_to_forward_links("\n".join(push_blocks))
        return [G.node(node) for node in push_nodes]


class VirtualSubnode(Subnode):
    # For instantiating a virtual subnode -- a subnode derived from another subnode.
    # Used by [[push]] (transclusion).
    # Used by [[exec]] (general actions contributed in gardens, see e.g. my [[flancian]]/garden/bin/).
    def __init__(self, source_subnode: 'Subnode', target_node: 'Node', block: Union[str, bytes]) -> None:
        """
        source_subnode: where this virtual subnode came from.
        target_node: where this virtual subnode will attach (go to).
        block: the actual payload, as pre rendered html."""
        self.uri = source_subnode.uri
        self.basename: str = path_to_basename(self.uri)
        self.garden_relative: str = path_to_garden_relative(current_app.config["AGORA_PATH"] + '/' + self.uri)
        # This is needed in Virtual subnodes as wikilink needs to be the node this is being pushed *to* due to a limitation of how we build nodes.
        self.virtual_wikilink : str = path_to_wikilink(current_app.config["AGORA_PATH"] + '/' + self.uri)
        self.url = "/subnode/virtual"
        self.virtual = True
        # Virtual subnodes are attached to their target
        self.wikilink = target_node.wikilink
        self.canonical_wikilink = self.wikilink
        self.user = source_subnode.user
        # LOG(2022-06-05): As of the time of writing we treat VirtualSubnodes as prerendered.
        self.mediatype = "text/html"
        self.type = "executable"

        try:
            self.content = block.decode("UTF-8")
        except AttributeError:
            # sometimes just a string.
            self.content = block
        self.forward_links = content_to_forward_links(self.content)

        self.mtime = source_subnode.mtime
        self.datetime = datetime.datetime.fromtimestamp(self.mtime).replace(
            microsecond=0
        )
        self.node = self.canonical_wikilink

    # We special case go for Virtual Subnodes as they're 'precooked', that is, content is html.
    # We could fix the special casing / at least use media types?
    def go(self):
        # lxml to the rescue again :)
        try:
            tree = lxml.html.fromstring(self.content)
        except lxml.etree.ParserError:
            return []

        for link in tree.iterlinks():
            # link is of the form (element, attribute, link, pos) -- see https://lxml.de/3.1/lxmlhtml.html.
            # yikes -- this was adapted from our other polemical lxml use :)
            if link[2] == "go":
                # ugly, but hey, it works... for now.
                # yolo?
                try:
                    # below seems to work for the test of [[2022-06-05]] pushing to [[testing]].
                    go = link[0].getnext().getnext().text_content()
                    return [go]
                except AttributeError:
                    # Better luck next time -- or when I fix this code :)
                    return []
        return []


class ExecutableSubnode(Subnode):
    # For instantiating an executable subnode -- one that you need to call .exec() on to receive blocks or a resource.
    # Used for garden-sourced executables.
    # Call exec(), get an actual subnode (tm).
    def __init__(self, path: str) -> None:
        """
        subnode: where this subnode came from.
        node: where this virtual subnode will attach (go to).
        block: the actual payload, as pre rendered html."""
        self.path = path
        # Use a subnode's URI as its identifier.
        self.uri: str = path_to_uri(path)
        self.url = '/subnode/' + self.uri
        self.basename: str = path_to_basename(self.uri)

        # Subnodes are attached to the node matching their wikilink.
        # i.e. if two users contribute subnodes titled [[foo]], they both show up when querying node [[foo]].
        # will often have spaces; not lossy (or as lossy as the filesystem)
        self.wikilink = path_to_wikilink(path)
        # essentially a slug.
        self.canonical_wikilink = util.canonical_wikilink(self.wikilink)
        # this is used by the Agora as a label for the source of this content.
        self.garden_relative = self.basename
        self.user = path_to_user(path)
        self.user_config = User(self.user).config
        self.node = self.canonical_wikilink

        # LOG(2022-06-05): As of the time of writing we treat VirtualSubnodes as prerendered.
        self.mediatype = 'text/html'
        self.content = f'This should be the output of script {self.uri}.'
        self.mtime = datetime.datetime.timestamp(datetime.datetime.now())

    def render(self, argument=''):
        """
        This is where subnode execution happens, as of 2023-09 only for .py files.
        """

        current_app.logger.info(f"In ExecutableSubnode render (args: {argument})")
        # YOLO, use with caution only in high trust Agoras -- which will hopefully remain most of them ;)

        if current_app.config["ENABLE_EXECUTABLE_NODES"]:
            if argument:
                output = subprocess.run(['/usr/bin/timeout', '-v', '3', self.path, argument], stdout=subprocess.PIPE, stderr=subprocess.STDOUT).stdout.decode("utf-8") 
            else:
                output = subprocess.run(['/usr/bin/timeout', '-v', '3', self.path], stdout=subprocess.PIPE, stderr=subprocess.STDOUT).stdout.decode("utf-8") 
        else:
                output = """
                Executable subnodes have been disabled by the stewards of this Agora.

                Please reach out to them or refer to Agora documentation if you think this is a mistake.\n"""
        self.content = output.replace('\n', '\n\n')
        content = render.preprocess(self.content, subnode=self)
        content = render.markdown(content)
        ret = render.postprocess(content)
        return ret

    def exec(self):
        pass


class User:
    def __init__(self, user: str) -> None:
        self.user = user
        self.uri = user
        # yikes
        self.url = "/@" + self.uri
        # this is a *lot* of printing.
        # current_app.logger.debug(f"{current_app.config['SOURCES_CONFIG']}")
        try:
            self.config = [
                x
                for x in current_app.config["SOURCES_CONFIG"]
                if x["target"].split("/")[-1] == self.user.split("@")[-1]
            ][0]
        except IndexError:
            self.config = {}
        if self.config:
            self.repo_url = self.config["url"]
            self.repo_target = self.config["target"]
            self.repo_type = self.config.get("format", "unknown")
            self.edit = self.config.get("edit", "")
            self.web = self.config.get("web", "")
            self.support = self.config.get("support", "")

    def subnodes(self) -> List['Subnode']:
        return subnodes_by_user(self.user)

    def __str__(self):
        return self.user

    def __eq__(self, other):
        return self.user == other.user

    def size(self) -> int:
        return len(self.subnodes())


def path_to_uri(path: str) -> str:
    return path.replace(current_app.config["AGORA_PATH"] + "/", "")

def path_to_garden_relative(path: str) -> str:
    relative = re.sub(current_app.config["AGORA_PATH"] + '/', "", path)
    relative = re.sub(r"(garden|stream|stoa)/.*?/", "", relative)
    return relative

def path_to_user(path: str) -> str:
    m = re.search("garden/(.+?)/", path)
    if m:
        return m.group(1)
    m = re.search("stoa/(.+?)/", path)
    if m:
        return "anonymous@" + m.group(1)
    m = re.search("stream/(.+?)/", path)
    if m:
        return m.group(1)
    return "agora"


def path_to_wikilink(path: str) -> str:
    return os.path.splitext(os.path.basename(path))[0]


def path_to_basename(path: str) -> str:
    return os.path.basename(path)


def content_to_forward_links(content: str) -> List[str]:
    # hack hack.
    match = regexes.WIKILINK.findall(content)
    links = []
    if match:
        # TODO: make link parsing format-aware.
        links = []
        for m in match:
            # Work around broken forward links due to org mode convention I didn't think of.
            if "][" not in m:
                links.append(util.canonical_wikilink(m))
            else:
                continue
    return links


def content_to_obsidian_embeds(content):
    # hack hack.
    match = regexes.OBSIDIAN_EMBED.findall(content)
    if match:
        # Work around broken forward links due to org mode convention I didn't think of.
        # TODO: make link parsing format-aware.
        return [util.canonical_wikilink(m) for m in match if "][" not in m]
    else:
        return []


def subnode_to_actions(subnode, action, blocks_only=False):
    # hack hack.
    if subnode.mediatype != "text/plain":
        return []
    if blocks_only:
        wikilink_regex = r"- \[\[" + action + r"\]\] (.*?)$"
    else:
        wikilink_regex = r"\[\[" + action + r"\]\] (.*?)$"
    content = subnode.content
    actions = []
    for line in content.splitlines():
        m = re.search(wikilink_regex, line)
        if m:
            actions.append(m.group(1))
    return actions


def subnode_to_taglink(subnode, tag, blocks_only=False):
    if subnode.mediatype != "text/plain":
        return []
    if blocks_only:
        tag_regex = f"- #{tag} (.*?)$"
    else:
        tag_regex = f"#{tag} (.*?)$"
    content = subnode.content
    tags = []
    for line in content.splitlines():
        m = re.search(tag_regex, line)
        if m:
            tags.append(m.group(1))
    return tags


def subnode_to_pushes(subnode):
    # This is actually only for pushes of the form [[foo]]! or [[foo]]:, meaning link-then-exclamation mark or colon.
    # For #push or [[push]] prefixes, see above.
    if subnode.mediatype != "text/plain":
        return []
    push_regex = r"(\[\[.*?\]\])[!:]"
    content = subnode.content
    pushes = []
    for line in content.splitlines():
        m = re.search(push_regex, line)
        if m:
            pushes.append(m.group(1))
    if pushes:
        current_app.logger.debug(f"*** Pushes from {subnode.uri}: {pushes}***")
    return pushes


def subnodes_by_wikilink(wikilink: str, fuzzy_matching: bool = True) -> List['Subnode']:
    if fuzzy_matching:
        # TODO
        subnodes = [
            subnode
            for subnode in G.subnodes()
            if fuzz.ratio(subnode.wikilink, wikilink) > FUZZ_FACTOR_EQUIVALENT
        ]
    else:
        subnodes = [subnode for subnode in G.subnodes() if subnode.wikilink == wikilink]
    return subnodes


def subnodes_by_user(user: str, sort_by: str = "mtime", mediatype: Optional[str] = None, reverse: bool = True) -> List['Subnode']:
    subnodes = [subnode for subnode in G.subnodes() if subnode.user == user]
    if mediatype:
        subnodes = [
            subnode
            for subnode in subnodes
            if mediatype and subnode.mediatype == mediatype
        ]
    return sorted(subnodes, key=attrgetter(sort_by), reverse=reverse)


def subnodes_by_outlink(wikilink: str) -> List['Subnode']:
    # This doesn't work. It matches too much/too little for some reason. Debug someday?
    # subnodes = [subnode for subnode in all_subnodes() if [wikilink for wikilink in subnode.forward_links if fuzz.ratio(subnode.wikilink, wikilink) > FUZZ_FACTOR_EQUIVALENT]]
    subnodes = [
        subnode
        for subnode in G.subnodes()
        if util.canonical_wikilink(wikilink) in subnode.forward_links
    ]
    return subnodes


def build_node(node: str, extension: str = "", user_list: str = "", qstr: str = "") -> 'Node':
    start_time = time.time()
    timings = []

    # unquote in case the node came in urlencoded, then slugify again to gain the 'dimensionality reduction' effects of
    # slugs -- and also because G.node() expects a slug as of 2022-01.
    # yeah, this is a hack.
    # TODO: fix this, make decoded unicode strings the main IDs within db.py.
    node = urllib.parse.unquote_plus(node)
    # hmm, I don't like this slugify.
    # TODO(2022-06-05): will try to remove it and see what happens.
    # *but this after fixing go links?*
    node = util.canonical_wikilink(node)
    current_app.logger.debug(f"[[{node}]]: Assembling node.")

    # default uprank: system account and maintainers, see config.py.
    rank = current_app.config["RANK"] or ["agora"]
    if user_list:
        # override rank
        # this comes e.g. from query strings and composition functions.
        if "," in user_list:
            rank = user_list.split(",")
        else:
            rank = user_list

    # we copy because we'll potentially modify subnode order, maybe add [[virtual subnodes]].
    stage_start_time = time.time()
    n = copy(G.node(node))
    timings.append(f"'G.node' took {time.time() - stage_start_time:.2f}s")

    # Auto pulls based on regex matching.
    virtual_subnodes = []
    for rule in current_app.config.get('AUTO_PULLS', []):
        if re.match(rule['pattern'], node):
            current_app.logger.info(f"Node [[{node}]] matched auto-pull pattern '{rule['pattern']}'.")
            for template in rule['templates']:
                target_string = template.format(node=node)
                parts = target_string.split('/')
                
                if len(parts) >= 2:
                    script_node_name = parts[0]
                    argument = parts[1]
                    
                    script_node = G.node(script_node_name)
                    if script_node and script_node.executable_subnodes:
                        current_app.logger.info(f"Found executable subnode for [[{script_node_name}]], executing with argument '{argument}'.")
                        # Assuming the first executable subnode is the one we want.
                        script_subnode = script_node.executable_subnodes[0]
                        output = script_subnode.render(argument=argument)
                        
                        # Create a virtual subnode to hold the output.
                        # The target_node is the node we are currently building (e.g., '840').
                        # The source_subnode is the script we just ran.
                        vs = VirtualSubnode(source_subnode=script_subnode, target_node=n, block=output)
                        virtual_subnodes.append(vs)
                    else:
                        current_app.logger.warning(f"Auto-pull for [[{node}]] failed: Could not find executable subnode on node [[{script_node_name}]].")
                else:
                    current_app.logger.warning(f"Auto-pull for [[{node}]] failed: Template '{template}' is not in the expected 'node/argument' format.")

    # Prepend virtual subnodes to the main list so they appear at the top.
    n.subnodes = virtual_subnodes + n.subnodes

    # Auto pulls based on regex matching.
    virtual_subnodes = []
    for rule in current_app.config.get('AUTO_PULLS', []):
        if re.match(rule['pattern'], node):
            for template in rule['templates']:
                target_node_name = template.format(node=node)
                target_node = G.node(target_node_name)
                if target_node and target_node.executable_subnodes:
                    # Again, assuming the first executable subnode is the one we want.
                    script_subnode = target_node.executable_subnodes[0]
                    output = script_subnode.render(argument=node)
                    vs = VirtualSubnode(source_subnode=script_subnode, target_node=n, block=output)
                    virtual_subnodes.append(vs)
    
    # Prepend virtual subnodes to the main list so they appear at the top.
    n.subnodes = virtual_subnodes + n.subnodes

    if n.subnodes:
        # earlier in the list means more highly ranked.
        stage_start_time = time.time()
        n.subnodes = util.uprank(n.subnodes, users=rank)
        timings.append(f"'uprank' took {time.time() - stage_start_time:.2f}s")
        if extension:
            # this is pretty hacky but it works for now.
            # should probably move to a filter method in the node? and get better template support to make what's happening clearer.
            stage_start_time = time.time()
            current_app.logger.debug(f"filtering down to extension {extension}")
            n.subnodes = [
                subnode
                for subnode in n.subnodes
                if subnode.uri.endswith(f".{extension}")
            ]
            n.uri = n.uri + f".{extension}"
            n.wikilink = n.wikilink + f".{extension}"
            timings.append(f"'extension filter' took {time.time() - stage_start_time:.2f}s")
    # n.subnodes.extend(n.exec())

    # q will likely be set by search/the CLI if the entity information isn't fully preserved by node mapping.
    # query is meant to be user parsable / readable text, to be used for example in the UI
    n.qstr = qstr or request.args.get("q")
    if not n.qstr:
        # could this come in better shape from the node proper when the node is actually defined? it'd be nice not to depend on de-slugifying.
        n.qstr = n.wikilink.replace("-", " ")
    # search_subnodes = db.search_subnodes(node)
    n.q = n.qstr

    duration = time.time() - start_time
    current_app.logger.info(f"[[{node}]]: Assembled in {duration:.2f}s ({', '.join(timings)}).")
    return n


def build_multinode(node0: str, node1: str, extension: str = "", user_list: str = "", qstr: str = "") -> 'Node':
    start_time = time.time()
    node0 = urllib.parse.unquote_plus(node0)
    node1 = urllib.parse.unquote_plus(node1)
    current_app.logger.debug(f"[[{node0}/{node1}]]: Assembling multinode (composition).")

    n0 = build_node(node0, extension, user_list, qstr)
    n1 = build_node(node1, extension, user_list, qstr)

    duration = time.time() - start_time
    current_app.logger.debug(f"[[{node0}/{node1}]]: Assembled multinode in {duration:.2f}s.")
    # hack hack
    n0.qstr = node0 + '/' + node1
    n0.q = n0.qstr

    return n0


# Additional support function needed by back_nodes method - will be resolved by the full import later
def nodes_by_outlink(wikilink: str) -> List['Node']:
    nodes = [
        node
        for node in G.nodes(only_canonical=True).values()
        if wikilink in node.forward_links()
    ]
    return sorted(nodes, key=attrgetter("wikilink"))