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
from . import file_engine as db
from .. import util

from json import dumps
from rdflib import Graph, Namespace, URIRef


def add_node(node: db.Node, g: Graph, only_forward=False):
    base = current_app.config["URL_BASE"]
    for linked_node in node.forward_links():
        if re.search("<.*>", linked_node):
            # work around links with html in them (?)
            continue
        if "|" in linked_node:
            # early support for https://anagora.org/go/agora-rfc/2
            linked_node = re.sub("|.*", "", linked_node)

        # this does away with lots of encoding problems in irregular links, but also encodes unicode characters, so some legibility is lost in the final result unless it is urldecoded.
        n0 = urllib.parse.quote_plus(node.wikilink)
        n1 = urllib.parse.quote_plus(linked_node)
        g.add(
            (
                URIRef(f"{base}/{n0}"),
                URIRef(f"{base}/links"),
                URIRef(f"{base}/{n1}"),
            )
        )

    if only_forward:
        return

    for backlinking_node in node.back_links():
        n0 = urllib.parse.quote_plus(backlinking_node)
        n1 = urllib.parse.quote_plus(node.wikilink)
        g.add(
            (
                URIRef(f"{base}/{n0}"),
                URIRef(f"{base}/links"),
                URIRef(f"{base}/{n1}"),
            )
        )

    for pushing_node in node.pushing_nodes():
        n0 = urllib.parse.quote_plus(node.wikilink)
        n1 = urllib.parse.quote_plus(linked_node)
        g.add(
            (
                URIRef(f"{base}/{n0}"),
                URIRef(f"{base}/pushes"),
                URIRef(f"{base}/{n1}"),
            )
        )

    for pulling_node in node.pulling_nodes():
        n0 = urllib.parse.quote_plus(pulling_node)
        n1 = urllib.parse.quote_plus(node.wikilink)
        g.add(
            (
                URIRef(f"{base}/{n0}"),
                URIRef(f"{base}/pulls"),
                URIRef(f"{base}/{n1}"),
            )
        )


def turtle_node(node) -> str:
    base = current_app.config["URL_BASE"]
    g = Graph()
    g.bind("a", f"{base}/")  # Binds the 'a' prefix to your namespace URI
    # g.namespace_manager.bind("a", agora)

    add_node(node, g)
    return g.serialize(format="turtle")


def turtle_nodes(nodes) -> str:
    base = current_app.config["URL_BASE"]
    g = Graph()
    g.bind("a", f"{base}/")  # Binds the 'a' prefix to your namespace URI

    print(f"turtling agora using forward links only")
    node_count = len(nodes)
    print(f"node count: {node_count}")

    for node in nodes:
        add_node(node, g, only_forward=True)

    return g.serialize(format="turtle")


