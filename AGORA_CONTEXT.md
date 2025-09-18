# Agora Server: Key Context & Architectural Decisions (as of 2025-09-18)

*This document summarizes the key operational and architectural context established during a collaborative development session. Its purpose is to serve as a briefing for future work on this Agora instance.*

## Guiding Philosophy

The Agora is a distributed knowledge graph, intended to connect individual "digital gardens" into a collaborative commons. The core design principle is that the filesystem is the source of truth, with databases and other technologies acting as performance-enhancing indexes, not the primary store of knowledge. This ensures the Agora remains portable, resilient, and grounded in simple, human-readable files.

## Production Environment & Deployment

The production environment is managed by `systemd` and served by `uWSGI`, as configured in `agora-server.service` and `prod.ini`.

### Key Insight: Zero-Downtime Rolling Restarts

The most critical and hard-won piece of knowledge from this session is the correct procedure for **zero-downtime, graceful, rolling restarts**.

**The Correct Workflow:**
```bash
# To deploy updates without interrupting service:
systemctl --user reload agora-server
```

**How It Works (The Final, Correct Implementation):**

1.  **Trigger**: `systemctl reload` touches the file specified in `touch-chain-reload` in `prod.ini`.
2.  **Chain Reload**: `chain-reload = true` tells the uWSGI master to reload workers **one by one**.
3.  **Lazy Loading**: `lazy-apps = true` ensures each new worker loads the updated application code from scratch.
4.  **Blocking Cache Warmup**: This is the crucial step. The application's `create_app()` function in `app/__init__.py` contains a blocking call to warm the in-memory caches (`G.nodes()`, `G.subnodes()`). This code only runs in uWSGI workers (`if uwsgi.worker_id() > 0:`).
5.  **The Wait**: Because the cache warming is a mandatory part of the application's startup, the uWSGI master process is **forced to wait** for the multi-second warmup to complete before it considers the new worker "ready". It then proceeds to the next worker.

This configuration guarantees that new workers are fully "warmed up" and ready for traffic before they replace old ones, preventing performance degradation during a deploy.

## Caching Architecture

The Agora uses a two-tier caching system to ensure performance:

1.  **L1 Cache (In-Memory)**: A `cachetools` TTL cache on the `G` (Graph) object. This provides the fastest possible access for live requests within a single worker process. It is cleared on every application restart.
2.  **L2 Cache (SQLite)**: A persistent SQLite database (`instance/agora.db`) that stores the serialized results of expensive filesystem scans.

**The Performance Bug We Fixed:**
We diagnosed and fixed a major performance issue where the in-memory cache was being populated twice on the first request after a flush (a "double deserialization"). This was resolved by refactoring `app/graph.py` to have a single, cached internal function (`_get_all_nodes_cached`) that performs the expensive loading, which is then called by a simple, non-cached public function (`nodes`).

## Project Roadmap

The immediate priorities for the project are documented in `PLAN.md` and include:
1.  Implementing a comprehensive `pytest` test suite.
2.  Adding a "Star Nodes" feature for user-specific bookmarks.
3.  Adding detailed performance logging to filesystem operations to quantitatively compare them against the SQLite cache.
