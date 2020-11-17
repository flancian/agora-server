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
from flask import Blueprint, url_for, render_template, current_app, Response, redirect
from markupsafe import escape
from . import config
from . import db
from . import forms
bp = Blueprint('agora', __name__)


@bp.route('/')
def index():
    return render_template('index.html', version=config.AGORA_VERSION, help=url_for('agora.help'), nodes=url_for('agora.nodes'), subnodes=url_for('agora.subnodes'), users=url_for('agora.users'), journals=url_for('agora.journals'), search=url_for('agora.search'), latest=url_for('agora.latest'))

@bp.route('/help')
def help():
    current_app.logger.warning('Not implemented.')
    return 'If I had implemented help already, here you\'d see documentation on all URL endpoints. For now, please refer to the <a href="https://flancia.org/go/agora">code</a>.'

@bp.route('/nodes')
def nodes():
    return render_template('nodes.html', nodes=db.all_nodes(include_journals=False))

@bp.route('/notes') # alias
@bp.route('/subnodes')
def subnodes():
    return render_template('subnodes.html', subnodes=db.all_subnodes())

@bp.route('/latest')
def latest():
    return render_template('subnodes.html', header="Latest", subnodes=db.latest())

@bp.route('/users')
def users():
    return render_template('users.html', users=db.all_users())

@bp.route('/journals')
def journals():
    return render_template('nodes.html', header="Journals", nodes=db.all_journals())

@bp.route('/today')
def today():
    today = datetime.datetime.now().date()
    return redirect("https://anagora.org/node/%s" % today.strftime("%Y-%m-%d"))

@bp.route('/u/<user>')
@bp.route('/user/<user>')
@bp.route('/@<user>')
def user(user):
    return render_template('user.html', user=user, readmes=db.user_readmes(user), subnodes=db.subnodes_by_user(user))

@bp.route('/garden/<garden>')
def garden(garden):
    current_app.logger.warning('Not implemented.')
    return 'If I had implemented rendering gardens already, here you would see garden named "%s".' % escape(garden)

@bp.route('/node/<node>')
@bp.route('/wikilink/<node>') # alias for now
def wikilink(node):
    return render_template('node_rendered.html', wikilink=node, subnodes=db.subnodes_by_wikilink(node), backlinks=db.subnodes_by_outlink(node))

@bp.route('/subnode/<path:subnode>')
def subnode(subnode):
    return render_template('subnode_rendered.html', subnode=db.subnode_by_uri(subnode), backlinks=db.subnodes_by_outlink(subnode))

# Searching with GET: potentially useful but probably not a good idea.
# @bp.route('/search/<query>')
# def search(query):
#    return render_template('subnodes.html', subnodes=db.search_subnodes(query))

@bp.route('/search', methods=('GET', 'POST'))
def search():
    form = forms.SearchForm()
    if form.validate_on_submit():
        return render_template('search.html', form=form, subnodes=db.search_subnodes(form.query.data))
    return render_template('search.html', form=form)

@bp.route('/asset/<user>/<asset>')
def asset(user, asset):
    # An asset is a binary in someone's garden/<user>/assets directory.
    # Currently unused.
    path = '/'.join(["garden", user, 'assets', asset])
    return current_app.send_static_file(path)

@bp.route('/raw/<node>')
def raw(node):
    # Currently unused.
    # hack hack
    # outlinks
    return Response("\n\n".join([str(n.outlinks) for n in db.nodes_by_wikilink(node)]), mimetype="text/plain")
    # content
    # return Response("\n\n".join([n.content for n in db.nodes_by_wikilink(node)]), mimetype="text/plain")

@bp.route('/backlinks/<node>')
def backlinks(node):
    # Currently unused.
    return render_template('nodes.html', nodes=db.nodes_by_outlink(node))
