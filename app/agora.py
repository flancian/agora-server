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

import base64
import base64
import collections
import datetime
import json
import os
import re
import requests
import time
import threading
import urllib.parse
from copy import copy
from urllib.parse import parse_qs, urlparse

import jsons
from Crypto.Hash import SHA256
from Crypto.PublicKey import RSA
from Crypto.Signature import pkcs1_15
from flask import (Blueprint, Response, abort, current_app, g, jsonify,
                   make_response, redirect, render_template, request,
                   send_file, url_for, flash)
from flask_cors import CORS
from markupsafe import escape
from mistralai.client import MistralClient, MistralException
from mistralai.models.chat_completion import ChatMessage

from . import federation, forms, providers, render, util
from .providers import gemini_complete, mistral_complete
from .storage import api, feed, sqlite_engine
from . import visualization
from .graph import G

# End uWSGI Cache Warming

bp = Blueprint("agora", __name__)
CORS(bp)


# For footer / timing information.
# Adapted from https://stackoverflow.com/questions/12273889/calculate-execution-time-for-every-page-in-pythons-flask
@bp.before_request
def before_request():
    g.start = time.time()

    # hack hack -- try dynamic URI_BASE based on what the browser sent our way.
    # this allows for easily provisioning an Agora in many virtual hosts, e.g. *.agor.ai.
    # If URI_BASE or URL_BASE are empty, try running this as a "wildcard Agora".
    if not current_app.config.get("URL_BASE") or not current_app.config.get("URI_BASE"):
        current_app.config["URI_BASE"] = request.headers["Host"]
        # Try to keep using the same protocol we're using.
        # Update: disabled as this doesn't really work / it seems to breaks agoras over https?
        # prefix = 'https://' if 'https' in request.base_url else 'http://'
        prefix = 'https://' # if 'https' in request.base_url else 'http://'
        current_app.config["URL_BASE"] = prefix + current_app.config["URI_BASE"]


@bp.after_request
def after_request(response):
    exectime = round(time.time() - g.start, 2)
    now = datetime.datetime.now().replace(microsecond=0)

    if (
        (response.response)
        and (200 <= response.status_code < 300)
        and (response.content_type.startswith("text/html"))
    ):
        response.set_data(
            response.get_data()
            .replace(b"__EXECTIME__", bytes(str(exectime), "utf-8"))
            .replace(b"__NOW__", bytes(str(now.astimezone()), "utf-8"))
        )
    return response


# End footer / timing information.

# The [[agora]] is a [[distributed knowledge graph]].
# Nodes are the heart of the [[agora]].


# In the [[agora]] there are no 404s. Everything that can be described with words has a node in the [[agora]].

# The [[agora]] is in some ways thus a [[search engine]]: anagora.org/agora-search
#
# Flask routes work so that the one closest to the function is the canonical one.
@bp.route("/<node>")
def root(node, user_list=""):
    start_time = time.time()

    # Builds a node with the bare minimum/stub metadata, should be quick.
    node = urllib.parse.unquote_plus(node)

    # We really need to get rid of this kind of hack :)
    # 2023-12-12: today is the day?
    # node = node.replace(",", "").replace(":", "")
    # As of [[2023-12-12]] I'm trying to do away with slugify again and move to 'canonical nodes' by default, i.e. no information loss if we can help it in node IDs.
    # node = util.slugify(node)
    n = api.Node(node)

    # q will likely be set by search/the CLI if the entity information isn't fully preserved by node mapping.
    # query is meant to be user parsable / readable text, to be used for example in the UI
    n.qstr = request.args.get("q")
    if not n.qstr:
        # could this come in better shape from the node proper when the node is actually defined? it'd be nice not to depend on de-slugifying.
        # 2023-12-12: trying out sticking to the canonical name as much as we can, we used to s/-/ /g here.
        # this means that 2023-12-12 no longer becomes '2023 12 12' "canonically" :)
        n.qstr = n.uri
    # search_subnodes = db.search_subnodes(node)
    n.q = n.qstr
    duration = time.time() - start_time
    current_app.logger.debug(f"[[{node}]]: Assembled light node in {duration:.2f}s.")
    

    return render_template(
        "sync.html",
        node=n,
        config=current_app.config,
        # To disable graphs because of e.g. a CDN outage again, flip this to False here and in /context.
        graph=True,
        # disabled a bit superstitiously due to [[heisenbug]] after I added this everywhere :).
        # sorry for the fuzzy thinking but I'm short on time and want to get things done.
        # (...famous last words).
        # TODO(2022-06-06): this should now be done in the async path, essentially embedding /annotations/X from node X
        # annotations=n.annotations(),
        # annotations_enabled=True,
    )

# Flask routes work so that the one closest to the function is the canonical one.
@bp.route("/wikilink/<node>")
@bp.route("/node/<node>/uprank/<user_list>")
@bp.route("/node/<node>")
def node(node, user_list=""):
    n = api.build_node(node)
    starred_subnodes = sqlite_engine.get_all_starred_subnodes()
    starred_nodes = sqlite_engine.get_all_starred_nodes()

    return render_template(
        "async.html",
        node=n,
        config=current_app.config,
        starred_subnodes=starred_subnodes,
        starred_nodes=starred_nodes,
        # disabled a bit superstitiously due to [[heisenbug]] after I added this everywhere :).
        # sorry for the fuzzy thinking but I'm short on time and want to get things done.
        # (...famous last words).
        # TODO(2022-06-06): this should now be done in the async path, essentially embedding /annotations/X from node X
        # annotations=n.annotations(),
        # annotations_enabled=True,
    )

@bp.route("/node/<node0>/<node1>")
@bp.route("/<node0>/<node1>")
def node2(node0, node1):
    n = api.build_multinode(node0, node1)

    return render_template(
        "sync.html",
        node=n,
        argument=node1,
        config=current_app.config,
        # annotations_enabled=True,
    )

@bp.route("/feed/<node>")
def node_feed(node):
    n = G.node(node)
    return Response(feed.node_rss(n), mimetype="application/rss+xml")


@bp.route("/feed/@<user>")
def user_feed(user):
    subnodes = api.subnodes_by_user(user, mediatype="text/plain")
    return Response(feed.user_rss(user, subnodes), mimetype="application/rss+xml")


@bp.route("/feed/journals/@<user>")
def user_journals_feed(user):
    subnodes = api.user_journals(user)
    return Response(feed.user_rss(user, subnodes), mimetype="application/rss+xml")


@bp.route("/feed/journals")
def journals_feed():
    nodes = api.all_journals()[0:30]
    n = api.consolidate_nodes(nodes)
    n.subnodes.reverse()
    # This is an abuse of node_rss?
    return Response(feed.node_rss(n), mimetype="application/rss+xml")


