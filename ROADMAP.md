# Agora Roadmap

This document outlines the future work for the Agora project, with a focus on the architectural split between the `agora-server` (this repository) and the `agora-bridge`.

## Core Architecture: The Server/Bridge Split and Hybrid Indexing

The Agora's architecture is a hybrid model designed for both real-time responsiveness and powerful, asynchronous processing. It is composed of two primary components that communicate and coordinate through a shared SQLite database (`agora.db`).

-   **Agora Server:** A user-facing Flask web application. Its primary responsibility is to handle HTTP requests and render HTML as quickly as possible.
    -   It performs **"hot" or "on-demand" indexing**: When a file is requested, the server instantly updates its metadata and links in the database. This ensures that recently accessed parts of the Agora are always perfectly up-to-date.
    -   It is the **read-mostly** and **request-handling** layer.

-   **Agora Bridge:** A background worker application. Its responsibility is to perform slow, asynchronous, and state-changing tasks that are not on the critical path of a user request.
    -   It performs **"cold" or "batch" indexing**: It runs periodic scans to backfill the index with files that haven't been accessed recently, performs expensive full-text indexing (FTS5), and can recover the index from scratch.
    -   It also handles all other asynchronous tasks like federation (pushing to the Fediverse) and pulling content from external sources.
    -   It is the **write-heavy** and **background processing** layer.

This hybrid approach provides the best of both worlds: the data users are actively viewing is indexed in real-time by the server, while the bridge ensures the entire Agora is eventually consistent and handles heavy tasks without impacting user-facing performance.

---

## Agora Bridge (The Worker)

*The following tasks belong to the `agora-bridge` repository and component.*

### Priority 1: Full Content Indexing Engine

**Goal:** Create a comprehensive SQLite index of all content in the Agora to enable powerful new features and dramatically improve performance for complex queries.

-   **Tasks:**
    -   Implement a batch process for initial, full-Agora indexing.
    -   Implement a periodic filesystem scanner to find and index changes to "cold" (infrequently accessed) subnodes, complementing the server's "hot" indexing.
    -   Integrate SQLite's FTS5 extension to build a full-text search index of all subnode content.
    -   The Bridge will be the primary **writer** to the database for batch operations.

### Priority 2: Real-Time Federation (Push Model)

**Goal:** Transform the Agora from a passive archive into an active, real-time participant in the Fediverse.

-   **Tasks:**
    -   Implement a job queue system for outgoing activities.
    -   When a new subnode is indexed (see above), add a "federate" job to the queue.
    -   The Bridge will process this queue, querying the database for the user's followers and pushing a signed `Create` activity to each follower's inbox.
    -   Implement logic for handling network retries and errors.

---

## Agora Server (The Web Interface)

*The following tasks belong to the `agora-server` (this) repository and component.*

### Priority 1: Stability & Performance (The Foundation)

**Goal:** Ensure the server remains lean, fast, and crash-free even as the graph grows.

-   **Tasks:**
    -   **Protect the Monolith:** Maintain the "Shared Object Identity" architecture in `graph.py`. A regression test (`tests/test_memory_optimization.py`) now enforces that `G.nodes()` and `G.subnodes()` share the same Python objects, keeping RAM usage low (~1.2GB).
    -   **Search Optimization (FTS5):** Current search operations (like `/fullsearch`) are slow (~900ms) because they scan the filesystem or iterate in Python. We need to implement SQLite FTS5 (Full-Text Search) to make these queries instant.

### Priority 2: Transition to SQLite as Primary Data Source

**Goal:** Refactor the server to leverage the fast, comprehensive index built by the Bridge, making the server faster, more memory-efficient, and simpler.

-   **Tasks:**
    -   Modify all data-fetching logic (e.g., in `app/graph.py`, `app/storage/api.py`) to be **read-only** queries against the SQLite database.
    -   Remove all code that requires walking the filesystem or parsing files during an HTTP request.
    -   The in-memory cache (`G`) may still be used for frequently accessed data, but it will be populated from SQLite, not the filesystem.

### Priority 2: Go Links UX Improvements

