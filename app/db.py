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
# guys! I wanna stay sane
from typing import Union

# For [[push]] parsing, perhaps move elsewhere?
import lxml.html
import lxml.etree

# This is, like, unmaintained :) I should reconsider; [[auto pull]] sounds like a better approach?
# https://anagora.org/auto-pull
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

    @cachetools.func.ttl_cache(ttl=60)
    def edges(self):
        pass

    @cachetools.func.ttl_cache(ttl=60)
    def n_edges(self):
        subnodes = G.subnodes()
        edges = sum([len(subnode.forward_links) for subnode in subnodes])
        return edges

    def node(self, uri):
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
        tokens = uri.split('-')
        permutations = itertools.permutations(tokens, max_length)
        permutations = ['-'.join(permutation) for permutation in permutations]
        nodes = [node for node in G.nodes(only_canonical=True).values() if node.wikilink in permutations and node.subnodes]
        return nodes

    def match(self, regex):
        # returns a list of nodes reasonably matching a regex.
        current_app.logger.debug(f'*** Looking for nodes matching {regex}.')
        nodes = [node for node in G.nodes(only_canonical=True).values() if 
                    # has some content
                    node.subnodes and
                    # its wikilink matches the regex
                    re.match(regex, node.wikilink)
                ]
        current_app.logger.debug(f'*** Found related nodes: {nodes}.')
        return nodes

    def search(self, regex):
        # returns a list of nodes reasonably freely matching a regex.
        current_app.logger.debug(f'*** Looking for nodes matching {regex} freely.')
        nodes = [node for node in G.nodes(only_canonical=True).values() if 
                    # has some content
                    node.subnodes and
                    # its wikilink matches the regex
                    re.search(regex, node.wikilink)
                ]
        current_app.logger.debug(f'*** Found related nodes: {nodes}.')
        return nodes

    # @cache.memoize(timeout=30)
    @cachetools.func.ttl_cache(ttl=60)
    def nodes(self, include_journals=True, only_canonical=True):
        # this is where a lot of the 'magic' happens.
        # this:
        #   - reads and coalesces (integrates) [[subnodes]] into [[nodes]] 
        #   - ocassionally provides some code-generated utility by virtue of provisioning [[virtual subnodes]]
        # most node lookups in the Agora just look up a node in this list.
        # this is expensive but less so than subnodes().
        begin = datetime.datetime.now()
        current_app.logger.debug('*** Loading nodes at {begin}.')
        # returns a list of all nodes

        # first we fetch all subnodes, put them in a dict {wikilink -> [subnode]}.
        # hack hack -- there's probably something in itertools better than this?
        node_to_subnodes = defaultdict(list)

        for subnode in self.subnodes():
            node_to_subnodes[subnode.node].append(subnode)
            if subnode.canonical_wikilink != subnode.wikilink and not only_canonical:
                node_to_subnodes[subnode.wikilink].append(subnode)
        
        # then we iterate over its values and construct nodes for each list of subnodes.
        nodes = {}
        for node in node_to_subnodes:
            if not include_journals and util.is_journal(node):
                pass
            n = Node(node)
            n.subnodes = node_to_subnodes[node]
            nodes[node] = n

        end = datetime.datetime.now()
        current_app.logger.debug(f'*** Nodes loaded from {begin} to {end}.')
        return nodes
        # TODO: experiment with other ranking.
        # return sorted(nodes, key=lambda x: -x.size())
        # return sorted(nodes, key=lambda x: x.wikilink.lower())

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
    @cachetools.func.ttl_cache(ttl=60)
    def subnodes(self, sort=lambda x: x.uri.lower()):
        # this is where the magic happens (?)
        # as in -- this is where the rubber meets the road.
        # as of [[2022-01-28]] this takes about 20s to run with an Agora of about 17k subnodes.
        # which makes caching important :)
        begin = datetime.datetime.now()
        current_app.logger.debug(f'*** Loading subnodes at {begin}.')
        base = current_app.config['AGORA_PATH']
        # Markdown.
        subnodes = [Subnode(f) for f in glob.glob(os.path.join(base, '**/*.md'), recursive=True)]
        # Org mode.
        # This should check for files, this blows up for directories like doc.anagora.org, so only globbing for garden for now.
        subnodes.extend([Subnode(f) for f in glob.glob(os.path.join(base, 'garden', '**/*.org'), recursive=True)])
        # Image formats.
        subnodes.extend([Subnode(f, mediatype='image/jpg') for f in glob.glob(os.path.join(base, '**/*.jpg'), recursive=True)])
        subnodes.extend([Subnode(f, mediatype='image/jpg') for f in glob.glob(os.path.join(base, '**/*.jpeg'), recursive=True)])
        subnodes.extend([Subnode(f, mediatype='image/png') for f in glob.glob(os.path.join(base, '**/*.png'), recursive=True)])
        subnodes.extend([Subnode(f, mediatype='image/gif') for f in glob.glob(os.path.join(base, '**/*.gif'), recursive=True)])
        subnodes.extend([Subnode(f, mediatype='image/webp') for f in glob.glob(os.path.join(base, '**/*.webp'), recursive=True)])

        end = datetime.datetime.now()
        current_app.logger.debug(f'*** Loaded subnodes from {begin} to {end}.')
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
        # hack hack
        # TODO: revamp the whole notion of wikilink; it should default to free form text, with slugs being generated
        # explicitly. will probably require coalescing different takes on what the 'canonical' description for a 
        # node should be, and perhaps having some precedence rules.
        # DEPRECATED -- use {qstr} in rendering code as needed (for now?).
        self.description = wikilink.replace('-', ' ')
        # LOL, this is *not* a uri.
        # TODO(flancian): check where this is used and fix.
        self.uri = wikilink
        # ensure wikilinks to journal entries are all shown in iso format
        # (important to do it after self.uri = wikilink to avoid breaking
        # links)
        if util.is_journal(wikilink):
            self.wikilink = util.canonical_wikilink(wikilink)
        # Yikes, I really did whatever I wanted here. This is clearly not a full url. More like a 'url_path'.
        self.url = '/node/' + self.uri
        self.actual_uri = current_app.config['URI_BASE'] + '/' + self.uri
        # This will be filled in by G as it generates all nodes.
        self.subnodes = []

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
        # There's surely a much better way to do this. Alas :)
        links = []
        for subnode in self.subnodes:
            links.extend(subnode.go())
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
    def forward_links(self):
        links = []
        for subnode in self.subnodes:
            links.extend(subnode.forward_links)
        return sorted(set(links))

    def forward_nodes(self):
        return [G.node(x) for x in self.forward_links()]

    # Pattern: (subject).action_object.
    # Could be modeled with RDF?
    def pull_nodes(self):
        # the nodes *being pulled* by this node.
        nodes = []
        for subnode in self.subnodes:
            nodes.extend(subnode.pull_nodes())
        return sorted(set(nodes), key=lambda x: x.uri)

    def auto_pull_nodes(self):
        # note that this essentially does [[node ranking]].
        # for [[user ranking]], see util.py and agora.py.
        banned_nodes = ['agora', 'go', 'pull', 'push']
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
        banned_nodes = ['agora', 'go', 'pull', 'push']
        nodes = []
        # TODO: check that this includes [[virtual subnodes]].
        # auto pull any subnode-specific includes.
        for subnode in self.subnodes:
            nodes.extend(subnode.auto_pull_nodes())
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
        regex = re.sub(r'[-_ ]', '.?', self.uri) + '$'
        nodes.extend([node for node in G.match(regex) if node.uri != self.uri])
        return nodes

    def related(self):
        # nodes that are probably heavily related; right now it does fuzzy prefix matching.
        # same caveats as for equivalent() :)
        nodes = []
        regex = re.sub(r'[-_ ]', '.*', self.uri)
        nodes.extend([node for node in G.search(regex) if node.uri != self.uri])
        return nodes

    def push_nodes(self):
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
            if self.wikilink != n.wikilink and self.wikilink in [n.wikilink for n in n.push_nodes()]:
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
                            argument = link[0].getnext().getnext().getnext().text_content() 
                            if re.search(other.wikilink, argument, re.IGNORECASE) or re.search(other.wikilink.replace('-', ' '), argument, re.IGNORECASE):
                                # go one level up to find the <li>
                                parent = link[0].getparent()
                                # the block to be pushed is this level and its children.
                                # TODO: replace [[push]] [[other]] with something like [[pushed from]] [[node]], which makes more sense in the target.
                                block = lxml.etree.tostring(parent)
                                subnodes.append(VirtualSubnode(subnode, other, block))
                        except AttributeError:
                            # Better luck next time -- or when I fix this code :)
                            pass
        if not subnodes:
            # could be a failure in parsing, as of the time of writing #push isn't well supported.
            subnodes.append(VirtualSubnode(subnode, other, f"<em>Couldn't parse #push. See source for content</em>."))
        return subnodes

    def exec(self):
        # returns the blocks (subnodes/resources) that this node *execution* results in, if any.
        # to add node-specific code, see exec/<node>.py (if it exists).
        # currently *unused*, unsure if we're going this way or straight to client-side rendering.
        subnodes = []
        subnodes.append(VirtualSubnode('wp', '', 'test'))
        return subnodes

    def back_nodes(self):
        return sorted([x for x in nodes_by_outlink(self.wikilink) if x.wikilink != self.wikilink])

    def back_links(self):
        return sorted([x.wikilink for x in self.back_nodes()])

    def pushed_subnodes(self):
        subnodes = []
        for node in self.pushing_nodes():
            for subnode in node.pushing(self):
                subnodes.append(subnode)
        return subnodes

    def annotations(self):
        annotations = feed.get_by_uri(self.actual_uri)
        return annotations


