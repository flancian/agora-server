# 🚀 High Priority: Implement On-Demand Hybrid SQLite Index

**Status: In Progress**
**Priority: High**

This document outlines the plan to implement a hybrid storage system where the filesystem remains the source of truth for content, and an SQLite database is used as a **high-performance, on-demand index** for metadata and computed byproducts. This approach will dramatically improve performance and scalability while preserving the core philosophy of the file-based Agora and eliminating the need for a separate indexing process.

---

## ✅ Completed Steps

-   **Feature Flag:** Added an `ENABLE_SQLITE` flag in `app/config.py` to control the entire feature. It is enabled by default in development environments.
-   **Robust DB Engine:** Re-architected `app/storage/sqlite_engine.py` to be fully thread-safe using Flask's application context (`g`). It now gracefully handles read-only filesystems and manages the database schema, including migrations.
-   **Optimized Schema:** Implemented a schema for `subnodes` and `links`, including a `source_node` column in the `links` table to allow for highly efficient backlink queries.
-   **On-Demand Indexing:** Implemented the core "write-through cache" logic in `app/graph.py`. Indexing now happens efficiently on-demand when a node is viewed, not during a slow initial scan.
-   **Performance Fix:** The `back_nodes` method in `app/graph.py` was refactored to query the SQLite index directly, resolving a major performance bottleneck and application hangs.
-   **Bug Squashing:** Debugged and fixed a series of follow-up issues, including `IntegrityError` from duplicate links, `ProgrammingError` from incorrect thread handling, and multiple `AttributeError` exceptions from mismatched function names.

---

## Next Steps

The foundational work is complete, and the system is stable. The following tasks remain to fully realize the benefits of the SQLite index:

1.  **Implement Full-Text Search (FTS):**
    *   Create a virtual FTS5 table in the schema.
    *   Update the on-demand indexing logic to populate this table with subnode content.
    *   Modify `search_subnodes` in `app/storage/api.py` to query the FTS index instead of the filesystem for a massive search performance boost.

2.  **Cache Additional Queries:**
    *   Extend the on-demand caching to other expensive, file-based queries like `all_users()`, `latest()`, and `top()`.

3.  **Develop a Test Suite:**
    *   Create a formal test suite that can run against both the pure file engine and the hybrid SQLite engine to verify that they produce identical results.

4.  **Create a Backfill Script (Optional):**
    *   Write a simple, one-off command-line script to pre-populate the index for existing production Agoras. While not strictly necessary due to the on-demand nature, this would "warm up" the cache for large sites.

---

## Core Principles (Unchanged)

1.  **Files are the Source of Truth:** All user-generated content (subnodes) will continue to live as plain text files on disk.
2.  **SQLite is a Just-in-Time Index:** The database acts as a "write-through cache."
3.  **The Application is the Indexer:** There is no separate indexer script.

---

# 🚀 High Priority: Unify CSS Stylesheets and Implement Theming

**Status: Not Started**
**Priority: High**

This task outlines the plan to refactor the current dual-stylesheet (light/dark) system into a modern, single-stylesheet architecture using CSS Custom Properties (Variables). This will improve performance, simplify maintenance, and provide a better user experience.

---

## Goal

-   Eliminate the practice of swapping entire CSS files to change themes.
-   Consolidate all styles into a single, manageable stylesheet.
-   Implement a robust and instant theme-switching mechanism using CSS variables.

---

## Current Implementation (The Problem)

The Agora currently uses two separate stylesheets for theming:
-   `app/static/css/screen-dark.css` (Default theme)
-   `app/static/css/screen-light.css` (Overrides for the light theme)

A JavaScript function in `app/js-src/main.ts` dynamically changes the `<link>` tag's `href` attribute to point to the selected stylesheet. This is managed by a theme-switcher UI element.

**Drawbacks:**
-   **Flash of Unstyled Content (FOUC):** Swapping files can cause a noticeable delay or "flash" as the new stylesheet is loaded.
-   **Code Duplication:** `screen-light.css` contains many overrides, leading to duplicated selectors and making maintenance difficult. To change a style, a developer might need to edit it in two places.
-   **Complex Logic:** The JavaScript and Flask backend logic for managing two versioned files is more complex than necessary.

---

## Proposed Solution: CSS Custom Properties

The plan is to refactor the CSS to use a single file where themes are defined as palettes of CSS variables.

### Step-by-Step Plan

1.  **Consolidate Stylesheets:**
    *   Merge all styles from `screen-light.css` into `screen-dark.css`.
    *   Rename `screen-dark.css` to a more neutral name like `app/static/css/main.css`.

