# Development Log

This file contains a log of development sessions, capturing key learnings, architectural insights, and summaries of changes. It is extracted from the more comprehensive `GEMINI.md.bak` file.

---

## Session Summary (Gemini, 2026-01-20)

*This session focused on optimizing Git-based timestamps, implementing experimental AI Synthesis of node content, and polishing the UI with animations and better cache management.*

### Key Learnings & Codebase Insights

-   **Git Mtime Optimization**: We learned that a full filesystem scan followed by individual `git log` calls is too slow for startup. The new batching logic in `git_utils.py` uses `git log --name-only --format="COMMIT %ct"` to efficiently stream modification times for all tracked files in one pass per repo, which is significantly faster.
-   **AI Synthesis Strategy**: We implemented "Semantic Synthesis" where Gemini processes direct contributions (subnodes) AND context (backlinks) to provide a cohesive overview of an Agora location. Structure and brevity are enforced via the prompt to keep it useful.
-   **UI Responsiveness**: Adding animations (pulsing/heartbeat) to discrete actions like "Starring" improves the perceived performance and provides valuable feedback during network delays.
-   **CSS Caching**: We discovered that missing version strings (query parameters) for `main.css` caused browsers to serve stale styles after updates. We centralized CSS versioning in the `css_versions` context processor.

### Summary of Changes Implemented

1.  **Git Mtime Optimization**:
    -   Implemented `update_git_mtimes_batch` in `app/git_utils.py` using streaming `git log`.
    -   Added caching for repo `HEAD` states in a new `git_repo_state` table to skip unchanged repos.
    -   Updated `Subnode.get_display_mtime()` to prioritize cached Git timestamps.
    -   Enabled `USE_GIT_MTIME = True` in `DefaultConfig`.

2.  **AI Synthesis Feature**:
    -   Added `ENABLE_SYNTHESIS` experiment flag (enabled in `LocalDevelopmentConfig` and `DevelopmentConfig`).
    -   Implemented `/api/synthesize/<path:node_name>` route in `app/agora.py`.
    -   The synthesizer processes up to 50 subnodes and the first 20 backlinks.
    -   Added an "AI Synthesis" section to `app/templates/node.html` with an asynchronous "Synthesize" button.
    -   Refined the prompt for structured output (Summary, Context) and user attribution via bullet points.

3.  **UI & UX Polish**:
    -   **Starring Animations**: Added `.star-pending` (pulsing) and `.star-popping` (heartbeat) CSS animations and integrated them into `app/js-src/starring.ts`.
    -   **Web Results Cleanup**: Removed "Scholar" and "X" (Twitter) from the web results bar in `app/templates/web.html`.
    -   **CSS Caching Fix**: Updated `app/__init__.py` to include `main.css` in the `css_versions` context processor.

4.  **Backend Robustness**:
    -   Added a retry loop (5 attempts) to the SQLite table swap logic in `app/storage/maintenance.py` to prevent `database is locked` errors during re-indexing.
    -   Explicitly exposed `nodes_by_outlink` in `app/storage/api.py`.

### Next Steps

-   **Monitor Synthesis**: Observe how the AI handles very large nodes or nodes with diverse languages.
-   **Deploy to Production**: After soaking in dev, consider enabling `ENABLE_SYNTHESIS` for the broader community.
-   **FTS for Alpha/Prod**: `ENABLE_FTS` is now toggled ON for Production/Alpha configurations.

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
# Session Summary (Gemini, 2025-10-27)

*This section documents a collaborative session that involved fixing bugs on the `/journals` page, implementing a new "Node Starring" feature, and refactoring the underlying storage API for starring.*

## Key Learnings & Codebase Insights