class Subnode:
    """A subnode is a note or media resource volunteered by a user of the Agora.
    It maps to a particular file in the Agora repository, stored (relative to 
    the Agora root) in the attribute 'uri'."""
    def __init__(self, path, mediatype='text/plain'):
        # Use a subnode's URI as its identifier.
        self.uri: str = path_to_uri(path)
        self.url = '/subnode/' + self.uri

        # Subnodes are attached to the node matching their wikilink.
        # i.e. if two users contribute subnodes titled [[foo]], they both show up when querying node [[foo]].
        # will often have spaces; not lossy (or as lossy as the filesystem)
        self.wikilink = path_to_wikilink(path)
        # essentially a slug.
        self.canonical_wikilink = util.canonical_wikilink(self.wikilink)
        self.user = path_to_user(path)
        self.user_config = User(self.user).config
        if self.user_config:
            try:
                self.edit_path = os.path.join(*self.uri.split('/')[2:])
            except TypeError:
                current_app.logger.debug(f'{self.uri} resulted in no edit_path')
            self.support = self.user_config.get('support', False)
            self.edit: Union[str, False] = self.user_config.get('edit', False)
            self.web: Union[str, False] = self.user_config.get('web', False)
            if self.edit:
                # for edit paths with {path}
                self.edit = self.edit.replace("{path}", self.edit_path)
                # for edit paths with {slug}
                # hack hack, the stoa doesn't expect an .md extension so we just cut out the extension from the path for now.
                self.edit = self.edit.replace("{slug}", self.edit_path[:-3])
            if self.web:
                # same as the above but for views
                # for web paths with {path}
                self.web = self.web.replace("{path}", self.edit_path)
                # for web paths with {slug}
                self.web = self.web.replace("{slug}", self.edit_path[:-3])

        self.mediatype = mediatype

        if self.mediatype == 'text/plain':
            try:
                with open(path) as f:
                    self.content = f.read()
                    # Marko raises IndexError on render if the file doesn't terminate with a newline.
                    if not self.content.endswith('\n'):
                        self.content = self.content + '\n'
                    self.forward_links = content_to_forward_links(self.content)
            except IsADirectoryError:
                self.content = "(A directory).\n"
                self.forward_links = []
        elif self.mediatype.startswith('image'):
            with open(path, 'rb') as f:
                self.content = f.read()
                self.forward_links = []
        else:
            raise ValueError

        self.mtime = os.path.getmtime(path)
        self.node = self.canonical_wikilink
        # Initiate node for wikilink if this is the first subnode, append otherwise.
        # G.addsubnode(self)

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

    @cachetools.func.ttl_cache(ttl=60)
    def render(self):
        if self.mediatype != 'text/plain':
            # hack hack
            return '<br /><img src="/raw/{}" style="display: block; margin-left: auto; margin-right: auto; max-width: 100%" /> <br />'.format(self.uri)
        if 'subnode/virtual' in self.url:
            # virtual subnodes should come pre-rendered (as they were extracted post-rendering from other subnodes)
            return self.content
        # ugly, this should be in render.py?
        content = render.preprocess(self.content, subnode=self)
        # this breaks pull buttons
        # content = bleach.clean(content)
        if self.uri.endswith('md') or self.uri.endswith('MD'):
            try:
                content = render.markdown(content)
            except:
                # which exception exactly? this should be improved.
                content = "<strong>There was an error loading or rendering this subnode. You can try refreshing, which will retry this operation.</strong>"
                current_app.logger.exception(f'Subnode could not be loaded in {self} (Heisenbug).')
        if self.uri.endswith('org') or self.uri.endswith('ORG'):
            content = render.orgmode(content)
        # ugly, this too
        ret = render.postprocess(content)
        return ret

    def raw(self):
        return content

    def parse(self):
        """Try to extract structured information from the subnode in question, 
        for example by parsing action blocks or included front matter (YAML).
        """
        # not really finished nor tested.
        raise NotImplementedError
        import yaml
        front_matter = re.search('---(\n.*)*---', self.content, flags=re.MULTILINE)
        if front_matter:
            front_matter = re.sub('---', '', front_matter[0])
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
        golinks = subnode_to_actions(self, 'go')
        # TODO change this to something better after we figure out [[agora actions]] in [[agora proposals]]
        golinks.extend(subnode_to_taglink(self, 'go'))
        golinks.extend(subnode_to_taglink(self, 'go-link'))
        sanitized_golinks = []
        for golink in golinks:
            # looks like a proper URL (includes a protocol)
            if '://' in golink:
                sanitized_golinks.append(golink)
            # looks like a transitive go link (case two in the docstring)
            elif '[[' in golink:
                match = re.search('\[\[(.+?)\]\]', golink)
                if match:
                    action = match.group(1)
                    # hack hack
                    transitive = subnode_to_actions(self, action)[0]
                    sanitized_golinks.append(transitive)
            else:
                # hack hack.
                sanitized_golinks.append('https://' + golink)
        return sanitized_golinks

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
        current_app.logger.debug(f"links {links}")
        sanitized_links = []
        for link in links:
            if '://' in link:
                sanitized_links.append(link)
            else:
                # hack hack.
                sanitized_links.append('https://' + link)
        return sanitized_links

    @cachetools.func.ttl_cache(ttl=60)
    def pull_nodes(self):
        """
        returns a set of nodes pulled (see [[pull]]) in this subnode
        pulls are blocks of the form:
        - [[pull]] [[node]]
        - #pull [[node]]
        """
        pull_blocks = subnode_to_actions(self, 'pull')
        pull_blocks += subnode_to_taglink(self, 'pull')
        current_app.logger.debug(f'in pull_nodes for {self.uri}')
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


    @cachetools.func.ttl_cache(ttl=60)
    def push_nodes(self):
        """
        returns a set of push links contained in this subnode
        push links are blocks of the form:
        - [[push]] [[node]]
        - #push [[node]]

        TODO: refactor with the above.
        """

        # TODO: test.
        push_blocks = subnode_to_actions(self, 'push')
        push_blocks += subnode_to_taglink(self, 'push')
        push_nodes = content_to_forward_links("\n".join(push_blocks))
        return [G.node(node) for node in push_nodes]