def parse_node(node: db.Node) -> dict:
    base = current_app.config["URL_BASE"]
    d = dict()
    d["nodes"] = []
    d["links"] = []
    unique_nodes = set()

    this = node.wikilink
    forward_links = node.forward_links()
    back_links = node.back_links()
    pushing_nodes = [n.wikilink for n in node.pushing_nodes()]
    pulling_nodes = [n.wikilink for n in node.pulling_nodes()]

    if pushing_nodes:
        unique_nodes.add("push")
        for pushing_node in pushing_nodes:
            n0 = this
            n1 = pushing_node
            d["links"].append({"source": n1, "target": "push"})
            d["links"].append({"source": "push", "target": n0})
            unique_nodes.add(n0)
            unique_nodes.add(n1)

    if pulling_nodes:
        unique_nodes.add("pull")
        for pulling_node in pulling_nodes:
            n0 = this
            n1 = pulling_node
            d["links"].append({"source": n0, "target": "pull"})
            d["links"].append({"source": "pull", "target": n1})
            unique_nodes.add(n0)
            unique_nodes.add(n1)

    if back_links:
        unique_nodes.add("back")
        for backlinking_node in back_links:
            if backlinking_node in ["pull", "push"]:
                continue
            if backlinking_node in pushing_nodes or backlinking_node in pulling_nodes:
                print(f"discarded {node} because of being in pushed/pull list.")
                continue
            n0 = backlinking_node
            n1 = this
            d["links"].append({"source": n0, "target": "back"})
            d["links"].append({"source": "back", "target": n1})
            unique_nodes.add(n0)
            unique_nodes.add(n1)

    if forward_links:
        unique_nodes.add("forward")
        for linked_node in forward_links:
            if linked_node in ["pull", "push"]:
                continue
            if re.search("<.*>", linked_node):
                # work around links with html in them (?)
                continue
            if "|" in linked_node:
                # early support for {base}/go/agora-rfc/2
                linked_node = re.sub("|.*", "", linked_node)
            n0 = this
            n1 = linked_node
            # without these intermediate nodes, the force graph layout kind of sucks -- backlinks and outlinks intermingle in a symmetrical wheel.
            d["links"].append({"source": n0, "target": "forward"})
            d["links"].append({"source": "forward", "target": n1})
            # seems more reasonable but doesn't work (for now?)
            # d["links"].append({'source': n0, 'target': n1})
            unique_nodes.add(n0)
            unique_nodes.add(n1)

    for n in unique_nodes:
        if n == node.wikilink:
            d["nodes"].append(
                {"id": n, "name": n.replace("-", " "), "val": 6, "group": 1}
            )
        elif n == "back":
            d["nodes"].append(
                {"id": n, "name": n.replace("-", " "), "val": 3, "group": 2}
            )
        elif n == "forward":
            d["nodes"].append(
                {"id": n, "name": n.replace("-", " "), "val": 3, "group": 2}
            )
        elif n == "pull":
            d["nodes"].append(
                {"id": n, "name": n.replace("-", " "), "val": 3, "group": 3}
            )
        elif n == "push":
            d["nodes"].append(
                {"id": n, "name": n.replace("-", " "), "val": 3, "group": 3}
            )
        elif n in back_links:
            d["nodes"].append(
                {"id": n, "name": n.replace("-", " "), "val": 1, "group": 4}
            )
        elif n in forward_links:
            d["nodes"].append(
                {"id": n, "name": n.replace("-", " "), "val": 1, "group": 5}
            )
        elif n in pulling_nodes:
            d["nodes"].append(
                {"id": n, "name": n.replace("-", " "), "val": 1, "group": 6}
            )
        elif n in pushing_nodes:
            d["nodes"].append(
                {"id": n, "name": n.replace("-", " "), "val": 1, "group": 7}
            )
        elif n == "":
            # sometimes we get an empty forward link.
            continue
        else:
            d["nodes"].append(
                {"id": n, "name": n.replace("-", " "), "val": 1, "group": 8}
            )

    return d


def json_node(node):
    # format: {BASE}/force-graph

    d = parse_node(node)
    return dumps(d)


# technically doesn't belong here but... perhaps this becomes graph.py eventually.
def json_nodes(nodes):
    # format: {BASE}/force-graph
    # this first redoes the RDF graph and then converts it to JSON.
    # the code duplication can be fixed with refactoring; more important is whether going through RDF makes sense at all.
    # I think because RDF does some cleanup to get to "well formed ids" there might be enough of a benefit from reusing that.

    base = current_app.config["URL_BASE"]
    g = Graph()
    g.namespace_manager.bind("a", agora)

    print(f"jsoing agora using forward links only")
    node_count = len(nodes)
    print(f"node count: {node_count}")

    unique_nodes = set()
    for node in nodes:
        unique_nodes.add(node)
        add_node(node, g, only_forward=True)

    d = {}
    nodes_to_render = set()
    d["nodes"] = []
    d["links"] = []

    # for n0, _, n1 in g.triples((None, None, None)):
    #    # this step needed because dicts don't fit in sets in python because they're not hashable.
    #    unique_nodes.add(n0)
    #    unique_nodes.add(n1)

    for node in unique_nodes:
        # hack hack
        size = node.size()
        # if size <= 4:
        #     continue
        d["nodes"].append(
            {"id": f"{base}/{node.uri}", "name": node.description, "val": size}
        )
        nodes_to_render.add(urllib.parse.quote_plus(f"{base}/{node.uri}"))

    print(f"Have unique nodes, building triples...")

    for n0, link, n1 in g.triples((None, None, None)):
        # This was slow when we were using a list instead of a set.
        if str(n0) in nodes_to_render and str(n1) in nodes_to_render:
            d["links"].append({"source": n0, "target": n1})
            # print(f".", end="", flush=True)
            # this takes care of links to non-existent nodes, added with value 1 by default.
            # now commented as we don't graph those by default.
            # d["nodes"].append({'id': n1, 'name': n1, 'val': 1})

    return dumps(d)
