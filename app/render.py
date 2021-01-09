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


# Org-mode goes here.
