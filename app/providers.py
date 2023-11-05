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
#
# The [[agora]] models search as an open market of providers (who bid content for each query) and users (who are interested in media of any type which is relevant within a given [[context]], which maps to a query).

from collections import namedtuple
from dataclasses import dataclass
from enum import Enum
from flask import current_app, redirect, url_for
from typing import Sequence
from uuid import uuid4
import urllib.parse

from . import util


class FloatEnum(float, Enum):
    pass


class Confidence(FloatEnum):
    # intended to be a float 0 .. 1
    null = 0.0
    low = 0.1
    default = 0.5
    high = 0.9
    inf = 1.0


# Cannot use order=True because natural ordering breaks when a member is a callable.
@dataclass()
class Bid:
    confidence: Confidence = Confidence.null
    proposal: callable = False
    message: str = ""

    def __lt__(self, other):
        return self.confidence < other.confidence


def get_bids(q: str, tokens: Sequence[str] = []) -> Sequence[Bid]:

    # conceptually a list of tuples (confidence, proposal), but actually a list of data classes currently. unsure if this is idiomatic.
    bids = []
    for provider in PROVIDERS:
        bids.append(provider(q, tokens))
    return bids  # unranked; sort to rank


def go(q, tokens):
    if tokens[0] == "go" and len(tokens) > 1:
        return Bid(
            Confidence.high,
            lambda: redirect(
                url_for("agora.go", node=util.slugify(" ".join(tokens[1:])))
            ),
            "Follow go link",
        )
    else:
        return Bid(Confidence.null, lambda: False)

    # add logic for:
    #    if there is indeed a go link in the destination
    #        return (0.9, )
    #    if there is not:
    #        return (False, 0.0)


def tw(q, tokens):
    # performs a twitter search
    if tokens[0] == "tw":
        # I miss pattern matching. Which pattern should I use here?
        # TODO: check out if the new 'case' fits.
        if len(tokens) == 2:
            search = "%20".join(tokens[2:])
            return Bid(
                Confidence.high,
                lambda: redirect(f"https://twitter.com/search/?f=live&q={search}"),
                "Twitter search",
            )
        if len(tokens) > 2:
            user = tokens[1]
            search = "%20".join(tokens[2:])
            return Bid(
                Confidence.high,
                lambda: redirect(
                    f"https://twitter.com/search/?f=live&q=from%3A{user}%20{search}"
                ),
                "Twitter search",
            )

    else:
        return Bid(Confidence.null, lambda: False)


def yubnub(q, tokens):
    yubnub_tokens = [
        "wp",  # wikipedia
        "am",  # amazon (us)
        "amde",  # amazon (de)
        "tpb",  # the pirate bay
        "hdl",  # libgen
        "lbn",  # libgen
        "yt",  # youtube
        "spotify",  # spotify
        "goog",  # google
        "g",  # google
        "ddg",  # ddg
        "imdb",  # imdb
        "mdn",  # developer.mozilla.org
        "academia",  # academia.edu
    ]

    if tokens[0] in yubnub_tokens and len(tokens) > 1:
        return Bid(
            Confidence.high,
            lambda: redirect(f"https://yubnub.org/parser/parse?command={q}"),
            "Yubnub command",
        )
    else:
        return Bid(Confidence.null, lambda: False)


def node(q, tokens):
    # This will always bid to show an [[agora]] node, even if "empty" (there is no check for content at this point).
    # This serves as a "constructive 404" in case nothing else beats it.
    return Bid(
        Confidence.default,
        lambda: redirect(url_for("agora.root", node=q)),
        "Agora node",
    )


PROVIDERS = [
    node,
    go,
    tw,
    yubnub,
]
