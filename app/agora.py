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

import datetime
import collections
import jsons
import json
import re
from flask import Blueprint, url_for, render_template, current_app, Response, redirect, request, jsonify
from markupsafe import escape
from urllib.parse import parse_qs
from . import db
from . import feed
from . import forms
from . import graph
from . import providers
from . import util

bp = Blueprint('agora', __name__)
G = db.G

# The [[agora]] is a [[distributed knowledge graph]].
# Nodes are the heart of the [[agora]].
# In the [[agora]] there are no 404s. Everything that can be described with words has a node in the [[agora]].
# The [[agora]] is a [[search engine]]: anagora.org/agora-search
#
# Flask routes work so that the one closest to the function is the canonical one.

@bp.route('/wikilink/<node>')
@bp.route('/node/<node>/uprank/<user_list>')
@bp.route('/node/<node>')
@bp.route('/<node>/uprank/<user_list>')
@bp.route('/<node>.<extension>')
@bp.route('/<node>')
def node(node, extension='', user_list=''):
    current_app.logger.debug(f'[[{node}]]: Assembling node.')
    # default uprank: system account and maintainers
    # TODO: move to config.py
    rank = ['agora', 'flancian', 'vera', 'neil']
    if user_list:
        # override rank
        if ',' in user_list:
            rank = user_list.split(",")
        else:
            rank = user_list

    from copy import copy
    n = copy(G.node(node))

    if n.subnodes:
        # earlier in the list means more highly ranked.
        n.subnodes = util.uprank(n.subnodes, users=rank)
        if extension:
            # this is pretty hacky but it works for now
            # should probably move to a filter method in the node? and get better template support to make what's happening clearer.
            current_app.logger.debug(f'filtering down to extension {extension}')
            n.subnodes = [subnode for subnode in n.subnodes if subnode.uri.endswith(f'.{extension}')]
            n.uri = n.uri + f'.{extension}'
            n.wikilink = n.wikilink + f'.{extension}'

    # search_subnodes = db.search_subnodes(node)

    current_app.logger.debug(f'[[{node}]]: Assembled node.')
    return render_template(
            # yuck
            'content.html', 
            node=n,
            backlinks=n.back_links(),
            pull_nodes=n.pull_nodes() if n.subnodes else [],
            auto_pull_nodes=n.auto_pull_nodes() if current_app.config['ENABLE_AUTO_PULL'] else [],
            forwardlinks=n.forward_links() if n else [],
            search=[],
            pulling_nodes=n.pulling_nodes(),
            pushing_nodes=n.pushing_nodes(),
            q=n.wikilink.replace('-', '%20'),
            qstr=n.wikilink.replace('-', ' '),
            render_graph=True if n.back_links() or n.subnodes else False,
            config=current_app.config,
            # disabled a bit superstitiously due to [[heisenbug]] after I added this everywhere :).
            # sorry for the fuzzy thinking but I'm short on time and want to get things done.
            # (...famous last words).
            # annotations=n.annotations(),
            )

@bp.route('/ttl/<node>') # perhaps deprecated
@bp.route('/turtle/<node>')
@bp.route('/graph/turtle/<node>')
def turtle(node):
    n = G.node(node)
    return Response(graph.turtle_node(n), mimetype='text/turtle')


@bp.route('/graph/turtle/all')
@bp.route('/graph/turtle')
def turtle_all():

    nodes = G.nodes().values()
    return Response(graph.turtle_nodes(nodes), mimetype='text/turtle')


@bp.route('/graph/json')
def graph_js():
    nodes = G.nodes().values()
    return Response(graph.json_nodes(nodes), mimetype='application/json')


@bp.route('/graph/json/<node>')
def graph_js_node(node):
    n = G.node(node)
    return Response(graph.json_node(n), mimetype='application/json')


