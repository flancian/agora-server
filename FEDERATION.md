# Agora Federation

The Agora supports a basic level of ActivityPub federation, allowing users from other federated platforms (like Mastodon, Pleroma, etc.) to follow and receive updates from users within the Agora.

This document outlines the current implementation.

## Key Endpoints

### WebFinger

-   **Endpoint:** `/.well-known/webfinger?resource=acct:<user>@<domain>`
-   **Purpose:** Allows users on other servers to discover Agora users. When a remote user searches for `@<user>@<your.agora.domain>`, their server queries this endpoint.
-   **Implementation:** The Agora checks if the requested user exists. If they do, it returns a JSON response containing a link to the user's ActivityPub profile (`actor`) URL.

### Actor Profile

-   **Endpoint:** `/users/<username>` (also aliased to `/u/<username>`)
-   **Purpose:** Provides the ActivityPub actor profile for an Agora user. This is a machine-readable JSON object that describes the user.
-   **Implementation:** The profile includes:
    -   The user's unique `id`.
    -   Their `preferredUsername`.
    -   Links to their `inbox` and `outbox`.
    -   A link to their human-readable Agora profile page (`/u/<user>`).
    -   A public key (`publicKeyPem`) for verifying signed requests.

### Inbox

-   **Endpoint:** `/u/<user>/inbox` (POST)
-   **Purpose:** Receives activities from other servers.
-   **Implementation:**
    -   Handles `Follow`, `Like`, `Create` (Reply), and `Announce` (Boost) activities.
    -   Incoming requests are verified using HTTP Signatures.
    -   **Follow:** Adds the follower to the database and sends an `Accept` activity back.
    -   **Reactions:** Stores Likes, Replies, and Boosts in the `reactions` table in SQLite.

### Outbox

-   **Endpoint:** `/u/<user>/outbox` (GET)
-   **Purpose:** Shows a collection of the user's recent public activities.
-   **Implementation:**
    -   It returns an `OrderedCollection` of the user's 20 most recent subnodes, formatted as `Create` activities wrapping a `Note` object.
    -   Each `Note` object has a stable, unique ID (`/u/<user>/note/<path>`) that returns the ActivityPub JSON representation, ensuring compatibility with Mastodon and other platforms.

## Federation Logic

### Following a User

1.  A user on a remote server follows an Agora user.
2.  The remote server sends a `Follow` activity to the Agora user's inbox.
3.  The Agora validates the activity (HTTP Signature) and adds the follower to its database.
4.  The Agora sends an `Accept` activity back to the remote server.
5.  Immediately after sending the `Accept`, the Agora sends the new follower the **5 most recent subnodes** from the followed user. This is to populate the new follower's timeline with some initial content.

### Sending Posts (Federating)

-   **Initial Posts:** As described above, the 5 most recent posts are sent to new followers.
-   **Worker Process:** To automatically push new content to existing followers, you must run the **Federation Worker**.
-   **Tracking:** The Agora tracks which subnodes have been federated in a dedicated SQLite table (`federated_subnodes`). This prevents sending the same subnode to the same follower multiple times.

### Running the Federation Worker

The federation worker is a separate process that polls the Git repositories for new commits and broadcasts them to followers.

**Manual Run (Single Pass):**
```bash
uv run python3 scripts/federation_worker.py --once
```

**Continuous Loop (Default Interval: 5 minutes):**
```bash
uv run python3 scripts/federation_worker.py
```

**Systemd Service:**
It is recommended to run this as a systemd service (e.g., `agora-federation.service`) to ensure it runs continuously in the background.

### Security

-   **Keys:** The Agora automatically generates a `private.pem` and `public.pem` key pair on first run if they don't exist.
-   **Signed Requests:** All outgoing activities (like `Accept` and `Create`) are signed with the user's private key. Remote servers can fetch the public key from the actor profile to verify that the requests are legitimate.
-   **Incoming Verification:** The Inbox strictly validates HTTP Signatures on incoming requests to prevent spoofing.
