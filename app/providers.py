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
import time
import functools

from . import util
from .storage import sqlite_engine
import google.generativeai as genai
from mistralai.client import MistralClient
from mistralai.models.chat_completion import ChatMessage


def cache_ai_generation(provider_func):
    """
    Decorator to cache the results of AI generation functions in SQLite.
    """
    @functools.wraps(provider_func)
    def wrapper(prompt):
        provider_name = provider_func.__name__.split('_')[0] # e.g., 'gemini' from 'gemini_complete'

        if not current_app.config.get('ENABLE_SQLITE'):
            return provider_func(prompt)

        ttl = current_app.config.get('SQLITE_CACHE_TTL', {}).get('ai_generation', 0)
        if ttl <= 0:
            return provider_func(prompt)

        cached_content, timestamp = sqlite_engine.get_ai_generation(prompt, provider_name)

        if cached_content and (time.time() - timestamp) < ttl:
            current_app.logger.info(f"AI Cache: HIT for '{prompt[:30]}...' with provider {provider_name}.")
            return cached_content
        
        current_app.logger.info(f"AI Cache: MISS for '{prompt[:30]}...' with provider {provider_name}.")
        new_content = provider_func(prompt)
        
        # Only cache successful responses, not error messages.
        if "error" not in new_content.lower() and "not properly set up" not in new_content.lower():
            sqlite_engine.save_ai_generation(prompt, provider_name, new_content, int(time.time()))
        
        return new_content
    return wrapper


@cache_ai_generation
def gemini_complete(prompt):
    if current_app.config["ENABLE_AI"]:
        api_key = current_app.config["GEMINI_API_KEY"]
        if not api_key:
            return "[[GenAI]] is not properly set up for Gemini in this Agora yet. Please set the GEMINI_API_KEY environment variable to a valid API key."

        genai.configure(api_key=api_key)
        # Updated to a more recent model, as seen in other parts of the code.
        model = genai.GenerativeModel('gemini-2.5-flash')

        enriched_prompt = current_app.config['AI_PROMPT'] + prompt
        
        try:
            response = model.generate_content(enriched_prompt)
            return response.text
        except Exception as e:
            return f"An error occurred with the Gemini API: {e}"
    else:
        return "<em>This Agora is not AI-enabled yet</em>."

@cache_ai_generation
def mistral_complete(prompt):
    if current_app.config["ENABLE_AI"]:
        api_key = current_app.config["MISTRAL_API_KEY"]
        if not api_key:
            return "[[GenAI]] is not properly set up for Mistral in this Agora yet. Please set the MISTRAL_API_KEY environment variable to a valid API key."

        client = MistralClient(api_key=api_key)
        enriched_prompt = current_app.config['AI_PROMPT'] + prompt
        messages = [
            ChatMessage(role="user", content=enriched_prompt)
        ]

        try:
            # model="mistral-small-latest" was seen in logs.
            chat_response = client.chat(
                model="mistral-small-latest",
                messages=messages,
            )
            return chat_response.choices[0].message.content
        except Exception as e:
            return f"An error occurred with the Mistral API: {e}"
    else:
        return "<em>This Agora is not AI-enabled yet</em>."



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
                url_for("agora.go", node=util.canonical_wikilink(" ".join(tokens[1:])))
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
