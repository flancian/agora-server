# Development Log

This file contains a log of development sessions, capturing key learnings, architectural insights, and summaries of changes. It is extracted from the more comprehensive `GEMINI.md.bak` file.

---

# Session Summary (Gemini, 2025-10-27)

*This section documents a collaborative session that involved fixing bugs on the `/journals` page, implementing a new "Node Starring" feature, and refactoring the underlying storage API for starring.*

## Key Learnings & Codebase Insights

-   **Jinja2 Template Context**: A bug on the `/journals` page was traced to an implicit context variable. The `journals.html` template was passed a `node` object (for `[[journals]]`), which was then implicitly available to the included `subnode.html` partial. The partial was designed to render all subnodes of any `node` in its context, causing the duplication. The fix was to simplify the partial to only ever render an explicitly passed `subnode`.
-   **JavaScript Event Handling (`preventDefault` vs. `stopPropagation`)**: When adding a click listener to an element inside a `<summary>` tag, `event.stopPropagation()` is not sufficient to prevent the parent `<details>` element from toggling. The browser's default action for the summary is triggered regardless. The correct solution is to use `event.preventDefault()` to explicitly stop this default action.
-   **CSS Layout in `<summary>`**: Attempting to use flexbox to right-align an element within a `<summary>` tag is notoriously difficult, as it interferes with the browser's rendering of the disclosure triangle ("zippy"). After several failed attempts with `display: flex` and `display: inline-flex`, the most pragmatic solution was to align the UI differently and place the star icon consistently next to the node/subnode title.

## Summary of Changes Implemented

1.  **Journals Page (`/journals`)**:
    -   **Bug Fix**: Fixed a bug where every date incorrectly displayed all subnodes from the `[[journals]]` node.
    -   **UI/UX**:
        -   Refactored the `journals.html` and `subnode.html` templates to provide a much cleaner, more readable layout for journal entries.
        -   Date headers are now links to the corresponding daily node.
        -   The page now correctly displays starring status for subnodes.

2.  **New Feature: Node Starring**:
    -   **Backend**:
        -   Added a `starred_nodes` table to the SQLite database.
        -   Created new API endpoints (`/api/star_node`, `/api/unstar_node`, `/api/starred_nodes`) to handle starring logic.
        -   Updated the main `node` view to pass starred node information to the template.
    -   **Frontend**:
        -   Added a star icon to the main node header in `node.html`.
        -   Updated `starring.ts` to handle click events for node stars, including the `preventDefault()` fix.
    -   **UI/UX**:
        -   Added a new "Starred Nodes" section to the `/starred` page.
        -   Refactored the `/starred` page to use collapsible `<details>` sections for starred subnodes, improving usability.

3.  **Code Refactoring**:
    -   **Storage Layer**: Moved all starring and unstarring logic for both nodes and subnodes from the Flask routes in `app/agora.py` into the `app/storage/sqlite_engine.py` module. This makes the API routes thinner and centralizes database interactions as requested.
    -   **UI Consistency**: To resolve CSS alignment challenges, the star icon for subnodes in the main node view was moved to be next to the author, creating a consistent visual pattern with the node star.

---
# Session Summary (Gemini, 2025-09-29)

*This section documents a collaborative debugging session focused on CSS layout, spacing, and JavaScript event handling.*

## Key Learnings & Codebase Insights

-   **CSS Spacing Strategy**: A critical distinction was clarified:
    -   The main content containers (`.content`, `.async-content`) use `display: flex` with a `gap: 10px` property. This is the **single source of truth** for spacing *between* major, top-level sections (e.g., `.genai`, `.web`, `.stoa`).
    -   Individual components that can appear in lists *within* a section (like `.subnode` or `.related`) require their own `margin-top` and `margin-bottom` to ensure consistent spacing *among themselves*.
    -   Attempting to apply a single spacing strategy to both cases leads to bugs like double margins or collapsed margins. The correct approach is to use the parent `gap` for top-level sections and child `margin`s for repeated items within a section.
