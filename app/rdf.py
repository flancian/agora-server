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

from flask import current_app, redirect, url_for
from . import util

import rdflib

def turtle(node) -> str:

    g = rdflib.Graph()

    for backlinking_node in node.back_links():
        n0 = backlinking_node
        n1 = node
        g.add((
            rdflib.URIRef(f"https://anagora.org/{n0}"),
            rdflib.URIRef(f"https://anagora.org/links"),
            rdflib.URIRef(f"https://anagora.org/{n1}"),
        ))

    for linked_node in node.forward_links():
        n0 = node
        n1 = linked_node
        g.add((
            rdflib.URIRef(f"https://anagora.org/{n0}"),
            rdflib.URIRef(f"https://anagora.org/links"),
            rdflib.URIRef(f"https://anagora.org/{n1}"),
        ))

    for pushing_node in node.pushing_nodes():
        n0 = node
        n1 = linked_node
        g.add((
            rdflib.URIRef(f"https://anagora.org/{n0}"),
            rdflib.URIRef(f"https://anagora.org/pushes"),
            rdflib.URIRef(f"https://anagora.org/{n1}"),
        ))

    for pulling_node in node.pulling_nodes():
        n0 = pulling_node
        n1 = node
        g.add((
            rdflib.URIRef(f"https://anagora.org/{n0}"),
            rdflib.URIRef(f"https://anagora.org/pulls"),
            rdflib.URIRef(f"https://anagora.org/{n1}"),
        ))


    for s, p, o in g:
        print(s, p, o)

    return g.serialize(format="turtle")

