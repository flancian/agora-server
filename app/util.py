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
import re
from dateparser import DateDataParser
from functools import lru_cache

parser = DateDataParser(languages=['en'])

def rank(l, user):
    # hack hack
    return sorted(l, key=lambda x: x.user)

def uprank(l, users):
    # hack hack
    def score(n):
        if n.user in users:
            # the earlier in the list a user comes, the more highly ranked it is.
            return users.index(n.user) - len(users) - 1
        return 0
            
    return sorted(l, key=score) 

def filter(l, projection):
    # hack hack
    return [n for n in l if n.user == projection]

def canonical_wikilink(wikilink):

    if is_journal(wikilink):
        try:
            wikilink = canonical_date(wikilink)
        except:
            # TODO: if we add logging, maybe log that we couldn't parse a date here
            pass

    # hack hack
    wikilink = (
        wikilink.lower()
        # chars that convert to -, slug-like.
        .replace(' ', '-')
        .replace('/', '-')
        .replace('\'', '')
        # chars that are elided.
        .replace('%', '')
        .replace(',', '')
    )
    return wikilink


@lru_cache(maxsize=None)
def canonical_date(wikilink):
    date = parser.get_date_data(wikilink).date_obj
    try:
        wikilink = date.isoformat().split("T")[0]
    except:
        pass

    return wikilink


@lru_cache(maxsize=1)  #memoize this
def get_combined_date_regex():
    date_regexes = [
        # iso format
        '[0-9]{4}-[0-9]{2}-[0-9]{2}',
        # roam format (what a monstrosity!)
        '(January|February|March|April|May|June|July|August|September|October|November|December) [0-9]{1,2}(st|nd|th), [0-9]{4}',
        # roam format (after filename sanitization)
        '(january|february|march|april|may|june|july|august|september|october|november|december)-[0-9]{1,2}(st|nd|th)-[0-9]{4}',
    ]

    # combine all the date regexes into one super regex
    # TODO: it'd really be better to compile this regex once rather than on
    # each request, but as the knuth would say premature optimization is the
    # root of all evil, etc. etc.
    return re.compile(f'^({"|".join(date_regexes)})$')


@lru_cache(maxsize=None)
def is_journal(wikilink):
    return get_combined_date_regex().match(wikilink)