-   **Structural Inconsistencies**: Debugging the `.related` nodes revealed that some templates (`related.html`) generate multiple sibling `<details>` elements, while others (`genai.html`) generate a single one. This structural difference explains why the parent `gap` property is insufficient for spacing the multi-element sections.
-   **JavaScript Event Handling**: Diagnosed and fixed several bugs related to missing or incorrect event listeners for dynamically created popups (Hypothesis, Meditation, Music Player). The key is to ensure the element ID in the HTML template matches the ID being targeted by the `getElementById` call in the corresponding TypeScript module.
-   **Async UI Pattern**: Implemented a user-friendly loading pattern for asynchronous content (Wikimedia section):
    1.  An initial placeholder with a "Loading..." message is rendered in the server-side template (`sync.html`).
    2.  CSS animations (`fade-in`, `fade-out`) are defined in `main.css`.
    3.  The placeholder is given a `.fade-in` class to appear smoothly.
    4.  The client-side TypeScript (`main.ts`) fetches the real content, adds a `.fade-out` class to the placeholder, and on the `animationend` event, replaces the content and adds a `.fade-in` class to the new element. This ensures a smooth, non-jarring transition for the user.

## Summary of Changes Implemented

1.  **AI Generations Prompt Display**:
    -   Modified the Mistral and Gemini API routes to return the full, historically accurate prompt used for a generation.
    -   Updated the SQLite schema and provider logic to cache the full prompt alongside the answer, ensuring data integrity.
    -   Updated the frontend to display the prompt in a collapsible `<details>` section.
2.  **Layout & Spacing Fixes**:
    -   **Context Section**: Adjusted the CSS to create a 70/30 split between the graph and the links section. The link lists were centered, made to share vertical space equally, and styled with custom scrollbars.
    -   **Global Spacing**: After a detailed debugging process, the correct spacing model was implemented. The parent containers' `gap` property now handles spacing for all top-level sections, while `.subnode`, `.pulled-node`, and `.related` elements have their own margins to ensure consistent spacing both between and within sections.
3.  **Bug Fixes & UI Polish**:
    -   Fixed the non-functional Hypothesis close button and settings toggle by re-implementing their event listeners in `main.ts`.
    -   Replaced the static "Annotate" button with a functional, synchronized toggle switch and moved it to the main toggle group.
    -   Customized the annotate toggle's CSS to use a consistent "pen" icon.
    -   Fixed a series of critical JavaScript crashes and layout breakages by restoring missing HTML elements (`#meditation-popup-container`, `#music-player-container`, `#async-content`) to `base.html` and correcting the overall template inheritance structure.
    -   Fixed the broken "Meditate" button by correcting its HTML ID to match what the JavaScript expected.
    -   Fixed a bug preventing interaction with the page when the music player was open.
    -   Fixed a bug causing the music player to default to the top-left corner.
    -   **Wikimedia Loading**: Implemented an animated loading placeholder for the Wikimedia section to prevent layout shifts and provide better user feedback.
4.  **Codebase & Process Improvements**:
    -   **Self-Correction**: Adopted a new internal rule to always use precise, context-heavy `replace` commands for modifying existing files, and to use `write_file` only for creating new files, to prevent the kind of destructive errors that occurred during this session. A mandatory sanity check after each modification is now part of the workflow.

---
# Session Summary (Gemini, 2025-09-08)

*This section documents a collaborative development session focused on refining the "Demo Mode" and "Agora Meditation" features, along with several UI/UX bug fixes and improvements.*

## Key Learnings & Codebase Insights