@bp.route("/feed/latest")
def latest_feed():
    subnodes = api.latest(1000)
    subnodes.reverse()
    return Response(feed.latest_rss(subnodes), mimetype="application/rss+xml")


@bp.route("/ttl/<node>")  # perhaps deprecated
@bp.route("/turtle/<node>")
@bp.route("/graph/turtle/<node>")
def turtle(node):
    n = G.node(node)
    response = make_response(visualization.turtle_node(n))
    response.mimetype = "text/turtle"
    # Cache for 30 minutes - individual node turtle data
    response.headers['Cache-Control'] = 'public, max-age=1800'
    response.headers['Vary'] = 'Accept-Encoding'
    return response


@bp.route("/graph/turtle/all")
@bp.route("/graph/turtle")
def turtle_all():
    nodes = G.nodes().values()
    response = make_response(visualization.turtle_nodes(nodes))
    response.mimetype = "text/turtle"
    # Cache for 2 hours - expensive full graph turtle data
    response.headers['Cache-Control'] = 'public, max-age=7200'
    response.headers['Vary'] = 'Accept-Encoding'
    return response


@bp.route("/graph/json/all")
@bp.route("/graph/json")
def graph_js():
    nodes = G.nodes().values()
    response = make_response(visualization.json_nodes(nodes))
    response.mimetype = "application/json"
    # Cache for 2 hours - very expensive full graph JSON data  
    response.headers['Cache-Control'] = 'public, max-age=7200'
    response.headers['Vary'] = 'Accept-Encoding'
    return response


@bp.route("/graph/json/top/<int:count>")
def graph_js_top(count):
    # This endpoint needs full node objects to trace links, so we bypass the api.top() cache
    # and go directly to the file_engine.
    nodes = api.file_engine.top()[:count]
    response = make_response(visualization.json_nodes(nodes))
    response.mimetype = "application/json"
    # Cache for 2 hours - expensive full graph JSON data
    response.headers['Cache-Control'] = 'public, max-age=7200'
    response.headers['Vary'] = 'Accept-Encoding'
    return response


@bp.route("/graph/json/<node>")
def graph_js_node(node):
    n = G.node(node)
    response = make_response(visualization.json_node(n))
    response.mimetype = "application/json"
    # Cache for 1 hour - individual node graph JSON data
    response.headers['Cache-Control'] = 'public, max-age=3600'
    response.headers['Vary'] = 'Accept-Encoding'
    return response


@bp.route("/@<user>/<node>")
def root_subnode(node, user):
    node = urllib.parse.unquote_plus(node)
    node = util.canonical_wikilink(node)
    n = G.node(node)

    n.subnodes = util.filter(n.subnodes, user)
    n.subnodes = util.uprank(n.subnodes, user)
    search_subnodes = api.search_subnodes_by_user(node, user)

    # q will likely be set by search/the CLI if the entity information isn't fully preserved by node mapping.
    # query is meant to be user parsable / readable text, to be used for example in the UI
    n.qstr = request.args.get("q")

    if not n.qstr:
        # could this come in better shape from the node proper when the node is actually defined? it'd be nice not to depend on de-slugifying.
        n.qstr = n.wikilink.replace("-", " ")

    n.qstr = f"@{user}/" + n.wikilink.replace("-", " ")
    n.q = n.qstr

    return render_template(
        "sync.html",
        node=n,
        subnode=f"@{user}/" + n.wikilink,
    )


@bp.route("/node/<node>@<user>")
@bp.route("/node/@<user>/<node>")
def subnode(node, user):
    node = urllib.parse.unquote_plus(node)
    node = util.canonical_wikilink(node)
    n = G.node(node)

    n.subnodes = util.filter(n.subnodes, user)
    n.subnodes = util.uprank(n.subnodes, user)
    search_subnodes = api.search_subnodes_by_user(node, user)

    # q will likely be set by search/the CLI if the entity information isn't fully preserved by node mapping.
    # query is meant to be user parsable / readable text, to be used for example in the UI
    n.qstr = request.args.get("q")

    if not n.qstr:
        # could this come in better shape from the node proper when the node is actually defined? it'd be nice not to depend on de-slugifying.
        n.qstr = n.wikilink.replace("-", " ")

    n.qstr = f"@{user}/" + n.wikilink.replace("-", " ")
    n.q = n.qstr

    return render_template(
        "async.html",
        node=n,
        subnode=f"@{user}/" + n.wikilink,
    )


@bp.route("/export/<node>@<user>")
@bp.route("/export/@<user>/<node>")
def subnode_export(node, user):
    node = urllib.parse.unquote_plus(node)
    node = util.canonical_wikilink(node)
    n = G.node(node)

    n.subnodes = util.filter(n.subnodes, user)
    n.subnodes = util.uprank(n.subnodes, user)
    search_subnodes = api.search_subnodes_by_user(node, user)

    # q will likely be set by search/the CLI if the entity information isn't fully preserved by node mapping.
    # query is meant to be user parsable / readable text, to be used for example in the UI
    n.qstr = request.args.get("q")

    if not n.qstr:
        # could this come in better shape from the node proper when the node is actually defined? it'd be nice not to depend on de-slugifying.
        n.qstr = n.wikilink.replace("-", " ")

    n.qstr = f"@{user}/" + n.wikilink.replace("-", " ")
    n.q = n.qstr

    starred_subnodes = sqlite_engine.get_all_starred_subnodes()

    return render_template(
        "node.html",
        node=n,
        subnode=f"@{user}/" + n.wikilink,
        starred_subnodes=starred_subnodes,
    )


# Special


@bp.route("/")
def index():

    qstr = request.args.get("q")
    if qstr:
        # This is a search. 
        # We need to serve the node inline, without redirecting.
        # Unfortunately this is needed to make Chrome trigger opensearch and let users
        # add the Agora as a search engine.
        # No, this doesn't make sense.
        if re.match('^[a-z]+/', qstr):
            # special case go links for now -- this is terrible, yes :)
            return redirect(url_for(".root", node=qstr))

        # As of [[2023-12-12]] I'm trying to do away with slugify again and move to 'canonical nodes' by default, i.e. no information loss if we can help it in node IDs.
        # node = util.slugify(node)
        n = api.Node(qstr)
        n.qstr = qstr
        n.q = qstr

        return render_template(
            "sync.html",
            node=n,
            config=current_app.config,
            # disabled a bit superstitiously due to [[heisenbug]] after I added this everywhere :).
            # sorry for the fuzzy thinking but I'm short on time and want to get things done.
            # (...famous last words).
            # TODO(2022-06-06): this should now be done in the async path, essentially embedding /annotations/X from node X
            # annotations=n.annotations(),
            # annotations_enabled=True,
        )

    # return redirect(url_for(".root", node="index"))

    # GET / without query string -> serve the index.
    user = 'agora'
    n = api.build_node(user)
    n.qstr = ""
    return render_template(
        "index.html",
        user=api.User(user),
        readmes=api.user_readmes(user),
        subnodes=api.subnodes_by_user(user, sort_by="node", reverse=False),
        latest=api.subnodes_by_user(user, sort_by="mtime", reverse=True)[:100],
        node=n,
    )

