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
import re
import time
from urllib.parse import parse_qs

import jsons
import urllib.parse
from flask import (Blueprint, Response, current_app, jsonify, redirect,
                   render_template, request, url_for, g, send_file)
from markupsafe import escape
from copy import copy

from . import db, feed, forms, graph, providers, util

bp = Blueprint('agora', __name__)
G = db.G

# For footer / timing information.
# Adapted from https://stackoverflow.com/questions/12273889/calculate-execution-time-for-every-page-in-pythons-flask
@bp.before_request
def before_request():
  g.start = time.time()

@bp.after_request
def after_request(response):
    exectime = time.time() - g.start
    now = datetime.datetime.now()

    if ((response.response) and
        (200 <= response.status_code < 300) and
        (response.content_type.startswith('text/html'))):
        response.set_data(response.get_data().replace(
            b'__EXECTIME__', bytes(str(exectime), 'utf-8')).replace(
            b'__NOW__', bytes(str(now), 'utf-8')))
    return response
# End footer / timing information.

# The [[agora]] is a [[distributed knowledge graph]].
# Nodes are the heart of the [[agora]].
# In the [[agora]] there are no 404s. Everything that can be described with words has a node in the [[agora]].
# The [[agora]] is in some ways thus a [[search engine]]: anagora.org/agora-search
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

    # there are some ill-slugged links to anagora.org out there, special casing here for a while at least.
    # this should probably be made irrelevant by the Big Refactor that we need to do to make the canonical node identifier non-lossy.
    node = node.replace(',', '').replace(':', '')

    # unquote in case the node came in urlencoded, then slugify again to gain the 'dimensionality reduction' effects of
    # slugs -- and also because G.node() expects a slug as of 2022-01.
    # yeah, this is a hack.
    # TODO: fix this, make decoded unicode strings the main IDs within db.py.
    node = urllib.parse.unquote_plus(node)
    node = util.slugify(node)

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
    # n.subnodes.extend(n.exec())

    # q will likely be set by search/the CLI if the entity information isn't fully preserved by node mapping.
    # query is meant to be user parsable / readable text, to be used for example in the UI
    qstr = request.args.get('q') 
    if not qstr: 
        # could this come in better shape from the node proper when the node is actually defined? it'd be nice not to depend on de-slugifying.
        qstr = n.wikilink.replace('-', ' ')

    # search_subnodes = db.search_subnodes(node)

    current_app.logger.debug(f'[[{node}]]: Assembled node.')
    return render_template(
            # yuck
            'content.html', 
            node=n,
            back_nodes=n.back_nodes(),
            pull_nodes=n.pull_nodes() if n.subnodes else [],
            auto_pull_nodes=n.auto_pull_nodes() if current_app.config['ENABLE_AUTO_PULL'] else [],
            forward_nodes=n.forward_nodes() if n else [],
            search=[],
            pulling_nodes=n.pulling_nodes(),
            pushing_nodes=n.pushing_nodes(),
            # the q part of the query string -- can be forwarded to other sites, expected to preserve all information we got from the user.
            q=urllib.parse.quote_plus(qstr),
            # the decoded q parameter in the query string or inferred human-readable query for the slug. it should be ready for rendering.
            qstr=qstr,
            render_graph=True if n.back_nodes() or n.subnodes else False,
            config=current_app.config,
            # disabled a bit superstitiously due to [[heisenbug]] after I added this everywhere :).
            # sorry for the fuzzy thinking but I'm short on time and want to get things done.
            # (...famous last words).
            # annotations=n.annotations(),
            # annotations_enabled=True,
            )

