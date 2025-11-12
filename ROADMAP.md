# Performance Improvement Plan

**Goal:** Eliminate the long server startup delay on a cold start while ensuring the Agora remains responsive and progressively builds its rich context data.

---

### Phase 1: The Fast, Shallow Scan (Instant Startup)
*   **Task:** Modify the initial graph build process (`_get_all_nodes_cached`).
*   **Change:** The scan will **only** read filenames to build the list of nodes and their associated subnodes. It will **not** read file contents or parse wikilinks.
*   **Benefit:** This will drop the server cold start time from ~40 seconds to just 1-2 seconds. The Agora will be "usable" for primary content immediately. The `links` table in the database will be empty at this stage.

---

### Phase 2: Background Link Indexing (The Slow Work)
*   **Task:** Implement a background worker thread within the main server process.
*   **Change:** This worker will be responsible for the slow task of reading every subnode's content and populating the `links` table in the database. We will use the robust "Expiring SQLite Lock" mechanism we discussed to ensure only one worker runs this task, even in a multi-process environment.
*   **Benefit:** The expensive indexing work is moved out of the startup path and happens in the background without blocking the server.

---

### Phase 3: The "Smart" Context Endpoint (Graceful Degradation)
*   **Task:** Modify the existing `/context/<node>` endpoint.
*   **Change:** When a request comes in, the endpoint will first check the `links` table.
    *   If the links for that node **are present**, it will return the fully rendered context immediately.
    *   If the links **are not yet present** (because the background worker hasn't processed them yet), it will fall back to the old, slower method of scanning files on-demand for just that request.
*   **Benefit:** The "Context" section will always show correct data. It might be slow to load for the first few users while the background indexing is in progress, but it will never be incorrectly empty. As the background worker fills the database, this endpoint will get progressively faster.