@bp.route("/Δ")
@bp.route("/delta")
@bp.route("/latest")
def latest():
    n = api.build_node("latest")
    return render_template(
        "recent.html", 
        header="Recent deltas", 
        subnodes=api.latest(max=1000), 
        node=n,
        annotations=feed.get_latest(),
    )


@bp.route("/starred")
def starred():
    n = api.build_node("starred")
    
    # sqlite_engine now returns a list of tuples (uri, timestamp_str)
    starred_subnodes_data = sqlite_engine.get_all_starred_subnodes()
    subnodes = []
    for uri, timestamp_str in starred_subnodes_data:
        subnode = api.subnode_by_uri(uri)
        if subnode:
            # The timestamp from SQLite is a string, convert it to a datetime object.
            subnode.starred_timestamp = datetime.datetime.strptime(timestamp_str.split('.')[0], '%Y-%m-%d %H:%M:%S')
            subnodes.append(subnode)

    starred_nodes_data = sqlite_engine.get_all_starred_nodes()
    nodes = []
    for uri, timestamp_str in starred_nodes_data:
        node = api.build_node(uri)
        # The timestamp from SQLite is a string, convert it to a datetime object.
        node.starred_timestamp = datetime.datetime.strptime(timestamp_str.split('.')[0], '%Y-%m-%d %H:%M:%S')
        nodes.append(node)

    return render_template(
        "starred.html",
        header="Starred items",
        subnodes=subnodes,
        nodes=nodes,
        node=n,
    )


@bp.route("/annotations/")
@bp.route("/annotations")
def annotations():
    n = api.build_node("annotations")
    return render_template(
        "annotations.html",
        header="Recent annotations",
        annotations=feed.get_latest(),
        node=n,
    )


@bp.route("/random")
def random():
    today = datetime.date.today()
    random = api.random_node()
    return redirect(f"/{urllib.parse.quote_plus(random.description)}")


@bp.route("/now")
@bp.route("/tonight")
@bp.route("/today")
def today():
    today = datetime.date.today()
    return redirect("/%s" % today.strftime("%Y-%m-%d"))


@bp.route("/tomorrow")
def tomorrow():
    tomorrow = datetime.date.today() + datetime.timedelta(days=1)
    return redirect("/%s" % tomorrow.strftime("%Y-%m-%d"))


@bp.route("/regexsearch", methods=("GET", "POST"))
def regexsearch():
    n = api.build_node("regexsearch")
    """mostly deprecated in favour of jump-like search, left around for now though."""
    form = forms.SearchForm()
    if form.validate_on_submit():
        return render_template(
            "regexsearch.html",
            form=form,
            subnodes=api.search_subnodes(form.query.data),
            node=n,
        )
    return render_template("regexsearch.html", form=form, node=n)


@bp.route("/ctzn-login")
def ctzn_login():
    return render_template("ctzn_login.html")


#
# Actions
#


# I love [[go links]] :)
# This was composite go, now graduated to handling all supported cases :)
# This is still a hack (works for n=1, n=2), needs to be replaced with proper generic node/block "algebra"?
# TODO(2022-06-05): maybe through providers.py? This feels like arbitrary query handling, unsure where to draw the line as of yet.
@bp.route("/go/<node0>/<node1>")
@bp.route("/go/<node0>/")
@bp.route("/go/<node0>")
@bp.route("/node/go/<node0>")
def go(node0, node1=""):
    """Redirects to the URL in the given node in a block that starts with [[<action>]], if there is one."""
    # TODO(flancian): all node-scoped stuff should move to actually use node objects.
    # perhaps we need merge_node(n0, n1) in api.py?
    # TODO(flancian): make [[go]] call this?
    # current_app.logger.debug = print
    current_app.logger.debug(f"running composite_go for {node0}, {node1}.")
    base = current_app.config["URL_BASE"]

    if not node1:
        # this may be surprising, but I find that using [[foo]] in node [[foo]] near a link is sometimes a useful pattern.
        # this also lets us do stuff like [[foo]] <URL> in pushes and stream updates and define go links like this (if there aren't any better.)
        node1 = node0
    n0 = api.build_node(node0)
    n1 = api.build_node(node1)

    links = n0.go() + n1.go()
    # we go through n0 looking for n1 as a tag.
    for subnode in n0.subnodes:
        if node0 == node1:
            links.extend(subnode.filter(node1))
        else:
            # this needs to be higher priority, e.g. go/move/7 > go/move
            links = subnode.filter(node1) + links

    current_app.logger.debug(f"n0 [[{n0}]]: filtered to {node1} yields {links}.")

    # ...and through n1 looking for n0 as a tag.
    for subnode in n1.subnodes:
        if node0 == node1:
            links.extend(subnode.filter(node0))
        else:
            # this needs to be higher priority, e.g. go/7/move > go/move
            links = subnode.filter(node0) + links

    current_app.logger.debug(f"n1 [[{n1}]]: filtered to {node0} finalizes to {links}.")

    # look further if needed.
    if len(links) == 0:
        # No matching links found so far.
        # Try using also pushed_subnodes(), which are relative expensive (slow) to compute.
        # Note that this actually is needed for 'simple go' as well, points again in the direction of refactoring/joining?

        for subnode in n0.pushed_subnodes():
            go_links = subnode.go()
            if go_links:
                links.extend(go_links)
        current_app.logger.debug(f"n0 [[{n0}]]: filtered to {node1} yields {links}.")

        for subnode in n1.pushed_subnodes():
            go_links = subnode.go()
            if go_links:
                links.extend(go_links)
        current_app.logger.debug(
            f"n1 [[{n1}]]: filtered to {node0} finalizes to {links}."
        )

    for link in links:
        if util.is_valid_url(link):
            current_app.logger.info(f"Detected go link was a valid URL: {link}.")
            return redirect(link)
        else:
            current_app.logger.info(f"Detected go link was not a valid URL: {link}.")

    # No matching viable links found after all tries.
    # TODO(flancian): flash an explanation :)
    if node0 != node1:
        return redirect(f"{base}/{node0}/{node1}")
    else:
        return redirect(f"{base}/{node0}")


