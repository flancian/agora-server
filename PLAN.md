# Agora Development Plan

This document outlines the future work for the Agora project, with a focus on the architectural split between the `agora-server` (this repository) and the `agora-bridge`.

## Core Architecture: The Server/Bridge Split

The Agora is composed of two primary components:

-   **Agora Server:** A user-facing Flask web application. Its sole responsibility is to handle HTTP requests, query for data, and render HTML as quickly as possible. It is the **read-only** and **request-handling** layer.
-   **Agora Bridge:** A background worker application. Its responsibility is to perform slow, asynchronous, and state-changing tasks, such as indexing content, pulling from external sources, and pushing updates to the Fediverse. It is the **write-only** and **processing** layer.

All future development should respect this separation of concerns.

---

## Agora Bridge (The Worker)

*The following tasks belong to the `agora-bridge` repository and component.*

### Priority 1: Full Content Indexing Engine

**Goal:** Create a comprehensive SQLite index of all content in the Agora to enable powerful new features and dramatically improve performance for complex queries.

-   **Tasks:**
    -   Implement a filesystem watcher to detect changes to subnodes in real-time.
    -   On change, parse the subnode and update a series of tables in the `agora.db` SQLite database (e.g., `subnodes`, `links`, `tags`).
    -   Integrate SQLite's FTS5 extension to build a full-text search index of all subnode content.
    -   The Bridge will be the **only** component with write access to this database.

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

### Priority 1: Transition to SQLite as Primary Data Source

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

### UI/UX Polish (Ongoing)

-   **Musical Side Quests:** Continue development of the ambient music player and other atmospheric features.
-   **Tooltip and UI Consistency:** Continue refining tooltips, button labels, and other UI elements for clarity and consistency.

---

## ✅ Completed Work

*This section tracks major completed initiatives.*

### Fediverse Integration (October 2025)
-   ✅ **Actor Profile:** The `/u/<user>` endpoint now generates a valid ActivityPub actor profile.
-   ✅ **WebFinger:** Users are discoverable via WebFinger.
-   ✅ **Dynamic Outbox:** The `/u/<user>/outbox` serves a user's 20 most recent subnodes.
-   ✅ **Inbox and Follows:** The server correctly handles `Follow` activities and sends an `Accept` confirmation.
-   ✅ **Welcome Package:** New followers receive the 5 most recent, unfederated subnodes.
-   ✅ **Federation Tracking:** A database table tracks federated subnodes to prevent duplicates.

### Code Refactoring (September 2025)
-   ✅ **`main.ts` modularization:** Broke up the monolithic `main.ts` file into smaller, feature-specific modules (`settings.ts`, `demo.ts`, `draggable.ts`, etc.), reducing the file size by over 30% and improving maintainability.