-   **Jinja2 Template Context**: A bug on the `/journals` page was traced to an implicit context variable. The `journals.html` template was passed a `node` object (for `[[journals]]`), which was then implicitly available to the included `subnode.html` partial. The partial was designed to render all subnodes of any `node` in its context, causing the duplication. The fix was to simplify the partial to only ever render an explicitly passed `subnode`.
-   **JavaScript Event Handling (`preventDefault` vs. `stopPropagation`)**: When adding a click listener to an element inside a `<summary>` tag, `event.stopPropagation()` is not sufficient to prevent the parent `<details>` element from toggling. The browser's default action for the summary is triggered regardless. The correct solution is to use `event.preventDefault()` to explicitly stop this default action.
-   **CSS Layout in `<summary>`**: Attempting to use flexbox to right-align an element within a `<summary>` tag is notoriously difficult, as it interferes with the browser's rendering of the disclosure triangle ("zippy"). After several failed attempts with `display: flex` and `display: inline-flex`, the most pragmatic solution was to align the UI differently and place the star icon consistently next to the node/subnode title.

## Summary of Changes Implemented

1.  **Journals Page (`/journals`)**:
    -   **Bug Fix**: Fixed a bug where every date incorrectly displayed all subnodes from the `[[journals]]` node.
    -   **UI/UX**:
        -   Refactored the `journals.html` and `subnode.html` templates to provide a much cleaner, more readable layout for journal entries.
        -   Date headers are now links to the corresponding daily node.
        -   The page now correctly displays starring status for subnodes.

2.  **New Feature: Node Starring**:
    -   **Backend**:
        -   Added a `starred_nodes` table to the SQLite database.
        -   Created new API endpoints (`/api/star_node`, `/api/unstar_node`, `/api/starred_nodes`) to handle starring logic.
        -   Updated the main `node` view to pass starred node information to the template.
    -   **Frontend**:
        -   Added a star icon to the main node header in `node.html`.
        -   Updated `starring.ts` to handle click events for node stars, including the `preventDefault()` fix.
    -   **UI/UX**:
        -   Added a new "Starred Nodes" section to the `/starred` page.
        -   Refactored the `/starred` page to use collapsible `<details>` sections for starred subnodes, improving usability.

3.  **Code Refactoring**:
    -   **Storage Layer**: Moved all starring and unstarring logic for both nodes and subnodes from the Flask routes in `app/agora.py` into the `app/storage/sqlite_engine.py` module. This makes the API routes thinner and centralizes database interactions as requested.
    -   **UI Consistency**: To resolve CSS alignment challenges, the star icon for subnodes in the main node view was moved to be next to the author, creating a consistent visual pattern with the node star.

---
# Session Summary (Gemini, 2025-09-29)

*This section documents a collaborative debugging session focused on CSS layout, spacing, and JavaScript event handling.*

## Key Learnings & Codebase Insights

-   **CSS Spacing Strategy**: A critical distinction was clarified:
    -   The main content containers (`.content`, `.async-content`) use `display: flex` with a `gap: 10px` property. This is the **single source of truth** for spacing *between* major, top-level sections (e.g., `.genai`, `.web`, `.stoa`).
    -   Individual components that can appear in lists *within* a section (like `.subnode` or `.related`) require their own `margin-top` and `margin-bottom` to ensure consistent spacing *among themselves*.
    -   Attempting to apply a single spacing strategy to both cases leads to bugs like double margins or collapsed margins. The correct approach is to use the parent `gap` for top-level sections and child `margin`s for repeated items within a section.
