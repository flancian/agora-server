This file provides a summary of my core understanding of the Agora project, which I use as my primary context for our sessions.

For a detailed plan of future work, see [[ROADMAP.md]].
For a log of completed work, see [[DONE.md]].
For essays and poems on the project's philosophy, see [[PHILOSOPHY.md]].

---

## Understanding the Agora (as of 2025-09-21)

*This is a summary of my understanding of the project's philosophy and technical principles based on our collaboration.*

### The Agora of Flancia's Intents (The "Why")

The project's goal is to create a **Free Knowledge Commons** with a focus on:
-   **Connecting Digital Gardens**: Weaving together individual, user-owned collections of notes into a larger whole.
-   **Collaborative Problem-Solving**: Building a space where knowledge is not just stored but actively used and composed into tools.
-   **Low Barrier to Contribution**: Prioritizing simple, durable formats (like plain text files) to make it easy for anyone to participate.
-   **Playful Experimentation**: Fostering a delightful and evolving user experience.

### The Agora Protocol (The "How")

The protocol is a set of architectural patterns that enable the Agora's vision:
-   **Decentralization**: The filesystem is the ultimate source of truth. The server is a lens, not a silo.
-   **Nodes are Concepts, Subnodes are Utterances**: A key distinction where abstract topics (`[[Calculus]]`) are composed of concrete contributions (`@user/calculus-notes.md`).
-   **Composition over Centralization**: Nodes are built by pulling and combining content from other, more specialized nodes (e.g., `[[170]]` pulling from `[[calc/170]]`).
-   **Everything Has a Place (No 404s)**: Every possible query resolves to a node, turning dead ends into invitations to contribute.

---

## Agora Core Concepts (as of 2025-09-29)

*This is a summary of my understanding of the project's architecture and user experience principles.*

-   **The Default View is a Composite**: The main user experience is not just a single page, but a composition of a central topic and a suite of satellite information panels. The "default view" for any given node is a collection of:
    -   The **Node Proper**: The collection of subnodes (user contributions) that define the node.
    -   **Contextual Sections**: A series of `<details>` summaries that provide automatically-fetched context about the node's topic from various sources.
-   **Nodes are Collections, Subnodes are Resources**: A key architectural pattern is the distinction between nodes and subnodes.
    -   A **Node** (`[[wikilink]]`) represents a topic, a location, or a collection of things. It is an abstract concept.
-   A **Subnode** (`@user/document.md`) is a specific, concrete resource or "utterance" contributed by a user that is associated with a node.

---

## Session Summary (Gemini, 2025-11-29)

*This section documents a collaborative debugging and refactoring session focused on implementing accurate Git-based timestamps (`git mtime`) throughout the Agora. The work progressed from fixing initial import errors to a complete architectural redesign of the feature to solve critical performance bottlenecks.*

### Key Learnings & Codebase Insights

-   **Eager vs. On-Demand Architecture**: We proved that the initial "eager" approach of scanning all Git repositories on server startup is not scalable and hangs the server. We replaced it with two distinct "on-demand" strategies:
    1.  A **fast, shallow, batched scan** for the `/latest` page, which inspects only the last ~20 commits of each repository.
    2.  A **lazy-loaded, single-file lookup** for subnode footers in the main node view, which only queries Git at the moment a subnode is rendered.
-   **The `pygit2` vs. `git log` Performance Trap**: A critical discovery was that performing a deep history walk for a single file using the `pygit2` library is extremely slow, as it requires iterating through commit objects in Python. Shelling out to the native `git log -1 -- <file>` command is orders of magnitude faster because it leverages Git's internal, highly-optimized indexes. This makes the on-demand, single-file lookup feasible.
-   **Multi-Layer Caching & State Consistency**: Debugging revealed complex interactions between multiple cache layers (`graph_cache` for subnodes, `query_cache` for `/latest`). A key bug was fixed where the "Flush Cache" button would clear the data caches but not the `git_repo_state` table, leading to an inconsistent state that prevented the Git scanner from running correctly on subsequent startups.
-   **Template Architecture**: We clarified the roles of different templates, identifying `node.html` as the correct place to implement the subnode loop for the main view and refactoring `subnode.html` to be a self-contained view for focused subnode rendering.

