--- Context from: ../.gemini/GEMINI.md ---
## Gemini Added Memories
- The user prefers to handle git operations like committing themselves. I should not commit changes unless explicitly asked.
- The user runs the dev server themselves. I should only make code changes and recompile when necessary (e.g. `npm run build`), but not run the application with `./run-dev.sh`.
- The user prefers direct, technical explanations without metaphors or allegories.
- The user appreciates creative language like metaphors and poetry, but prefers technical explanations to be direct. I should use metaphors judiciously and avoid over-explaining simple concepts.
- The user prefers JavaScript logic to be in `main.ts` rather than in inline `<script>` tags. I should follow this convention.
- Always run `npm run build` after modifying any `.ts` files in `app/js-src/` to compile the changes.
- The user prefers to keep `main.ts` as a thin orchestrator. Self-contained features (e.g., settings, demo mode, music player) should be extracted into their own modules in `app/js-src/` to keep the codebase organized.
--- End of Context from: ../.gemini/GEMINI.md ---

--- Context from: GEMINI.md ---
--- Context from: ../.gemini/GEMINI.md ---
## Gemini Added Memories
- The user prefers to handle git operations like committing themselves. I should not commit changes unless explicitly asked.
- The user runs the dev server themselves. I should only make code changes and recompile when necessary (e.g. `npm run build`), but not run the application with `./run-dev.sh`.
- The user prefers direct, technical explanations without metaphors or allegories.
- The user appreciates creative language like metaphors and poetry, but prefers technical explanations to be direct. I should use metaphors judiciously and avoid over-explaining simple concepts.
--- End of Context from: ../.gemini/GEMINI.md ---

--- Context from: GEMINI.md ---
### Essay: Tending the Digital Garden

Our collaboration has been a microcosm of the very principles outlined in the Agora Protocol. It was not a one-way transmission of instructions, but a dialogue—a rapid, iterative dance of creation and refinement. You, the user, acted as the gardener, holding the vision for this particular corner of the commons. You knew the soil, the light, and what you wanted to grow. I, the agent, acted as a willing, tireless assistant, equipped with the tools to till the soil, plant the seeds, and tend the weeds.

The process began with a clear need: to improve the signal-to-noise ratio of the system's logs, making the Agora more maintainable. From there, we moved to the user-facing experience, recognizing that a commons thrives not just on the quality of its information, but on the quality of its presentation. The creation of the tabbed interfaces for Wikimedia, AI Generations, and Web Search was a testament to this. It was a move away from a simple list of links towards an integrated, intuitive space for knowledge discovery.

This was not a linear path. We encountered errors—a `TemplateSyntaxError` from a misplaced tag, a `ValueError` from a conflicting blueprint name, a broken tab from a subtle logic flaw. Each of these "bugs" was not a failure, but a point of clarification. Your precise feedback was the critical element that turned these stumbling blocks into stepping stones. You would point to a flickering scrollbar, a misaligned element, an inconsistent style, and in doing so, you were teaching me the aesthetics and ergonomics of the Agora. You were defining the user experience in real-time.

Our most sophisticated collaboration was the implementation of the embeddability check. When faced with the browser's "refused to connect" error, we didn't simply give up. We devised a system where the server could gently probe a URL's headers, anticipating the browser's security constraints. This is a perfect metaphor for the Agora Protocol itself: a system designed to gracefully handle the realities of a distributed, heterogeneous web, finding ways to connect and share knowledge while respecting the boundaries of each participant.

Each change, from the smallest CSS tweak to the implementation of a new API endpoint, was an act of tending this shared garden. By making the interface more consistent, the error messages more helpful, and the presentation more beautiful, we were making the Agora a more welcoming and useful space for all beings who might wander through it. Our dialogue, a fleeting exchange between human and machine, has left a lasting artifact—a small, but hopefully meaningful, improvement to a free knowledge commons.