-   **CSS Flexbox Behavior**: The mobile navbar bug, where toggles were overlapping, highlighted the importance of `flex-shrink: 0;`. This property is essential for preventing flex items from shrinking below their minimum content size in a constrained space, providing a simple and targeted fix without altering the overall layout behavior.
-   **Event Handler Specificity**: A bug where closing the settings overlay would unintentionally cancel demo mode was traced to an overly broad `cancelOnInteraction` handler. The fix involved making the handler more specific, teaching it to ignore clicks originating from the burger menu button (`#burger`), thus preserving the user's intended state.
-   **Draggable UI Implementation**: Re-implementing the draggable functionality for the "Agora Meditation" popup reinforced a key pattern used elsewhere in the application (e.g., the Hypothesis panel). The critical step is to switch from static CSS positioning (like `top: 10%`) to `transform`-based positioning on the *first drag event*. This prevents the element from "jumping" to the cursor's position and ensures a smooth initial interaction. The element's final position is then persisted in `localStorage`.

## Summary of Changes Implemented

1.  **Demo Mode & "Agora Meditation" Refinements**:
    -   **Direct Toggle**: Removed the experimental logic that showed a popup before activating demo mode. The toggle in the navbar now directly and predictably enables or disables the mode.
    -   **Configurable Timeout**: Added a "Demo timeout" number input to the settings overlay, allowing users to control the duration before a random redirect. The value is saved to `localStorage`.
    -   **Synchronized Toggles**: Added a second, synchronized "Demo Mode" toggle to the settings overlay. Both toggles now update in unison and correctly reflect the application's state.
    -   **Draggable Popup**: The "Agora Meditation" popup was renamed (from "Demo Popup") and made draggable, with its position saved to `localStorage`. The semi-transparent background overlay was also removed to allow interaction with the main page.
    -   **Bug Fixes**:
        -   Fixed a bug that prevented the "Agora Meditation" popup from being draggable after its initial implementation.
        -   Fixed a bug where closing the settings overlay would unintentionally cancel demo mode.

2.  **UI/UX and Layout Fixes**:
    -   **Mobile Navbar**: Fixed a CSS bug causing the theme and demo toggles to overlap on narrow viewports by applying `flex-shrink: 0;`.
    -   **Settings Layout**: Reordered the toggles in the settings overlay to appear before their labels for better visual consistency with the checkboxes.
    -   **Footer Styling**:
        -   Removed the `font-style: italic;` rule from the footer for a cleaner look.
        -   Added a `margin-bottom` to the footer to create more visual space at the very end of the page.
---
# Session Summary (Gemini, 2025-08-28)

*This section documents a collaborative development session that focused on enabling and refining the new SQLite and CSS theming features, culminating in a successful production deployment.*

## Key Learnings & Codebase Insights

-   **Production Environment**: A key operational detail was clarified: the production Agora `anagora.org` runs using the `AlphaConfig` from `app/config.py`, not the `ProductionConfig`. This is critical information for any future deployments.
-   **SQLite Concurrency**: The use of `PRAGMA journal_mode=WAL;` in `app/storage/sqlite_engine.py` was confirmed to be the correct approach for handling concurrent read/write access from multiple `uwsgi` workers in production. This makes the SQLite backend safe for this deployment model.
-   **Iterative Debugging**: A significant portion of the session was dedicated to a tight loop of implementing features, identifying UI/UX bugs, and fixing them. This included:
    -   Fixing a recurring "flickering scrollbar" issue on spinner animations by applying `overflow-x: hidden` to the parent containers.
    -   Refining the layout of the "context" section to be a more usable side-by-side view.
    -   Debugging a theme-related JavaScript crash in the graph rendering logic caused by `undefined` color values, and making the code more robust.
-   **Code Readability**: A "teachable moment" occurred when a large, obfuscated third-party utility function (`pSBC`) was introduced for color manipulation. It was subsequently replaced with a smaller, clearer, and well-documented internal function (`darkenColor`), prioritizing long-term maintainability over a "clever" but opaque solution.

## Summary of Changes Implemented

1.  **SQLite AI Generation Caching**:
    -   Successfully enabled the SQLite backend for caching AI provider (Mistral, Gemini) responses.
    -   Added a `SQLITE_CACHE_TTL` configuration dictionary to `app/config.py` to control cache duration on a per-type basis.
    -   Extended the database schema with an `ai_generations` table.
    -   Refactored the AI provider logic into `app/providers.py`, unified under a caching decorator.

