# Next Steps for the Agora

*Captured on 2025-12-22 after the successful launch of Hosted Gardens provisioning.*

## 1. The "Bullpen" (Editor) Deployment
*   **Context**: We wrote `agora-bridge/bullpen/bullpen.py` (a multi-tenant proxy manager) and an Nginx config, but haven't deployed it.
*   **Goal**: Make `edit.anagora.org` functional so hosted users can edit their files immediately.
*   **Tasks**:
    *   Install `bull` binary on the server.
    *   Set up systemd service for `bullpen.py`.
    *   Configure Nginx/Traefik to route `edit.anagora.org` to the Bullpen port.

## 2. Federation Verification (ActivityPub)
*   **Context**: We re-enabled the federation worker code (`ENABLE_FEDERATION_WORKER`) and fixed the process spawning logic.
*   **Goal**: Verify that the Agora is actively broadcasting to the Fediverse.
*   **Tasks**:
    *   Check `agora-server` logs for federation activity.
    *   Verify Actor endpoints.
    *   Test "Welcome Package" delivery for new followers.

## 3. Graph Robustness (Local Bundling) - DONE
*   **Context**: The `force-graph` visualization library in `base.html` relies on `unpkg.com`, which has had outages. It is currently commented out.
*   **Goal**: Restore the knowledge graph visualization.
*   **Tasks**:
    *   [x] Download `force-graph` and its dependencies.
    *   [x] Bundle them into `app/static/js/`.
    *   [x] Update `base.html` to load locally.

## 4. Documentation & Cleanup - DONE
*   **Tasks**:
    *   [x] Review `DONE.md` and consolidate session logs.
    *   [x] Ensure all new env vars (`AGORA_FORGEJO_*`) are documented in `agora-bridge/README.md`.

## 5. The N-Fold Exploration (High Priority)
*   **Context**: A strategic philosophical pivot to make the Agora more playful, resilient, and "alive".
*   **Goal**: Weave these three pillars into the Agora experience:
    1.  **AI Mode (Ambient Agora)**: Implement a mode where the Agora navigates itself, synthesizes thoughts, and leaves "glowing notes" for users to discover.
    2.  **Playful Interactions / Adventure UI**: Introduce MUD-like mechanics (inventory, quests, map traversal) to turn knowledge exploration into play.
    3.  **True P2P / agor.ai**: Deepen the structural commitment to the Agora Protocol by supporting decentralized `*.agor.ai` instances and prioritizing client-side, peer-to-peer federation (ATProto/IPFS) so the graph doesn't rely solely on a central server.