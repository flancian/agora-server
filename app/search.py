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

from collections import namedtuple
from dataclasses import dataclass
from enum import Enum

Bid = namedtuple('Bid', 'confidence proposal')

class Confidence(Enum):
    # intended to be a float 0 .. 1
    null = 0
    low = 0.1
    default = 0.5
    high = 0.9
    inf = 1

@dataclass
class Bid:
    confidence: Confidence
    proposal: callable

PROVIDERS = [
        node, 
        go
        ]

def get_bids(q: str, tokens: list[str] = []) -> list[Bid]:

    # a list of tuples (confidence, proposal)
    bids = []
    for provider in PROVIDERS:
        bid += provider(q, tokens)
    return bids # unranked; sort to rank

def go(q, tokens):
    if tokens[0] == 'go' and len(tokens) > 1:
        return Bid(Confidence.high, lambda x: redirect(url_for('.go', node=util.slugify(" ".join(tokens[1:])))))
    else:
        return Bid(Confidence.low, lambda x: False)
    # add logic for:
    #    if there is indeed a go link in the destination
    #        return (0.9, )
    #    if there is not:
    #        return (False, 0.0)


def node(q, tokens):
    return (some_function, 0.1)
    return Bid(Confidence.default, lambda x: redirect(url_for('.go', node=util.slugify(" ".join(tokens[1:])))))
