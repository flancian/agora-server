# Copyright 2022 Google LLC
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

from . import bp, Response
import requests
import pprint

# As of [[2022-09-29]] unfinished/unused.
@bp.route('/exec/nav/<node>')
def nav(node):
    return Response(f"""
        <div class='exec topline-nav'>
        <strong><- previous </strong><a href='{url}'>{url}</a> 
        <strong>next → </strong><a href='{url}'>{url}</a> 
        </div>""", 
        mimetype='text/html'
    )