class VirtualSubnode(Subnode):
    # For instantiating a virtual subnode -- a subnode derived from another subnode. 
    # Used by [[push]] (transclusion).
    # Used by [[exec]] (general actions).
    def __init__(self, source_subnode, target_node, block):
        """
        source_subnode: where this virtual subnode came from.
        target_node: where this virtual subnode will attach (go to).
        block: the actual payload, as pre rendered html."""
        self.uri = source_subnode.uri
        self.url = '/subnode/virtual'
        # Virtual subnodes are attached to their target
        self.wikilink = target_node.wikilink
        self.canonical_wikilink = self.wikilink
        self.user = source_subnode.user
        # Only text transclusion supported.
        self.mediatype = 'text/plain'

        try:
            self.content = block.decode('UTF-8')
        except AttributeError:
            # sometimes just a string.
            self.content = block
        self.forward_links = content_to_forward_links(self.content)

        self.mtime = source_subnode.mtime
        self.node = self.canonical_wikilink


def subnode_to_actions(subnode, action, blocks_only=False):
    # hack hack.
    if subnode.mediatype != 'text/plain':
        return []
    if blocks_only:
        wikilink_regex ='- \[\[' + action + '\]\] (.*?)$'
    else:
        wikilink_regex ='\[\[' + action + '\]\] (.*?)$'
    content = subnode.content
    actions = []
    for line in content.splitlines():
        m = re.search(wikilink_regex, line)
        if m:
            actions.append(m.group(1))
    return actions