### Summary of Changes Implemented

1.  **Deprecated the Synchronous Startup Scan**: The entire `update_all_git_mtimes` function and its associated startup thread were removed, solving the server hanging issue.
2.  **Implemented On-Demand `/latest` Page**:
    *   Created `get_latest_changes_per_repo` to perform a fast, shallow scan of recent commits.
    *   Added caching to this function to ensure good performance.
    *   Updated the `/latest` page to display changes grouped by user in a clean, tabular format.
3.  **Implemented On-Demand Timestamps for Subnode Footers**:
    *   Created a new `get_mtime` function that uses a fast `subprocess` call to `git log`.
    *   Added a `get_display_mtime` method to the `Subnode` class to lazy-load this data at render time.
    *   Updated the `node.html` template to display the accurate Git timestamp (or a fallback to `mtime`) in the subnode footer.
4.  **UI/UX Refinements**:
    *   Made subnodes in the main node view collapsible (`<details>`).
    *   Cleaned up and improved the headers for the single-subnode view.
    *   Moved the subnode type (e.g., "Text") to the header for better information density.
    *   Fixed multiple styling and layout issues in the templates.

---

## Session Summary (Gemini, 2025-11-30)

*This section documents a comprehensive optimization session focused on SQLite integration, graph performance, and robustness.*

### Key Learnings & Codebase Insights

-   **The "Full Graph Load" Bottleneck**: We diagnosed that the application was deserializing the entire graph (47k+ nodes) from SQLite into memory for *every* request that triggered a fuzzy search (`G.match`) or node lookup (`G.node`), causing 5-9s delays.
-   **SQLite as a Relational DB**: We shifted from treating SQLite as a key-value blob store to using its relational capabilities.
    -   Implemented **Lazy Loading**: `G.node(uri)` now fetches only the specific node's subnodes from the `subnodes` table, making node instantiation instant (`0.00s`).
    -   Implemented **SQL Regex**: Added a custom `REGEXP` function to SQLite and updated `G.match`/`G.search` to filter nodes at the database level, avoiding the need to load all nodes into Python.
-   **Path Handling**: Discovered a critical issue where relative paths stored in SQLite caused `FileNotFoundError` when `Subnode` tried to open them. We fixed this by reconstructing absolute paths using `AGORA_PATH`.
-   **Executable Subnodes**: Fixed a regression where `.py` scripts were not being added to `node.executable_subnodes` during the new lazy-load process.
-   **"Ghost Files"**: Identified that the incremental update logic (`update_subnodes_bulk`) does not remove deleted files, leading to errors. A full re-index (via `worker.py`) is required to clean up.

### Summary of Changes Implemented

1.  **Optimized `G.node`**: Now uses `sqlite_engine.get_subnodes_by_node` to load data on-demand.
2.  **Optimized Regex Search**: Implemented `sqlite_engine.search_nodes_by_regex` and updated `app/graph.py` to use it.
3.  **Restored Executable Subnodes**: Updated `G.node` to correctly populate `executable_subnodes`.
4.  **Robust File Loading**: Added `try...except FileNotFoundError` to `load_image_subnode` to prevent 500 errors on missing assets.
5.  **Database Scripts**:
    -   Created `scripts/reset_db.sh`: safely clears cache tables (`subnodes`, `links`, `query_cache`, `graph_cache`) while preserving user data.
    -   Created `scripts/worker.py`: A local copy of the re-indexing worker for manual or cron execution.
6.  **Performance Wins**:
    -   Node assembly time reduced to **0.00s**.
    -   Backlink retrieval time is negligible.
    -   `/random` is now instant.
    -   Disabled expensive Python-side fuzzy matching (`fuzz.ratio`) when SQLite is enabled to prevent graph explosion.

