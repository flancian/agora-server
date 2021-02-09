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
from slugify import slugify, SLUG_OK
from . import config
from . import db
from . import forms
from . import util

bp = Blueprint('agora', __name__)
G = db.G

# Special
@bp.route('/index')
@bp.route('/')
def index():
    return redirect(url_for('.node', node='index'))

@bp.route('/help')
def help():
    current_app.logger.warning('Not implemented.')
    return 'If I had implemented help already, here you\'d see documentation on all URL endpoints. For now, please refer to the <a href="https://flancia.org/go/agora">code</a>.'

@bp.route('/Δ')
@bp.route('/delta')
@bp.route('/latest')
def latest():
    return render_template('subnodes.html', header="Latest", subnodes=db.latest())

@bp.route('/today')
def today():
    today = datetime.datetime.now().date()
    return redirect("https://anagora.org/node/%s" % today.strftime("%Y-%m-%d"))

@bp.route('/oldsearch', methods=('GET', 'POST'))
def oldsearch():
    """deprecated in favour of jump-like search"""
    form = forms.SearchForm()
    if form.validate_on_submit():
        return render_template('search.html', form=form, subnodes=db.search_subnodes(form.query.data))
    return render_template('search.html', form=form)

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
# Likely equivalent to [default action](https://anagora.org/node/default-action)
@bp.route('/go/<node0>/<node1>')
def composite_go(node0, node1):
    """Redirects to the URL in the given node in a block that starts with [[<action>]], if there is one."""
    # TODO(flancian): all node-scoped stuff should move to actually use node objects.
    # TODO(flancian): make [[go]] call this?
    try:
        n0 = db.nodes_by_wikilink(node0)
    except KeyError:
        return redirect("https://anagora.org/node/%s" % node0)
    try:
        n1 = db.nodes_by_wikilink(node1)
    except KeyError:
        return redirect("https://anagora.org/node/%s" % node1)

    if len(n0) == 0 and len(n1) == 0:
        # No nodes with this name.
        # Redirect to composite node, which might exist and provides search.
        return redirect(f'https://anagora.org/node/{node0}-{node1}')

    links = []
    if len(n0) != 0:
        links.extend(n0[0].filter(node1))

    if len(n1) != 0:
        links.extend(n1[0].filter(node0))

    if len(links) == 0:
        # No matching links found.
        # Redirect to composite node, which might exist and provides search.
        # TODO(flancian): flash an explanation :)
        return redirect(f'https://anagora.org/node/{node0}-{node1}')

    if len(links) > 1:
        # TODO(flancian): to be implemented.
        # Likely default to one of the links, show all of them but redirect to default within n seconds.
        current_app.logger.warning('Code to manage nodes with more than one go link is not Not implemented.')

    return redirect(links[0])

@bp.route('/push/<node>/<other>')
def push(node, other):
    n = G.node(node)
    o = G.node(other)
    pushing = n.pushing(o)

    return Response(pushing)


@bp.route('/exec')
@bp.route('/search')
@bp.route('/jump')
def jump():
    """Redirects to a context; in "jump" mode, a node *always* exists (nodes map one to one to all possible queries)."""
    q = request.args.get('q')
    tokens = q.split(" ")
    # hack hack
    if tokens[0] == 'go' and len(tokens) > 1:
        return redirect(url_for('.go', node=slugify(q[3:])))
    return redirect(url_for('.node', node=slugify(q)))

# Entities
@bp.route('/wikilink/<node>')
@bp.route('/node/<node>')
@bp.route('/node/<node>/uprank/<user_list>')
def node(node,user_list=""):
    default_rank = ['agora', 'flancian']
    rank = user_list.split(",")
    if len(rank) == 0:
        rank = default_rank
    n = G.node(node)
    if n.subnodes:
        # earlier in the list means more highly ranked.
        print("rank", rank)
        n.subnodes = util.uprank(n.subnodes, users=rank)
        permutations = []
    # if it's a 404, include permutations.
    else:
        permutations = G.existing_permutations(node)

    search_subnodes = db.search_subnodes(node)

    return render_template(
            'node_rendered.html', 
            node=n,
            backlinks=n.back_links(),
            pull_nodes=n.pull_nodes() if n.subnodes else permutations,
            forwardlinks=n.forward_links() if n else [],
            search=search_subnodes,
            pulling_nodes=n.pulling_nodes(),
            pushing_nodes=n.pushing_nodes(),
            query=n.wikilink.replace('-', '%20')
            )

@bp.route('/node/<node>.json')
@bp.route('/node/<node>/uprank/<user_list>.json')
def node_json(node,user_list=""):
    default_rank = ['agora', 'flancian']
    rank = user_list.split(",")
    if len(rank) == 0:
        rank = default_rank
    n = G.node(node)
    if n.subnodes:
        # earlier in the list means more highly ranked.
        print("rank", rank)
        n.subnodes = util.uprank(n.subnodes, users=rank)
        permutations = []
    # if it's a 404, include permutations.
    else:
        permutations = G.existing_permutations(node)

    search_subnodes = db.search_subnodes(node)

    return jsons.dump({"node": n, "back_links": n.back_links(), "pull_nodes": n.pull_nodes()})
    # return render_template(
    #         'node_rendered.html', 
    #         node=n,
    #         backlinks=n.back_links(),
    #         pull_nodes=n.pull_nodes() if n.subnodes else permutations,
    #         forwardlinks=n.forward_links() if n else [],
    #         search=search_subnodes,
    #         pulling_nodes=n.pulling_nodes(),
    #         pushing_nodes=n.pushing_nodes(),
    #         query=n.wikilink.replace('-', '%20')
    #         )

@bp.route('/node/<node>@<user>')
@bp.route('/node/@<user>/<node>')
@bp.route('/@<user>/<node>')
def subnode(node, user):

    n = G.node(node)

    n.subnodes = util.filter(n.subnodes, user)
    n.subnodes = util.uprank(n.subnodes, user)
    search_subnodes = db.search_subnodes_by_user(node, user)

    return render_template(
            'subnode_rendered.html', 
            node=n,
            )


@bp.route('/subnode/<path:subnode>')
def old_subnode(subnode):
    return render_template('subnode_rendered.html', subnode=db.subnode_by_uri(subnode), backlinks=db.subnodes_by_outlink(subnode))

@bp.route('/u/<user>')
@bp.route('/user/<user>')
@bp.route('/node/@<user>')  # so that [[@flancian]] works.
@bp.route('/@<user>')
def user(user):
    return render_template('user.html', user=user, readmes=db.user_readmes(user), subnodes=db.subnodes_by_user(user))

@bp.route('/user/<user>.json')
def user_json(user):
    return jsons.dump({"user": user, "subnodes": db.subnodes_by_user(user)})

@bp.route('/garden/<garden>')
def garden(garden):
    current_app.logger.warning('Not implemented.')
    return 'If I had implemented rendering gardens already, here you would see garden named "%s".' % escape(garden)


# Lists
@bp.route('/nodes')
def nodes():
    return render_template('nodes.html', nodes=G.nodes(include_journals=False))

@bp.route('/nodes.json')
def nodes_json():
    return jsonify(jsons.dump(G.nodes(include_journals=False)))

@bp.route('/notes') # alias
@bp.route('/subnodes')
def subnodes():
    return render_template('subnodes.html', subnodes=G.subnodes())

@bp.route('/@')
@bp.route('/users')
def users():
    return render_template('users.html', users=db.all_users())

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