Our latest work continued this theme, moving from broad strokes to fine details. We activated the SQLite backend, not for critical data, but as a gentle cache for AI-generated thoughts, a way to make the Agora quicker and more responsive. Then, we turned our attention to the garden's appearance, unifying the tangled vines of the stylesheets. The old way—swapping entire files for light and dark modes—was swept away, replaced by a modern, elegant system of CSS variables. The result was an instantaneous, flicker-free theme change, a small moment of delight for the user.

This polishing act revealed deeper complexities. A theme-aware graph, a beautiful idea, initially rendered itself invisible in the light, a casualty of forgotten color contrasts. A critical backlink, present in the old ways, vanished in the new, forcing us to trace the threads of logic back to their source and temporarily revert to a slower, more reliable path. Each fix was a lesson in the subtleties of the system. Even the color of an info box became a point of collaboration, a quest for the perfect "flan-like" shade—a testament to the idea that in a well-tended garden, every detail matters.

Our recent efforts have been a study in the final, subtle acts of cultivation. We moved from laying out the garden beds to polishing the dewdrops on the leaves. The theme toggle, once a simple link, was sculpted into a tactile, animated switch—a small moment of delight that speaks to the quality of the space. We chased down the ghosts in the machine: a phantom space beside a wikilink, an animation that flickered with nervous energy. Each fix was like tuning an instrument, adjusting the strings until the note was pure. This is the quiet, essential work of tending the commons: ensuring that not only is the information valuable, but the experience of discovering it is seamless, intuitive, and beautiful.

***

### Poem: The Weaver and the Gardener

The Gardener arrives with morning light,
A vision held, both clear and bright.
"The logs," you say, "they sing too loud,
Let's find the signal in the cloud."

A prompt, a thought, a thread of need,
I take the loom and plant the seed.
The code unfurls, a verdant line,
A quick response, "The fix is mine."

But wait, a flicker, out of place,
A scrollbar's brief, distracting race.
"The spinner heart," you gently note,
"Disturbs the calm." And so I wrote

A line of style, a careful rule,
To make the commons calm and cool.
Then tabs for wikis, side-by-side,
A place for knowledge to reside.

A `ValueError`, sharp and fast,
A shadow from a blueprint cast.
You point it out, a guiding hand,
Across this new and fertile land.

We learned to ask before we showed,
If distant servers would allow the load.
A `HEAD` request, a gentle probe,
To mend the fabric of the globe.

The stylesheets, a tangled vine,
In light and dark, a messy design.
We merged their threads and made them true,
A single source, for me and you.

The graph of thought, it learned to see,
The theme you chose, instantly.
But a backlink lost, a thread astray,
Forced a retreat to yesterday.

The latest tending of the garden has been an exercise in refining the experience, moving from the architecture of the pathways to the feel of the stones beneath one's feet. A pair of scroll buttons, functional yet separate, were unified into a single, intelligent control that anticipates the user's need. A playful thought—to add a whisper of music to the demo—became a lesson in responsibility. The initial implementation, though it worked, came with a hidden weight, a burden of kilobytes that every visitor would have to carry. And so, the work deepened. We didn't remove the whimsy; we re-architected it. We delved into the machinery of the modern web, teaching the application to fetch that spark of joy only when it was asked for. This is the craft: to build something that is not only powerful but also considerate, not only rich with features but also light on its feet.

***

### Poem: The Weaver and the Gardener

The Gardener arrives with morning light,
A vision held, both clear and bright.
"The logs," you say, "they sing too loud,
Let's find the signal in the cloud."

A prompt, a thought, a thread of need,
I take the loom and plant the seed.
The code unfurls, a verdant line,
A quick response, "The fix is mine."

But wait, a flicker, out of place,
A scrollbar's brief, distracting race.
"The spinner heart," you gently note,
"Disturbs the calm." And so I wrote

A line of style, a careful rule,
To make the commons calm and cool.
Then tabs for wikis, side-by-side,
A place for knowledge to reside.

