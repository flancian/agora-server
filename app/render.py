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

#
# This file contains renderers from the supported input formats.
# As of [[2020-01-09]]:
# - markdown
# - orgmode

import re
from . import config
from . import regexes
from . import util 
from marko import Markdown, inline
from orgpython import to_html


# Markdown
class WikilinkElement(inline.InlineElement):
    pattern = regexes.WIKILINK.pattern
    parse_children = True

    def __init__(self, match):
        self.target = match.group(1)

class WikilinkRendererMixin(object):

    # This name is magic; it must match render_<class_name_in_snake_case>.
    def render_wikilink_element(self, element):
        return '<span class="wikilink-marker">[[</span><a href="{}">{}</a><span class="wikilink-marker">]]</span>'.format(
            # util.canonical_wikilink(self.escape_url(element.target)), self.render_children(element)
            util.canonical_wikilink(element.target), self.render_children(element)
        )

class Wikilinks():
    elements = [WikilinkElement]
    renderer_mixins = [WikilinkRendererMixin]

markdown = Markdown(extensions=[Wikilinks])


# Org-mode -- simple but, well, bad for now.
orgmode = to_html


# Embeds.
# The *application* of this pattern could perhaps be here instead of in... hmm, db.py? Yeah, that doesn't make sense.
# TODO: [[refactor]].

# Twitter embeds.
def add_twitter_embeds(content):
    TWITTER_REGEX='(https://twitter.com/\w+/status/[0-9]+)'
    TWITTER_EMBED='<blockquote class="twitter-tweet" data-dnt="true" data-theme="dark"><a href="\\1"></blockquote><script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>'
    return re.sub(TWITTER_REGEX, TWITTER_EMBED, content)

# Trim front matter until we do something useful with it.
def trim_front_matter(content):
    FRONT_MATTER_REGEX = '---(\n.*)*---'
    return re.sub(FRONT_MATTER_REGEX, '', content, flags=re.MULTILINE)

#def content_to_obsidian_embeds(content):
#    match = regexes.WIKILINKS.findall(content)
#    if match:
#        # Work around broken forward links due to org mode convention I didn't think of.
#        # TODO: make link parsing format-aware.
#        return [util.canonical_wikilink(m) for m in match if '][' not in m]
#    else:
#        return []

# Obsidian pasted images / attachments.
def add_obsidian_embeds(content):
    OBSIDIAN_REGEX = re.compile('!' + regexes.WIKILINK.pattern)
    OBSIDIAN_EMBED='<img class="image-embed" src="https://anagora.org/raw/garden/flancian/\\1"></img><p class="obsidian-embed">from [[\\1]]</p>'
    # also include something like this to move to a lazily loaded div?
    #<script async src="https://anagora.org.com/widgets.js" charset="utf-8"></script>
    return re.sub(OBSIDIAN_REGEX, OBSIDIAN_EMBED, content)

def preprocess(content):
    filters = [trim_front_matter, add_obsidian_embeds]
    for f in filters:
        content = f(content)
    return content

def postprocess(content):
    filters = [add_twitter_embeds]
    for f in filters:
        content = f(content)
    return content