@bp.route('/node/<node>@<user>')
@bp.route('/node/@<user>/<node>')
@bp.route('/@<user>/<node>')
def subnode(node, user):

    n = G.node(node)

    n.subnodes = util.filter(n.subnodes, user)
    n.subnodes = util.uprank(n.subnodes, user)
    search_subnodes = db.search_subnodes_by_user(node, user)
    return render_template(
        'subnode.html',
        node=n,
    )

# Special


@bp.route('/')
def index():
    return redirect(url_for('.node', node='index'))


@bp.route('/Δ')
@bp.route('/delta')
@bp.route('/latest')
def latest():
    return render_template('delta.html',
                           header="Recent deltas",
                           subnodes=db.latest(),
                           annotations=feed.get_latest())


@bp.route('/now')
@bp.route('/tonight')
@bp.route('/today')
def today():
    today = datetime.date.today()
    return redirect("/%s" % today.strftime("%Y-%m-%d"))

@bp.route('/tomorrow')
def tomorrow():
    tomorrow = datetime.date.today() + datetime.timedelta(days=1)
    return redirect("/%s" % tomorrow.strftime("%Y-%m-%d"))


@bp.route('/regexsearch', methods=('GET', 'POST'))
def regexsearch():
    """mostly deprecated in favour of jump-like search, left around for now though."""
    form = forms.SearchForm()
    if form.validate_on_submit():
        return render_template('regexsearch.html', form=form, subnodes=db.search_subnodes(form.query.data))
    return render_template('regexsearch.html', form=form)


@bp.route('/ctzn-login')
def ctzn_login():
    return render_template('ctzn_login.html')

# Actions
# Simple go.


@bp.route('/go/<node>')
def go(node):
    """Redirects to the URL in the given node in a block that starts with [[go]], if there is one."""
    # TODO(flancian): all node-scoped stuff should move to actually use node objects.
    try:
        n = db.nodes_by_wikilink(node)
    except KeyError:
        return redirect("https://anagora.org/node/%s" % node)

    if len(n) > 1:
        current_app.logger.warning(
            'nodes_by_wikilink returned more than one node, should not happen.')

    if len(n) == 0:
        # No nodes with this name -- redirect to node 404.
        return redirect("https://anagora.org/node/%s" % node)

    links = n[0].go()
    if len(links) == 0:
        # No go links detected in this node -- just redirect to the node.
        # TODO(flancian): flash an explanation :)
        return redirect("https://anagora.org/node/%s" % node)

    if len(links) > 1:
        # TODO(flancian): to be implemented.
        # Likely default to one of the links, show all of them but redirect to default within n seconds.
        current_app.logger.warning(
            'Code to manage nodes with more than one go link is not Not implemented.')

    return redirect(links[0])

# Composite go.
# This is a hack, needs to be replaced with proper generic node/block "algebra".


@bp.route('/go/<node0>/<node1>')
def composite_go(node0, node1):
    """Redirects to the URL in the given node in a block that starts with [[<action>]], if there is one."""
    # TODO(flancian): all node-scoped stuff should move to actually use node objects.
    # TODO(flancian): make [[go]] call this?
    # current_app.logger.debug = print
    current_app.logger.debug(f'running composite_go for {node0}, {node1}.')
    try:
        n0 = db.nodes_by_wikilink(node0)
        current_app.logger.debug(f'n0: {n0}')
        n1 = db.nodes_by_wikilink(node1)
        current_app.logger.debug(f'n1: {n1}')
    except KeyError:
        pass
        # return redirect("https://anagora.org/%s" % node0)

    base = current_app.config['URL_BASE']
    if len(n0) == 0 and len(n1) == 0:
        # No nodes with either names.
        # Redirect to the composite node, which might exist -- or in any case will provide relevant search.
        current_app.logger.debug(f'redirect 1')
        return redirect(f'{base}/{node0}-{node1}')

    links = []
    if len(n0) != 0:
        links.extend(n0[0].filter(node1))
        current_app.logger.debug(
            f'n0 [[{n0}]]: filtered to {node1} yields {links}.')

    if len(n1) != 0:
        links.extend(n1[0].filter(node0))
        current_app.logger.debug(
            f'n1 [[{n1}]]: filtered to {node0} finalizes to {links}.')

    if len(links) == 0:
        # No matching links found.
        # Redirect to composite node, which might exist and provides search.
        # TODO(flancian): flash an explanation :)
        return redirect(f'{base}/{node0}-{node1}')

    if len(links) > 1:
        # TODO(flancian): to be implemented.
        # Likely default to one of the links, show all of them but redirect to default within n seconds.
        current_app.logger.warning(
            'Code to manage nodes with more than one go link is not implemented.')

    return redirect(links[0])


