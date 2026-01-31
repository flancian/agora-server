# Copyright 2025 Google LLC
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

import os
import time
import json
from flask import current_app
import app.storage.file_engine as file_engine
import app.storage.sqlite_engine as sqlite_engine
# Import the canonical Graph object 'G' directly.
from app.graph import G, Node as NodeClass, User as UserClass, Subnode as SubnodeClass

# The file engine is always the source of truth.
# The sqlite engine is a cache.

def _is_sqlite_enabled():
    """Checks if the SQLite engine is enabled in the config."""
    return current_app.config.get('ENABLE_SQLITE', False)

def build_node(title):
    """
    Builds a node.
    If SQLite is enabled, it will be used as a cache.
    The file engine is always used as the source of truth.
    """
    # For now, we only cache/index backlinks.
    # Other node properties are still calculated on the fly.
    # This function is a template for how to cache other properties in the future.
    node = file_engine.build_node(title)

    if _is_sqlite_enabled():
        # Let's try to get backlinks from the index.
        # This is a read-only operation, so it's safe.
        indexed_backlinks = sqlite_engine.get_backlinking_nodes(node.uri)
        # Here you could merge or replace the file-based backlinks
        # For now, we'll just log that we have them.
        if indexed_backlinks:
            current_app.logger.debug(f"Got {len(indexed_backlinks)} backlinks for [[{title}]] from SQLite index.")
            # In a full implementation, you would replace node.back_links with these.
            # For example: node.back_links = indexed_backlinks

    # The write-through caching happens within the Graph object methods,
    # specifically when subnodes are accessed, to ensure freshness.
    return node

def build_multinode(node0, node1):
    # This function is complex and for now will remain file-based.
    return file_engine.build_multinode(node0, node1)

def Graph():
    """
    Returns the canonical Graph object for the application.
    """
    return G

def Node(node_uri):
    """
    Returns a Node object.
    The Node object will handle on-demand caching when its properties are accessed.
    """
    return NodeClass(node_uri)

def subnode_by_uri(uri):
    # This is a direct lookup, no complex caching logic needed here yet.
    return file_engine.subnode_by_uri(uri)

def random_node():
    if _is_sqlite_enabled():
        wikilink = sqlite_engine.get_random_node()
        if wikilink:
            # We return a lightweight Node object.
            # Properties will be lazy-loaded if accessed.
            return NodeClass(wikilink)
    return file_engine.random_node()

def all_journals():
    # The caching logic below was found to be faulty, causing FileNotFoundErrors.
    # It assumes that the journals are Nodes and tries to reconstruct Subnodes from Node URIs.
    # Disabling for now to restore functionality.
    # TODO: Implement a correct caching strategy for all_journals, likely by caching
    # a list of dictionaries with full subnode paths and mediatypes.
    # if _is_sqlite_enabled():
    #     cache_key = 'all_journals'
    #     ttl = current_app.config['QUERY_CACHE_TTL'].get('all_journals', 3600)
    #     cached_value, timestamp = sqlite_engine.get_cached_query(cache_key)

    #     if cached_value and (time.time() - timestamp < ttl):
    #         current_app.logger.info(f"CACHE HIT (sqlite): Using cached data for all_journals.")
    #         # The result is a list of Subnode objects. We cache the URIs and reconstruct.
    #         # The Subnode constructor is cheap enough for this purpose.
    #         subnode_uris = json.loads(cached_value)
    #         return [SubnodeClass(uri) for uri in subnode_uris]

    #     current_app.logger.info(f"CACHE MISS (sqlite): Recomputing all_journals.")
    #     journals = file_engine.all_journals()
    #     # Extract URIs for serialization.
    #     subnode_uris = [j.uri for j in journals]
    #     sqlite_engine.save_cached_query(cache_key, json.dumps(subnode_uris), time.time())
    #     return journals
    # else:
    return file_engine.all_journals()

def all_users():
    if _is_sqlite_enabled():
        cache_key = 'all_users'
        ttl = current_app.config['QUERY_CACHE_TTL'].get(cache_key, 3600)
        cached_value, timestamp = sqlite_engine.get_cached_query(cache_key)
        
        if cached_value and (time.time() - timestamp < ttl):
            current_app.logger.info(f"CACHE HIT (sqlite): Using cached data for all_users.")
            # The result is a list of User objects, which can't be directly JSON serialized.
            # We cache the usernames and reconstruct the objects. The User constructor is cheap.
            usernames = json.loads(cached_value)
            return [UserClass(u) for u in usernames]

        current_app.logger.info(f"CACHE MISS (sqlite): Recomputing all_users.")
        users = file_engine.all_users()
        # Extract usernames for serialization.
        usernames = [u.uri for u in users]
        sqlite_engine.save_cached_query(cache_key, json.dumps(usernames), time.time())
        return users
    else:
        return file_engine.all_users()

def User(username):
    # User objects are built from subnodes, so the caching will happen there.
    return UserClass(username)

def user_readmes(username):
    return file_engine.user_readmes(username)

def subnodes_by_user(username, sort_by="mtime", mediatype=None, reverse=True):
    # This is a core function that could be cached.
    # For now, it remains file-based.
    return file_engine.subnodes_by_user(username, sort_by, mediatype, reverse)

