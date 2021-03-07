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

import glob
import itertools
import re
import os
from flask import current_app
from . import cache
from . import config
from . import feed
from . import render
from . import util
from collections import defaultdict
from fuzzywuzzy import fuzz
from operator import attrgetter

# For [[push]] parsing, perhaps move elsewhere?
import lxml.html
import lxml.etree


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
        # this used to be even worse :)
        try:
            nodes = [node for node in G.nodes() if node.wikilink == uri]
            node = nodes[0]
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
        nodes = [node for node in G.nodes() if node.wikilink in permutations and node.subnodes]
        return nodes

    @cache.memoize(timeout=30)
    def nodes(self, include_journals=True):
        current_app.logger.debug('Loading graph.')
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

        current_app.logger.debug('Graph loaded.')
        # TODO: experiment with other ranking.
        # return sorted(nodes, key=lambda x: -x.size())
        return sorted(nodes, key=lambda x: x.wikilink.lower())

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
    def subnodes(self, sort=lambda x: x.uri.lower()):
        # Markdown.
        subnodes = [Subnode(f) for f in glob.glob(os.path.join(config.AGORA_PATH, '**/*.md'), recursive=True)]
        # Org mode.
        subnodes.extend([Subnode(f) for f in glob.glob(os.path.join(config.AGORA_PATH, '**/*.org'), recursive=True)])
        # Image formats.
        subnodes.extend([Subnode(f, mediatype='image/jpg') for f in glob.glob(os.path.join(config.AGORA_PATH, '**/*.jpg'), recursive=True)])
        subnodes.extend([Subnode(f, mediatype='image/png') for f in glob.glob(os.path.join(config.AGORA_PATH, '**/*.png'), recursive=True)])
        subnodes.extend([Subnode(f, mediatype='image/gif') for f in glob.glob(os.path.join(config.AGORA_PATH, '**/*.gif'), recursive=True)])
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
        self.actual_uri = config.URI_BASE + '/node/' + self.uri
        self.subnodes = []

    def __lt__(self, other):
        return self.wikilink.lower() < other.wikilink.lower()

    def __gt__(self, other):
        return self.wikilink.lower() > other.wikilink.lower()

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
        links = []
        for subnode in self.subnodes:
            links.extend(subnode.filter(other))
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

    # Pattern: (subject).action_object.
    # Could be modeled with RDF?
    def pull_nodes(self):
        # the nodes *being pulled* by this node.
        nodes = []
        for subnode in self.subnodes:
            nodes.extend(subnode.pull_nodes())
        return sorted(set(nodes), key=lambda x: x.uri)

    def pulling_nodes(self):
        # the nodes pulling *this* node.
        # compare with: pull_nodes.
        nodes = []
        for backlink in self.back_links():
            n = G.node(backlink)
            if self.wikilink in [n.wikilink for n in n.pull_nodes()]:
                nodes.append(n)
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
        for backlink in self.back_links():
            n = G.node(backlink)
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
        return subnodes

    def back_links(self):
        return sorted([x.wikilink for x in nodes_by_outlink(self.wikilink) if x.wikilink != self.wikilink])

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
        self.uri = path_to_uri(path)
        self.url = '/subnode/' + path_to_uri(path)
        # Subnodes are attached to the node matching their wikilink.
        # i.e. if two users contribute subnodes titled [[foo]], they both show up when querying node [[foo]].
        self.wikilink = util.canonical_wikilink(path_to_wikilink(path))
        self.user = path_to_user(path)
        self.mediatype = mediatype

        if self.mediatype == 'text/plain':
            with open(path) as f:
                self.content = f.read()
                # Marko raises IndexError on render if the file doesn't terminate with a newline.
                if not self.content.endswith('\n'):
                    self.content = self.content + '\n'
                self.forward_links = content_to_forward_links(self.content)
        elif self.mediatype.startswith('image'):
            with open(path, 'rb') as f:
                self.content = f.read()
                self.forward_links = []
        else:
            raise ValueError

        self.mtime = os.path.getmtime(path)
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

    def render(self):
        if self.mediatype != 'text/plain':
            # hack hack
            #return 'This is a subnode of type {}. You can <a href="/raw/{}">view</a> it.'.format(self.mediatype, self.uri)
            return '<br /><img src="/raw/{}" style="display: block; margin-left: auto; margin-right: auto; max-width: 50%" /> <br />'.format(self.uri)
        # ugly, this should be in render
        content = render.preprocess(self.content)
        if self.uri.endswith('md') or self.uri.endswith('MD'):
            try:
                content = render.markdown(content)
            except:
                content = "<strong>There was an error loading this subnode. You can try refreshing, which may retry this operation.</strong>"
        if self.uri.endswith('org') or self.uri.endswith('ORG'):
            content = render.orgmode(content)
        # ugly, this too
        return render.postprocess(content)

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

        - [[go]] protocol://example.org

        Or a transitive form:

        - [[go]] [[foo]]
        - [[foo]] protocol://example.org

        (protocol defaults to https.)
        """
        golinks = subnode_to_actions(self, 'go')
        sanitized_golinks = []
        for golink in golinks:
            # looks like a URL (includes a protocol)
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
        links = subnode_to_actions(self, other, blocks_only=True)
        sanitized_links = []
        for link in links:
            if '://' in link:
                sanitized_links.append(link)
            else:
                # hack hack.
                sanitized_links.append('https://' + link)
        return sanitized_links

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

    def push_nodes(self):
        """
        returns a set of push links contained in this subnode
        push links are blocks of the form:
        - [[push]] [[node]]

        TODO: refactor with the above.
        """

        # TODO: test.
        push_blocks = subnode_to_actions(self, 'push')
        push_nodes = content_to_forward_links("\n".join(push_blocks))
        return [G.node(node) for node in push_nodes]

class VirtualSubnode(Subnode):
    # For instantiating a virtual subnode -- a subnode derived from another subnode. 
    # Used by [[push]] (transclusion).
    def __init__(self, source_subnode, target_node, block):
        """
        source_subnode: where this virtual subnode came from.
        target_node: where this virtual subnode will attach (go to).
        block: the actual payload, as pre rendered html."""
        self.uri = source_subnode.uri
        self.url = '/subnode/virtual'
        # Virtual subnodes are attached to their target
        self.wikilink = target_node.wikilink
        self.user = source_subnode.user
        # Only text transclusion supported.
        self.mediatype = 'text/plain'

        self.content = block.decode('UTF-8')
        self.forward_links = content_to_forward_links(self.content)

        self.mtime = source_subnode.mtime
        self.node = self.wikilink


def subnode_to_actions(subnode, action, blocks_only=False):
    # hack hack.
    if subnode.mediatype != 'text/plain':
        return []
    if blocks_only:
        action_regex ='- \[\[' + action + '\]\] (.*?)$'
    else:
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
        # Work around broken forward links due to org mode convention I didn't think of.
        # TODO: make link parsing format-aware.
        return [util.canonical_wikilink(m) for m in match if '][' not in m]
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

# Deprecated.
def nodes_by_wikilink(wikilink):
    nodes = [node for node in G.nodes() if node.wikilink == wikilink]
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
    subnodes = [subnode for subnode in G.subnodes() if subnode.mediatype == 'text/plain' and re.search(query, subnode.content, re.IGNORECASE)]
    return subnodes

def search_subnodes_by_user(query, user):
    subnodes = [subnode for subnode in G.subnodes() if subnode.mediatype == 'text/plain' and subnode.user == user and re.search(query, subnode.content, re.IGNORECASE)]
    return subnodes

def subnodes_by_user(user):
    subnodes = [subnode for subnode in G.subnodes() if subnode.user == user]
    return subnodes

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
    nodes = [node for node in G.nodes() if wikilink in node.forward_links()]
    return sorted(nodes, key=attrgetter('wikilink'))

def subnodes_by_outlink(wikilink):
    # This doesn't work. It matches too much/too little for some reason. Debug someday?
    # subnodes = [subnode for subnode in all_subnodes() if [wikilink for wikilink in subnode.forward_links if fuzz.ratio(subnode.wikilink, wikilink) > FUZZ_FACTOR]]
    subnodes = [subnode for subnode in G.subnodes() if util.canonical_wikilink(wikilink) in subnode.forward_links]
    return subnodes
