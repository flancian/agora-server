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

import re

# pattern: 
# - regexes are always compiled
#   - .pattern attribute if you want the raw string.
WIKILINK = re.compile(r'\[\[ *(.+?) *\]\]')

# These are of the form: [text to show](#page to link to)
TIDDLYLINK = re.compile(r'\[([^\]]+?)\]\(#([^\)]+?)\)', re.MULTILINE)

# TODO: move action extractor regex here as well.
# is this the best way?
ACTION_2 = re.compile(r'\[\[(.*?)\]\]\s*\[\[(.*?)\]\]')

