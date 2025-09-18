#!/usr/bin/env python3
# Copyright 2021 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.  # You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import glob
import itertools
import os
from feedgen.feed import FeedGenerator
from flask import current_app
import feedparser
import pprint
import urllib.parse
from ..graph import G

HYPOTHESIS_USERS = {
    "flancian": "flancian",
    "diegodlh": "diegodlh",
}

HYPOTHESIS_TAGS = ["[[byzantine emperors]]"]

MASTODON_USERS = {
    "flancian": "flancian",
    "diegodlh": "diegodlh",
}


def get_user_feeds():
    feeds = {}
    for agora_user, hypothesis_user in HYPOTHESIS_USERS.items():
        feeds[agora_user] = feedparser.parse(
            f"https://hypothes.is/stream.atom?user={hypothesis_user}"
        )
    return feeds


def get_tag_feeds():
    feeds = []
    for tag in HYPOTHESIS_TAGS:
        tag = urllib.parse.quote_plus(tag)
        url = f"https://hypothes.is/stream.atom?tags={tag}"
        feeds.append(feedparser.parse(url))
    return feeds


def get_by_uri(uri):
    feed = False
    uri = urllib.parse.quote_plus(uri)
    url = f"https://hypothes.is/stream.atom?uri={uri}"
    try:
        feed = feedparser.parse(url)
    except UnicodeEncodeError:
        pass
    return feed


def get_latest():
    feed = False
    uri = "anagora.org/*"
    url = f"https://hypothes.is/stream.atom?wildcard_uri={uri}"
    try:
        feed = feedparser.parse(url)
    except (UnicodeEncodeError, urllib.error.URLError):
        current_app.logger.exception(f"Couldn't get annotations in feed.get_latest().")
    return feed


def node_rss(node):
    fg = FeedGenerator()
    # not sure what this field is for
    fg.id(f"https://anagora.org/{node.wikilink}.rss")
    fg.title(f"Agora feed for node [[{node.wikilink}]]")
    fg.author({"name": "anagora.org users", "email": "anagora@flancia.org"})
    fg.logo("https://anagora.org/favicon.ico")
    fg.subtitle("The Agora is a crowdsourced distributed knowledge graph.")
    fg.link(href=f"https://anagora.org/{node.wikilink}", rel="self")
    fg.language("en")
    for subnode in node.subnodes:
        fe = fg.add_entry()
        fe.id(f"{subnode.uri}")
        fe.title(f"{subnode.uri}")
        fe.content(f"{subnode.content}")
        fe.description(f"A post by user @{subnode.user} in node [[{subnode.node}]].")
        fe.link(href=f"https://anagora.org/@{subnode.user}/{subnode.node}")
    return fg.rss_str(pretty=True)


def latest_rss(subnodes):
    fg = FeedGenerator()
    URL_BASE = current_app.config.get("URL_BASE", "https://anagora.org")
    # not sure what this field is for
    fg.id(f"{URL_BASE}/feed/latest")
    fg.title(f"Agora feed for latest updates")
    fg.author({"name": "anagora.org users", "email": "anagora@flancia.org"})
    fg.logo(f"{URL_BASE}/favicon.ico")
    fg.subtitle("The Agora is a crowdsourced distributed knowledge graph.")
    fg.link(href=f"{URL_BASE}/feed/latest", rel="self")
    fg.language("en")
    for subnode_light in subnodes:
        # Re-hydrate the lightweight subnode from the cache into a full object
        # to ensure we have access to its content.
        try:
            subnode = next(s for s in G.subnodes() if s.uri == subnode_light.uri)
        except StopIteration:
            # Should not happen, but as a safeguard...
            continue

        fe = fg.add_entry()
        fe.id(f"{URL_BASE}/{subnode.uri}")
        fe.title(subnode.wikilink)
        fe.link(href=f"{URL_BASE}/{subnode.uri}")
        # there is no render function here because we are in storage.
        # probably this means we should move this function to a different place.
        # fe.content(f'{render.markdown(subnode.content)}', type='html')
        fe.content(f"{subnode.content}")
        fe.author({"name": subnode.user, "email": "agora@flancia.org"})
        fe.updated(subnode.datetime.isoformat() + "Z")

    return fg.rss_str(pretty=True)


def user_rss(user, subnodes):
    fg = FeedGenerator()
    # not sure what this field is for
    fg.id(f"https://anagora.org/feed/@{user}.rss")
    fg.title(f"Agora feed for user @{user}")
    fg.author({"name": "anagora.org/@{user}", "email": "anagora@flancia.org"})
    fg.logo("https://anagora.org/favicon.ico")
    fg.subtitle("The Agora is a crowdsourced distributed knowledge graph.")
    fg.link(href=f"https://anagora.org/feed/@{user}", rel="self")
    fg.language("en")
    for subnode in subnodes:
        fe = fg.add_entry()
        fe.id(f"{subnode.uri}")
        fe.title(f"{subnode.uri}")
        fe.content(f"{subnode.content}")
        fe.description(f"A post by user @{user} in node [[{subnode.node}]].")
        fe.link(href=f"https://anagora.org/@{user}/{subnode.node}")
    return fg.rss_str(pretty=True)


def main():
    if DEBUG:
        feeds = get_user_feeds()
        # for user, feed in feeds.items():
        #    for item in feed.entries:
        #        print(f'user: {user}')
        #        pprint.pprint(item)
        #        print('***\n')

        feeds = get_tag_feeds()
        for item in feeds:
            pprint.pprint(item)
            print("***\n")
    else:
        api.update_status(phrase)


if __name__ == "__main__":
    main()
