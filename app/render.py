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
from marko.ext.gfm import gfm
from marko.ext.footnote import Footnote
from orgpython import to_html

# we add and then remove this from detected Tiddlylinks to opt out from default Marko rendering.
# pretty dirty but it works (tm) and prevents an excursion deeper into Marko.
TIDDLYHACK = ' TIDDLYLINK'

# Markdown
class WikilinkElement(inline.InlineElement):
    # is this regexes pattern a good idea?
    pattern = regexes.WIKILINK.pattern
    parse_children = True

    def __init__(self, match):
        self.target = match.group(1)

class WikilinkRendererMixin(object):

    # This name is magic; it must match render_<class_name_in_snake_case>.
    def render_wikilink_element(self, element):
        if '|' in element.target:
            first, second = element.target.split('|')
            target = util.canonical_wikilink(first.rstrip())
            label = second.lstrip()
            return f'<span class="wikilink-marker">[[</span><a href="{target}" title="[[{element.target}]]" class="wikilink">{label}</a><span class="wikilink-marker">]]</span>'
        else:
            target = util.canonical_wikilink(element.target)
            label = self.render_children(element)
            return f'<span class="wikilink-marker">[[</span><a href="{target}" title="[[{element.target}]]"class="wikilink">{label}</a><span class="wikilink-marker">]]</span>'

class TiddlylinkElement(inline.InlineElement):
    # is this regexes pattern a good idea?
    pattern = regexes.TIDDLYLINK.pattern

    def __init__(self, match):
        self.anchor = match.group(1)
        self.target = match.group(2).replace(TIDDLYHACK, '')

class TiddlylinkRendererMixin(object):

    # This name is magic; it must match render_<class_name_in_snake_case>.
    def render_tiddlylink_element(self, element):
        return '<span class="wikilink-marker">[[</span><a href="{}" class="wikilink">{}</a><span class="wikilink-marker">]]</span>'.format(
            util.canonical_wikilink(element.target), element.anchor
        )

class HashtagElement(inline.InlineElement):
    # is this regexes pattern a good idea?
    pattern = regexes.HASHTAG.pattern
    parse_children = True

    def __init__(self, match):
        self.target = match.group(1)

class HashtagRendererMixin(object):

    # This name is magic; it must match render_<class_name_in_snake_case>.
    def render_hashtag_element(self, element):
        # return '<span class="wikilink-marker">[[</span><a href="{}">{}</a><span class="wikilink-marker">]]</span>'.format(
        return '<span class="hashtag-marker">#</span><a href="{}" class="wikilink">{}</a><span class="hashtag-marker"></span>'.format(
            # util.canonical_wikilink(self.escape_url(element.target)), self.render_children(element)
            util.canonical_wikilink(element.target), self.render_children(element)
        )

class Wikilinks():
    elements = [WikilinkElement, TiddlylinkElement, HashtagElement]
    renderer_mixins = [WikilinkRendererMixin, TiddlylinkRendererMixin, HashtagRendererMixin]


markdown = gfm
markdown.use(Wikilinks, Footnote)


# Org-mode -- simple but, well, bad for now.
orgmode = to_html


# Embeds.
# The *application* of this pattern could perhaps be here instead of in... hmm, db.py? Yeah, that doesn't make sense.
# TODO: [[refactor]].

# Twitter embeds.
# Now disabled, we prefer to embed client side.
def add_twitter_embeds(content, subnode):
    TWITTER_REGEX='(https://twitter.com/\w+/status/[0-9]+)'
    TWITTER_EMBED='<blockquote class="twitter-tweet" data-dnt="true" data-theme="dark"><a href="\\1"></blockquote><script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>'
    return re.sub(TWITTER_REGEX, TWITTER_EMBED, content)

