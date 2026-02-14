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

from . import bp, Response
import requests
from flask import render_template

@bp.route("/exec/wp/<node>")
def wp(node):
    headers = {
        'User-Agent': 'Agora-Server/1.0 (https://anagora.org/; mailto:0@flancian.org)'
    }

    # Fetch Wikipedia data
    try:
        search_response = requests.get(
            f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={node}&format=json",
            headers=headers,
            timeout=5
        ).json()
        search_results = search_response.get("query", {}).get("search", [])
        if not search_results:
            wp_data = None
        else:
            pageid = search_results[0]["pageid"]
            result_response = requests.get(
                f"https://en.wikipedia.org/w/api.php?action=query&pageids={pageid}&prop=extlinks|info|pageprops&inprop=url&ppprop=wikibase_item&format=json",
                headers=headers,
                timeout=5
            ).json()
            pages = result_response.get("query", {}).get("pages", {})
            wp_data = pages.get(str(pageid))
    except (requests.exceptions.RequestException, ValueError):
        wp_data = None

    # Fetch Wiktionary data
    try:
        search_response = requests.get(
            f"https://en.wiktionary.org/w/api.php?action=query&list=search&srsearch={node}&format=json",
            headers=headers,
            timeout=5
        ).json()
        search_results = search_response.get("query", {}).get("search", [])
        if not search_results:
            wt_data = None
        else:
            pageid = search_results[0]["pageid"]
            result_response = requests.get(
                f"https://en.wiktionary.org/w/api.php?action=query&pageids={pageid}&prop=info&inprop=url&format=json",
                headers=headers,
                timeout=5
            ).json()
            pages = result_response.get("query", {}).get("pages", {})
            wt_data = pages.get(str(pageid))
    except (requests.exceptions.RequestException, ValueError):
        wt_data = None

    return render_template("wp_wt.html", node=node, wp_data=wp_data, wt_data=wt_data)

