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
    # score is a sorting order; lower comes first.
    def score(n):
        score = 0
        if n.user in users:
            # the earlier in the list a user comes, the more highly ranked it is.
            score = users.index(n.user) - len(users) - 1
        if n.mediatype != 'text/plain':
            # try *downranking* images again; it makes nodes more readable as the text subnodes usually contain the title of the node in a leading position.
            score += 0.01
        return score
            
    return sorted(l, key=score) 

def similar(l, term):
    return [n.wikilink for n in l if n.wikilink.startswith(term)]

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
        .strip()
        # we replace a bunch of non-slug characters with -, then replace all runs of - with a single -.
        # we don't want to just s#/#-# because that breaks action handling (which looks like foo/bar/baz, and we want to keep intact for path-based handlers)
        .replace("/ ", '-')
        .replace(" /", '-')
        # the following ones could be a regex
        .replace(' ', '-')
        # this seemed to make sense but I found it too limiting. it makes the following lossy:
        # - example.tld
        # - filename.ext
        # .replace('.', '-')
        .replace('\'', '-')
        .replace('%', '-')
        .replace('.', '-')
        .replace(',', '-')
        .replace(':', '-')
        .replace("\'", '-')
        .replace("+", '-')
    )
    wikilink = re.sub('-+', '-', wikilink)
    return wikilink


slugify = canonical_wikilink


@lru_cache(maxsize=None)
def canonical_date(wikilink):
    # this is best effort, returns the wikilink for non-dates (check before you use).
    try:
        date = parser.get_date_data(wikilink, date_formats=['%Y-%m-%d', '%Y_%m_%d', '%Y%m%d']).date_obj
        return date.isoformat().split("T")[0]
    except AttributeError:
        return wikilink


@lru_cache(maxsize=1)  #memoize this
def get_combined_date_regex():
    date_regexes = [
        # iso format, lax
        '[0-9]{4}.?[0-9]{2}.?[0-9]{2}',
        # week format
        '[0-9]{4}-W',
        # roam format (what a monstrosity!)
        '(January|February|March|April|May|June|July|August|September|October|November|December) [0-9]{1,2}(st|nd|th), [0-9]{4}',
        # roam format (after filename sanitization)
        '(january|february|march|april|may|june|july|august|september|october|november|december)-[0-9]{1,2}(st|nd|th)-[0-9]{4}',
    ]

    # combine all the date regexes into one super regex
    # TODO: it'd really be better to compile this regex once rather than on
    # each request, but as the knuth would say premature optimization is the
    # root of all evil, etc. etc.
    return re.compile(f'^({"|".join(date_regexes)})')


@lru_cache(maxsize=None)
def is_journal(wikilink):
    return get_combined_date_regex().match(wikilink)