def add_twitter_pull(content, subnode):
    # negative lookbehind tries to only match twitter links not preceded by a ", which would be there if the URL is being used as part of an <a href="..."> tag (adding an embed in that case using regexes would break the link).
    # https://www.regular-expressions.info/lookaround.html if you're wondering how this works.
    if 'subnode/virtual' in subnode.url:
        # trouble at the mill.
        # virtual subnodes are prerendered by virtue of how they are generated (from the final html)
        # they should be "pre cooked".
        return content 

    TWITTER_REGEX=r'(?<!")(https://twitter.com/\w+/status/[0-9]+)'
    TWITTER_EMBED=r'\1 // <button class="pull-tweet" value=\1>pull</button>'
    return re.sub(TWITTER_REGEX, TWITTER_EMBED, content)

def add_mastodon_pull(content, subnode):
    # hack: negative lookbehind tries to only match for anchors not preceded by a span... just because in the agora we have 
    # spans just preceding every anchor that is a wikilink.
    if re.search(r'(?<!</span>)<a href', content):
        # don't apply filters when content has html links that are not result of a wikilink.
        # this works around a bug in some org mode translated files we have.
        return content
    MASTODON_REGEX='(https://[a-zA-Z-.]+/web/statuses/[0-9]+)'
    MASTODON_REGEX_ALT='(https://[a-zA-Z-.]+/@\w+/[0-9]+)'
    MASTODON_EMBED='\\1 <button class="pull-mastodon-status" value="\\1">pull</button>'
    ret = re.sub(MASTODON_REGEX, MASTODON_EMBED, content)
    ret = re.sub(MASTODON_REGEX_ALT, MASTODON_EMBED, ret)
    return ret

def add_pleroma_pull(content, subnode):
    # hack: negative lookbehind tries to only match for anchors not preceded by a span... just because in the agora we have 
    # spans just preceding every anchor that is a wikilink.
    if re.search(r'(?<!</span>)<a href', content):
        # don't apply filters when content has html links that are not result of a wikilink.
        # this works around a bug in some org mode translated files we have.
        return content
    PLEROMA_REGEX='(https://[a-zA-Z-.]+/notice/\w+)'
    PLEROMA_EMBED='\\1 <button class="pull-pleroma-status" value="\\1">pull</button>'
    ret = re.sub(PLEROMA_REGEX, PLEROMA_EMBED, content)
    return ret

def old_add_url_pull(content, subnode):
    # deprecated in favour of arbitrary url pulling.
    # writer side signals like [[pull]] in subnodes should be interpreted as a petition to [[auto pull]].
    URL_REGEX='(\[\[pull\]\]) (.+:\/\/.+)'
    URL_EMBED='<button class="pull-url" value="\\2">pull</button> \\2'
    ret = re.sub(URL_REGEX, URL_EMBED, content)
    return ret

def add_url_pull(content, subnode):
    # hacky but, hey, it seems to work often enough and covers wikipedia + wikidata.
    # https://stackoverflow.com/questions/3809401/what-is-a-good-regular-expression-to-match-a-url
    # -> https://regexr.com/3e6m0
    # 'http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*'

    # URL_REGEX='(\[\[go\]\]) (.+:\/\/.+)'
    # @(https?|ftp)://(-\.)?([^\s/?\.#-]+\.?)+(/[^\s]*)?$@iS
    # URL_REGEX='(https?:\/\/([^s/?\<>]+wiki.+)'
    # URL_REGEX="^[a-z0-9!#$%&'-*+\/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?"
    # URL_REGEX='http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*'
    # 
    # some explanations are in order for the regex below :)
    # (?<!\( at the beginning of the regex is a negative lookbehind that makes it not match for URLs immediately 
    # following a parenthesis. This prevents the pull from triggering for Markdown links, e.g. [text](target).
    # \S+ just means any non-whitespace character.
    # (wiki|...|flancia) is just an allowlist of strings in the URL that make it likely to be embeddable (accept iframes).
    # [^\s/]* at the beginning makes it so that these strings are only matched in the domain part of the URL 
    # (so e.g. twitter.com/flancian doesn't match).  makes sense as iframe policies are usually per-domain.
    # if you don't understand this *or* think you could do it better at no great cost please reach out to [[flancian]] :)
    URL_REGEX='((?<!\()https?:\/\/[^\s/]*(wiki|anagora|doc|pad|flancia)\S+[^\s.,:;])'
    URL_EMBED='\\1 <button class="pull-url" value="\\1">pull</button>'

    ret = re.sub(URL_REGEX, URL_EMBED, content)
    # hack hack -- "fixes" pulling for markdown style links, e.g. [text](anchor).
    # but would break actual articles that start with ()
    ret = ret.replace(')"', '"')
    return ret