@bp.route("/push/<node>/<other>")
def push2(node, other):

    current_app.logger.info(f">>> push2 arg: {other}.")
    # returns by default an html view for the 'pushing here' section / what is being received in associated feeds
    n = api.build_node(node)

    return render_template(
        "push.html",
        argument=other,
        pushed_subnodes=n.pushed_subnodes(),
        embed=True,
        node=n,
    )

@bp.route("/push/<node>")
def push(node):
    # returns by default an html view for the 'pushing here' section / what is being received in associated feeds
    n = api.build_node(node)

    return render_template(
        "push.html",
        pushed_subnodes=n.pushed_subnodes(),
        embed=True,
        node=n,
    )


@bp.route("/context/<node>")
def context(node):
    # returns by default an html view for the 'context' section: graph, links (including pushes, which can be costly)
    n = api.build_node(node)

    return render_template(
        "context.html",
        embed=True,
        node=n,
        graph=True,
        # Last tested on 2024-07-17, sort of works but requires "normalizing" dev instance to prod Agora URLs? Maybe.
        # annotations=n.annotations(),
        # annotations_enabled=True,
    )


@bp.route("/context/all")
def context_all():
    # Returns by default a full Agora graph, by default embedded in /nodes.
    n = api.build_node('context/all')
    n.qstr = "context/all"
    return render_template(
        "agoragraph.html",
        embed=True,
        node=n,
    )


# good for embedding the whole Agora (this is called by recursive pulls)
@bp.route("/embed/<node>")
def embed(node):
    current_app.logger.debug(f"embed [[{node}]]: Assembling node.")
    n = api.build_node(node)

    return render_template(
        "sync.html",
        node=n,
        embed=True,
        config=current_app.config,
    )


# good for embedding just node -onlycontent (this is called by non-recursive pulls)
@bp.route("/pull/<node>")
def pull(node):
    current_app.logger.debug(f"pull [[{node}]]: Assembling node.")
    n = api.build_node(node)

    return render_template(
        "sync.html",
        node=n,
        embed=True,
        config=current_app.config,
    )


# for embedding search (at bottom of node).
@bp.route("/fullsearch/<qstr>")
def fullsearch(qstr):
    current_app.logger.debug(f"full text search for [[{qstr}]].")
    search_subnodes = api.search_subnodes(qstr)

    return render_template(
        "fullsearch.html", qstr=qstr, q=qstr, node=qstr, search=search_subnodes
    )


# This receives whatever you type in the mini-cli up to the top of anagora.org.
# Then it parses it and redirects to the right node or takes the appropriate action.
# See https://anagora.org/agora-search, in particular 'design', for more.
@bp.route("/exec")
@bp.route("/jump")
@bp.route("/search")
def search():
    """Redirects to an appropriate context.
    Originally called "jump" because in the [[agora]] nodes *always* exist, as they map 1:1 to all possible queries. Thus [[agora search]].
    """
    qstr = request.args.get("q") or ""
    tokens = qstr.split(" ")

    if '/' in qstr:
        # subnodes (of the form @user/node) currently (as of 2023-12-10) break if they are quote_plussed.
        # By break, I mean: URLs get their @ and / encoded, and that breaks pushes and other things.
        # also e.g. go/x breaks when / is encoded as %252.
        q = qstr
    else:
        q = urllib.parse.quote_plus(qstr)

    # ask for bids from search providers.
    # both the raw query and tokens are passed for convenience; each provider is free to use or discard each.
    results = providers.get_bids(q, tokens)
    # should result in a reasonable ranking; bids are a list of tuples (confidence, proposal)
    results.sort(reverse=True)
    current_app.logger.info(f"Search results for {qstr}: {results}")
    result = results[
        0
    ]  # the agora always returns at least one result: the offer to render the node for the query.

    # perhaps here there could be special logic to flash a string at the top of the result node if what we got back from search is a string.

    # hack hack
    # [[push]] [[2021-02-28]] in case I don't get to it today.
    if callable(result.proposal):
        return result.proposal()
    if result.message:
        # here we should probably do something to 'flash' the message?
        pass
    # catch all follows.
    # "should never happen" (lol) as the agora is its own search provider and a plain node rendering should always be returned as a bid for every query.
    # log a warning if it does :)
    current_app.logger.warning(
        "Node catch-all in agora.py triggered; should never happen (tm)."
    )
    return redirect(url_for(".root", node=q), code=301)


@bp.route("/subnode/<path:subnode>")
def old_subnode(subnode):
    sn = api.subnode_by_uri(subnode)
    n = api.build_node(sn.wikilink)
    return render_template(
        "subnode.html", node=n, subnode=sn, backlinks=api.subnodes_by_outlink(subnode)
    )


@bp.route("/u/<user>")
@bp.route("/user/<user>")
@bp.route("/node/@<user>")  # so that [[@flancian]] works.
@bp.route("/@<user>")
def user(user):
    n = api.build_node(user)
    n.qstr = "@" + n.qstr
    return render_template(
        "user.html",
        user=api.User(user),
        readmes=api.user_readmes(user),
        subnodes=api.subnodes_by_user(user, sort_by="node", reverse=False),
        latest=api.subnodes_by_user(user, sort_by="mtime", reverse=True)[:100],
        node=n,
    )



@bp.route("/user/<user>.json")
def user_json(user):
    subnodes = list(map(lambda x: x.wikilink, api.subnodes_by_user(user)))
    return jsonify(jsons.dump(subnodes))


@bp.route("/garden/<garden>")
def garden(garden):
    current_app.logger.warning("Not implemented.")
    return (
        'If I had implemented rendering gardens already, here you would see garden named "%s".'
        % escape(garden)
    )


# Lists
@bp.route("/nodes")
def nodes():
    n = api.build_node("nodes")
    page = request.args.get('page', 1, type=int)
    per_page = 52
    all_nodes = api.top()
    total_nodes = len(all_nodes)
    start = (page - 1) * per_page
    end = start + per_page
    nodes_on_page = all_nodes[start:end]

    if current_app.config["ENABLE_STATS"]:
        return render_template("nodes.html", nodes=nodes_on_page, node=n, stats=api.stats(), graph=True, page=page, per_page=per_page, total_nodes=total_nodes)
    else:
        return render_template("nodes.html", nodes=nodes_on_page, node=n, stats=None, graph=True, page=page, per_page=per_page, total_nodes=total_nodes)


@bp.route("/nodes.json")
def nodes_json():
    nodes = G.nodes(include_journals=False).values()
    links = list(map(lambda x: x.wikilink, nodes))
    return jsonify(jsons.dump(links))


@bp.route("/similar/<term>.json")
def similar_json(term):
    nodes = util.similar(api.top(), term)
    return jsonify(nodes)


@bp.route("/@")
@bp.route("/users")
def users():
    n = api.build_node("users")
    return render_template("users.html", users=api.all_users(), node=n, stats=api.stats())