### Production Recommendations

-   **Deploy Hook**: Run `scripts/reset_db.sh` or `scripts/worker.py` after deployment to ensure the SQLite index matches the current filesystem and `AGORA_PATH`.
-   **Periodic Re-indexing**: Schedule `scripts/worker.py` to run periodically (e.g., nightly) to clean up deleted files ("ghosts") from the index.

---

## Session Summary (Gemini, 2025-12-05/06)

*This session addressed critical performance regressions and clarified the caching architecture.*

### Key Learnings & Codebase Insights

-   **Cache Stampede in Production**: We identified a severe performance bottleneck (`15-30s` server restarts) caused by `uWSGI` workers (`lazy-apps = true`) simultaneously deserializing the entire `graph_cache` blob from SQLite into memory. This was due to the cache warming logic in `app/__init__.py` running in every worker process.
-   **Filesystem I/O vs. Deserialization**: The "lazy loading" approach, while reducing RAM, introduced significant per-request I/O latency by re-reading subnode content from disk for every graph traversal, leading to slower complex node renders (e.g., `[[post scarcity]]`). The previous "monolithic" approach, though RAM-intensive, offered near-zero-latency access once the graph was in memory.
-   **Reversion to Monolithic (Default)**: To prioritize production stability and performance, we decided to revert to the monolithic (full in-memory graph) loading strategy by default.
-   **Feature Flag for Lazy Loading**: The "lazy loading" optimization was preserved behind a new `ENABLE_LAZY_LOAD` configuration flag, allowing future re-evaluation or gradual adoption.

### Summary of Changes Implemented

1.  **Reverted `prod.ini`**: Set `lazy-apps = true` back to ensure graceful worker reloading.
2.  **Reverted `app/__init__.py` Cache Warming**: Restored the `uwsgi.worker_id() > 0` check, making cache warming run in each worker post-fork (as per the existing graceful reload strategy).
3.  **Introduced `ENABLE_LAZY_LOAD`**: Added `ENABLE_LAZY_LOAD = False` to `app/config.py` as a default. This flag now gates the lazy-loading logic.
4.  **Gated Lazy Logic**: Modified `G.node`, `G.match`, and `G.search` in `app/graph.py` to only use the SQLite-based lazy-loading paths if `ENABLE_LAZY_LOAD` is explicitly `True`. By default, they now revert to using the full in-memory graph (`G.nodes()`).
5.  **Restored Fuzzy Search**: Re-enabled the `fuzz.ratio` based fuzzy search in `Node.related()` when `ENABLE_LAZY_LOAD` is `False`, as it operates on the in-memory graph.
6.  **Fixed Executable Subnodes**: Corrected the logic in `G.node` to properly populate `executable_subnodes` when loading from SQLite (this fix remains, though currently behind the `ENABLE_LAZY_LOAD` flag).

---

## Agora Caching Architecture (as of 2025-12-06)

*This section clarifies the purpose and contents of different cache layers in the Agora.*

### 1. In-Memory Cache (Python `G` object & `cachetools`)

This cache operates within each running Python worker process and provides the fastest data access, as it relies on direct memory lookups. It is cleared on application restarts or worker reloads.

-   **Monolithic Graph (`ENABLE_LAZY_LOAD = False` - Default/Production):
    -   **What**: Stores the entire graph. This includes all `Node` objects, `Subnode` objects, and crucially, the **full text content** (`Subnode.content`) of all markdown/org-mode/myco files, as well as pre-parsed `forward_links` for all subnodes.
    -   **How**: During application startup (or the first request to each worker in `lazy-apps = true` mode), `G.nodes()` and `G.subnodes()` (which call `_get_all_nodes_cached`) either deserialize the `graph_cache` blob from SQLite or perform a full filesystem scan. The resulting Python objects are then stored in `cachetools` LRU caches within the `G` object.
    -   **Impact**: High RAM usage, but subsequent access to any node or subnode property/content is near-instant, as no disk I/O or further parsing is typically needed.

