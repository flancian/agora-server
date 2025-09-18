# Agora Caching Architecture

This document outlines the multi-layered caching strategy used by the Agora server to ensure high performance and responsiveness, particularly for large, distributed knowledge graphs.

## Two-Tier Caching Model

The Agora employs a two-tier caching model to balance speed, persistence, and data consistency. The filesystem is always the ultimate source of truth, but live user requests are served from caches whenever possible.

### L1: In-Memory Cache (`cachetools`)

*   **What it is**: A fast, in-process cache that stores fully deserialized Python objects (`Node`, `Subnode`, etc.).
*   **Purpose**: To provide near-instantaneous data access for requests handled by a worker process that has already loaded the graph. This is the fastest possible path.
*   **Lifecycle**: The cache is populated on the first request a worker serves (the "cache warming" process). It is completely cleared whenever the application is restarted or reloaded.
*   **Log Signature**: `CACHE HIT (in-memory)`

### L2: Persistent Cache (SQLite)

*   **What it is**: A SQLite database (`instance/agora.db`) that stores the *serialized results* of expensive filesystem scans. The main table used for this is `graph_cache`.
*   **Purpose**: To prevent the slow, multi-second filesystem scan on every single server restart. When a new worker starts, instead of walking the entire filesystem, it can read a pre-processed JSON blob from this database and deserialize it.
*   **Lifecycle**: This cache is persistent. It is only invalidated when a developer manually clicks the "Invalidate SQLite" button in the development environment.
*   **Log Signature**: `CACHE HIT (sqlite)`

## Performance Analysis (as of 2025-09-19)

Based on recent profiling, we have established the following performance benchmarks for the initial "cache warming" process in a worker:

| Stage                               | Time Taken | Source          | Description                                                              |
| ----------------------------------- | ---------- | --------------- | ------------------------------------------------------------------------ |
| **Cold Start (Filesystem Scan)**    | **~5.0s**  | `glob` on disk  | A complete cache miss. The worker must scan ~43,000 files on disk.       |
| **Warm Start (SQLite Deserialization)** | **~3.9s**  | `agora.db` file | The in-memory cache is empty, but the SQLite cache is populated.         |
| **Hot Read (In-Memory Hit)**        | **<10ms**  | RAM             | The in-memory cache is populated. This is the path for most user requests. |

### Key Findings

1.  **The Bottleneck is I/O**: The majority of the "cold start" time (~80%) is spent just walking the filesystem to find all the subnode files.
2.  **SQLite is a Measurable Improvement**: The L2 SQLite cache provides a consistent **~22% speedup** for the worker startup process compared to a cold start.
3.  **The Primary Benefit is Consistency**: Beyond the raw speedup, the SQLite cache guarantees that every worker in a multi-process environment is working with the exact same version of the graph data, which is critical for preventing bugs. It also provides the foundation for future optimizations like full-text search.

## Development Tools

For testing and debugging the caching layers, the local development environment provides two buttons in the footer:

*   **Flush Cache**: Clears the **L1 In-Memory Cache** for the current worker process.
*   **Invalidate SQLite**: Clears the **L2 Persistent Cache** tables (`graph_cache`, `query_cache`, etc.) *and* flushes the L1 cache. This forces a full "cold start" on the next page load.

## Path Forward: Potential Optimizations

While the current SQLite-based warming process is a significant improvement over a cold filesystem scan, the ~3.9 second deserialization time can be further optimized.

The recommended path forward is to implement a more granular caching schema.

### Granular Caching Strategy

*   **Current State**: The entire node graph is stored as a single, large JSON blob in the `graph_cache` table. Deserialization is a single-threaded, monolithic task.
*   **Proposed State**: Redesign the `graph_cache` table to store each `Node` object individually, keyed by its wikilink.
    *   `key` (TEXT, PK): The node's wikilink (e.g., "my_node").
    *   `value` (TEXT/JSON): The serialized `Node` object, including its list of subnode paths.
*   **Benefits**:
    1.  **Faster Individual Page Loads**: When rendering a single node, we could fetch and deserialize *only that node*, which would be nearly instantaneous, instead of loading the entire graph.
    2.  **Parallel Deserialization**: For the full cache warming process, we could fetch all rows and use Python's `multiprocessing` module to deserialize the nodes in parallel across multiple CPU cores, which could dramatically reduce the total warmup time.
*   **Next Steps**: This would require a significant refactoring of the `_get_all_nodes_cached` function and the database interaction logic, but it represents the most promising path to the next level of performance.