@bp.route('/feed/<node>') 
def node_feed(node):
    n = G.node(node)
    return Response(feed.rss(n), mimetype='application/rss+xml')


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

    node = urllib.parse.unquote_plus(node)
    node = util.slugify(node)
    n = G.node(node)

    n.subnodes = util.filter(n.subnodes, user)
    n.subnodes = util.uprank(n.subnodes, user)
    search_subnodes = db.search_subnodes_by_user(node, user)

    # q will likely be set by search/the CLI if the entity information isn't fully preserved by node mapping.
    # query is meant to be user parsable / readable text, to be used for example in the UI
    qstr = request.args.get('q') 

    if not qstr: 
        # could this come in better shape from the node proper when the node is actually defined? it'd be nice not to depend on de-slugifying.
        qstr = n.wikilink.replace('-', ' ')

    return render_template(
        'content.html',
        node=n,
        subnode=f'@{user}/'+n.wikilink,
        qstr=f'@{user}/'+n.wikilink.replace('-', ' '),
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

@bp.route('/random')
def random():
    today = datetime.date.today()
    random = db.random_node()
    return redirect(f"/{random.uri}")

@bp.route('/feed/latest') 
def latest_feed():
    # empty node, we'll fake this one.
    n = G.node('')
    n.subnodes = db.latest()[:100]
    n.subnodes.reverse()
    return Response(feed.rss(n), mimetype='application/rss+xml')

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

    node = urllib.parse.unquote_plus(node)
    node = util.slugify(node)
    try:
        n = db.nodes_by_wikilink(node)
    except KeyError:
        return redirect(f'https://anagora.org/{node}')

    if len(n) > 1:
        current_app.logger.warning(
            'nodes_by_wikilink returned more than one node, should not happen.')

    if len(n) == 0:
        # No nodes with this name -- redirect to node 404.
        return redirect(f'https://anagora.org/{node}')

    # we should do ranking :)
    links = n[0].go()
    if len(links) == 0:
        # No go links detected in this node -- just redirect to the node.
        # TODO(flancian): flash an explanation :)
        return redirect(f'https://anagora.org/{node}')

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
    qstr = request.args.get('q')
    tokens = qstr.split(" ")
    q = urllib.parse.quote_plus(qstr)

    # ask for bids from search providers.
    # both the raw query and tokens are passed for convenience; each provider is free to use or discard each.
    results = providers.get_bids(q, tokens)
    # should result in a reasonable ranking; bids are a list of tuples (confidence, proposal)
    results.sort(reverse=True)
    current_app.logger.info(f'Search results for {qstr}: {results}')
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
    return render_template('user.html', user=db.User(user), readmes=db.user_readmes(user), 
        subnodes=db.subnodes_by_user(user, sort_by='node', reverse=False),
        latest=db.subnodes_by_user(user, sort_by='mtime', reverse=True)[:100]
        )


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

@bp.route('/journals/<entries>')
@bp.route('/journals/', defaults={'entries': None})
@bp.route('/journals', defaults={'entries': None})
def journals(entries):
    if not entries:
        entries = current_app.config['JOURNAL_ENTRIES']
    elif entries == 'all':
        entries = 2000000 # ~ 365 * 5500 ~ 3300 BC
    else:
        entries = int(entries)
    return render_template('journals.html', qstr=f"journals/{entries}", header=f"Journals for the last {entries} days with entries", nodes=db.all_journals()[0:entries])


@bp.route('/journals.json')
def journals_json():
    return jsonify(jsons.dump(db.all_journals()))


@bp.route('/asset/<user>/<asset>')
def asset(user, asset):
	# An asset is a binary in someone's garden/<user>/assets directory.
	# Currently unused.
	path = '/'.join([current_app.config['AGORA_PATH'], "garden", user, 'assets', asset])
	return send_file(path)


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


@bp.route('/api/callback')
def callback():
	print("ACCESS TOKEN FROM GITEA")
	print(request.values['code'])
	return f'TOKEN {request.values["code"]}<script>alert("{request.values["code"]}")</script>'

# https://git.anagora.org/login/oauth/authorize?client_id=f88fe801-c51b-456e-ac20-2a967555cec0&redirect_uri=http://localhost:5000/api/callback&response_type=code