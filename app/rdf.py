# Copyright 2021 Google LLC
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
#
# The [[agora]] models search as an open market of providers (who bid content for each query) and users (who are interested in media of any type which is relevant within a given [[context]], which maps to a query).

import re
import urllib
from flask import current_app, redirect, url_for
from . import db
from . import util

from rdflib import Graph, Namespace, URIRef

def add_node(node: db.Node, g: Graph, only_forward=False):

    for linked_node in node.forward_links():
        if re.search('<.*>', linked_node):
            # work around links with html in them (?)
            continue
        if '|' in linked_node:
            # early support for https://anagora.org/go/agora-rfc/2
            linked_node = re.sub('|.*', '', linked_node)
        # this does away with lots of encoding problems in irregular links, but also encodes unicode characters, so some legibility is lost in the final result unless it is urldecoded.
        linked_node = urllib.parse.quote_plus(linked_node)
        n0 = node.wikilink
        n1 = linked_node
        g.add((
            URIRef(f"https://anagora.org/{n0}"),
            URIRef(f"https://anagora.org/links"),
            URIRef(f"https://anagora.org/{n1}"),
        ))

    if only_forward:
        return

    for backlinking_node in node.back_links():
        n0 = backlinking_node
        n1 = node.wikilink
        g.add((
            URIRef(f"https://anagora.org/{n0}"),
            URIRef(f"https://anagora.org/links"),
            URIRef(f"https://anagora.org/{n1}"),
        ))

    for pushing_node in node.pushing_nodes():
        n0 = node.wikilink
        n1 = linked_node
        g.add((
            URIRef(f"https://anagora.org/{n0}"),
            URIRef(f"https://anagora.org/pushes"),
            URIRef(f"https://anagora.org/{n1}"),
        ))

    for pulling_node in node.pulling_nodes():
        n0 = pulling_node
        n1 = node.wikilink
        g.add((
            URIRef(f"https://anagora.org/{n0}"),
            URIRef(f"https://anagora.org/pulls"),
            URIRef(f"https://anagora.org/{n1}"),
        ))

def turtle_node(node) -> str:

    g = Graph()
    agora = Namespace("https://anagora.org/")
    g.namespace_manager.bind('agora', agora)

    add_node(node, g)
    return g.serialize(format="turtle")

def turtle_graph(nodes) -> str:

    g = Graph()
    agora = Namespace("https://anagora.org/")
    g.namespace_manager.bind('agora', agora)

    print(f"turtling agora using forward links only")
    node_count = len(nodes)
    print(f"node count: {node_count}")

    for node in nodes:
        add_node(node, g, only_forward=True)

    return g.serialize(format="turtle")

