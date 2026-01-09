# Agora Server Cache

This document outlines the caching mechanisms used in the Agora Server, primarily focusing on the SQLite database.

## Indexing Strategy: On-Demand / Lazy Indexing

To ensure the index is always up-to-date without requiring a slow, separate worker process, the Agora Server uses an **on-demand** (or "lazy") indexing strategy.

When a subnode (file) is accessed during a user request, the server performs a quick check:
1.  It compares the file's current modification time (`mtime`) on the filesystem with the `mtime` stored in the `subnodes` table.
2.  If the file is new or has been modified, the server immediately re-indexes that single file.
3.  This process involves updating the relevant rows in the `subnodes`, `links`, and `node_links` tables.

This ensures that any content being actively viewed is always fresh in the index, distributing the indexing load into small, instantaneous operations instead of a large, slow batch job.

## SQLite Database Schema & Review (as of 2025-09-19)

The database acts as a **cache and index** to speed up operations that would otherwise require expensive filesystem reads across many small files. This is a very effective and appropriate use of SQLite in this context. The schema is generally simple, clear, and fit for this purpose.

### Table-by-Table Breakdown

-   **`subnodes`**: The core index. It maps a subnode's file `path` to its key metadata (`user`, parent `node`, `mtime`), allowing the application to quickly find subnodes without scanning the filesystem.

-   **`links`**: Stores the graph's edges at the most granular level. It maps which subnode (`source_path`) links to which node (`target_node`). This is critical for performance, as it makes calculating backlinks an efficient database query instead of a slow file-parsing operation.

-   **`node_links`**: A performance optimization table that stores direct, pre-aggregated node-to-node relationships.
    -   **Schema**: `(source_node TEXT, target_node TEXT)`
    -   **Purpose**: Instead of calculating node-level links by running a `DISTINCT` query on the larger `links` table every time, this table provides a fast, pre-computed lookup for high-level graph operations. It is updated automatically whenever a subnode is re-indexed.

-   **`starred_subnodes`**: A simple list of subnode URIs that have been starred. As of this writing, this is a global list.

-   **`ai_generations`**, **`query_cache`**, **`graph_cache`**: These are general-purpose key-value cache tables with timestamps, used to store the results of expensive operations like AI provider calls (`ai_generations`) or repeated queries (`query_cache`, `graph_cache`).

-   **`cache_events`**: A logging table to track cache performance (hits, misses, errors, timings), which is excellent for diagnostics.

## Database Location

The SQLite database file is located at **`agora.db`** within the configured `AGORA_PATH`.
-   **Production/Alpha**: Typically `/home/agora/agora/agora.db` (or `/home/flancian/agora/agora.db` depending on the user).
-   **Local Development**: Typically `~/agora/agora.db` or constructed by the `setup.sh` script.

The server does *not* store the database in the git repository (`agora-server/`) to avoid coupling code and state.

### Recommendations

1.  **Add Indexes for Faster Lookups**: Queries on non-primary-key columns can be slow. Adding indexes to the following columns would significantly improve performance, especially for nodes with many backlinks and for user pages.
    ```sql
    CREATE INDEX IF NOT EXISTS idx_links_target_node ON links(target_node);
    CREATE INDEX IF NOT EXISTS idx_subnodes_user ON subnodes(user);
    CREATE INDEX IF NOT EXISTS idx_subnodes_node ON subnodes(node);
    ```

2.  **(Future) Per-User Starring**: The current `starred_subnodes` table is global. To support per-user starring in the future, the schema could be altered to include a `user` column and a composite primary key.
    ```sql
    CREATE TABLE starred_subnodes (
        subnode_uri TEXT NOT NULL,
        user TEXT NOT NULL,
        PRIMARY KEY (subnode_uri, user)
    );
    ```

## In-Memory Graph Architecture (Monolithic Mode)

*Added: Jan 2026*

When running with `ENABLE_LAZY_LOAD = False` (default for Production/Alpha), the Agora loads the **entire graph** into memory on worker startup.

### Memory Optimization: Object Deduplication
With ~100k+ subnodes, Python object overhead is significant. To prevent OOM (Out of Memory) errors, `app/graph.py` enforces **Object Deduplication**:

1.  **Single Source of Truth**: `_get_all_subnodes_cached` creates the `Subnode` objects.
2.  **Shared References**: When `_get_all_nodes_cached` builds `Node` objects, it **must not** instantiate new `Subnode` objects. Instead, it looks up the existing instances from the subnode cache.
3.  **Impact**: This cuts memory usage by ~50% (e.g., from 3.0GB down to 1.2GB per worker).

**Critical Invariant**:
`id(G.node('foo').subnodes[0])` MUST EQUAL `id(G.subnode('path/to/foo.md'))`.
*Do not refactor `graph.py` to decouple these caches without understanding this memory impact.*

### Unbounded Caches
Avoid using `@lru_cache(maxsize=None)` on utility functions (like `is_journal`) that take arbitrary strings/paths as input. In a long-running process, this is a memory leak. Use `cachetools.TTLCache` or bounded LRU.
