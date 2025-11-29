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
