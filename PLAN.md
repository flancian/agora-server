# 🎵 Future Work

## Musical Side Quests

**Goal:** Enrich the Agora's atmosphere and provide tools for musical exploration.
**Priority: Low**

-   **Tasks:**
    -   **Ambient Music Toggle (In Progress):**
        -   Add a `🎵` toggle to the main action bar.
        -   When enabled, it will show a small, draggable mini-player that plays a looping, ambient MIDI track.
        -   The feature will use dynamic imports to load audio libraries on-demand, preserving initial page load speed.
        -   The player's state (on/off) and position will be saved to `localStorage`.
    -   **A/V Provider Tab (Next Up):**
        -   Create a new "Media" section alongside the existing AI, Web, and Wikimedia sections.
        -   Implement a tab for `chiptune.app`, which will be loaded on-demand into an iframe.
        -   The implementation will use the existing embeddability check to provide a graceful fallback if the site cannot be embedded.

## Go Links UX Improvements

**Goal:** Make the powerful "go link" feature more intuitive and user-friendly.
**Priority: Medium**

-   **Tasks:**
    -   **Backend: Ensure `#go` and `[[go]]` are equivalent.**
        -   Review the link detection logic in the backend to confirm that both `#go` and `[[go]]` are treated as valid ways to define a go link.
    -   **UI: Make the "Go" Button Smarter.**
        -   The frontend should check if a valid go link exists for the current node.
        -   If a link exists, the button should be enabled. Consider changing its text to be more descriptive if possible (e.g., "Go to Source").
        -   If no link exists, the button should be disabled and have a tooltip explaining why (e.g., "No go link defined in this node").
    -   **UI: Provide Feedback on Failure.**
        -   If a user clicks the "Go" button but no valid link is found, flash a message to the user explaining what happened instead of silently failing.
    -   **UI: Visually Highlight Go Link Definitions.**
        -   Apply a special CSS class or icon (e.g., ➡️) to subnodes that contain a `[[go]]` or `#go` definition, making them easier to spot when reading a node.

## Fediverse Integration (ActivityPub)

**Goal:** Integrate the Agora with the Fediverse, allowing Agora users to be followed and their contributions to appear as posts on platforms like Mastodon.
**Priority: Medium**

### Completed (October 2025)
-   ✅ **Actor Profile:** The `/u/<user>` endpoint now generates a valid ActivityPub actor profile, pulling the user's bio from `[[@user/bio]]`.
-   ✅ **WebFinger:** Users are discoverable via WebFinger (`.well-known/webfinger`).
-   ✅ **Dynamic Outbox:** The `/u/<user>/outbox` endpoint serves a collection of the user's 20 most recent subnodes as `Create` activities.
-   ✅ **Source Links:** All federated posts now include an HTML link back to the original subnode in the Agora.
-   ✅ **Inbox and Follows:** The `/u/<user>/inbox` endpoint correctly handles `Follow` activities, stores follower relationships in the database, and sends back an `Accept` confirmation.
-   ✅ **Welcome Package:** Upon a successful follow, the Agora sends the 5 most recent, previously unfederated subnodes to the new follower. This is controlled by the `ACTIVITYPUB_SEND_WELCOME_PACKAGE` feature flag.
-   ✅ **Federation Tracking:** A new `federated_subnodes` table in the database tracks which subnodes have been sent to prevent duplicates.

### Next Steps
-   **Real-time Push:** The most important next step is to move from a pull/welcome-only model to a push model. New and updated subnodes should be pushed to the inboxes of all of a user's followers in near real-time.
-   **Federate Stars as Likes:** Implement the logic in the `star_subnode` function to send a `Like` activity to the original author's server when a user stars a subnode. This makes the Agora an active participant, not just a publisher.
-   **Handle More Incoming Activities:**
    -   **Undo(Follow):** The inbox should handle `Undo` activities to correctly process unfollows.
    -   **Like/Announce:** The inbox should be able to receive `Like` and `Announce` (boost/repost) activities from other servers and potentially represent them in the Agora UI.
-   **Federate Replies and Mentions:**
    -   Parse subnode content for `@user@domain` mentions.
    -   If a subnode is a reply to a Fediverse post, it should be sent with the `inReplyTo` field pointing to the original post.
-   **UI Enhancements:**
    -   Add UI elements to a user's profile page to show their follower/following counts.
    -   Consider adding a "Federate" button to subnodes for manual sharing.


# ✅ Completed Work: Refactoring `main.ts`

**Goal:** Improve maintainability of the frontend code by breaking up the monolithic `main.ts` file.
**Date:** 2025-09-28

-   **Summary:**
    -   The `main.ts` file had grown to over 2500 lines, making it difficult to navigate and maintain.
    -   Identified several self-contained features that could be extracted into their own modules.
-   **Actions Taken:**
    -   Created a new `app/js-src/util.ts` for shared utility functions like `safeJsonParse` and constants like `CLIENT_DEFAULTS`.
    -   Extracted all settings and `localStorage` management into `app/js-src/settings.ts`.
    -   Created a reusable `makeDraggable` function in `app/js-src/draggable.ts` and refactored the three draggable UI components (Hypothesis, Agora Meditation, Music Player) to use it.
    -   Moved the "Agora Meditation" / "Demo Mode" feature into `app/js-src/demo.ts`.
    -   Moved the subnode starring feature into `app/js-src/starring.ts`.
    -   Moved the ambient music player feature into `app/js-src/music.ts`.
-   **Outcome:**
    -   Reduced `main.ts` from over 2500 lines to approximately 1700 lines.
    -   Extracted over 650 lines of code into new, feature-specific modules, improving code organization and separation of concerns.
    -   `main.ts` now acts as a high-level orchestrator, initializing the various modules.