def search_subnodes(query, mode='exact'):
    # mode: 'exact' (FTS phrase), 'broad' (FTS stemmed), 'fs' (filesystem)
    
    if mode != 'fs' and _is_sqlite_enabled() and current_app.config.get('ENABLE_FTS', False):
        start_time = time.time()
        paths = sqlite_engine.search_subnodes_fts(query, mode=mode)
        if paths:
            current_app.logger.info(f"FTS search ({mode}) for '{query}' found {len(paths)} results in {time.time() - start_time:.4f}s.")
            # Convert paths to Subnode objects.
            # The paths in DB are relative to AGORA_PATH (e.g. garden/user/node.md).
            agora_path = current_app.config['AGORA_PATH']
            subnodes = []
            for relative_path in paths:
                absolute_path = os.path.join(agora_path, relative_path)
                # We assume standard text subnodes for search results for now.
                # Ideally we'd store/retrieve mediatype from DB.
                subnodes.append(SubnodeClass(absolute_path))
            return subnodes
        else:
            current_app.logger.info(f"FTS search ({mode}) for '{query}' found 0 results.")
            # If broad search found nothing, return empty.
            # If exact search found nothing, maybe we could auto-fallback? 
            # For now let the UI handle fallbacks.
            return []

    return file_engine.search_subnodes(query)

def search_subnodes_by_user(query, username):
    return file_engine.search_subnodes_by_user(query, username)

def latest(max):
    if _is_sqlite_enabled():
        cache_key = f'latest_{max}' # Changed key to v2 to invalidate old cache.
        ttl = current_app.config['QUERY_CACHE_TTL'].get('latest', 3600)
        cached_value, timestamp = sqlite_engine.get_cached_query(cache_key)

        if cached_value and (time.time() - timestamp < ttl):
            current_app.logger.info(f"CACHE HIT (sqlite): Using cached data for latest.")
            cached_data = json.loads(cached_value)
            subnodes = []
            for item in cached_data:
                # Reconstruct a lightweight subnode object from the cached data
                s = SubnodeClass.__new__(SubnodeClass)
                s.uri = item['uri']
                s.user = item['user']
                s.wikilink = item['wikilink']
                s.mtime = item['mtime']
                subnodes.append(s)
            return subnodes

        current_app.logger.info(f"CACHE MISS (sqlite): Recomputing latest from SQLite index.")
        results = sqlite_engine.get_latest_subnodes(max)
        subnodes = []
        data_to_cache = []
        for item in results:
            s = SubnodeClass.__new__(SubnodeClass)
            s.uri = item['path']
            s.user = item['user']
            s.wikilink = item['node']
            s.mtime = item['mtime']
            subnodes.append(s)
            data_to_cache.append({'uri': s.uri, 'user': s.user, 'wikilink': s.wikilink, 'mtime': s.mtime})

        sqlite_engine.save_cached_query(cache_key, json.dumps(data_to_cache), time.time())
        return subnodes
    else:
        return file_engine.latest(max)

def top():
    if _is_sqlite_enabled():
        cache_key = 'top' # Changed key to v2 to invalidate old cache.
        ttl = current_app.config['QUERY_CACHE_TTL'].get(cache_key, 3600)
        cached_value, timestamp = sqlite_engine.get_cached_query(cache_key)

        if cached_value and (time.time() - timestamp < ttl):
            current_app.logger.info(f"CACHE HIT (sqlite): Using cached data for top.")
            cached_data = json.loads(cached_value)
            nodes = []
            for item in cached_data:
                # Reconstruct a lightweight node object from the cached data
                n = NodeClass.__new__(NodeClass)
                n.uri = item['uri']
                n.wikilink = item['wikilink']
                n.url = f"/node/{item['uri']}"
                # Attach a function that returns the cached size
                n.size = lambda s=item['size']: s
                nodes.append(n)
            return nodes

        current_app.logger.info(f"CACHE MISS (sqlite): Recomputing top.")
        nodes = file_engine.top()
        # Cache all the data needed to reconstruct the object without file I/O
        data_to_cache = [
            {'uri': n.uri, 'wikilink': n.wikilink, 'size': n.size()}
            for n in nodes
        ]
        sqlite_engine.save_cached_query(cache_key, json.dumps(data_to_cache), time.time())
        return nodes
    else:
        return file_engine.top()

def stats():
    return file_engine.stats()

def subnodes_by_outlink(node):
    return file_engine.subnodes_by_outlink(node)

def nodes_by_outlink(node):
    if _is_sqlite_enabled():
        # TODO: Implement full caching for this if needed.
        # For now, we can try to use the SQLite index if it's a simple backlink lookup.
        # But file_engine.nodes_by_outlink does complex logic with G.nodes().
        # Let's stick to file_engine for correctness for now, or use sqlite_engine.get_backlinking_nodes?
        # get_backlinking_nodes returns URIs, not Node objects.
        # The file_engine version returns Node objects.
        # Let's stick to file_engine to be safe and consistent with the object type expected.
        pass
    return file_engine.nodes_by_outlink(node)

def user_journals(username):
    return file_engine.user_journals(username)