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
import time
import os
from flask import current_app
from . import config
from . import feed
from . import regexes
from . import render
from . import util
from collections import defaultdict
from fuzzywuzzy import fuzz
from operator import attrgetter
from typing import Union
from pathlib import Path
from dateparser import DateDataParser

# For [[push]] parsing, perhaps move elsewhere?
import lxml.html
import lxml.etree
import sqlite3
from dotmap import DotMap
import json

# This is, like, unmaintained :) I should reconsider; [[auto pull]] sounds like a better approach?
# https://anagora.org/auto-pull
FUZZ_FACTOR = 95

# Spreading over a range prevents thundering herd affected by I/O throughput.
CACHE_TTL = random.randint(120, 240)
dbpath = os.getenv('AGORA_DB_PATH')


def regexp(pattern, string):
    return re.search(pattern, string) is not None


class Graph:
    def __init__(self):
        # Revisit.
        dbconnection = sqlite3.connect(dbpath, check_same_thread=False)
        dbconnection.create_function("REGEXP", 2, regexp)
        dbconnection.row_factory = sqlite3.Row
        self.cursor = dbconnection.cursor()

    def edge(self, n0, n1):
        pass

    def edges(self):
        pass

    def node(self, uri):
        # looks up a node by uri (essentially [[wikilink]]).
        # this used to be even worse :)
        return Node(uri)

    def existing_permutations(self, uri, max_length=4):
        # looks up nodes matching a permutation of the tokenized uri.
        #
        # example use: if [[server-agora]] does not exist, serve [[agora-server]]
        #
        # this is, of course, a terrible implementation and dangerous :)
        # only enable up to 4 tokens as 24 permutations is manageable.
        tokens = uri.split('-')
        permutations = itertools.permutations(tokens, max_length)
        permutations = ['-'.join(permutation) for permutation in permutations]
        nodes = [node for node in G.nodes(only_canonical=True).values(
        ) if node.wikilink in permutations and node.subnodes]
        return nodes

    def users(self):
        users = []
        results = self.cursor.execute("select * from users").fetchall()
        for result in results:
            user = User(result[1])
            users.append(user)
        return users

    def journals(self):
        current_app.logger.info(util.get_combined_date_regex())
        results = self.cursor.execute(
            f"SELECT * FROM files WHERE node_name REGEXP '{util.get_combined_date_regex()}' order by node_name desc").fetchmany(100)
        nodes = []
        for result in results:
            node = Node(result[1])
            nodes.append(node)
        nodes.sort(key=lambda x: x.canonical_date(), reverse=True)
        seen = set()
        nodes = [obj for obj in nodes if obj.wikilink not in seen and not seen.add(
            obj.wikilink)]
        return nodes

    def random_node(self):
        result = self.cursor.execute(
            f"select * from files order by random()").fetchone()
        return result['node_name']

    def grab_raw(self, url):
        file = self.cursor.execute(
            f"select * from files where path = '{url}'").fetchone()
        return file['content']
    
    def fullsearch(self, term):
        results = self.cursor.execute(f"select * from files where content like '%{term}%'").fetchall()
        subnodes = []
        for result in results:
            node = Node(result['node_name'])
            s = node.subnodes
            subnodes = subnodes + s
        return subnodes
        


        


