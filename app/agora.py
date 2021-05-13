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
import jsons
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
@bp.route('/<node>')
def node(node,user_list=[]):
    current_app.logger.debug(f'[[{node}]]: Assembling node.')
    if user_list:
        rank = user_list.split(",")
    else:
        rank = ['agora', 'flancian']
    n = G.node(node)
    if n.subnodes:
        # earlier in the list means more highly ranked.
        n.subnodes = util.uprank(n.subnodes, users=rank)
        permutations = []
    # if it's a 404, include permutations.
    else:
        permutations = G.existing_permutations(node)

    search_subnodes = db.search_subnodes(node)

    current_app.logger.debug(f'[[{node}]]: Assembled node.')
    return render_template(
            # yuck
            'content.html', 
            node=n,
            backlinks=n.back_links(),
            pull_nodes=n.pull_nodes() if n.subnodes else permutations,
            forwardlinks=n.forward_links() if n else [],
            search=search_subnodes,
            pulling_nodes=n.pulling_nodes(),
            pushing_nodes=n.pushing_nodes(),
            q=n.wikilink.replace('-', '%20'),
            qstr=n.wikilink.replace('-', ' '),
            render_graph=True if n.subnodes else False,
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
@bp.route('/today')
def today():
    today = datetime.datetime.now().date()
    return redirect("/node/%s" % today.strftime("%Y-%m-%d"))

@bp.route('/regexsearch', methods=('GET', 'POST'))
def regexsearch():
    """mostly deprecated in favour of jump-like search, left around for now though."""
    form = forms.SearchForm()
    if form.validate_on_submit():
        return render_template('regexsearch.html', form=form, subnodes=db.search_subnodes(form.query.data))
    return render_template('regexsearch.html', form=form)

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
        current_app.logger.warning('nodes_by_wikilink returned more than one node, should not happen.')

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
        current_app.logger.warning('Code to manage nodes with more than one go link is not Not implemented.')

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
        current_app.logger.debug(f'n0 [[{n0}]]: filtered to {node1} yields {links}.')

    if len(n1) != 0:
        links.extend(n1[0].filter(node0))
        current_app.logger.debug(f'n1 [[{n1}]]: filtered to {node0} finalizes to {links}.')

    if len(links) == 0:
        # No matching links found.
        # Redirect to composite node, which might exist and provides search.
        # TODO(flancian): flash an explanation :)
        return redirect(f'{base}/{node0}-{node1}')

    if len(links) > 1:
        # TODO(flancian): to be implemented.
        # Likely default to one of the links, show all of them but redirect to default within n seconds.
        current_app.logger.warning('Code to manage nodes with more than one go link is not implemented.')

    return redirect(links[0])

@bp.route('/push/<node>/<other>')
def push(node, other):
    n = G.node(node)
    o = G.node(other)
    pushing = n.pushing(o)

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
    results.sort(reverse=True) # should result in a reasonable ranking; bids are a list of tuples (confidence, proposal)
    current_app.logger.info(f'Search results for {q}: {results}')
    print(f'Search results for {q}: {results}')
    result = results[0] # the agora always returns at least one result: the offer to render the node for the query.

    # perhaps here there could be special logic to flash a string at the top of the result node if what we got back from search is a string.

    # hack hack
    # [[push]] [[2021-02-28]] in case I don't get to it today.
    # if tokens[0] == 'go' and len(tokens) > 1:
    #    return redirect(url_for('.go', node=util.slugify(" ".join(tokens[1:]))))
    if callable(result.proposal):
        return result.proposal()
    if result.message:
        # here we should probably do something to 'flash' the message?
        pass
    # catch all follows.
    # "should never happen" (lol) as the agora is its own search provider and a plain node rendering should always be returned as a bid for every query.
    # log a warning if it does :)
    current_app.logger.warning('Node catch-all in agora.py triggered; should never happen (tm).')
    return redirect(url_for('.node', node=util.slugify(q)))


@bp.route('/subnode/<path:subnode>')
def old_subnode(subnode):
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
    return render_template('nodes.html', nodes=db.top())

@bp.route('/nodes.json')
def nodes_json():
    nodes = G.nodes(include_journals=False).values()
    links = list(map(lambda x: x.wikilink, nodes))
    return jsonify(jsons.dump(links))

@bp.route('/notes') # alias
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
    return render_template('nodes.html', header="Journals", nodes=db.all_journals())

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