2.  **Define CSS Color Palettes:**
    *   In the new `main.css`, define the default (light) theme variables within the `:root` selector.
    *   Define the dark theme overrides under a `[data-theme="dark"]` attribute selector.

    ```css
    /* Default (light) theme */
    :root {
      --main-bg: #e9e9e9;
      --text-color: #000000;
      --link-color: #377ba8;
      --accent-bg: #F5F7FF;
      --border: #D8DAE1;
      /* ... and all other color variables ... */
    }

    /* Dark theme overrides */
    [data-theme="dark"] {
      --main-bg: #000;
      --text-color: #bfbfbf;
      --link-color: #9fc6e0;
      --accent-bg: #2B2B2B;
      --border: #666;
      /* ... and all other color variables ... */
    }
    ```

3.  **Refactor CSS to Use Variables:**
    *   Go through the consolidated `main.css` and replace all hardcoded color values with their corresponding `var(--variable-name)`.

    ```css
    /* Example Usage */
    body {
      background-color: var(--main-bg);
      color: var(--text-color);
    }

    a {
      color: var(--link-color);
    }
    ```

4.  **Update JavaScript Theme Switcher:**
    *   Modify the theme-switching logic in `app/js-src/main.ts`.
    *   Instead of changing the stylesheet `href`, the new code will toggle the `data-theme="dark"` attribute on the `<html>` or `<body>` element.
    *   The user's preference ('light' or 'dark') will still be saved in `localStorage`.

5.  **Update Backend and Templates:**
    *   Modify `app/templates/base.html` to link to the single, new stylesheet (`main.css`).
    *   Update the context processor in `app/__init__.py` to only provide a single CSS version, or simplify it as needed for the single file.

---

## Benefits of This Approach

1.  **Instant Theme Switching:** No network request is needed, so theme changes are immediate and seamless.
2.  **Simplified Maintenance:** All styles and color palettes are in one file, eliminating duplicated code and making updates much easier.
3.  **Cleaner Code:** The JavaScript becomes much simpler, and the backend logic for versioning is streamlined.
4.  **Future-Proof:** This is the modern, standard way to handle theming and opens the door for more complex themes in the future (e.g., high-contrast, different colors).

---

# ✅ Completed: Graph Architecture Refactoring 

**Status: COMPLETED (August 2025)**

This document outlines the completed refactoring to improve the Agora's architecture by centralizing graph operations into `app/graph.py`.

## ✅ Completed Architecture Changes

### New Clean Separation of Concerns

**Before:** `app/storage/file_engine.py` handled both data access AND graph logic (~1500 lines)

**After:** Clean separation across three files:

- **`app/graph.py` (NEW - Core Graph Module):** Contains `Graph`, `Node`, `Subnode`, `User` classes with comprehensive type hints. This is now the central API for all graph operations.

- **`app/visualization.py` (RENAMED from `app/storage/graph.py`):** Handles visual graph representation (RDF, Turtle, JSON for D3.js force graphs).

- **`app/storage/file_engine.py` (STRIPPED DOWN):** Now only handles file I/O operations (~247 lines). No knowledge of Graph/Node concepts.

### ✅ Completed Tasks

**Phase 1: Architecture Restructure** 
- ✅ **Created `app/graph.py`:** Moved all core classes (`Graph`, `Node`, `Subnode`, `User`) with global `G` instance
- ✅ **Renamed `app/storage/graph.py` → `app/visualization.py`:** Clear separation of graph logic vs. visualization
- ✅ **Stripped `app/storage/file_engine.py`:** Down to pure file operations (1500→247 lines)
- ✅ **Updated `app/storage/api.py`:** Now imports core classes from `app/graph`
- ✅ **Updated all imports:** `app/agora.py` and other files now reference correct modules

**Phase 2: Type Safety & Quality**
- ✅ **Added comprehensive type hints:** All key methods properly typed
  - `forward_links() -> List[str]` (wikilink strings)  
  - `forward_nodes() -> List[Node]` (actual Node objects)
  - `back_links() -> List[str]`, `back_nodes() -> List[Node]`
  - `subnodes() -> List[Subnode]`, `node(uri: str) -> Node`
  - All constructors and build functions properly typed
- ✅ **Backwards compatibility:** All existing imports still work through storage layer