class Node:
    """Nodes map 1:1 to wikilinks.
    They resolve to a series of subnodes when being rendered (see below).
    It maps to a particular file in the Agora repository, stored (relative to
    the Agora root) in the attribute 'uri'."""

    def __init__(self, wikilink):
        dbconnection = sqlite3.connect(dbpath)
        dbconnection.row_factory = sqlite3.Row
        self.cursor = dbconnection.cursor()
        # Use a node's URI as its identifier.
        # Subnodes are attached to the node matching their wikilink.
        # i.e. if two users contribute subnodes titled [[foo]], they both show up when querying node [[foo]].
        self.wikilink = wikilink
        self.slug = wikilink.lower().replace(" ", "-")
        # hack hack
        # TODO: revamp the whole notion of wikilink; it should default to free form text, with slugs being generated
        # explicitly. will probably require coalescing different takes on what the 'canonical' description for a
        # node should be, and perhaps having some precedence rules.
        # DEPRECATED -- use {qstr} in rendering code as needed (for now?).
        self.description = wikilink.replace('-', ' ')
        # LOL, this is *not* a uri.
        # TODO(flancian): check where this is used and fix.
        self.uri = wikilink
        self.url = '/node/' + self.uri
        self.actual_uri = current_app.config['URI_BASE'] + '/' + self.uri
        current_app.logger.debug(
            f"select * from files where node_name='{wikilink.lower()}'")
        results = self.cursor.execute(
            f"select * from files join users on files.user_id = users.id where node_name=?", [wikilink.lower()]).fetchall()
        subnodes = []
        for result in results:
            node = result['node_name']
            content = result['content']
            url = result['path']
            user = result['name']
            rendered = result['rendered']
            subnode = Subnode(node=node, content=content, rendered=rendered, user=user, url=url)
            subnodes.append(subnode)

        self.subnodes = subnodes

    def back_nodes(self):
        backlinks = []
        results = self.cursor.execute(
            f"select * from files where outlinks like '%{self.wikilink}%'").fetchall()
        for result in results:
            backlinks.append(Node(result[1]))
        return backlinks

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

    def size(self):
        return len(self.subnodes)

    def go(self):
        result = self.cursor.execute(
            f"select * from files where node_name = ? and golink != ''", [self.wikilink]).fetchone()
        if result:
            return result['golink']
        return ""

    def filter(self, other):
        # There's surely a much better way to do this. Alas :)
        current_app.logger.debug(f"filter {self}, {other}")
        links = []
        for subnode in self.subnodes:
            links.extend(subnode.filter(other))
            current_app.logger.debug(f"subnode {subnode.uri}, {links}")
        return links

    def forward_nodes(self):
        results = self.cursor.execute(
            f"select * from files where node_name ='{self.wikilink}'").fetchall()
        nodes = []
        for result in results:
            outlinks = json.loads(result['outlinks'])
            for outlink in outlinks:
                nodes.append(Node(outlink))
        return nodes

    def pull_nodes(self):
        # set in database
        return []

    def auto_pull_nodes(self):
        # set in database
        return []

    def related_nodes(self):
        # note that this essentially does [[node ranking]].
        # for [[user ranking]], see util.py and agora.py.
        banned_nodes = ['agora', 'go', 'pull', 'push']
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
        return self.back_nodes()

    def push_nodes(self):
        # nodes pushed to from this node.
        links = []
        for subnode in self.subnodes:
            links.extend(subnode.push_nodes())
        return sorted(set(links))

    def canonical_date(self):
        parser = DateDataParser(languages=['en'])
        date = parser.get_date_data(self.wikilink, date_formats=[
            '%Y-%m-%d', '%Y_%m_%d', '%Y%m%d']).date_obj
        if date is None:
            return ""
        return date.isoformat().split("T")[0]

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
                if subnode.mediatype != 'text/plain':
                    continue
                try:
                    # I tried parsing the marko tree but honestly this seemed easier/simpler.
                    html = render.markdown(subnode.content)
                except AssertionError:
                    pass
                try:
                    tree = lxml.html.fromstring(html)
                except lxml.etree.ParserError:
                    continue

                for link in tree.iterlinks():
                    # link is of the form (element, attribute, link, pos) -- see https://lxml.de/3.1/lxmlhtml.html.
                    if link[2] == 'push':
                        # ugly, but hey, it works... for now.
                        # this is *flaky* as it depends on an exact number of html elements to separate
                        # [[push]] and its [[target node]].
                        # could be easily improved by just looking for the next <a>.
                        try:
                            argument = link[0].getnext(
                            ).getnext().getnext().text_content()
                            if re.search(other.wikilink, argument, re.IGNORECASE) or re.search(other.wikilink.replace('-', ' '), argument, re.IGNORECASE):
                                # go one level up to find the <li>
                                parent = link[0].getparent()
                                # the block to be pushed is this level and its children.
                                # TODO: replace [[push]] [[other]] with something like [[pushed from]] [[node]], which makes more sense in the target.
                                block = lxml.etree.tostring(parent)
                                subnodes.append(VirtualSubnode(
                                    subnode, other, block))
                        except AttributeError:
                            # Better luck next time -- or when I fix this code :)
                            pass
        if not subnodes:
            # could be a failure in parsing, as of the time of writing #push isn't well supported.
            subnodes.append(VirtualSubnode(
                subnode, other, f"<em>Couldn't parse #push. See source for content</em>."))
        return subnodes

    def exec(self):
        # returns the blocks (subnodes/resources) that this node *execution* results in, if any.
        # to add node-specific code, see exec/<node>.py (if it exists).
        # currently *unused*, unsure if we're going this way or straight to client-side rendering.
        subnodes = []
        subnodes.append(VirtualSubnode('wp', '', 'test'))
        return subnodes

    def back_links(self):
        return sorted([x.wikilink for x in self.back_nodes()])

    def forward_links(self):
        return sorted([x.wikilink for x in self.forward_nodes()])

    def annotations(self):
        annotations = feed.get_by_uri(self.actual_uri)
        return annotations


