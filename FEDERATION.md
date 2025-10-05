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
-   **Purpose:** Receives activities from other servers, such as `Follow` requests.
-   **Implementation:**
    -   Currently, it only handles the `Follow` activity.
    -   When a `Follow` is received, the Agora adds the follower to the user's follower list in the SQLite database.
    -   It then dispatches a background task to send an `Accept` activity back to the follower's server to confirm the follow.

### Outbox

-   **Endpoint:** `/u/<user>/outbox` (GET)
-   **Purpose:** Shows a collection of the user's recent public activities.
-   **Implementation:**
    -   It returns an `OrderedCollection` of the user's 20 most recent subnodes, formatted as `Create` activities wrapping a `Note` object.
    -   This endpoint is primarily for other servers to pull a user's recent history; it does not actively push new content.

## Federation Logic

### Following a User

1.  A user on a remote server follows an Agora user.
2.  The remote server sends a `Follow` activity to the Agora user's inbox.
3.  The Agora validates the activity and adds the follower to its database.
4.  The Agora sends an `Accept` activity back to the remote server.
5.  Immediately after sending the `Accept`, the Agora sends the new follower the **5 most recent subnodes** from the followed user. This is to populate the new follower's timeline with some initial content.

### Sending Posts (Federating)

-   **Initial Posts:** As described above, the 5 most recent posts are sent to new followers.
-   **Tracking:** The Agora now tracks which subnodes have been federated in a dedicated SQLite table (`federated_subnodes`). This prevents sending the same subnode to the same follower multiple times (e.g., on a re-follow).
-   **Future Posts:** **Note:** The current implementation does *not* automatically push new subnodes to all followers as they are created. Federation of new content is not yet fully implemented. The `star_subnode` function contains a placeholder comment to federate a post when it's starred, but the logic is not yet active.

### Security

-   **Keys:** The Agora automatically generates a `private.pem` and `public.pem` key pair on first run if they don't exist.
-   **Signed Requests:** All outgoing activities (like `Accept` and `Create`) are signed with the user's private key. Remote servers can fetch the public key from the actor profile to verify that the requests are legitimate.