def subnode_to_taglink(subnode, tag, blocks_only=False):
    if subnode.mediatype != 'text/plain':
        return []
    if blocks_only:
        tag_regex =f'- #{tag} (.*?)$'
    else:
        tag_regex =f'#{tag} (.*?)$'
    content = subnode.content
    tags = []
    for line in content.splitlines():
        m = re.search(tag_regex, line)
        if m:
            tags.append(m.group(1))
    return tags

class User:
    def __init__(self, user):
        self.user = user
        self.uri = user
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
         return subnodes_by_user(self.user)

    def __str__(self):
        return self.user

    def __eq__(self, other):
        return self.user == other.user

    def size(self):
        return len(self.subnodes())

def path_to_uri(path):
    return path.replace(current_app.config['AGORA_PATH'] + '/', '')

def path_to_user(path):
    m = re.search('garden/(.+?)/', path)
    if m:
        return m.group(1)
    m = re.search('stoa/(.+?)/', path)
    if m:
        return 'anonymous@' + m.group(1)
    m = re.search('stream/(.+?)/', path)
    if m:
        return m.group(1)
    return 'agora'

def path_to_wikilink(path):
    return os.path.splitext(os.path.basename(path))[0]

def content_to_forward_links(content):
    # hack hack.
    match = regexes.WIKILINK.findall(content)
    links = []
    if match:
        # TODO: make link parsing format-aware.
        links = []
        for m in match:
            # Work around broken forward links due to org mode convention I didn't think of.
            if '][' not in m:
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
        return [util.canonical_wikilink(m) for m in match if '][' not in m]
    else:
        return []