@bp.route("/users.json")
def users_json():
    users = list(map(lambda x: x.uri, api.all_users()))
    return jsonify(jsons.dump(users))


@bp.route("/journal/<user>")
def user_journal(user):
    n = api.build_node(user)
    journal_subnodes = api.user_journals(user)
    
    subnodes_by_date = collections.defaultdict(list)
    for subnode in journal_subnodes:
        # The URI of a journal subnode is its date, e.g., "2025-09-12".
        subnodes_by_date[subnode.uri].append(subnode)

    return render_template(
        "journals.html",
        header=f"Journals for user @{user}",
        node=n,
        subnodes_by_date=subnodes_by_date,
    )


@bp.route("/journal/<user>.json")
def user_journal_json(user):
    return jsonify(jsons.dump(api.user_journals(user)))


@bp.route("/journals/<entries>")
@bp.route("/journals/", defaults={"entries": None})
@bp.route("/journals", defaults={"entries": None})
def journals(entries):
    n = api.build_node("journals")
    if entries:
        n.qstr = f"journals/{entries}"
    if not entries:
        n.qstr = f"journals"
        entries = current_app.config["JOURNAL_ENTRIES"]
    elif entries == "all":
        entries = 2000000  # ~ 365 * 5500 ~ 3300 BC
    else:
        try:
            entries = int(entries)
        except ValueError:
            # we only support numbers and all (handled above), other suffixes must be a broken link from /all or /30 or such...
            # long story, this is a hack working around a bug for now.
            return redirect(url_for(".root", node=entries))

    journal_subnodes = api.all_journals()[0:entries]
    subnodes_by_date = collections.defaultdict(list)
    for subnode in journal_subnodes:
        # The URI of a journal subnode is its date, e.g., "2025-09-12".
        subnodes_by_date[subnode.uri].append(subnode)

    return render_template(
        "journals.html",
        node=n,
        header=f"Journal entries in the last {entries} days",
        subnodes_by_date=subnodes_by_date,
    )