class Subnode:
    """A subnode is a note or media resource volunteered by a user of the Agora.
    It maps to a particular file in the Agora repository, stored (relative to
    the Agora root) in the attribute 'uri'."""

    def __init__(self, node=None, content=None, user=None, url=None, rendered=None, type="text"):
        dbconnection = sqlite3.connect(dbpath)
        dbconnection.row_factory = sqlite3.Row
        self.cursor = dbconnection.cursor()

        self.node = node
        self.wikilink = node
        self.content = content.decode()
        self.rendered = rendered.decode()
        self.user = user
        self.url = url
        self.uri = node.replace(" ", "-")
        self.datetime = datetime.datetime.now()  # put in database
        self.basename = node
        self.type = type

    def __hash__(self):
        return hash(self.uri)

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

    def render(self):
        # content = render.preprocess(self.content, subnode=self)
        # content = render.markdown(content)
        # if self.uri.endswith('org') or self.uri.endswith('ORG'):
        #     content = render.preprocess(self.content, subnode=self)
        #     content = render.orgmode(content)

        # ret = render.postprocess(content)
        return self.rendered


class User:
    def __init__(self, user):
        dbconnection = sqlite3.connect(dbpath)
        dbconnection.row_factory = sqlite3.Row
        self.cursor = dbconnection.cursor()

        self.user = user
        self.uri = user
        self.name = user
        # yikes
        self.url = '/@' + self.uri
        try:
            self.config = [x for x in current_app.config['YAML_CONFIG'] if
                           x['target'].split('/')[-1] == self.user.split('@')[-1]][0]
        except IndexError:
            self.config = {}
        if self.config:
            self.repo_url = self.config['url']
            self.repo_target = self.config['target']
            self.repo_type = self.config.get('format', 'unknown')
            self.edit = self.config.get('edit', '')
            self.web = self.config.get('web', '')
            self.support = self.config.get('support', '')

    def subnodes(self):
        user = self.cursor.execute(
            f"select * from users where name='{self.name}'").fetchone()
        results = self.cursor.execute(
            f"select * from files where user_id={user['id']}").fetchall()
        subnodes = []
        for result in results:
            node = result['node_name']
            content = result['content']
            url = result['path']
            user = self.name
            rendered = result['rendered']
            subnode = Subnode(node=node, content=content, user=user, url=url, rendered=rendered)
            subnodes.append(subnode)

        return subnodes

    def readmes(self):
        user = self.cursor.execute(
            f"select * from users where name='{self.name}'").fetchone()
        results = self.cursor.execute(
            f"select * from files where user_id={user[0]} and node_name='readme'").fetchall()
        subnodes = []
        for result in results:
            node = result['node_name']
            content = result['content']
            url = result['path']
            user = self.name
            rendered = result['rendered']
            subnode = Subnode(node=node, content=content, user=user, url=url, rendered=rendered)
            subnodes.append(subnode)
        return subnodes

    def __str__(self):
        return self.user

    def __eq__(self, other):
        return self.user == other.user

    def size(self):
        return len(self.subnodes())
