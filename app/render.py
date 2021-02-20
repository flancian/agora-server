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
from . import util 
from marko import Markdown, inline
from orgpython import to_html


# Markdown
class WikilinkElement(inline.InlineElement):
    pattern = r'\[\[ *(.+?) *\]\]'
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


# Twitter embeds.
def add_twitter_embeds(content):
    TWITTER_REGEX='(https://twitter.com/\w+/status/[0-9]+)'
    TWITTER_EMBED='<blockquote class="twitter-tweet" data-dnt="true" data-theme="dark"><a href="\\1"></blockquote><script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>'
    return re.sub(TWITTER_REGEX, TWITTER_EMBED, content)

# Trim front matter until we do something useful with it.
def trim_front_matter(content):
    FRONT_MATTER_REGEX = '---(\n.*)*---'
    return re.sub(FRONT_MATTER_REGEX, '', content, flags=re.MULTILINE)


# "Pipeline"
preprocess = trim_front_matter
postprocess = add_twitter_embeds