-   **Structural Inconsistencies**: Debugging the `.related` nodes revealed that some templates (`related.html`) generate multiple sibling `<details>` elements, while others (`genai.html`) generate a single one. This structural difference explains why the parent `gap` property is insufficient for spacing the multi-element sections.
-   **JavaScript Event Handling**: Diagnosed and fixed several bugs related to missing or incorrect event listeners for dynamically created popups (Hypothesis, Meditation, Music Player). The key is to ensure the element ID in the HTML template matches the ID being targeted by the `getElementById` call in the corresponding TypeScript module.
-   **Async UI Pattern**: Implemented a user-friendly loading pattern for asynchronous content (Wikimedia section):
    1.  An initial placeholder with a "Loading..." message is rendered in the server-side template (`sync.html`).
    2.  CSS animations (`fade-in`, `fade-out`) are defined in `main.css`.
    3.  The placeholder is given a `.fade-in` class to appear smoothly.
    4.  The client-side TypeScript (`main.ts`) fetches the real content, adds a `.fade-out` class to the placeholder, and on the `animationend` event, replaces the content and adds a `.fade-in` class to the new element. This ensures a smooth, non-jarring transition for the user.

## Summary of Changes Implemented

1.  **AI Generations Prompt Display**:
    -   Modified the Mistral and Gemini API routes to return the full, historically accurate prompt used for a generation.
    -   Updated the SQLite schema and provider logic to cache the full prompt alongside the answer, ensuring data integrity.
    -   Updated the frontend to display the prompt in a collapsible `<details>` section.
2.  **Layout & Spacing Fixes**:
    -   **Context Section**: Adjusted the CSS to create a 70/30 split between the graph and the links section. The link lists were centered, made to share vertical space equally, and styled with custom scrollbars.
    -   **Global Spacing**: After a detailed debugging process, the correct spacing model was implemented. The parent containers' `gap` property now handles spacing for all top-level sections, while `.subnode`, `.pulled-node`, and `.related` elements have their own margins to ensure consistent spacing both between and within sections.
3.  **Bug Fixes & UI Polish**:
    -   Fixed the non-functional Hypothesis close button and settings toggle by re-implementing their event listeners in `main.ts`.
    -   Replaced the static "Annotate" button with a functional, synchronized toggle switch and moved it to the main toggle group.
    -   Customized the annotate toggle's CSS to use a consistent "pen" icon.
    -   Fixed a series of critical JavaScript crashes and layout breakages by restoring missing HTML elements (`#meditation-popup-container`, `#music-player-container`, `#async-content`) to `base.html` and correcting the overall template inheritance structure.
    -   Fixed the broken "Meditate" button by correcting its HTML ID to match what the JavaScript expected.
    -   Fixed a bug preventing interaction with the page when the music player was open.
    -   Fixed a bug causing the music player to default to the top-left corner.
    -   **Wikimedia Loading**: Implemented an animated loading placeholder for the Wikimedia section to prevent layout shifts and provide better user feedback.
4.  **Codebase & Process Improvements**:
    -   **Self-Correction**: Adopted a new internal rule to always use precise, context-heavy `replace` commands for modifying existing files, and to use `write_file` only for creating new files, to prevent the kind of destructive errors that occurred during this session. A mandatory sanity check after each modification is now part of the workflow.

---
# Session Summary (Gemini, 2025-09-08)

*This section documents a collaborative development session focused on refining the "Demo Mode" and "Agora Meditation" features, along with several UI/UX bug fixes and improvements.*

## Key Learnings & Codebase Insights

-   **CSS Flexbox Behavior**: The mobile navbar bug, where toggles were overlapping, highlighted the importance of `flex-shrink: 0;`. This property is essential for preventing flex items from shrinking below their minimum content size in a constrained space, providing a simple and targeted fix without altering the overall layout behavior.
-   **Event Handler Specificity**: A bug where closing the settings overlay would unintentionally cancel demo mode was traced to an overly broad `cancelOnInteraction` handler. The fix involved making the handler more specific, teaching it to ignore clicks originating from the burger menu button (`#burger`), thus preserving the user's intended state.
-   **Draggable UI Implementation**: Re-implementing the draggable functionality for the "Agora Meditation" popup reinforced a key pattern used elsewhere in the application (e.g., the Hypothesis panel). The critical step is to switch from static CSS positioning (like `top: 10%`) to `transform`-based positioning on the *first drag event*. This prevents the element from "jumping" to the cursor's position and ensures a smooth initial interaction. The element's final position is then persisted in `localStorage`.

