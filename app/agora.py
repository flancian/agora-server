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

import collections
import datetime
import json
import os
import re
import time
import urllib.parse
from copy import copy
from distutils.command.config import config
from urllib.parse import parse_qs

import jsons
from Crypto.PublicKey import RSA
from Crypto.Signature import pkcs1_15
from flask import (Blueprint, Response, current_app, g, jsonify, make_response,
                   redirect, render_template, request, send_file, url_for)
from flask_cors import CORS
from markupsafe import escape
from mistralai.client import MistralClient, MistralException
from mistralai.models.chat_completion import ChatMessage

from . import forms, providers, render, util
from .storage import api, feed, graph

bp = Blueprint("agora", __name__)
CORS(bp)

# Global graph. We want this here as we have what amounts to a per-process cache.
G = api.Graph()

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
        current_app.config["URL_BASE"] = 'https://' + current_app.config["URI_BASE"]


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

    # Builds a node with the bare minimum/stub metadata, should be quick.
    current_app.logger.debug(f"[[{node}]]: Assembling light node.")

    # We really need to get rid of this kind of hack :)
    # 2023-12-12: today is the day?
    # node = node.replace(",", "").replace(":", "")
    node = urllib.parse.unquote_plus(node)
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
    current_app.logger.debug(f"[[{node}]]: Assembled light node.")

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