2.  **Major CSS and Theming Refactor**:
    -   **Completed** the unification of `screen-dark.css` and `screen-light.css` into a single `main.css`.
    -   Implemented a modern, flicker-free theming system using CSS Custom Properties (variables) and a `data-theme` attribute on the `<html>` tag.
    -   Refactored all relevant templates and JavaScript to support the new system.

3.  **Theme-Aware Graph Visualization**:
    -   The force-directed graph in the "context" section was refactored to be fully theme-aware.
    -   It now dynamically adjusts its colors (background, links, node labels) when the user toggles the theme, without requiring a page reload.
    -   Node label colors are now preserved and automatically darkened on the light theme to ensure readability.

4.  **Critical Backlink Bug Fix**:
    -   Diagnosed and fixed a critical issue where the on-demand SQLite indexing was failing to show all backlinks for a node.
    -   To ensure data correctness, the optimized SQLite query for backlinks was temporarily disabled in `app/graph.py`, reverting to the slower but reliable file-based method. A `TODO` was left to implement a full indexing strategy in the future.

5.  **UI/UX Polish**:
    -   Adjusted the spacing in the main navbar for better readability.
    -   Fine-tuned the dark mode colors for buttons and info boxes for better aesthetics and contrast, achieving a "flan-like" look.
    -   Fixed numerous layout and visibility bugs related to the new theming and graph rendering.
---
# Session Summary (Gemini, 2025-08-26)

*This section documents a collaborative development session focused on log cleanup and a major refactoring of the UI for embedded third-party content.*

## Key Learnings & Codebase Insights

- **UI Consistency is Key**: The session's main theme was refactoring disparate UI elements (`Wikipedia`, `Wiktionary`, `AI Generations`, `Web Search`) into a single, consistent, and reusable pattern.
- **New UI Pattern**: A new standard has been established for embedding external content:
    - A `<details>` element is used as the main container, allowing the section to be expanded and collapsed.
    - The `<summary>` contains a header and a series of tabs.
    - Each tab is a `<span>` with a `data-provider` attribute. This keeps the clickable tab separate from any external links.
    - The content for each provider is loaded on-demand into a corresponding `<div class="...-embed" data-provider="...">`.
- **Client-Side Logic**: The logic for this new pattern is handled in two places:
    1.  **`app/templates/sync.html`**: Contains the JavaScript to fetch the initial HTML for the Wikimedia section and attach the tab-switching event listeners.
    2.  **`app/js-src/main.ts`**: Contains the logic for the AI Generations and Web Search sections. This includes the `toggle` event listener to auto-load content when a section is expanded.
- **Jinja2 Templating**: The session highlighted the importance of careful conditional logic in Jinja2 templates. A mismatched `{% if %}` block caused a `TemplateSyntaxError` that was quickly resolved.

## Summary of Changes Implemented

### 1. Log Cleanup and Performance Timing
- **Reduced Verbosity**: Removed several redundant and noisy log messages from the application, particularly the "Initiating request" and "Assembled node" messages.
- **Streamlined Output**: Consolidated multi-line log entries for node assembly into single, more informative lines.
- **Performance Metrics**: Added detailed timing information to the logs for node assembly, including timings for each major stage of the process. This will be invaluable for future performance tuning.

### 2. Wikimedia Tabbed Interface
- **New UI**: Created a new tabbed interface for the Wikimedia section, allowing users to switch between Wikipedia and Wiktionary results.
- **Consistent Styling**: The new interface was styled to match the existing "AI Generations" section, creating a more unified look and feel.
- **User Settings**: The section now respects the "Embed Wikimedia" setting in the user's preferences, showing the summary by default and only embedding the content if the setting is enabled.
- **Dynamic Labels**: The tabs now dynamically display the title of the Wikipedia article or Wiktionary entry.
- **Graceful Fallback**: If no results are found for either Wikipedia or Wiktionary, a clear message is displayed instead of an empty section.