## Summary of Changes Implemented

1.  **Demo Mode & "Agora Meditation" Refinements**:
    -   **Direct Toggle**: Removed the experimental logic that showed a popup before activating demo mode. The toggle in the navbar now directly and predictably enables or disables the mode.
    -   **Configurable Timeout**: Added a "Demo timeout" number input to the settings overlay, allowing users to control the duration before a random redirect. The value is saved to `localStorage`.
    -   **Synchronized Toggles**: Added a second, synchronized "Demo Mode" toggle to the settings overlay. Both toggles now update in unison and correctly reflect the application's state.
    -   **Draggable Popup**: The "Agora Meditation" popup was renamed (from "Demo Popup") and made draggable, with its position saved to `localStorage`. The semi-transparent background overlay was also removed to allow interaction with the main page.
    -   **Bug Fixes**:
        -   Fixed a bug that prevented the "Agora Meditation" popup from being draggable after its initial implementation.
        -   Fixed a bug where closing the settings overlay would unintentionally cancel demo mode.

2.  **UI/UX and Layout Fixes**:
    -   **Mobile Navbar**: Fixed a CSS bug causing the theme and demo toggles to overlap on narrow viewports by applying `flex-shrink: 0;`.
    -   **Settings Layout**: Reordered the toggles in the settings overlay to appear before their labels for better visual consistency with the checkboxes.
    -   **Footer Styling**:
        -   Removed the `font-style: italic;` rule from the footer for a cleaner look.
        -   Added a `margin-bottom` to the footer to create more visual space at the very end of the page.
---
# Session Summary (Gemini, 2025-08-28)

*This section documents a collaborative development session that focused on enabling and refining the new SQLite and CSS theming features, culminating in a successful production deployment.*

## Key Learnings & Codebase Insights

-   **Production Environment**: A key operational detail was clarified: the production Agora `anagora.org` runs using the `AlphaConfig` from `app/config.py`, not the `ProductionConfig`. This is critical information for any future deployments.
-   **SQLite Concurrency**: The use of `PRAGMA journal_mode=WAL;` in `app/storage/sqlite_engine.py` was confirmed to be the correct approach for handling concurrent read/write access from multiple `uwsgi` workers in production. This makes the SQLite backend safe for this deployment model.
-   **Iterative Debugging**: A significant portion of the session was dedicated to a tight loop of implementing features, identifying UI/UX bugs, and fixing them. This included:
    -   Fixing a recurring "flickering scrollbar" issue on spinner animations by applying `overflow-x: hidden` to the parent containers.
    -   Refining the layout of the "context" section to be a more usable side-by-side view.
    -   Debugging a theme-related JavaScript crash in the graph rendering logic caused by `undefined` color values, and making the code more robust.
-   **Code Readability**: A "teachable moment" occurred when a large, obfuscated third-party utility function (`pSBC`) was introduced for color manipulation. It was subsequently replaced with a smaller, clearer, and well-documented internal function (`darkenColor`), prioritizing long-term maintainability over a "clever" but opaque solution.

## Summary of Changes Implemented

1.  **SQLite AI Generation Caching**:
    -   Successfully enabled the SQLite backend for caching AI provider (Mistral, Gemini) responses.
    -   Added a `SQLITE_CACHE_TTL` configuration dictionary to `app/config.py` to control cache duration on a per-type basis.
    -   Extended the database schema with an `ai_generations` table.
    -   Refactored the AI provider logic into `app/providers.py`, unified under a caching decorator.

2.  **Major CSS and Theming Refactor**:
    -   **Completed** the unification of `screen-dark.css` and `screen-light.css` into a single `main.css`.
    -   Implemented a modern, flicker-free theming system using CSS Custom Properties (variables) and a `data-theme` attribute on the `<html>` tag.
    -   Refactored all relevant templates and JavaScript to support the new system.