**Goal:** Make the powerful "go link" feature more intuitive and user-friendly.

-   **Tasks:**
    -   **UI:** On page load, query the SQLite index to check if a `[[go]]` or `#go` link exists for the current node.
    -   **UI:** Pass a flag to the template to conditionally enable or disable the "Go" button.
    -   **UI:** Update the button's tooltip to reflect its state (e.g., "No go link defined").
    -   **CSS:** Add a special class to visually highlight subnodes that contain a go link definition, making them easier to spot.
    -   **JS:** If a user clicks a disabled "Go" button or the action fails, flash a message explaining what happened.

### Priority 3: Conditional Autopull for Empty Nodes

**Goal:** Automatically enrich empty nodes by pulling relevant external content (Wikipedia, Fediverse) to provide immediate value. This will only trigger if a node has no subnodes of its own.

-   **Tasks:**
    -   **UI:** Add an "Autopull" toggle switch to the settings overlay (`overlay.html`).
    -   **State:** Manage the toggle's state in `settings.ts`, saving it to `localStorage`.
    -   **Logic:** In `main.ts`, use a `MutationObserver` to detect when the main node content has loaded.
    -   **Logic:** The observer will check if the "Autopull" setting is enabled and if the node is empty (has no `.subnode` elements).
    -   **Logic:** If conditions are met, programmatically "click" the summaries for the Wikipedia section and any un-pulled Mastodon embeds.
    -   **UX Feedback:** Display a toast notification to inform the user that content is being autopulled.

### Priority 4: Collaborative Features (The Read-Write Web)

**Goal:** Close the loop on collaboration by allowing users to not just read, but actively "remix" and evolve content found in the Agora. This draws inspiration from Ward Cunningham's vision of the [Federated Wiki](http://fed.wiki.org/view/welcome-visitors), where copying is the first step of conversation.

-   **Feature: "Fork to Garden"**
    -   **Concept:** A user viewing a subnode (e.g., a note by `@flancian`) can click a "Fork" button. This action copies the content into their own hosted garden (e.g., `garden/my-user/forked-node.md`), preserving a backlink to the original source (`[[pushed from]]` or similar).
    -   **Flow:**
        1.  **UI:** Add a "Fork" (or "Remix") button to the subnode footer.
        2.  **Auth:** Check if the current viewer is logged in (via the Bullpen/Forgejo auth). If not, prompt to login/signup.
        3.  **Action:** The Agora Server (or Bridge) retrieves the raw content of the target subnode.
        4.  **Write:** It writes a new file to the user's garden via the Bullpen API or direct filesystem access (if hosted).
        5.  **Edit:** The user is immediately redirected to the **Bullpen** editor with the new file open, ready to annotate or modify.
    -   **Attribution:** The system automatically prepends/appends metadata citing the original author, maintaining the lineage of ideas.

### Priority 5: Semantic Search (The Compass)

**Goal:** Move beyond exact string matching to connect thoughts that are semantically related but phrased differently (e.g., linking "collaborative cognition" with "group thinking").

-   **Technology: `sqlite-vec`**
    -   We can integrate [sqlite-vec](https://github.com/asg017/sqlite-vec), a lightweight vector search extension for SQLite.
    -   **Process:**
        1.  **Embed:** The Bridge (background worker) uses a local embedding model (e.g., `all-MiniLM-L6-v2` via `sentence-transformers` or `llm` CLI) to generate a vector for each subnode's content.
        2.  **Store:** These vectors are stored in a virtual table in `agora.db` managed by `sqlite-vec`.
        3.  **Query:** When a user views a node, the Server queries this table for the "nearest neighbors" in vector space.
        4.  **Display:** These results are shown in a new "Related (Semantic)" section or merged into the existing "Related" list, creating a powerful discovery mechanism that acts as a compass through the knowledge graph.

### UI/UX Polish (Ongoing)

-   **Musical Side Quests:** Continue development of the ambient music player and other atmospheric features.
-   **Tooltip and UI Consistency:** Continue refining tooltips, button labels, and other UI elements for clarity and consistency.
