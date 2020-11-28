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

def canonical_wikilink(wikilink):
    # hack hack
    wikilink = (
        wikilink.lower()
        .replace(' ', '-')
        .replace('\'', '')
        .replace(',', '')
        .replace('/', '-')
    )
    return wikilink


def is_journal(wikilink):
    date_regexes = [
        # iso format
        '[0-9]{4}-[0-9]{2}-[0-9]{2}',
        # roam format (what a monstrosity!)
        '(January|February|March|April|May|June|July|August|September|October|November|December) [0-9]{1,2}(st|nd|th), [0-9]{4}',
        # roam format (sanitzed for filenames)
        '(january|february|march|april|may|june|july|august|september|october|november|december)-[0-9]{1,2}(st|nd|th)-[0-9]{4}',
    ]

    # combine all the date regexes into one super regex
    combined_date_regex = re.compile(f'^({"|".join(date_regexes)})$')

    return combined_date_regex.match(wikilink)
