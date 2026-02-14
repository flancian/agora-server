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
import pprint
from thefuzz import fuzz


@bp.route("/exec/wt/<node>")
def wt(node):
    try:
        search = requests.get(
            f"https://en.wiktionary.org/w/api.php?action=query&list=search&srsearch={node}&format=json",
            headers={"User-Agent": "The Agora of Flancia (https://anagora.org/)"},
            timeout=5
        )
        search.raise_for_status()  # Raise an exception for bad status codes
        search_data = search.json()
        
        if not search_data.get("query", {}).get("search"):
            return Response("") # No search results found

        pageid = search_data["query"]["search"][0]["pageid"]
    except (requests.exceptions.RequestException, ValueError, IndexError, KeyError) as e:
        # This catches network errors, JSON decoding errors, or unexpected structure.
        current_app.logger.error(f"Wiktionary search failed for '{node}': {e}")
        return Response("")

    try:
        result_response = requests.get(
            f"https://en.wiktionary.org/w/api.php?action=query&pageids={pageid}&prop=extlinks|info|pageprops&inprop=url&format=json",
            headers={"User-Agent": "The Agora of Flancia (https://anagora.org/)"},
            timeout=5
        )
        result_response.raise_for_status()
        result = result_response.json()

        page = result.get("query", {}).get("pages", {}).get(str(pageid), {})
        if not page:
            return Response("") # Page data not found

        title = page.get("title", node)
        url = page.get("canonicalurl", f"https://en.wiktionary.org/wiki/{node}")

    except (requests.exceptions.RequestException, ValueError, KeyError) as e:
        current_app.logger.error(f"Wiktionary page load failed for pageid '{pageid}': {e}")
        return Response(f"<!-- Error loading wiktionary page for {node} -->")
        
    inferred_node = title.replace("_", "-")

    # MAGIC :)
    # if fuzz.ratio(title, node) > 60:
    #     summary_class = "autopull"
    # else:
    #     summary_class = "noautopull"

    summary_class = "noautopull"

    if inferred_node.lower() != node.lower(): 
        leading = f"leading to node <span class='wikilink-marker'>[[</span><a href='/{inferred_node}'>{title}</a><span class='wikilink-marker'>]]</span>"
    else:
        # Exact match, skip leading.
        leading = ""
        # Optionall autopull for exact matches. This should probably be an Agora setting :)
        # summary_class = "autopull"

    return Response(
        f"""
        <!-- adding stoa gets this the right css for the 'done' state as of the time of writing -->
        <details class='exec wiktionary-search web'>
        <summary class="{summary_class}"><span>
        <strong title="We love Wiktionary! Here is an entry hopefully relevant for this location.">
        📖 Wiktionary entry </strong> <em><a href='{url}'>{title}</em></a></span>
        {leading} </summary> 

        <!-- find a better way to present this data which is only useful for some users. -->
        <!-- 
        <button class='pull-exec ag' value='/{inferred_node}'>pull</button>-->
        <!--{result}-->

        <iframe id="exec-wt" src={url} style="max-width: 99.5%;" width="99.5%" height="700em" allowfullscreen="allowfullscreen"></iframe>
        </details>
        """,
        mimetype="text/html",
    )