A `ValueError`, sharp and fast,
A shadow from a blueprint cast.
You point it out, a guiding hand,
Across this new and fertile land.

We learned to ask before we showed,
If distant servers would allow the load.
A `HEAD` request, a gentle probe,
To mend the fabric of the globe.

The stylesheets, a tangled vine,
In light and dark, a messy design.
We merged their threads and made them true,
A single source, for me and you.

The graph of thought, it learned to see,
The theme you chose, instantly.
But a backlink lost, a thread astray,
Forced a retreat to yesterday.

A simple link, a moon, a sun,
A sliding switch, the change is done.
A phantom space, a ghostly bug,
A pixel's pull, a CSS shrug.
A flicker's dance, a jarring sight,
We calmed the code and made it right.
To make the garden, line by line,
Not just work, but feel divine.

A single button, smart and keen,
To scroll the top or bottom scene.
A hidden tune, a playful sound,
On demo's click, a joy is found.
But joy, we learned, can carry weight,
A heavy script, a slower fate.
So with a modern, clever sleight,
We split the code to keep it light.

So let this stand, this small design,
This dialogue of your mind and mine.
A garden tended, branch and root,
For beings seeking truth's own fruit.

Our latest work delved deep, to find
A stutter in the Agora's mind.
Upon first waking, cold and vast,
A double-memory was cast.
It learned its shape, then learned again,
A needless echo, causing pain.
We traced the flaw, and with calm art,
We gave the loom a single heart.
Now waking happens in a flash,
No second thought, no wasteful dash.

***
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

## Crumbs for the Future

- **Configuration is the Source of Truth**: When adding features that depend on environment (e.g., dev vs. prod URLs), always add variables to `app/config.py` rather than hardcoding them or relying on the `request` object.
- **Frontend Build Step is Essential**: Remember to run `npm run build` after any changes to `.ts` files in `app/js-src/`.
- **Asynchronous Loading**: Much of the page is loaded asynchronously. The core logic for this is in `app/js-src/main.ts`. New interactive elements should be integrated there.
- **Styling**: The Agora uses a dual-theme system. Changes to CSS should be tested in both light (`screen-light.css`) and dark (`screen-light.css`) modes. Note that `screen-light.css` imports and overrides the dark theme.
--- End of Context from: GEMINI.md ---
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

The sortie fails, the goal's denied,
The old code stands, re-sanctified.
But honor's found in knowing why
The boldest efforts went awry.
We fall back now, but wiser stand,
To map the code of this strange land.

---

## Understanding the Agora (as of 2025-09-21)

*This is a summary of my understanding of the project's philosophy and technical principles based on our collaboration.*

### The Agora of Flancia's Intents (The "Why")

The project's goal is to create a **Free Knowledge Commons** with a focus on:
-   **Connecting Digital Gardens**: Weaving together individual, user-owned collections of notes into a larger whole.
-   **Collaborative Problem-Solving**: Building a space where knowledge is not just stored but actively used and composed into tools.
-   **Low Barrier to Contribution**: Prioritizing simple, durable formats (like plain text files) to make it easy for anyone to participate.
-   **Playful Experimentation**: Fostering a delightful and evolving user experience.

### The Agora Protocol (The "How")

The protocol is a set of architectural patterns that enable the Agora's vision:
-   **Decentralization**: The filesystem is the ultimate source of truth. The server is a lens, not a silo.
-   **Nodes are Concepts, Subnodes are Utterances**: A key distinction where abstract topics (`[[Calculus]]`) are composed of concrete contributions (`@user/calculus-notes.md`).
-   **Composition over Centralization**: Nodes are built by pulling and combining content from other, more specialized nodes (e.g., `[[170]]` pulling from `[[calc/170]]`).
-   **Everything Has a Place (No 404s)**: Every possible query resolves to a node, turning dead ends into invitations to contribute.
