

# 🎵 Future Work: Musical Side Quests

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