### 3. AI Generations UI Refactoring
- **Goal**: To make the "AI Generations" section consistent with the new Wikimedia tabbed interface.
- **Actions**:
    - Refactored `app/templates/genai.html` to use the new tabbed structure.
    - Updated `app/js-src/main.ts` to handle the new tab logic, including auto-pulling content when the section is expanded and displaying a loading spinner.
    - Fixed a bug where the spinner animation was causing a flickering horizontal scrollbar by adding `overflow-x: hidden` to the content container.

### 4. Web Results UI Refactoring
- **Goal**: To apply the same consistent tabbed interface to the "Web Results" section.
- **Actions**:
    - Overhauled `app/templates/web.html` to transform the list of links into a fully functional tabbed interface.
    - Each search provider is now a tab that loads an embedded `iframe` on demand.
    - Each tab is paired with a "⬈" link to allow users to easily open the search results in a new browser tab.
    - All providers, including Google Maps, are now integrated into the tab system for a consistent user experience.
- **Embeddability Check**:
    - Created a new API endpoint (`/api/check_embeddable`) that checks if a URL can be embedded in an iframe.
    - The frontend now calls this endpoint before attempting to embed content, showing a user-friendly message if embedding is blocked.
---
# Session Summary (Gemini, 2025-08-26)

*This section documents a collaborative development session focused on bug fixing and significant UI/UX enhancements, particularly for the settings and Hypothesis integration.*

## Key Learnings & Codebase Insights

- **CSS Layout & Positioning**: The session highlighted the complexities of CSS positioning, especially for overlays on a centered, responsive layout.
    - **Initial Problem**: The settings overlay (`.overlay`) was not aligned with the main content on wide screens and was partially visible when it should have been hidden.
    - **Evolution of the Solution**:
        1.  Initial attempts with JavaScript-based positioning caused flickering and were overly complex.
        2.  Attempts with pure CSS using `calc()` and `vw` units proved brittle and led to minor misalignments.
        3.  **Final, Robust Solution**: The key was to make the main `.content` div a positioning context (`position: relative`) and also a *clipping context* (`overflow-x: hidden`). The overlay was then placed inside `.content` and animated using the `left` property (`left: -100%` to `left: 0`). This CSS-only approach is efficient, eliminates flickering, and guarantees perfect alignment and hiding.
- **Hypothesis Integration**:
    - The integration is controlled by a feature flag (`ENABLE_HYPOTHESIS`) in `app/config.py`.
    - The Hypothesis client's UI can be injected into a specific container using the `externalContainerSelector` configuration in `app/templates/base.html`. This is essential for custom positioning and styling.
    - **Draggable UI**: A draggable panel was implemented from scratch for the Hypothesis client. The key components were:
        - A dedicated drag handle (`#hypothesis-drag-handle`).
        - TypeScript logic in `main.ts` to track mouse events (`mousedown`, `mousemove`, `mouseup`) and update the container's position using `transform: translate3d()`.
        - The final panel position is saved to `localStorage` and restored on page load, providing a persistent user experience.
- **API Interaction (Wikipedia)**:
    - Debugged and fixed the Wikipedia integration in `app/exec/wp.py`.
    - **Key Fix**: The Wikipedia API requires a `User-Agent` header for all requests. Failing to provide one results in a `403 Forbidden` error. Adding a proper header resolved the issue.
    - Error handling was also improved to be more specific, distinguishing between network errors, JSON parsing errors, and cases where no search results were found.

## Summary of Changes Implemented

