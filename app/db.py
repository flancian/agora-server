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

import glob
import re
import os
from . import config
from operator import attrgetter

RE_WIKILINKS = re.compile('\[\[(.*?)\]\]')

class Node:
    def __init__(self, path):
        self.dir = path_to_url(path)
        self.wikilink = path_to_wikilink(path)
        self.url = '/node/' + self.wikilink
        with open(path) as f:
            self.content = f.read()
        self.outlinks = content_to_outlinks(self.content)

def path_to_url(path):
    return path.replace(config.AGORA_PATH + '/', '')

def path_to_wikilink(path):
    return os.path.splitext(os.path.basename(path))[0]

def content_to_outlinks(content):
    # hack hack.
    match = RE_WIKILINKS.findall(content)
    if match:
        return [m.lower().replace(' ', '-').replace('\'', '').replace(',', '') for m in match]
    else:
        return []

def all_nodes():
    l = sorted([f for f in glob.glob(os.path.join(config.AGORA_PATH, '**/*.md'), recursive=True)])
    return [Node(f) for f in l]

def all_journals():
    # hack hack.
    l = sorted([f for f in glob.glob(os.path.join(config.AGORA_PATH, '**/????-??-??.md'), recursive=True)])
    return sorted([Node(f) for f in l], key=attrgetter('wikilink'), reverse=True)

def nodes_by_wikilink(wikilink):
    nodes = [node for node in all_nodes() if node.wikilink == wikilink]
    return nodes

def nodes_by_outlink(wikilink):
    nodes = [node for node in all_nodes() if wikilink in node.outlinks]
    return nodes
