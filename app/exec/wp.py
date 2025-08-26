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


@bp.route("/exec/wp/<node>")
def wp(node):
    headers = {
        'User-Agent': 'Agora-Server/1.0 (https://anagora.org/; mailto:0@flancia.org)'
    }
    try:
        search = requests.get(
            f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={node}&format=json",
            headers=headers
        )
        search.raise_for_status()  # Raise an exception for bad status codes (4xx or 5xx)
        search_response = search.json()
    except requests.exceptions.RequestException as e:
        return f"<div class='subnode'>Could not connect to Wikipedia: {e}</div>"
    except requests.exceptions.JSONDecodeError:
        return f"<div class='subnode'>Wikipedia returned an invalid response.</div>"

    search_results = search_response.get("query", {}).get("search", [])

    if not search_results:
        return f"<div class='subnode'>No Wikipedia article found for '{node}'.</div>"

    pageid = search_results[0]["pageid"]
    
    try:
        result_response = requests.get(
            f"https://en.wikipedia.org/w/api.php?action=query&pageids={pageid}&prop=extlinks|info|pageprops&inprop=url&ppprop=wikibase_item&format=json",
            headers=headers
        )
        result_response.raise_for_status()
        result = result_response.json()
    except requests.exceptions.RequestException as e:
        return Response(f"<!-- Could not connect to Wikipedia: {e} -->", mimetype="text/html")
    except requests.exceptions.JSONDecodeError:
        return Response("<!-- Wikipedia returned an invalid response. -->", mimetype="text/html")

    search_results = search_response.get("query", {}).get("search", [])

    if not search_results:
        return Response("", mimetype="text/html")

    pageid = search_results[0]["pageid"]
    
    try:
        result_response = requests.get(
            f"https://en.wikipedia.org/w/api.php?action=query&pageids={pageid}&prop=extlinks|info|pageprops&inprop=url&ppprop=wikibase_item&format=json",
            headers=headers
        )
        result_response.raise_for_status()
        result = result_response.json()
    except requests.exceptions.RequestException as e:
        return Response(f"<!-- Could not connect to Wikipedia for pageid {pageid}: {e} -->", mimetype="text/html")
    except requests.exceptions.JSONDecodeError:
        return Response(f"<!-- Couldn't parse Wikipedia response for pageid {pageid}. -->", mimetype="text/html")

    pages = result.get("query", {}).get("pages", {})
    page_data = pages.get(str(pageid))

    if not page_data:
        return Response(f"<!-- Could not retrieve page data for pageid {pageid} from Wikipedia. -->", mimetype="text/html")

    title = page_data.get("title", "Unknown Title")
    url = page_data.get("canonicalurl", "")
    pageprops = page_data.get("pageprops", {})
    wikibase_item = pageprops.get("wikibase_item")
    wikidata_url = f"https://www.wikidata.org/wiki/{wikibase_item}"
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
        <details class='exec wiki-search web wikipedia'>
        <summary class="{summary_class}"><span>

        <strong title="We love Wikipedia! Here is the top known article for this location.">
        📖 Wikipedia </strong> <em><a href='{url}' target="_blank">{title}</em></a></span>
        {leading} </summary> 

        <div class="info-box with-spacing" style="margin-bottom: 10px;" info-box-id="wp">
            <span class="genai-header"><em>This is the top ranked article in English-language <strong>Wikipedia</strong> for your search.</em></span>
            <span id="dismiss-wp" info-box-id="wp" class="dismiss-button">x</span>
        </div>

        <!-- find a better way to present this data which is only useful for some users. -->
        <!-- 
        &nbsp &nbsp ↳ Wikidata <a href='{wikidata_url}'>{wikibase_item}</a>
        <button class='pull-exec wd' value='{wikidata_url}'>pull</button><br />
        <button class='pull-exec ag' value='/{inferred_node}'>pull</button>-->
        <!--{result}-->

        <iframe id="exec-wp" src={url} style="max-width: 99.5%;" width="99.5%" height="700em" allowfullscreen="allowfullscreen"></iframe>
        </details>
        """,
        mimetype="text/html",
    )