3.  **Theme-Aware Graph Visualization**:
    -   The force-directed graph in the "context" section was refactored to be fully theme-aware.
    -   It now dynamically adjusts its colors (background, links, node labels) when the user toggles the theme, without requiring a page reload.
    -   Node label colors are now preserved and automatically darkened on the light theme to ensure readability.

4.  **Critical Backlink Bug Fix**:
    -   Diagnosed and fixed a critical issue where the on-demand SQLite indexing was failing to show all backlinks for a node.
    -   To ensure data correctness, the optimized SQLite query for backlinks was temporarily disabled in `app/graph.py`, reverting to the slower but reliable file-based method. A `TODO` was left to implement a full indexing strategy in the future.

5.  **UI/UX Polish**:
    -   Adjusted the spacing in the main navbar for better readability.
    -   Fine-tuned the dark mode colors for buttons and info boxes for better aesthetics and contrast, achieving a "flan-like" look.
    -   Fixed numerous layout and visibility bugs related to the new theming and graph rendering.
---
# Session Summary (Gemini, 2025-08-26)

*This section documents a collaborative development session focused on log cleanup and a major refactoring of the UI for embedded third-party content.*

## Key Learnings & Codebase Insights

- **UI Consistency is Key**: The session's main theme was refactoring disparate UI elements (`Wikipedia`, `Wiktionary`, `AI Generations`, `Web Search`) into a single, consistent, and reusable pattern.
- **New UI Pattern**: A new standard has been established for embedding external content:
    - A `<details>` element is used as the main container, allowing the section to be expanded and collapsed.
    - The `<summary>` contains a header and a series of tabs.
    - Each tab is a `<span>` with a `data-provider` attribute. This keeps the clickable tab separate from any external links.
    - The content for each provider is loaded on-demand into a corresponding `<div class="...-embed" data-provider="...">`.
- **Client-Side Logic**: The logic for this new pattern is handled in two places:
    1.  **`app/templates/sync.html`**: Contains the JavaScript to fetch the initial HTML for the Wikimedia section and attach the tab-switching event listeners.
    2.  **`app/js-src/main.ts`**: Contains the logic for the AI Generations and Web Search sections. This includes the `toggle` event listener to auto-load content when a section is expanded.
- **Jinja2 Templating**: The session highlighted the importance of careful conditional logic in Jinja2 templates. A mismatched `{% if %}` block caused a `TemplateSyntaxError` that was quickly resolved.

## Summary of Changes Implemented

### 1. Log Cleanup and Performance Timing
- **Reduced Verbosity**: Removed several redundant and noisy log messages from the application, particularly the "Initiating request" and "Assembled node" messages.
- **Streamlined Output**: Consolidated multi-line log entries for node assembly into single, more informative lines.
- **Performance Metrics**: Added detailed timing information to the logs for node assembly, including timings for each major stage of the process. This will be invaluable for future performance tuning.

### 2. Wikimedia Tabbed Interface
- **New UI**: Created a new tabbed interface for the Wikimedia section, allowing users to switch between Wikipedia and Wiktionary results.
- **Consistent Styling**: The new interface was styled to match the existing "AI Generations" section, creating a more unified look and feel.
- **User Settings**: The section now respects the "Embed Wikimedia" setting in the user's preferences, showing the summary by default and only embedding the content if the setting is enabled.
- **Dynamic Labels**: The tabs now dynamically display the title of the Wikipedia article or Wiktionary entry.
- **Graceful Fallback**: If no results are found for either Wikipedia or Wiktionary, a clear message is displayed instead of an empty section.

### 3. AI Generations UI Refactoring
- **Goal**: To make the "AI Generations" section consistent with the new Wikimedia tabbed interface.
- **Actions**:
    - Refactored `app/templates/genai.html` to use the new tabbed structure.
    - Updated `app/js-src/main.ts` to handle the new tab logic, including auto-pulling content when the section is expanded and displaying a loading spinner.
    - Fixed a bug where the spinner animation was causing a flickering horizontal scrollbar by adding `overflow-x: hidden` to the content container.