@bp.route("/api/clear-in-memory-cache", methods=["POST"])
def clear_in_memory_cache():
    try:
        G._get_all_nodes_cached.cache_clear()
        G.subnodes.cache_clear()
        G.executable_subnodes.cache_clear()
        G.edges.cache_clear()
        G.n_edges.cache_clear()
        current_app.logger.info("Cleared in-memory caches via API.")
        return jsonify({"status": "success"})
    except Exception as e:
        current_app.logger.error(f"Error clearing in-memory caches: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


@bp.route("/debug/exec")
def debug_exec():
    n = api.build_node("debug-exec")
    executables = G.executable_subnodes()
    return render_template("debug_exec.html", node=n, executables=executables)


@bp.route("/invalidate-sqlite", methods=["POST"])
def invalidate_sqlite():
    # For safety, this is only enabled in local development.
    if not current_app.config.get("ENABLE_FLUSH_CACHE_BUTTON", False):
        abort(403)

    try:
        # This gives us a database connection within the application context.
        from .storage import sqlite_engine
        db = sqlite_engine.get_db()
        
        # Define the tables that are safe to clear.
        cache_tables = ['query_cache', 'subnodes', 'links', 'graph_cache']
        
        if db:
            for table in cache_tables:
                # Using plain SQL for simplicity.
                db.execute(f"DELETE FROM {table};")
            db.commit()
        
        # Also clear the in-memory caches to force a full reload from the filesystem.
        G._get_all_nodes_cached.cache_clear()
        G.subnodes.cache_clear()
        G.executable_subnodes.cache_clear()
        G.edges.cache_clear()
        G.n_edges.cache_clear()

        flash("SQLite and in-memory caches have been invalidated.", "info")
        current_app.logger.info(f"Invalidated SQLite cache tables: {cache_tables} and cleared in-memory caches.")
        return jsonify({"status": "success"})

    except Exception as e:
        current_app.logger.error(f"Error invalidating SQLite caches: {e}")
        # Rollback in case of error
        if db:
            db.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500


@bp.route("/journals.json")
def journals_json():
    return jsonify(jsons.dump(api.all_journals()))


@bp.route("/asset/<user>/<asset>")
def asset(user, asset):
    # An asset is a binary in someone's garden/<user>/assets directory.
    # Currently unused.
    path = "/".join([current_app.config["AGORA_PATH"], "garden", user, "assets", asset])
    return send_file(path)


@bp.route("/raw/<path:subnode>")
def raw(subnode):
    s = api.subnode_by_uri(subnode)
    if not s:
        abort(404)
    return Response(s.content, mimetype=s.mediatype)


@bp.route("/backlinks/<node>")
def backlinks(node):
    # Currently unused.
    return render_template("nodes.html", nodes=api.nodes_by_outlink(node))


@bp.route("/opensearch.xml")
def search_xml():
    return (
        render_template("search.xml"),
        200,
        {"Content-Type": "application/opensearchdescription+xml"},
    )


def count_votes(subnode):
    match = re.search(r"#(\w+)", subnode.content)
    if not match:
        return None
    tag = match.group(1)
    return {"user": subnode.user, "vote": tag}


# API space is /api.
# Elsewhere in the Agora we try to return HTML; even in system pages like /users,
# the intent is to offer the content of node [[users]] after the node-specific UI.
#
# Here we go wild ;)
# (Here or wherever an Agora announces using .well-known or WebFinger some such...)

@bp.route("/api/proposal/<user>/<node>")
def proposal(user, node):
    n = G.node(node)
    subnode = next(x for x in n.subnodes if x.user == user)
    other_nodes = [x for x in n.subnodes if x.user != user]
    print("subnode", subnode)
    print("other nodes", other_nodes)
    votes = list(filter(None, map(count_votes, other_nodes)))
    print("votes", votes)
    vote_options = [x.get("vote") for x in votes]
    print("options", vote_options)
    vote_counts = collections.Counter(vote_options)
    print("counts", vote_counts)
    return render_template(
        "proposal.html",
        node=n,
        subnode=subnode,
        votes=votes,
        vote_options=vote_options,
        vote_counts=json.dumps(vote_counts),
    )


@bp.route("/api/callback")
def callback():
    print("ACCESS TOKEN FROM GITEA")
    print(request.values["code"])
    return f'TOKEN {request.values["code"]}<script>alert("{request.values["code"]}")</script>'


@bp.route("/api/complete/<prompt>")
def complete(prompt):
    if current_app.config["ENABLE_AI"]:
        full_prompt, answer = mistral_complete(prompt)
        if full_prompt is None and "not properly set up" not in answer:
            # This is likely an old cache entry. Reconstruct a prompt for display.
            full_prompt = "The prompt for this cached response is not available, but the query was:" + prompt
        return jsonify({'prompt': full_prompt, 'answer': render.markdown(answer)})
    else:
        return jsonify({'answer': "<em>This Agora is not AI-enabled yet</em>."})


@bp.route("/api/gemini_complete/<prompt>")
def gemini_complete_route(prompt):
    full_prompt, answer = gemini_complete(prompt)
    if full_prompt is None and "not properly set up" not in answer:
        # This is likely an old cache entry. Reconstruct a prompt for display.
        full_prompt = "The prompt for this cached response is not available, but the query was:" + prompt
    return jsonify({'prompt': full_prompt, 'answer': render.markdown(answer)})

@bp.route("/api/random_artifact")
def random_artifact():
    if current_app.config.get('ENABLE_SQLITE', False):
        prompt, content = api.sqlite_engine.get_random_ai_generation()
        if content:
            return jsonify({
                'prompt': prompt,
                'content': render.markdown(content)
            })
    return jsonify({'content': '<em>No artifacts found in the database cache.</em>'})

@bp.route("/api/star/<path:subnode_uri>", methods=["POST"])
def star_subnode(subnode_uri):
    try:
        db = sqlite_engine.get_db()
        if db is None:
            current_app.logger.error("API: Database connection is not available for starring.")
            return jsonify({"status": "error", "message": "Database connection failed"}), 500
        
        db.execute(
            "INSERT INTO starred_subnodes (subnode_uri, timestamp) VALUES (?, ?)",
            (subnode_uri, datetime.datetime.utcnow())
        )
        db.commit()

        # Federate the star action as a Create activity to followers.
        # TODO: The federation logic for starring needs to be implemented.
        # The 'federate_create' function was not defined, causing a NameError.
        # app_context = current_app.app_context()
        # thread = threading.Thread(target=federate_create, args=(subnode_uri, app_context))
        # thread.start()

        return jsonify({"status": "success", "action": "starred", "uri": subnode_uri})
    except Exception as e:
        current_app.logger.error(f"API: Error starring subnode {subnode_uri}: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@bp.route("/api/unstar/<path:subnode_uri>", methods=["POST"])
def unstar_subnode(subnode_uri):
    try:
        db = sqlite_engine.get_db()
        if db is None:
            current_app.logger.error("API: Database connection is not available for unstarring.")
            return jsonify({"status": "error", "message": "Database connection failed"}), 500

        db.execute(
            "DELETE FROM starred_subnodes WHERE subnode_uri = ?",
            (subnode_uri,)
        )
        db.commit()
        return jsonify({"status": "success", "action": "unstarred", "uri": subnode_uri})
    except Exception as e:
        current_app.logger.error(f"API: Error unstarring subnode {subnode_uri}: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@bp.route("/api/starred")
def get_starred_subnodes():
    try:
        db = sqlite_engine.get_db()
        if db is None:
            current_app.logger.error("API: Database connection is not available for fetching stars.")
            return jsonify({"status": "error", "message": "Database connection failed"}), 500

        cursor = db.execute(
            "SELECT subnode_uri FROM starred_subnodes"
        )
        starred_uris = [row[0] for row in cursor.fetchall()]
        return jsonify(starred_uris)
    except Exception as e:
        current_app.logger.error(f"API: Error fetching starred subnodes: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


@bp.route("/api/star_node/<path:node_uri>", methods=["POST"])
def star_node(node_uri):
    try:
        db = sqlite_engine.get_db()
        if db is None:
            current_app.logger.error("API: Database connection is not available for starring.")
            return jsonify({"status": "error", "message": "Database connection failed"}), 500
        
        db.execute(
            "INSERT INTO starred_nodes (node_uri, timestamp) VALUES (?, ?)",
            (node_uri, datetime.datetime.utcnow())
        )
        db.commit()
        return jsonify({"status": "success", "action": "starred", "uri": node_uri})
    except Exception as e:
        current_app.logger.error(f"API: Error starring node {node_uri}: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@bp.route("/api/unstar_node/<path:node_uri>", methods=["POST"])
def unstar_node(node_uri):
    try:
        db = sqlite_engine.get_db()
        if db is None:
            current_app.logger.error("API: Database connection is not available for unstarring.")
            return jsonify({"status": "error", "message": "Database connection failed"}), 500

        db.execute(
            "DELETE FROM starred_nodes WHERE node_uri = ?",
            (node_uri,)
        )
        db.commit()
        return jsonify({"status": "success", "action": "unstarred", "uri": node_uri})
    except Exception as e:
        current_app.logger.error(f"API: Error unstarring node {node_uri}: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@bp.route("/api/starred_nodes")
def get_starred_nodes():
    try:
        db = sqlite_engine.get_db()
        if db is None:
            current_app.logger.error("API: Database connection is not available for fetching stars.")
            return jsonify({"status": "error", "message": "Database connection failed"}), 500

        starred_uris = sqlite_engine.get_all_starred_nodes()
        return jsonify(starred_uris)
    except Exception as e:
        current_app.logger.error(f"API: Error fetching starred nodes: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


# Fediverse space is: /inbox, /outbox, /users/<username>, .well-known/webfinger, .well-known/nodeinfo?

def send_accept(app, follow_activity, actor_url, key_id, base_url):
    """
    Constructs and sends an Accept activity to the follower's inbox.
    This function is designed to be run in a background thread.
    """
    with app.app_context():
        with app.test_request_context(base_url=base_url):
            # This import is needed as it's run in a separate thread.
            import requests
            current_app.logger.info("Attempting to send Accept activity in background thread.")
            follower_actor_uri = follow_activity.get('actor')
            
            # 1. Fetch the follower's profile to find their inbox.
            try:
                current_app.logger.info(f"Fetching follower profile from {follower_actor_uri}")
                actor_res = requests.get(
                    follower_actor_uri,
                    headers={'Accept': 'application/activity+json, application/ld+json'},
                    timeout=5
                )
                actor_res.raise_for_status()
                actor_profile = actor_res.json()
                follower_inbox = actor_profile.get('inbox')
                if not follower_inbox:
                    raise ValueError("Follower's profile does not contain an inbox URL.")
                current_app.logger.info(f"Found follower inbox: {follower_inbox}")
            except (requests.RequestException, ValueError) as e:
                current_app.logger.error(f"Could not fetch follower's profile or find inbox for {follower_actor_uri}: {e}")
                return

            # 2. Construct the Accept activity.
            accept_activity = {
                '@context': 'https://www.w3.org/ns/activitystreams',
                'id': actor_url + f'#accepts/follows/{follow_activity["id"].split("/")[-1]}',
                'type': 'Accept',
                'actor': actor_url,
                'object': follow_activity
            }

            # 3. Sign and POST the Accept request.
            private_key, _ = federation.ap_key_setup()
            federation.send_signed_request(follower_inbox, key_id, accept_activity, private_key)

            if not current_app.config.get('ACTIVITYPUB_SEND_WELCOME_PACKAGE', False):
                return

            # 4. Prepare the 5 most recent unfederated posts to be sent to the new follower.
            # All URL generation must happen here, within the app context.
            username = actor_url.split('/')[-1]
            
            # Fetch a larger pool of recent subnodes to find some that are not yet federated.
            all_recent_subnodes = api.subnodes_by_user(username, sort_by="mtime", reverse=True)[:50]
            unfederated_subnodes = []
            for subnode in all_recent_subnodes:
                if not sqlite_engine.is_subnode_federated(subnode.uri):
                    unfederated_subnodes.append(subnode)
            
            # Take the 5 most recent from the unfederated list.
            subnodes_to_send = unfederated_subnodes[:5]

            posts_to_send = []
            for subnode in subnodes_to_send:
                object_id = url_for('.root', node=subnode.wikilink, _external=True) + f'#/{subnode.uri}'
                content_str = subnode.content.decode('utf-8', 'replace') if isinstance(subnode.content, bytes) else subnode.content
                content_with_link = f"""{content_str}
<br><br>
<p>Source: <a href="{object_id}" rel="nofollow noopener noreferrer" target="_blank">{object_id}</a></p>
"""

                posts_to_send.append({
                    "published_time": datetime.datetime.fromtimestamp(subnode.mtime, tz=datetime.timezone.utc).isoformat(),
                    "object_id": object_id,
                    "activity_id": url_for('.user_outbox', user=username, _external=True) + f'#/{subnode.uri}/{subnode.mtime}',
                    "actor_url": url_for('.ap_user', username=username, _external=True),
                    "content": render.markdown(content_with_link),
                    "url": url_for('.root', node=subnode.wikilink, _external=True)
                })

            # 5. Send the recent posts in a new background thread.
            # We create a new app_context for this new thread.
            new_app_context = current_app.app_context()
            thread = threading.Thread(target=send_recent_posts, args=(follower_inbox, key_id, posts_to_send, new_app_context))
            thread.start()

def send_recent_posts(follower_inbox, key_id, posts_to_send, app_context):
    """
    Sends a list of pre-constructed post activities to a new follower.
    This function is designed to be run in a background thread.
    """
    with app_context:
        current_app.logger.info(f"Sending {len(posts_to_send)} recent posts to {follower_inbox}")
        private_key, _ = federation.ap_key_setup()

        for post_data in posts_to_send:
            # The object_id is the canonical URL to the subnode.
            # We can extract the subnode_uri from it.
            subnode_uri = post_data['object_id'].split('#/')[-1]
            
            if sqlite_engine.is_subnode_federated(subnode_uri):
                current_app.logger.info(f"Skipping already federated subnode: {subnode_uri}")
                continue

            create_activity = {
                '@context': 'https://www.w3.org/ns/activitystreams',
                'id': post_data['activity_id'],
                'type': 'Create',
                'actor': post_data['actor_url'],
                'to': [follower_inbox],
                'object': {
                    'id': post_data['object_id'],
                    'type': 'Note',
                    'published': post_data['published_time'],
                    'attributedTo': post_data['actor_url'],
                    'content': post_data['content'],
                    'url': post_data['url'],
                    'to': ['https://www.w3.org/ns/activitystreams#Public'],
                }
            }
            federation.send_signed_request(follower_inbox, key_id, create_activity, private_key)
            
            # Mark as federated after sending.
            sqlite_engine.add_federated_subnode(subnode_uri)

            # Small delay to avoid overwhelming the remote server.
            time.sleep(0.5)


def send_signed_request(inbox_url, key_id, activity):
    """
    Signs and sends an ActivityPub activity to a remote inbox.
    """
    current_app.logger.info(f"Preparing to send signed request to {inbox_url}")
    ap_key_setup() # Ensure g.private_key is loaded
    
    inbox_domain = urlparse(inbox_url).netloc
    target_path = urlparse(inbox_url).path
    
    date_header = datetime.datetime.utcnow().strftime('%a, %d %b %Y %H:%M:%S GMT')
    
    body = json.dumps(activity, separators=(',', ':')).encode('utf-8')
    digest_header = 'SHA-256=' + base64.b64encode(SHA256.new(body).digest()).decode('utf-8')

    string_to_sign = (
        f'(request-target): post {target_path}\n'
        f'host: {inbox_domain}\n'
        f'date: {date_header}\n'
        f'digest: {digest_header}'
    )

    signer = pkcs1_15.new(g.private_key)
    signature = base64.b64encode(signer.sign(SHA256.new(string_to_sign.encode('utf-8'))))

    header = (
        f'keyId="{key_id}",'
        f'headers="(request-target) host date digest",'
        f'signature="{signature.decode("utf-8")}"'
    )


    headers = {
        'Host': inbox_domain,
        'Date': date_header,
        'Digest': digest_header,
        'Signature': header,
        'Content-Type': 'application/activity+json',
        'Accept': 'application/activity+json, application/ld+json'
    }
    current_app.logger.info(f"Sending signed request with headers: {headers}")

    try:
        response = requests.post(inbox_url, data=body, headers=headers, timeout=10)
        response.raise_for_status()
        current_app.logger.info(f"Successfully sent signed request to {inbox_url}. Response: {response.status_code}")
    except requests.RequestException as e:
        current_app.logger.error(f"Error sending signed request to {inbox_url}: {e}")
        if e.response is not None:
            current_app.logger.error(f"Response body: {e.response.text}")


def ap_key_setup():
	if hasattr(g, 'private_key') and hasattr(g, 'public_key'):
		return
	if not os.path.isfile('public.pem') or not os.path.isfile('private.pem'):
		g.private_key = RSA.generate(2048)
		g.public_key = g.private_key.public_key()
		with open('private.pem', 'wb') as fp:
			fp.write(g.private_key.export_key('PEM'))
		with open('public.pem', 'wb') as fp:
			fp.write(g.public_key.export_key('PEM'))
	else:
		with open('private.pem', 'rb') as fp:
			g.private_key = RSA.import_key(fp.read())
		with open('public.pem', 'rb') as fp:
			g.public_key = RSA.import_key(fp.read())

@bp.route("/u/<user>/inbox", methods=['POST'])
def user_inbox(user):
    """Handles incoming ActivityPub activities."""
    try:
        activity = request.get_json()
        if not activity:
            return "Request is not JSON", 400
    except Exception as e:
        current_app.logger.error(f"Could not parse ActivityPub JSON for user {user}: {e}")
        return "Could not parse JSON", 400

    current_app.logger.info(f"Received activity for user {user}: {json.dumps(activity, indent=2)}")

    if activity.get('type') == 'Follow':
        actor_uri = activity.get('actor')
        if not actor_uri or not isinstance(actor_uri, str):
            return "Invalid actor in Follow activity", 400

        # The user being followed is the one whose inbox this is.
        user_uri = url_for('.ap_user', username=user, _external=True)
        
        # Store the follower relationship.
        sqlite_engine.add_follower(user_uri, actor_uri)
        current_app.logger.info(f"User {user_uri} is now followed by {actor_uri}")

        # Generate all necessary URLs within the request context.
        actor_url = url_for('.ap_user', username=user, _external=True)
        key_id = actor_url + '#main-key'
        base_url = request.url_root
        app = current_app._get_current_object()

        # Send an Accept activity back to the follower's inbox in a background thread.
        thread = threading.Thread(target=send_accept, args=(app, activity, actor_url, key_id, base_url))
        thread.start()

        return jsonify({"status": "success", "action": "follow_accepted"}), 202

    # For now, we only handle Follow.
    return jsonify({"status": "success", "action": "activity_received"}), 202


@bp.route("/u/<user>/outbox")
def user_outbox(user):
    """Serves a user's recent subnodes as an ActivityPub OrderedCollection."""
    
    # Fetch the user's 20 most recent subnodes.
    subnodes = api.subnodes_by_user(user, sort_by="mtime", reverse=True)[:20]
    
    activities = []
    for subnode in subnodes:
        # Construct fully qualified URLs for each object.
        # The ID of the Create activity itself.
        activity_id = url_for('.user_outbox', user=user, _external=True, _scheme='https') + f'#/{subnode.uri}/{subnode.mtime}'
                # The ID of the Note object, which is the subnode itself.
        object_id = url_for('.root', node=subnode.wikilink, _external=True, _scheme='https') + f'#/{subnode.uri}'
        
        # Format the timestamp to ISO 8601 format as required by ActivityPub.
        published_time = datetime.datetime.fromtimestamp(subnode.mtime, tz=datetime.timezone.utc).isoformat()

        content_str = subnode.content.decode('utf-8', 'replace') if isinstance(subnode.content, bytes) else subnode.content
        content_with_link = f"""{content_str}
<br><br>
<p>Source: <a href="{object_id}" rel="nofollow noopener noreferrer" target="_blank">{object_id}</a></p>
"""

        create_activity = {
            'id': activity_id,
            'type': 'Create',
            'actor': url_for('.ap_user', username=user, _external=True, _scheme='https'),
            'published': published_time,
            'to': ['https://www.w3.org/ns/activitystreams#Public'],
            'cc': [url_for('.ap_user', username=user, _external=True, _scheme='https') + '/followers'],
            'object': {
                'id': object_id,
                'type': 'Note',
                'published': published_time,
                'attributedTo': url_for('.ap_user', username=user, _external=True, _scheme='https'),
                'content': render.markdown(content_with_link),
                'url': url_for('.root', node=subnode.wikilink, _external=True, _scheme='https'),
                'to': ['https://www.w3.org/ns/activitystreams#Public'],
                'cc': [url_for('.ap_user', username=user, _external=True, _scheme='https') + '/followers'],
            }
        }
        activities.append(create_activity)

    outbox_collection = {
        '@context': 'https://www.w3.org/ns/activitystreams',
        'id': url_for('.user_outbox', user=user, _external=True, _scheme='https'),
        'type': 'OrderedCollection',
        'totalItems': len(activities),
        'orderedItems': activities
    }
    
    r = make_response(jsonify(outbox_collection))
    r.headers['Content-Type'] = 'application/activity+json'
    return r


@bp.route("/inbox", methods=['POST'])
def inbox():
    """Reserved."""
    pass

@bp.route("/outbox")
def outbox():
    """Reserved."""
    pass

@bp.route("/users/<username>")
def ap_user(username):
    """Generates an ActivityPub actor profile for a given user."""

    ap_key_setup()
    
    # Try to fetch the user's bio from their garden.
    bio_subnode = api.subnode_by_uri(f'@{username}/bio')
    if bio_subnode:
        summary = bio_subnode.content.strip()
    else:
        summary = 'A user in the Agora of Flancia.'

    # Construct fully qualified URLs.
    user_url = url_for('.user', user=username, _external=True)
    actor_url = url_for('.ap_user', username=username, _external=True)
    inbox_url = url_for('.user_inbox', user=username, _external=True)
    outbox_url = url_for('.user_outbox', user=username, _external=True)
    icon_url = url_for('static', filename='img/agora.png', _external=True)

    r = make_response({
        '@context': [
            'https://www.w3.org/ns/activitystreams',
            'https://w3id.org/security/v1',
        ],
        'id': actor_url,
        'type': 'Person',
        'preferredUsername': username,
        'name': f'@{username}@{current_app.config["URI_BASE"]}',
        'summary': summary,
        'inbox': inbox_url,
        'outbox': outbox_url,
        'url': user_url,
        'discoverable': True,
        'icon': {
            'type': 'Image',
            'mediaType': 'image/png',
            'url': icon_url
        },
        'publicKey': {
            'id': f'{actor_url}#main-key',
            'owner': actor_url,
			'publicKeyPem': g.public_key.exportKey(format='PEM').decode('ascii'),
        }
    })

    r.headers['Content-Type'] = 'application/activity+json'
    return r

@bp.route("/.well-known/webfinger")
def webfinger():
    resource = request.args.get('resource')
    
    if not resource or not resource.startswith('acct:'):
        return "Invalid resource", 400

    # Extract user@domain from 'acct:user@domain'
    account = resource[5:]
    
    # For now, we only respond to queries for users on this Agora's domain.
    URI_BASE = current_app.config['URI_BASE']
    if '@' not in account or account.split('@')[1].lower() != URI_BASE.lower():
        return "User not found on this instance", 404

    username = account.split('@')[0]
    
    # Check if the user actually exists in the Agora.
    all_usernames = [u.uri for u in api.all_users()]
    if username not in all_usernames:
        return "User not found", 404

    # If we found the user, generate their links.
    links = [
        {
            'rel': 'self',
            'href': url_for('.ap_user', username=username, _external=True),
            'type': 'application/activity+json'
        },
        {
            'rel': 'http://webfinger.net/rel/profile-page',
            'href': url_for('.user', user=username, _external=True),
            'type': 'text/html'
        }
    ]

    r = make_response({
        'subject': resource,
        'links': links,
    })
    r.headers['Content-Type'] = 'application/jrd+json'
    return r

@bp.route("/.well-known/nodeinfo")
def nodeinfo():
    """Reserved."""
    pass