**Phase 3: Bug Fixes & Integration**
- ✅ **Fixed graph visualization navigation:** Corrected TypeScript template strings in `main.ts`
- ✅ **Compiled TypeScript:** Fixed click handlers with `npm run build`
- ✅ **Import path corrections:** Fixed relative imports after moving `visualization.py`
- ✅ **Verified functionality:** Agora loads and graph visualization works correctly

## Benefits Achieved

1. **Cleaner Architecture**: Graph logic separated from file I/O
2. **Better Maintainability**: Core classes in dedicated `app/graph.py` 
3. **Type Safety**: Comprehensive type hints prevent runtime errors
4. **Zero Breaking Changes**: All existing code continues to work
5. **Future-Ready**: Foundation for GraphQL APIs, better testing, etc.

## 🚀 Performance Optimization Plan

**Phase 1 (Quick Wins - ✅ COMPLETED):**
- ✅ **Add HTTP caching headers to expensive endpoints** (`/graph/json/*`, `/graph/turtle/*`)
  - Individual nodes: 30 min - 1 hour cache
  - Full graph data: 2 hours cache (very expensive)
  - Added `Vary: Accept-Encoding` for compression compatibility
- ✅ **Enable gzip compression for large responses**
  - Added `flask-compress` dependency with uv
  - Automatic compression for JSON/text responses >500 bytes
  - Significant bandwidth savings for graph visualization data
- ✅ **Implement content-based TTL strategy**
  - `graph_json`: 7200s (2h) - expensive visualization data
  - `node_data`: 1800s (30m) - moderate node operations  
  - `subnodes`: 900s (15m) - file content changes
  - `search`: 300s (5m) - frequently changing results
  - Backwards compatible with existing random TTL

**Phase 2 (Medium-term):**
- [ ] Set up Redis cache layer for shared caching across instances
- [ ] Pre-compute and cache expensive graph operations
- [ ] Add ETag support for conditional requests

**Phase 3 (Long-term):**
- [ ] Background task processing for heavy operations
- [ ] Database query optimizations
- [ ] CDN integration for static graph data

## Next Steps (Future Work)

Additional improvements beyond performance:

- [ ] **Create comprehensive test suite** for `app/graph.py` classes
- [ ] **Template optimization**: Update Jinja2 templates to use Node objects vs strings where beneficial  
- [ ] **Remove deprecated methods**: Once call sites are updated, consider removing `forward_links` in favor of `forward_nodes`
- [ ] **GraphQL API**: The new structure makes this much easier to implement

---

# Codebase Analysis & Observations

*Added by Claude - comprehensive analysis for future developers*

## Project Overview

The **Agora Server** is a Flask-based web application that powers a distributed knowledge graph called an "Agora". It aggregates digital gardens and information sources, making them searchable and interlinked through a wiki-like interface with [[wikilinks]].

### Key Concepts
- **Nodes**: Core knowledge entities identified by wikilinks (e.g., [[foo]])
- **Subnodes**: Individual files/sources that contribute content to a node
- **Users/Gardens**: Contributors who maintain digital gardens
- **Graph**: The interconnected network of all nodes and their relationships

## Current Architecture

### High-Level Structure
```
app/
├── __init__.py          # Flask app factory
├── agora.py            # Main views and routing (primary controller)
├── config.py           # Environment-specific configurations
├── storage/            # Data layer abstraction
│   ├── api.py          # Storage engine adapter (file vs SQLite)
│   ├── file_engine.py  # File-based storage (primary implementation)
│   └── sqlite_engine.py # Alternative SQLite storage (incomplete)
├── templates/          # Jinja2 templates (extensive set)
├── render.py           # Markdown/content rendering with wikilink parsing
├── util.py             # Utility functions
├── exec/              # Executable node system (security-sensitive)
└── static/            # CSS, JS, images
```

## Key Architectural Patterns

### 1. Storage Engine Abstraction
- `app/storage/api.py` provides a clean adapter pattern
- Supports swapping between file-based and SQLite storage via `STORAGE_ENGINE` env var
- File engine is mature; SQLite engine needs completion

### 2. Content Processing Pipeline
1. **File Discovery**: Glob patterns find markdown files in configured directories
2. **Parsing**: Markdown rendered with custom wikilink extension
3. **Graph Building**: Links extracted and bidirectional relationships established
4. **Caching**: TTL caching at multiple levels to handle I/O-heavy operations

### 3. Template-Heavy Architecture
- 30+ Jinja2 templates suggest rich, diverse UI functionality
- Templates handle: nodes, search, users, graphs, feeds, AI integration, etc.

## Strengths

