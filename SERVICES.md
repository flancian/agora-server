# Agora Services & Worker Architecture

This document outlines the ideal process architecture for running a production Agora, including the division of responsibilities between `agora-server` and `agora-bridge`.

## Service Architecture

In a production environment, the Agora consists of the following persistent services, ideally orchestrated via `systemd` or `docker-compose`.

### 1. Agora Server (Frontend & Core Logic)
*   **Role:** Serves the Web UI, API, and Federation endpoints.
*   **Process:** `uwsgi` (production) or `flask run` (dev).
*   **Port:** 5017 (internal/proxied).
*   **Dependencies:** `agora.db` (SQLite), `~/agora` (Filesystem).

### 2. Agora Server Worker (Internal Consistency)
*   **Role:** Maintains the internal state of the Agora graph and search indices.
*   **Process:** `scripts/worker.py` (Python).
*   **Schedule:** Periodic (e.g., every minute) or event-driven.
*   **Responsibilities:**
    *   **Full Text Search (FTS):** Rebuilds the `subnodes_fts` table from file content.
    *   **Graph Index:** Rebuilds `subnodes` and `links` tables for fast backlink/graph queries.
    *   **Cache Warming:** Regenerates expensive queries (see below) to prevent latency spikes for users.
    *   **Federation Broadcasting:** (Optional) Can run the broadcasting loop if not separated.

### 3. Agora Bridge (Integrations & Sync)
*   **Role:** Handles external interactions and privileged filesystem operations.
*   **Process:** `uwsgi` or `python api/agora.py`.
*   **Port:** 5018 (internal).
*   **Responsibilities:**
    *   **Provisioning:** Creating new gardens (`git clone`).
    *   **API Gateway:** receiving webhooks.

### 4. Agora Bridge Worker (External Sync)
*   **Role:** Manages data synchronization with the outside world.
*   **Process:** `push_gardens.sh` (Bash) or a future Python worker.
*   **Responsibilities:**
    *   **Pusher:** Periodically runs `git push` for hosted gardens.
    *   **Puller:** Periodically runs `git pull` for external gardens.
    *   **Bots:** Runs social media bots (Mastodon, Twitter, Bluesky).

---

## Worker Responsibilities: Cache Regeneration

To ensure a snappy user experience, the **Agora Server Worker** (`scripts/worker.py`) performs a "Full Reindex" cycle. This cycle must not only rebuild the graph but also explicitly regenerate and cache the results of expensive queries.

### The Reindex Loop

1.  **Build Graph:** Scan filesystem, update `subnodes`, `links`, and `subnodes_fts` tables.
2.  **Invalidate Caches:** Clear `query_cache` entries that are stale.
3.  **Regenerate Queries:**
    *   `/latest` (`api.latest(1000)`): Computes the most recent 1000 subnodes.
    *   `/nodes` / `top` (`api.top()`): Computes node sizes and ranks.
    *   `all_users` (`api.all_users()`): Lists all active users.
    *   `all_journals` (`api.all_journals()`): Aggregates all journal entries.
4.  **Federation Pass:** (If enabled) Broadcast new local posts to followers.

### Implementation Details

*   **Location:** `app/storage/maintenance.py` -> `run_full_reindex`.
*   **Mechanism:** Calls `sqlite_engine.save_cached_query` or triggers the `api` functions which write-through to the cache.

---

## Deployment (Ideal State)

We aim to consolidate these services into a `docker-compose.yml` located in the root `~/agora` repository (or a dedicated `agora-ops` repo).

```yaml
version: '3.8'
services:
  server:
    build: ../agora-server
    volumes:
      - ./data:/data
    ports:
      - "5017:5017"
  
  worker:
    build: ../agora-server
    command: ["uv", "run", "scripts/worker.py"]
    volumes:
      - ./data:/data

  bridge:
    build: ../agora-bridge
    volumes:
      - ./data:/data
    ports:
      - "5018:5018"

  bridge-worker:
    build: ../agora-bridge
    command: ["./push_gardens.sh"]
    volumes:
      - ./data:/data
```