### 4. Web Results UI Refactoring
- **Goal**: To apply the same consistent tabbed interface to the "Web Results" section.
- **Actions**:
    - Overhauled `app/templates/web.html` to transform the list of links into a fully functional tabbed interface.
    - Each search provider is now a tab that loads an embedded `iframe` on demand.
    - Each tab is paired with a "⬈" link to allow users to easily open the search results in a new browser tab.
    - All providers, including Google Maps, are now integrated into the tab system for a consistent user experience.
- **Embeddability Check**:
    - Created a new API endpoint (`/api/check_embeddable`) that checks if a URL can be embedded in an iframe.
    - The frontend now calls this endpoint before attempting to embed content, showing a user-friendly message if embedding is blocked.
---
# Session Summary (Gemini, 2025-08-26)

*This section documents a collaborative development session focused on bug fixing and significant UI/UX enhancements, particularly for the settings and Hypothesis integration.*

## Key Learnings & Codebase Insights

- **CSS Layout & Positioning**: The session highlighted the complexities of CSS positioning, especially for overlays on a centered, responsive layout.
    - **Initial Problem**: The settings overlay (`.overlay`) was not aligned with the main content on wide screens and was partially visible when it should have been hidden.
    - **Evolution of the Solution**:
        1.  Initial attempts with JavaScript-based positioning caused flickering and were overly complex.
        2.  Attempts with pure CSS using `calc()` and `vw` units proved brittle and led to minor misalignments.
        3.  **Final, Robust Solution**: The key was to make the main `.content` div a positioning context (`position: relative`) and also a *clipping context* (`overflow-x: hidden`). The overlay was then placed inside `.content` and animated using the `left` property (`left: -100%` to `left: 0`). This CSS-only approach is efficient, eliminates flickering, and guarantees perfect alignment and hiding.
- **Hypothesis Integration**:
    - The integration is controlled by a feature flag (`ENABLE_HYPOTHESIS`) in `app/config.py`.
    - The Hypothesis client's UI can be injected into a specific container using the `externalContainerSelector` configuration in `app/templates/base.html`. This is essential for custom positioning and styling.
    - **Draggable UI**: A draggable panel was implemented from scratch for the Hypothesis client. The key components were:
        - A dedicated drag handle (`#hypothesis-drag-handle`).
        - TypeScript logic in `main.ts` to track mouse events (`mousedown`, `mousemove`, `mouseup`) and update the container's position using `transform: translate3d()`.
        - The final panel position is saved to `localStorage` and restored on page load, providing a persistent user experience.
- **API Interaction (Wikipedia)**:
    - Debugged and fixed the Wikipedia integration in `app/exec/wp.py`.
    - **Key Fix**: The Wikipedia API requires a `User-Agent` header for all requests. Failing to provide one results in a `403 Forbidden` error. Adding a proper header resolved the issue.
    - Error handling was also improved to be more specific, distinguishing between network errors, JSON parsing errors, and cases where no search results were found.

## Summary of Changes Implemented