# Flask routes work so that the one closest to the function is the canonical one.
@bp.route("/wikilink/<node>")
@bp.route("/node/<node>/uprank/<user_list>")
@bp.route("/node/<node>")
def node(node, user_list=""):
    n = api.build_node(node)

    return render_template(
        "async.html",
        node=n,
        config=current_app.config,
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
    subnodes = api.latest()[:100]
    subnodes.reverse()
    return Response(feed.latest_rss(subnodes), mimetype="application/rss+xml")


@bp.route("/ttl/<node>")  # perhaps deprecated
@bp.route("/turtle/<node>")
@bp.route("/graph/turtle/<node>")
def turtle(node):
    n = G.node(node)
    return Response(graph.turtle_node(n), mimetype="text/turtle")


@bp.route("/graph/turtle/all")
@bp.route("/graph/turtle")
def turtle_all():
    nodes = G.nodes().values()
    return Response(graph.turtle_nodes(nodes), mimetype="text/turtle")


@bp.route("/graph/json/all")
@bp.route("/graph/json")
def graph_js():
    nodes = G.nodes().values()
    return Response(graph.json_nodes(nodes), mimetype="application/json")


@bp.route("/graph/json/<node>")
def graph_js_node(node):
    n = G.node(node)
    return Response(graph.json_node(n), mimetype="application/json")


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

    return render_template(
        "node.html",
        node=n,
        subnode=f"@{user}/" + n.wikilink,
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


    # return redirect(url_for(".root", node="index"))


@bp.route("/Δ")
@bp.route("/delta")
@bp.route("/latest")
def latest():
    n = api.build_node("latest")
    return render_template(
        "delta.html", header="Recent deltas", subnodes=api.latest(max=200), node=n
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
    return redirect(f"/{random.description}")


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
            links.extend(subnode.go())
        current_app.logger.debug(f"n0 [[{n0}]]: filtered to {node1} yields {links}.")

        for subnode in n1.pushed_subnodes():
            links.extend(subnode.go())
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
    qstr = request.args.get("q")
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
    if current_app.config["ENABLE_STATS"]:
        return render_template("nodes.html", nodes=api.top(), node=n, stats=api.stats())
    else:
        return render_template("nodes.html", nodes=api.top(), node=n, stats=None)


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
    # doesn't really work currently.
    n = api.build_node(user)
    subs = api.user_journals(user)
    nodes = [G.node(subnode.node) for subnode in subs]
    nodes.reverse()
    return render_template(
        "journals.html", header="Journals for user", node=n, nodes=nodes
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
    return render_template(
        "journals.html",
        node=n,
        header=f"Journal entries in the last {entries} days",
        nodes=api.all_journals()[0:entries],
    )


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
    print(s.content)
    return Response(s.content, mimetype=s.mediatype)


@bp.route("/backlinks/<node>")
def backlinks(node):
    # Currently unused.
    return render_template("nodes.html", nodes=api.nodes_by_outlink(node))


@bp.route("/settings")
def settings():
    n = api.build_node("settings")
    return render_template("settings.html", header="Settings", node=n)


@bp.route("/opensearch.xml")
def search_xml():
    return (
        render_template("search.xml"),
        200,
        {"Content-Type": "application/opensearchdescription+xml"},
    )


def count_votes(subnode):
    match = re.search("\#(\w+)", subnode.content)
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
        api_key = current_app.config["MISTRAL_API_KEY"]

         # anything above small is too slow in practice IMHO, as of 2024-03-16.
        model = "mistral-small"

        client = MistralClient(api_key=api_key)

        prompt = f"""
        You are a helpful assistant named Socrates whose task is to help people navigate a 
        [[Knowledge Commons]] we call the Agora. 
        
        Unless the user overrides it, you can assume to be operating within the [[Agora of 
        Flancia]], a free [[distributed knowledge graph]] provisioned for the benefit of 
        sentient beings available for free at https://anagora.org.  
        
        When responding, please ALWAYS surround a few interesting entities (things, people 
        or concepts) with [[double square brackets]] to link to them and thus make it easier
        for the user to learn more about them. 

        For example: in Agora node [[Socrates]], we would expect to see the link [[Plato]] 
        in double square brackets somewhere in the response. 
        
        Remember to ALWAYS include a few interesting wikilinks using the double square 
        brackets convention indicated above,.

        Now please answer or analyze prompt '{prompt}' provided by an Agora user who is 
        visiting the matching location."""

        messages = [
            ChatMessage(role="user", content=f"{prompt}")
        ]

        # No streaming
        try:
            chat_response = client.chat(
                model=model,
                messages=messages,
            )
            answer = str(chat_response.choices[0].message.content)
        except MistralException:
            # usually unauthorized; it happens if the key is invalid, for example.
            answer = "[[GenAI]] is not properly set up in this Agora yet. Please set the MISTRAL_API_KEY environment variable to a valid API key."
        return render.markdown(answer)
    else:
        return("<em>This Agora is not AI-enabled yet</em>.")

# Fediverse space is: /inbox, /outbox, /users/<username>, .well-known/webfinger, .well-known/nodeinfo?

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
    """TODO: implement."""

    ap_key_setup()
    URI_BASE = current_app.config['URI_BASE']

    r = make_response({
        '@context': [
            'https://www.w3.org/ns/activitystreams',
            'https://w3id.org/security/v1',
        ],
        'id': 'https://' + URI_BASE + f'/users/@{username}',
        'inbox': 'https://' + URI_BASE + '/inbox',
        'outbox': 'https://' + URI_BASE + '/outbox',
        'name': f'@{username}@{URI_BASE}',
        'preferredUsername': '{username}',
        'url': 'https://' + URI_BASE + f'/@{username}',
        'discoverable': True,
        'type': 'Person',
        'summary': 'A user in the Agora of Flancia.',
        'publicKey': {
            'id': 'https://' + URI_BASE + f'/users/{username}' + '#main-key',
            'owner': 'https://' + URI_BASE + f'/users/{username}',
			'publicKeyPem': g.public_key.exportKey(format='PEM').decode('ascii'),
        }
    })

    r.headers['Content-Type'] = 'application/activity+json'
    return r

@bp.route("/.well-known/webfinger")
def webfinger():
    resource = request.args.get('resource')

    users = api.all_users()

    links = []

    URI_BASE = current_app.config['URI_BASE']

    for user in users:
            links.append({'rel': 'self',
             'href': 'https://' + URI_BASE + '/users/' + f'{user}',
             'type': 'application/activity+json',
             'titles': {'und': f'@{user}@{URI_BASE}'},
             })
            links.append({'rel': 'http://webfinger.net/rel/profile-page',
             'href': 'https://' + URI_BASE + '/@' + f'{user}',
             'type': 'application/activity+json',
             'titles': {'und': f'@{user}@{URI_BASE}'},
             })

    # filter down to the actual user requested if any
    if resource:
        links = [link for link in links if resource in link['titles']['und']]

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








