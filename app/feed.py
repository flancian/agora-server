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
import feedparser
import pprint

HYPOTHESIS_USERS = {
        'flancian': 'flancian',
        'diegodlh': 'diegodlh',
        }

HYPOTHESIS_TAGS = ['[[byzantine emperors]]']

MASTODON_USERS = {
        'flancian': 'flancian',
        'diegodlh': 'diegodlh',
        }

def get_user_feeds():
    feeds = {}
    for agora_user, hypothesis_user in HYPOTHESIS_USERS.items():
        feeds[agora_user] = feedparser.parse(f'https://hypothes.is/stream.atom?user={hypothesis_user}')
    return feeds

def get_tag_feeds():
    import urllib.parse
    feeds = []
    for tag in HYPOTHESIS_TAGS:
        tag = urllib.parse.quote_plus(tag)
        url = f'https://hypothes.is/stream.atom?tags={tag}'
        print(url)
        feeds.append(feedparser.parse(url))
    return feeds

def get_by_uri(uri):
    url = f'https://hypothes.is/stream.atom?uri={uri}'
    feed = feedparser.parse(url)
    return feed

def get_latest():
    uri = 'anagora.org/*'
    url = f'https://hypothes.is/stream.atom?wildcard_uri={uri}'
    feed = feedparser.parse(url)
    return feed

def main():
    if DEBUG:
        feeds = get_user_feeds()
        #for user, feed in feeds.items():
        #    for item in feed.entries:
        #        print(f'user: {user}')
        #        pprint.pprint(item)
        #        print('***\n')
                
        feeds = get_tag_feeds()
        for item in feeds:
            pprint.pprint(item)
            print('***\n')
    else:
        api.update_status(phrase)


if __name__ == "__main__":
    main()