### ✅ Clean Separation of Concerns
- Well-defined layers: routing → storage → rendering → templates
- Storage abstraction allows for different backends

### ✅ Rich Feature Set
- Multi-format support (Markdown, Org-mode)
- Feed generation (RSS/Atom)
- Search capabilities (full-text, regex)
- AI integration (Mistral API)
- User gardens and collaborative features
- Graph visualization
- Executable nodes (with security controls)

### ✅ Flexible Configuration
- Environment-specific configs (Dev/Prod/Alpha)
- Feature flags for experiments
- YAML-based configuration for Agora-specific settings

### ✅ Performance Considerations
- TTL caching throughout (`@cachetools.func.ttl_cache`)
- Randomized cache expiry prevents thundering herd

## Areas for Improvement

### 🔧 Code Quality & Maintainability

1. **Type Hints**: Inconsistent typing throughout codebase
   - The current PLAN.md addresses Node class typing - extend this project-wide

2. **Documentation**: Limited inline documentation
   - Consider adding docstrings to complex functions
   - API documentation would help contributors

3. **File Size**: `app/storage/file_engine.py` is likely large and complex
   - The planned refactoring to separate concerns is excellent

### 🔧 Testing Infrastructure

4. **Test Coverage**: Only saw mention of `app/test_node.py` in PLAN
   - No evidence of comprehensive test suite
   - **Recommendation**: Establish pytest framework with fixtures
   - Add integration tests for template rendering
   - Test different storage engines

### 🔧 Dependency Management

5. **Dependencies**: Heavy dependency list in `pyproject.toml`
   - 40+ direct dependencies
   - **Recommendation**: Audit for unused packages
   - Consider lighter alternatives where possible

### 🔧 Security & Performance

6. **Security**: Executable nodes feature needs careful audit
   - Currently controlled by `ENABLE_EXECUTABLE_NODES` flag
   - Consider sandboxing or containerization

7. **Caching Strategy**: Multiple caching layers but may need refinement
   - Random TTL (120-240s) is interesting but might benefit from profiling
   - Consider Redis for multi-instance deployments

### 🔧 Code Organization

8. **Template Organization**: 30+ templates in single directory
   - Consider subdirectories by feature area
   - Template inheritance could be optimized

9. **Static Asset Management**: Manual JavaScript management
   - Consider modern build tools (already has package.json)
   - TypeScript compilation seems ad-hoc

## Suggested Improvements (Priority Order)

### High Priority
1. **Complete the Node class refactoring** (already planned in PLAN.md)
2. **Add comprehensive test suite** with pytest
3. **Complete SQLite storage engine** for better scalability
4. **Audit and optimize dependencies**

### Medium Priority
5. **Add project-wide type hints** and configure mypy
6. **Improve documentation** with docstrings and API docs
7. **Reorganize templates** into logical subdirectories
8. **Modernize JavaScript build process**

### Low Priority (Polish)
9. **Performance profiling** and cache optimization
10. **Security audit** of executable nodes
11. **Template inheritance optimization**
12. **Static analysis tools** (black, flake8, etc.)

## Development Workflow Notes

### Current Setup
- UV for Python dependencies
- npm for JavaScript (with TypeScript sources)
- Multiple run scripts for different environments
- Docker support available

### Recommendations for New Contributors
1. Start with the Node refactoring task (well-documented)
2. Use `./run-dev.sh` for development, or `./run-dev.sh Local` for example if you want to run `tar.agor.ai` in particular :)
3. Check `app/config.py` for feature flags before implementing ideally
4. Try to understand how the node is assembled and all else should follow :) Have fun!

### Critical Files to Understand
- `app/graph.py` - **Core graph classes**: `Graph`, `Node`, `Subnode`, `User` with type hints
- `app/agora.py:42` - Global graph instance (`G = api.Graph()`)
- `app/visualization.py` - Graph visualization (RDF, Turtle, JSON for D3.js)
- `app/storage/file_engine.py` - Pure file I/O operations (stripped down to ~247 lines)
- `app/render.py:37` - Wikilink parsing and content rendering
- `app/config.py:68` - User ranking system

## Future Architecture Considerations

1. **Microservices**: Current monolith could be split into:
   - Content ingestion service
   - Graph API service  
   - Web interface service

2. **GraphQL API**: Rich graph structure would benefit from GraphQL

3. **Real-time Features**: WebSocket support for collaborative editing

4. **Plugin System**: Architecture supports it, could formalize extension points

---

*This analysis was conducted in August 2025. The codebase shows signs of mature, thoughtful development with room for systematic improvement.*

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