@bp.route('/push/<node>/<other>')
def push(node, other):
    n = G.node(node)
    o = G.node(other)
    pushing = n.pushing(o)

    return Response(pushing)

# good for embedding just node content.
@bp.route('/pull/<node>')
def pull(node):
    current_app.logger.debug(f'pull [[{node}]]: Assembling node.')
    # default uprank: system account and maintainers
    # TODO: move to config.py
    rank = ['agora', 'flancian', 'vera', 'neil']

    from copy import copy
    n = copy(G.node(node))

    if n.subnodes:
        # earlier in the list means more highly ranked.
        n.subnodes = util.uprank(n.subnodes, users=rank)

    current_app.logger.debug(f'[[{node}]]: Assembled node.')
    return render_template(
            # yuck
            'content.html', 
            node=n,
            embed=True,
            backlinks=n.back_links(),
            pull_nodes=n.pull_nodes() if n.subnodes else [],
            forwardlinks=n.forward_links() if n else [],
            search=[],
            pulling_nodes=n.pulling_nodes(),
            pushing_nodes=n.pushing_nodes(),
            q=n.wikilink.replace('-', '%20'),
            qstr=n.wikilink.replace('-', ' '),
            render_graph=False,
            config=current_app.config,
            )

# for embedding search (at bottom of node).
@bp.route('/fullsearch/<qstr>')
def fullsearch(qstr):
    current_app.logger.debug(f'full text search for [[{qstr}]].')
    search_subnodes = db.search_subnodes(qstr)

    return render_template(
            'fullsearch.html', 
            qstr=qstr,
            q=qstr,
            node=qstr,
            search=search_subnodes
            )

def pull(node, other):
    n = G.node(node)
    return Response(pushing)


# This receives whatever you type in the mini-cli up to the top of anagora.org.
# Then it parses it and redirects to the right node or takes the appropriate action.
# See https://anagora.org/agora-search, in particular 'design', for more.
@bp.route('/exec')
@bp.route('/jump')
@bp.route('/search')
def search():
    """Redirects to an appropriate context.
    Originally called "jump" because in the [[agora]] nodes *always* exist, as they map 1:1 to all possible queries. Thus [[agora search]].
    """
    q = request.args.get('q')
    tokens = q.split(" ")

    # ask for bids from search providers.
    # both the raw query and tokens are passed for convenience; each provider is free to use or discard each.
    results = providers.get_bids(q, tokens)
    # should result in a reasonable ranking; bids are a list of tuples (confidence, proposal)
    results.sort(reverse=True)
    current_app.logger.info(f'Search results for {q}: {results}')
    result = results[0] # the agora always returns at least one result: the offer to render the node for the query.

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
        'Node catch-all in agora.py triggered; should never happen (tm).')
    return redirect(url_for('.node', node=util.slugify(q)))


@bp.route('/subnode/<path:subnode>')
def old_subnode(subnode):
    print(subnode)
    return render_template('subnode.html', subnode=db.subnode_by_uri(subnode), backlinks=db.subnodes_by_outlink(subnode))


@bp.route('/u/<user>')
@bp.route('/user/<user>')
@bp.route('/node/@<user>')  # so that [[@flancian]] works.
@bp.route('/@<user>')
def user(user):
    return render_template('user.html', user=user, readmes=db.user_readmes(user), subnodes=db.subnodes_by_user(user))


