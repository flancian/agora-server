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
from urllib.parse import urlparse

parser = DateDataParser(languages=['en'])


def rank(l, user):
    # hack hack
    return sorted(l, key=lambda x: x.user)


def is_valid_url(url):
    # from https://stackoverflow.com/a/36283503
    try:
        tokens = urlparse(url)
        min_attributes = ('scheme', 'netloc')
        return all([getattr(tokens, qualifying_attr)
                    for qualifying_attr in min_attributes])
    except AttributeError:
        return False


def uprank(l, users):
    # hack hack
    # score is a sorting order; lower comes first.
    def score(n):
        score = 0
        if n.user in users:
            # the earlier in the list a user comes, the more highly ranked it is.
            score = users.index(n.user) - len(users) - 1
        return score

    return sorted(l, key=score)


def similar(l, term):
    return [n.wikilink for n in l if n.wikilink.startswith(term)]


def filter(l, projection):
    # hack hack
    return [n for n in l if n.user == projection]


@lru_cache(maxsize=None)
def canonical_date(wikilink):
    # this is best effort, returns the wikilink for non-dates (check before you use).
    try:
        date = parser.get_date_data(wikilink, date_formats=[
                                    '%Y-%m-%d', '%Y_%m_%d', '%Y%m%d']).date_obj
        return date.isoformat().split("T")[0]
    except AttributeError:
        return wikilink


@lru_cache(maxsize=1)  # memoize this
def get_combined_date_regex():
    date_regexes = [
        # iso format, lax
        '[0-9]{4}.?[0-9]{2}.?[0-9]{2}',
        # week format
        '[0-9]{4}-W',
        # roam format (what a monstrosity!)
        # '(January|February|March|April|May|June|July|August|September|October|November|December) [0-9]{1,2}(st|nd|th), [0-9]{4}',
        # roam format (after filename sanitization)
        # '(january|february|march|april|may|june|july|august|september|october|november|december)-[0-9]{1,2}(st|nd|th)-[0-9]{4}',
    ]

    # combine all the date regexes into one super regex
    # TODO: it'd really be better to compile this regex once rather than on
    # each request, but as the knuth would say premature optimization is the
    # root of all evil, etc. etc.
    return f'^({"|".join(date_regexes)})'