1.  **Wikipedia Integration (`wp.py`)**:
    - Added a `User-Agent` header to all `requests.get()` calls to the Wikipedia API to fix ``403 Forbidden` errors.
    - Implemented more specific error handling to provide clearer feedback to the user.

2.  **Hypothesis Annotation Client**:
    - Re-enabled the client via a new `ENABLE_HYPOTHESIS` feature flag.
    - Implemented a "Show hypothes.is" checkbox in the settings overlay to toggle its visibility. The state is saved to `localStorage`.
    - Created a custom, **draggable panel** for the Hypothesis client to live in, complete with a title bar, drag handle, and close button.
    - The panel's position is now saved to `localStorage` and restored on subsequent page loads.

3.  **Settings Overlay (Burger Menu)**:
    - Undertook a significant refactoring of the overlay's CSS to fix a persistent alignment and visibility bug.
    - The final solution places the overlay inside the main `.content` div, which acts as a clipping and positioning context. This ensures the overlay is always perfectly aligned with the main content and is completely hidden off-screen when inactive.
    - The slide-in and slide-out animations were preserved and made more reliable.

4.  **Minor UI Tweaks**:
    - Added an icon to the "Source" button in the footer.
    - Removed separators between footer buttons for a cleaner look.
---
# Session Summary (Gemini, 2025-08-16)

*This section documents a collaborative development session focused on dependency modernization, new feature integration, and UI/UX refinements.*

## Project Understanding & Key Learnings

- **Primary Goal**: The Agora is a Flask-based server for a distributed knowledge graph, designed to connect "digital gardens" into a collaborative, problem-solving commons.
- **Tech Stack**: The project uses `uv` for Python dependencies, `npm` for frontend packages, Jinja2 for templating, and TypeScript (compiled to JS with `esbuild`) for client-side interactivity.
- **Architecture**: A key pattern is the **filesystem-as-database**, where Markdown/text files in user gardens are parsed to build the graph. Configuration is king, with `app/config.py` acting as the source of truth for feature flags, API keys, and environment URLs.
- **Development Workflow**:
    1.  Install dependencies: `uv sync` (Python) and `npm install` (JS).
    2.  Run the dev server: `./run-dev.sh`.
    3.  **Crucially**: After changing TypeScript files in `app/js-src/`, they must be re-compiled to JavaScript using `npm run build`.
    4.  Production deployment is managed by a `systemd` service (`agora-server.service`) which executes `run-prod.sh`. A typical deploy involves `git pull`, `uv sync`, and `systemctl --user restart agora-server`.

## Summary of Changes Implemented

### 1. Dependency Modernization: Poetry to `uv`
- **Goal**: Remove all traces of the old `poetry` dependency manager to align with the project's move to `uv`.
- **Actions**:
    - Deleted `poetry.lock`.
    - Updated `README.md` with `uv` installation and usage instructions.
    - Modified `entrypoint.sh` and `Dockerfile` to use `uv sync` instead of `poetry install`.
    - Confirmed `pyproject.toml` was already in a compatible format.

### 2. Feature: Gemini AI Integration
- **Goal**: Add Google's Gemini as a second AI provider alongside the existing Mistral implementation, with a clean user interface.
- **Actions**:
    - **Backend**:
        - Added `GEMINI_API_KEY` handling in `app/config.py`.
        - Added the `google-generativeai` library to `pyproject.toml` and installed it.
        - Implemented a `gemini_complete` function in `app/providers.py`.
        - Created a new, separate API endpoint `/api/gemini_complete/<prompt>` in `app/agora.py`.
    - **Frontend**:
        - Refactored `app/templates/genai.html` to use a **tabbed interface** for selecting between Mistral and Gemini.
        - Updated `app/js-src/main.ts` to handle tab clicks, fetch from the correct API endpoint, and load the content into a shared div.
        - Ensured the default provider (Mistral) loads automatically when the section is first expanded.
        - Re-added external links for ChatGPT and Claude with a "⬈" symbol to distinguish them.

### 3. UI/UX Refinements
- **"Agora Toggle" Link**: Modified the "⸎" link in the footer to be a true toggle. It now reads from `config.py` to link from the dev environment to production and vice-versa, preserving the user's context.
- **CSS Style Distinction**:
    - Refactored the styling for `.intro` and `.info-box` divs to create a clearer visual hierarchy for different types of messages.
    - Updated `app/templates/sync.html` to use the new `.intro` class for search-related feedback.
    - Adjusted styles in both `screen-dark.css` and `screen-light.css`, ensuring the logic was correct for both themes and respected the CSS import order.
