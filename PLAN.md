

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