def add_go_button(content, subnode):
    URL_REGEX='(\[\[go\]\]) (.+:\/\/.+)'
    URL_EMBED='<button class="go-url" value="\\2">go</button> \\2'
    ret = re.sub(URL_REGEX, URL_EMBED, content)
    return ret

# Trim front matter until we do something useful with it.
def trim_front_matter(content, subnode):
    FRONT_MATTER_REGEX = '---(\n.*)*---'
    return re.sub(FRONT_MATTER_REGEX, '', content, flags=re.MULTILINE)

# Trim obsidian block anchors until we do something useful with them.
def trim_block_anchors(content, subnode):
    BLOCK_ANCHOR_REGEX = r'\^[0-9-]+$'
    return re.sub(BLOCK_ANCHOR_REGEX, '', content, flags=re.MULTILINE)

# Trim liquid templates (Jekyll stuff) until we do something useful with them.
def trim_liquid(content, subnode):
    LIQUID_REGEX = r'{%.*?%}'
    return re.sub(LIQUID_REGEX, '<em>(Unsupported content elided by the Agora.)</em>', content, flags=re.MULTILINE)

# Trim margin notes (Jekyll stuff).
def trim_margin_notes(content, subnode):
    MARGIN_NOTES_REGEX = r'\[\[[^\]]*?::...\]\]'
    return re.sub(MARGIN_NOTES_REGEX, '', content, flags=re.MULTILINE)


# Make it so that Tiddlylinks (links of the form [foo](#bar), wish octothorpe) aren't handled by 
# [foo](bar) standard Markdown link parsing in Marko.
def force_tiddlylink_parsing(content, subnode):
    return re.sub(regexes.TIDDLYLINK.pattern, fr'[\1](#\2{TIDDLYHACK})', content, flags=re.MULTILINE)

# def content_to_obsidian_embeds(content):
#    match = regexes.WIKILINKS.findall(content)
#    if match:
#        # Work around broken forward links due to org mode convention I didn't think of.
#        # TODO: make link parsing format-aware.
#        return [util.canonical_wikilink(m) for m in match if '][' not in m]
#    else:
#        return []

# Obsidian pasted images / attachments.
def add_obsidian_embeds(content, subnode):
    OBSIDIAN_REGEX = re.compile('!' + regexes.WIKILINK.pattern)
    OBSIDIAN_EMBED=f'<a href="/raw/garden/{subnode.user}/\\1"><img class="image-embed" src="/raw/garden/{subnode.user}/\\1"></img><p class="obsidian-embed"></a>⥅ [[\\1]]</p>'
    # also include something like this to move to a lazily loaded div?
    #<script async src="https://anagora.org.com/widgets.js" charset="utf-8"></script>
    return re.sub(OBSIDIAN_REGEX, OBSIDIAN_EMBED, content)

def preprocess(content, subnode=''):
    filters = [trim_front_matter, trim_block_anchors, force_tiddlylink_parsing, trim_liquid, trim_margin_notes, add_obsidian_embeds, add_url_pull, add_twitter_pull]
    for f in filters:
        content = f(content, subnode)
    return content

def postprocess(content, subnode=''):
    # filters = [add_twitter_embeds]
    filters = [add_mastodon_pull, add_pleroma_pull]
    for f in filters:
        content = f(content, subnode)
    return content