1.  **Wikipedia Integration (`wp.py`)**:
    - Added a `User-Agent` header to all `requests.get()` calls to the Wikipedia API to fix ``403 Forbidden` errors.
    - Implemented more specific error handling to provide clearer feedback to the user.

2.  **Hypothesis Annotation Client**:
    - Re-enabled the client via a new `ENABLE_HYPOTHESIS` feature flag.
    - Implemented a "Show hypothes.is" checkbox in the settings overlay to toggle its visibility. The state is saved to `localStorage`.
    - Created a custom, **draggable panel** for the Hypothesis client to live in, complete with a title bar, drag handle, and close button.
    - The panel's position is now saved to `localStorage` and restored on subsequent page loads.

3.  **Settings Overlay (Burger Menu)**:
    - Undertook a significant refactoring of the overlay's CSS to fix a persistent alignment and visibility bug.
    - The final solution places the overlay inside the main `.content` div, which acts as a clipping and positioning context. This ensures the overlay is always perfectly aligned with the main content and is completely hidden off-screen when inactive.
    - The slide-in and slide-out animations were preserved and made more reliable.

4.  **Minor UI Tweaks**:
    - Added an icon to the "Source" button in the footer.
    - Removed separators between footer buttons for a cleaner look.
---
# Session Summary (Gemini, 2025-08-16)

*This section documents a collaborative development session focused on dependency modernization, new feature integration, and UI/UX refinements.*

## Project Understanding & Key Learnings

- **Primary Goal**: The Agora is a Flask-based server for a distributed knowledge graph, designed to connect "digital gardens" into a collaborative, problem-solving commons.
- **Tech Stack**: The project uses `uv` for Python dependencies, `npm` for frontend packages, Jinja2 for templating, and TypeScript (compiled to JS with `esbuild`) for client-side interactivity.
- **Architecture**: A key pattern is the **filesystem-as-database**, where Markdown/text files in user gardens are parsed to build the graph. Configuration is king, with `app/config.py` acting as the source of truth for feature flags, API keys, and environment URLs.
- **Development Workflow**:
    1.  Install dependencies: `uv sync` (Python) and `npm install` (JS).
    2.  Run the dev server: `./run-dev.sh`.
    3.  **Crucially**: After changing TypeScript files in `app/js-src/`, they must be re-compiled to JavaScript using `npm run build`.
    4.  Production deployment is managed by a `systemd` service (`agora-server.service`) which executes `run-prod.sh`. A typical deploy involves `git pull`, `uv sync`, and `systemctl --user restart agora-server`.

## Summary of Changes Implemented

### 1. Dependency Modernization: Poetry to `uv`
- **Goal**: Remove all traces of the old `poetry` dependency manager to align with the project's move to `uv`.
- **Actions**:
    - Deleted `poetry.lock`.
    - Updated `README.md` with `uv` installation and usage instructions.
    - Modified `entrypoint.sh` and `Dockerfile` to use `uv sync` instead of `poetry install`.
    - Confirmed `pyproject.toml` was already in a compatible format.

### 2. Feature: Gemini AI Integration
- **Goal**: Add Google's Gemini as a second AI provider alongside the existing Mistral implementation, with a clean user interface.
- **Actions**:
    - **Backend**:
        - Added `GEMINI_API_KEY` handling in `app/config.py`.
        - Added the `google-generativeai` library to `pyproject.toml` and installed it.
        - Implemented a `gemini_complete` function in `app/providers.py`.
        - Created a new, separate API endpoint `/api/gemini_complete/<prompt>` in `app/agora.py`.
    - **Frontend**:
        - Refactored `app/templates/genai.html` to use a **tabbed interface** for selecting between Mistral and Gemini.
        - Updated `app/js-src/main.ts` to handle tab clicks, fetch from the correct API endpoint, and load the content into a shared div.
        - Ensured the default provider (Mistral) loads automatically when the section is first expanded.
        - Re-added external links for ChatGPT and Claude with a "⬈" symbol to distinguish them.

### 3. UI/UX Refinements
- **"Agora Toggle" Link**: Modified the "⸎" link in the footer to be a true toggle. It now reads from `config.py` to link from the dev environment to production and vice-versa, preserving the user's context.
- **CSS Style Distinction**:
    - Refactored the styling for `.intro` and `.info-box` divs to create a clearer visual hierarchy for different types of messages.
    - Updated `app/templates/sync.html` to use the new `.intro` class for search-related feedback.
    - Adjusted styles in both `screen-dark.css` and `screen-light.css`, ensuring the logic was correct for both themes and respected the CSS import order.