def latest():
    return sorted(G.subnodes(), key=lambda x: -x.mtime)

def top():
    return sorted(G.nodes(only_canonical=True).values(), key=lambda x: -x.size())

def stats():
    stats = {}

    stats['nodes'] = len(G.nodes(only_canonical=True))
    stats['subnodes'] = len(G.subnodes())
    stats['edges'] = G.n_edges()
    stats['users'] = len(all_users())

    return stats

def all_users():
    # hack hack.
    users = os.listdir(os.path.join(current_app.config['AGORA_PATH'], 'garden'))
    return sorted([User(u) for u in users], key=lambda x: x.uri.lower())

def user_journals(user):
    nodes = [node for node in subnodes_by_user(user) if util.is_journal(node.wikilink)]
    return sorted(nodes, key=attrgetter('wikilink'), reverse=True)

def all_journals():
    # hack hack.
    # we could presumably have a more efficient nodes_by_regex? but it might be benchmark-level.
    nodes = G.nodes()
    nodes = [node for node in nodes.values() if util.is_journal(node.wikilink)]

    def datekey(x):
        return re.sub(r'[-_ ]', '', x.wikilink)
        
    r = sorted(nodes, key=datekey, reverse=True)
    return r

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

def subnodes_by_wikilink(wikilink, fuzzy_matching=True):
    if fuzzy_matching:
        # TODO
        subnodes = [subnode for subnode in G.subnodes() if fuzz.ratio(subnode.wikilink, wikilink) > FUZZ_FACTOR]
    else:
        subnodes = [subnode for subnode in G.subnodes() if subnode.wikilink == wikilink]
    return subnodes

def search_subnodes(query):
    current_app.logger.debug(f'query: {query}, searching subnodes.')
    subnodes = [subnode for subnode in G.subnodes() if subnode.mediatype == 'text/plain' and re.search(query, subnode.content, re.IGNORECASE)]
    current_app.logger.debug(f'query: {query}, searched subnodes.')
    return subnodes

def search_subnodes_by_user(query, user):
    subnodes = [subnode for subnode in G.subnodes() if subnode.mediatype == 'text/plain' and subnode.user == user and re.search(query, subnode.content, re.IGNORECASE)]
    return subnodes

def subnodes_by_user(user, sort_by='mtime', reverse=True):
    subnodes = [subnode for subnode in G.subnodes() if subnode.user == user]
    return sorted(subnodes, key=attrgetter(sort_by), reverse=reverse)

def user_readmes(user):
    # hack hack
    # fix duplication.
    subnodes = [subnode for subnode in G.subnodes() if subnode.mediatype == 'text/plain' and subnode.user == user and re.search('readme', subnode.wikilink, re.IGNORECASE)]
    return subnodes

def subnode_by_uri(uri):
    subnode = [subnode for subnode in G.subnodes() if subnode.uri == uri]
    if subnode:
        return subnode[0]
    else:
        # TODO: handle.
        return False

def nodes_by_outlink(wikilink):
    nodes = [node for node in G.nodes(only_canonical=True).values() if wikilink in node.forward_links()]
    return sorted(nodes, key=attrgetter('wikilink'))

def subnodes_by_outlink(wikilink):
    # This doesn't work. It matches too much/too little for some reason. Debug someday?
    # subnodes = [subnode for subnode in all_subnodes() if [wikilink for wikilink in subnode.forward_links if fuzz.ratio(subnode.wikilink, wikilink) > FUZZ_FACTOR]]
    subnodes = [subnode for subnode in G.subnodes() if util.canonical_wikilink(wikilink) in subnode.forward_links]
    return subnodes
