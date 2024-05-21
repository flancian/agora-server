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
    search = requests.get(
        f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={node}&format=json"
    )
    try:
        pageid = search.json()["query"]["search"][0]["pageid"]
    except IndexError:
        return Response("")
    result = requests.get(
        f"https://en.wikipedia.org/w/api.php?action=query&pageids={pageid}&prop=extlinks|info|pageprops&inprop=url&ppprop=wikibase_item&format=json"
    ).json()
    title = result["query"]["pages"][str(pageid)]["title"]
    url = result["query"]["pages"][str(pageid)]["canonicalurl"]
    wikibase_item = result["query"]["pages"][str(pageid)]["pageprops"]["wikibase_item"]
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
        <details class='exec wiki-search stoa'>
        <summary class="{summary_class}"><span>
        <strong title="We love Wikipedia! Here is the top known article for this location.">
        📖 Wikipedia article</strong> <em><a href='{url}'>{title}</em></a></span>
        {leading} </summary> 

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