-   **Lazy-Loaded Graph (`ENABLE_LAZY_LOAD = True` - Experimental):
    -   **What**: Stores individual `Node` and `Subnode` objects as they are accessed. `Subnode.content` is still read from disk upon each `Subnode`'s initialization if not already in memory/cache. The `G.node` method also caches individual `Node` objects.
    -   **How**: `G.node(uri)` queries the SQLite `subnodes` table for metadata (paths, mtimes) and then reads the actual file content from disk to populate `Subnode.content`. The `G.node` cache (`cachetools.ttl_cache`) stores the resulting `Node` objects.
    -   **Impact**: Lower peak RAM usage (doesn't load all content upfront), but can incur significant disk I/O latency for complex views that traverse many nodes or access their content if cache misses occur frequently.

### 2. SQLite Cache (`agora.db`)

This cache is persistent on disk and shared across all worker processes. It stores both structured relational data (for indexing and quick lookups) and serialized data blobs (for faster in-memory cache warming).

-   **`subnodes` table**: The primary relational index of all user contributions. Stores `path` (relative URI), `user`, `node` (wikilink), `mtime`. Used heavily by `app/graph.py` and the `worker.py` re-indexer. |
-   **`links` table**: The relational index of all parsed wikilinks. Stores `source_path`, `source_node`, `target_node`, `type`. Used for fast backlink retrieval. |
-   **`graph_cache` table**: Stores two large JSON blobs:
    -   `all_nodes_v2`: Serialized data for all `Node` objects (metadata only, not content).
    -   `all_subnodes_v2`: Serialized data for all `Subnode` objects (metadata, including file paths and mediatypes, but not content). *This is the direct source for warming the **Monolithic In-Memory Graph** on startup, offering faster startup than a full filesystem scan.*. |
-   **`query_cache` table**: General-purpose key-value store for results of expensive, non-graph-related queries (e.g., `/latest` changes). |
-   **`ai_generations` table**: Caches AI-generated responses (prompt, content, full_prompt). |
-   **Other tables**: `starred_nodes`, `starred_subnodes`, `followers`, `federated_subnodes` (store user preferences and federation state). |

*This section provides a summary of the SQLite database schema, outlining table usage, status, and how each table supports the Agora's various views.*

### 1. SQLite Usage Overview
*   **Engine**: All database logic is centralized in `app/storage/sqlite_engine.py`.
*   **Connection**: It uses a standard `sqlite3` connection in **WAL (Write-Ahead Log) mode** to handle concurrent reads/writes from multiple web workers.
*   **Location**: The database file is typically located at `agora.db` (or as configured in `prod.ini` under `sqlalchemy.url`).

### 2. Table Status & Usage

| Table Name | Status | Description & Usage |
| :--- | :--- | :--- |
| **`subnodes`** | **Active** | The core index of all user contributions (files). Stores `path` (relative URI), `user`, `node` (wikilink), `mtime`. Used heavily by `app/graph.py` and the `worker.py` re-indexer. |
| **`links`** | **Active** | The graph edges (backlinks). Stores relationships between subnodes and nodes. Critical for the **Node view**. |
| **`ai_generations`** | **Active** | Caches LLM responses (Mistral/Gemini) to avoid re-generating text. Stores `prompt`, `content`, `full_prompt`. |
| **`query_cache`** | **Active** | General-purpose cache for expensive operations. **Crucially**, it now stores the **Git-based "Latest Changes" list** to prevent server hangs. |
| **`graph_cache`** | **Active** | Caches heavy serialized graph objects (like JSON dumps of nodes) to speed up API responses. |
| **`starred_subnodes`** | **Active** | Stores user stars on specific contributions. |
| **`starred_nodes`** | **Active** | Stores user stars on general topics. |
| **`followers`** | **Active** | Stores ActivityPub relationships (who follows whom). |
| **`federated_subnodes`** | **Active** | Tracks which subnodes have already been pushed to the Fediverse to prevent duplicate posts. |
| **`git_repo_state`** | **Unused** | **Deprecated.** This was used by the old eager Git scanner. Since we moved to on-demand Git queries (cached in `query_cache`), this table is no longer read or written to. |

### 3. Mapping Tables to Views

*   **Node View** (`/node/<node>`):
    *   **`links`**: Used to generate the "Backlinks" list (via `get_backlinking_nodes`).
    *   **`subnodes`**: Indirectly used via the in-memory graph to find which files belong to the node.
    *   **`starred_*`**: Checks if the current node/subnodes are starred by the user.

*   **Context View** (`/context/<node>`):
    *   **`ai_generations`**: Fetches cached AI summaries/meditations for the sidebar.
    *   **`links`**: Used to visualize the local graph neighborhood.

*   **Latest View** (`/latest`):
    *   **`query_cache`**: The route checks this table for a key like `'latest_per_user_v1'`. If found, it serves the cached JSON. If not, it runs the Git command and saves the result here.
    *   **`subnodes`**: Used as a fallback or for `mtime` sorting in other feed views (e.g. RSS).

*   **Re-indexing (`worker.py`)**:
    *   This background script completely drops and rebuilds `subnodes` and `links` from the filesystem to ensure the index is fresh. It does *not* touch the user-data tables (`starred_*`, `followers`).

---

## Session Summary (Gemini, 2025-12-10)

*This section documents a series of iterative improvements and bug fixes, primarily focused on enhancing user feedback during slow loads and refining UI terminology.*

### Key Learnings & Codebase Insights

-   **Client-Side vs. Server-Side Cold Start Detection**: Initially, we explored server-side `g.cold_start` flags and header propagation. However, client-side detection based on `setTimeout` proved more robust for providing immediate "Warming up..." feedback during any slow load, while the server-side header remains valuable for precise "cold start" identification after the load completes (e.g., after an in-memory cache flush).
-   **Debugging Indentation Errors**: Python's strict indentation rules were a recurring challenge, highlighting the need for meticulous attention to whitespace, especially in template and Flask route modifications.
-   **Refactoring for Modularity**: Extracting the "empty node" message into its own template (`empty.html`) significantly improved code organization and reusability.
-   **HTML Structure Validity**: Incorrect nesting of `<details>` and stray `div` elements caused layout issues, underscoring the importance of valid and well-formed HTML.
-   **Consistency in Terminology**: Maintaining a consistent vocabulary across the UI (e.g., "Agora location") enhances clarity and aligns with the project's core metaphors.

### Summary of Changes Implemented

1.  **Cold Start Notifications**:
    *   Implemented a client-side "🌱 Warming up the Agora..." toast, displayed if a node content fetch takes longer than 3 seconds.
    *   Reinstated the backend `X-Agora-Cold-Start` header, set when the in-memory graph is rebuilt (either from filesystem scan or SQLite deserialization), triggering a "🙏 Apologies for the delay; that was a cold start." toast 1 second after the content loads.
2.  **Context Section Enhancement**:
    *   Elevated the 'Context' section to a top-level peer with consistent header styling.
    *   Added the `⥱` emoji to the Context header.
    *   Corrected an HTML structure bug in `context.html` related to an unclosed `div`.
    *   Ensured consistent background coloring by changing the wrapper class from `context subnode` to `context node`.
    *   Refined the header text to "⥱ **Context** for [[node]]".
3.  **Empty Node Clarity**:
    *   Factored out the "Nobody has noded..." message into its own `empty.html` template.
    *   Refined the empty node header to "📚 **Agora location** [[node]] (empty)".
    *   Removed extraneous margins from the `.not-found` CSS class.
4.  **Terminology Alignment**:
    *   Changed "Node" to "Agora location" in `node.html`, `empty.html`, and `related.html` headers and tooltips.
    *   Added parentheses around "(perhaps related)" and "(pulled by user)" / "(pulled by the Agora)" for consistent styling.
5.  **Subnode Header Refinement**:
    *   Restructured subnode headers to prioritize "Contribution" (e.g., `📓 <strong>Contribution</strong> foo.md by @user`).
    *   Moved `{{ subnode.type|capitalize }}` from the header to the footer, preceding the "last updated" timestamp.
6.  **`⸎` Sign Repositioning**:
    *   Moved the `⸎` sign from the subnode footer to the very end of the main Agora footer.
7.  **Bug Fixes**: Addressed and resolved several bugs, including:
    *   `IndentationError` in `app/agora.py` related to the `after_request` function.
    *   A critical bug in `app/templates/node.html` that caused subnode content to not render due to an accidentally deleted line.
    *   A JavaScript `ReferenceError` caused by a typo (`AGoraURL`).

---

## Session Summary (Gemini, 2025-12-12/14)

*This section documents the implementation of the Self-Service Signup flow and the Fediverse Content Broadcasting loop.*

### Key Learnings & Codebase Insights

-   **Bridge as Microservice**: We validated the architectural pattern where `agora-server` proxies requests to the internal `agora-bridge` API. This keeps sensitive git operations (cloning, config writing) isolated behind the bridge, improving security and simplifying the public-facing server configuration.
-   **Federation requires Git Truth**: We discovered that relying on the file-system index or cached graph for federation broadcasting can lead to stale or incorrectly sorted updates (the "Emoji Files" incident). Switching the federation loop to use `git_utils.get_latest_changes_per_repo` ensures that we broadcast exactly what the `/latest` page shows, which is the ground truth from git history.
-   **Execution Safety**: We robustified `ExecutableSubnode` by replacing the external `/usr/bin/timeout` call with Python's native `subprocess` timeout and added a strict 256KB output limit using `select` and `os.read`. This prevents user scripts from hanging the server or causing OOMs.
-   **Content Hygiene**: We learned that ActivityPub `Note` content requires careful handling, especially for images. We implemented logic to send images as links/attachments rather than attempting to decode their binary content as UTF-8 text.

### Summary of Changes Implemented

1.  **Signup Story (Self-Service)**:
    *   **Bridge API**: Updated `POST /sources` in `agora-bridge` to perform an immediate synchronous `git clone`.
    *   **Server Logic**: Added `POST /api/join` in `agora-server` to proxy requests to the bridge.
    *   **Client UI**: Added an interactive "Join" form to the Settings Overlay (`overlay.html`) and wired it up in `settings.ts`.
2.  **Fediverse Integration**:
    *   **Content Broadcasting**: Implemented `federate_latest_loop` in `app/agora.py`, a background thread that polls for new git commits every 5 minutes (adjustable via `FEDERATION_INTERVAL`). It broadcasts `Create` activities to followers for new subnodes.
    *   **Star Federation**: Implemented `federate_create` to broadcast `Like` activities when a user stars a node.
    *   **Follower Management**: Verified and fixed `user_inbox` handling of `Follow` activities and `Accept` responses.
3.  **Executable Subnodes**:
    *   Refactored execution logic into `util.run_with_timeout_and_limit`.
    *   Added `EXECUTABLE_NODE_OUTPUT_LIMIT` configuration.
    *   Switched to Python `timeout` handling.
4.  **Documentation**:
    *   Created `AGORA_ARCHITECTURE.md` detailing the Signup and Federation protocols with sequence diagrams.
    *   Created `2025-12.md` tracking the monthly goals.

### Architecture References

-   **`AGORA_ARCHITECTURE.md`**: See this file for sequence diagrams of the Signup and Federation flows.
-   **`2025-12.md`**: See this file for the detailed status of December's goals.

---

✦ Federation

  It takes a single spark to break the dark,
  A private note that finds its mark.
  We built the loom, we strung the wire,
  To turn a garden into fire.

  Not to burn, but to ignite—
  To signal "I am here" tonight.
  The gate is open. The path is free.
  The graph is you. The graph is me.

  ---

  Until next time. 🌱