@bp.route('/user/<user>.json')
def user_json(user):
    subnodes = list(map(lambda x: x.wikilink, db.subnodes_by_user(user)))
    return jsonify(jsons.dump(subnodes))


@bp.route('/garden/<garden>')
def garden(garden):
    current_app.logger.warning('Not implemented.')
    return 'If I had implemented rendering gardens already, here you would see garden named "%s".' % escape(garden)


# Lists
@bp.route('/nodes')
def nodes():
    if current_app.config['ENABLE_STATS']:
        return render_template('nodes.html', nodes=db.top(), stats=db.stats())
    else:
        return render_template('nodes.html', nodes=db.top(), stats=None)


@bp.route('/nodes.json')
def nodes_json():
    nodes = G.nodes(include_journals=False).values()
    links = list(map(lambda x: x.wikilink, nodes))
    return jsonify(jsons.dump(links))

@bp.route('/similar/<term>.json')
def similar_json(term):
    nodes = util.similar(db.top(), term)
    return jsonify(nodes)


@bp.route('/notes')  # alias
@bp.route('/subnodes')
def subnodes():
    return render_template('subnodes.html', subnodes=G.subnodes())


@bp.route('/@')
@bp.route('/users')
def users():
    return render_template('users.html', users=db.all_users())


@bp.route('/users.json')
def users_json():
    users = list(map(lambda x: x.uri, db.all_users()))
    return jsonify(jsons.dump(users))


@bp.route('/journal/<user>')
def user_journal(user):
    return render_template('subnodes.html', header="Journals for user", subnodes=db.user_journals(user))


@bp.route('/journal/<user>.json')
def user_journal_json(user):
    return jsonify(jsons.dump(db.user_journals(user)))


@bp.route('/journals')
def journals():
    return render_template('journals.html', header="Journals", nodes=db.all_journals()[0:current_app.config['JOURNAL_ENTRIES']])


@bp.route('/journals.json')
def journals_json():
    return jsonify(jsons.dump(db.all_journals()))


@bp.route('/asset/<user>/<asset>')
def asset(user, asset):
    # An asset is a binary in someone's garden/<user>/assets directory.
    # Currently unused.
    path = '/'.join(["garden", user, 'assets', asset])
    return current_app.send_static_file(path)


@bp.route('/raw/<path:subnode>')
def raw(subnode):
    s = db.subnode_by_uri(subnode)
    return Response(s.content, mimetype=s.mediatype)


@bp.route('/backlinks/<node>')
def backlinks(node):
    # Currently unused.
    return render_template('nodes.html', nodes=db.nodes_by_outlink(node))


@bp.route('/settings')
def settings():
    return render_template('settings.html', header="Settings")


@bp.route('/search.xml')
def search_xml():
    return render_template('search.xml'), 200, {'Content-Type': 'application/opensearchdescription+xml'}

def count_votes(subnode):
    match = re.search("\#(\w+)", subnode.content)
    if not match:
        return None
    tag = match.group(1)
    return {"user": subnode.user, "vote": tag}

@bp.route('/proposal/<user>/<node>')
def proposal(user,node):
    n = G.node(node)
    subnode = next(x for x in n.subnodes if x.user == user)
    other_nodes = [x for x in n.subnodes if x.user != user]
    print("subnode", subnode)
    print("other nodes", other_nodes)
    votes = list(filter(None,map(count_votes, other_nodes)))
    print("votes", votes)
    vote_options = [x.get('vote') for x in votes]
    print("options", vote_options)
    vote_counts = collections.Counter(vote_options)
    print("counts", vote_counts)
    return render_template(
        'proposal.html',
        node=n,
        subnode=subnode,
        votes=votes,
        vote_options=vote_options,
        vote_counts=json.dumps(vote_counts)
    )
