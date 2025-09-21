# Agora Server Cache

This document outlines the caching mechanisms used in the Agora Server, primarily focusing on the SQLite database.

## SQLite Database Schema & Review (as of 2025-09-19)

The database acts as a **cache and index** to speed up operations that would otherwise require expensive filesystem reads across many small files. This is a very effective and appropriate use of SQLite in this context. The schema is generally simple, clear, and fit for this purpose.

### Table-by-Table Breakdown

-   **`subnodes`**: The core index. It maps a subnode's file `path` to its key metadata (`user`, parent `node`, `mtime`), allowing the application to quickly find subnodes without scanning the filesystem.

-   **`links`**: Stores the graph's edges. It maps which subnode (`source_path`) links to which node (`target_node`). This is critical for performance, as it makes calculating backlinks an efficient database query instead of a slow file-parsing operation. The `source_node` column is used to speed up queries that need the source node's name without parsing it from the path.

-   **`starred_subnodes`**: A simple list of subnode URIs that have been starred. As of this writing, this is a global list.

-   **`ai_generations`**, **`query_cache`**, **`graph_cache`**: These are general-purpose key-value cache tables with timestamps, used to store the results of expensive operations like AI provider calls (`ai_generations`) or repeated queries (`query_cache`, `graph_cache`).

-   **`cache_events`**: A logging table to track cache performance (hits, misses, errors, timings), which is excellent for diagnostics.

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