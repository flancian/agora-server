# Refactoring Plan: Standardize Node Class Return Types

This document outlines the plan to refactor the `app.storage.file_engine.Node` class and centralize all graph-related logic into a new `app/node.py` module.

### Architectural Goal: Separation of Concerns

Before the refactoring, `app/storage/file_engine.py` was responsible for two things:
1.  **Data Access Layer:** Finding files on disk.
2.  **Graph Logic and Data Models:** The `Graph`, `Node`, `Subnode`, and `User` classes, which define the structure and behavior of the Agora.

This refactoring separates these concerns into a clear hierarchy:

- **`app/node.py` (New High-Level Module):** This file will contain the core application logic and models. It will define the `Graph`, `Node`, `Subnode`, and `User` classes. It will be the central, public API for interacting with the knowledge graph. When other parts of the app need a node, they will call functions in this module.

- **`app/storage/file_engine.py` (New Low-Level Module):** This file will become a utility module responsible only for low-level data access. It will contain functions that discover and read files from the disk. It will be used *by* `app/node.py` but will have no knowledge of the `Graph` or `Node` concepts itself.

This change clarifies the architecture, making it more intuitive and easier to maintain.
### Phase 1: Restructure and Establish the Standard

- [  **Create `app/node.py`:** Move the `Graph`, `Node`, `Subnode`, `User` classes and the global `G` instance from `app/storage/file_engine.py` to the new `app/node.py`.
- [ ] **Refactor `app/storage/file_engine.py`:** Strip this file down to its essential file-access functions (e.g., a function that globs for all markdown files and returns a list of paths).
- [ ] **Connect the Modules:** Update the `Graph` class in `app/node.py` to call the low-level functions in `app/storage/file_engine.py` to get its data.
- [ ] **Update Method Signatures with Type Hints:** In `app/node.py`, add Python type hints to all relevant methods in the `Node` class (`-> list[Node]`).
- [ ] **Create a New Test File:** Create `app/test_node.py` to validate the `Node` class's behavior.
- [ ] **Add Contract-Enforcing Tests:** The new test file will validate the return types of the `Node` methods, ensuring they return `list[Node]` or `list[str]` as specified.
### Phase 2: Implement the Refactoring

- [ ] **Modify Method Implementations:** Review and update the logic inside each method in `app/node.py` to ensure it conforms to the new type-hinted signatures.
- [ ] **Update App-Wide Imports:** Change all other files in the application that used to import `G` or `Node` from `app.storage.file_engine` to import from `app.node` instead.
- [ ] **Run Tests:** Ensure all tests in `app/test_node.py` pass.
### Phase 3: Update Call Sites

- [ ] **Identify Dependent Code:** Find all code (especially in Jinja2 templates) that uses the results of the refactored `Node` methods.
- [ ] **Refactor Call Sites:** Update the code to work with `Node` objects instead of wikilink strings (e.g., changing `<a href="/{{ wikilink }}">` to `<a href="/{{ node.uri }}">`).
- [ ] **Run Full Test Suite:** Execute all tests for the application to ensure no regressions were introduced.
### Phase 4: Cleanup (Optional but Recommended)

- [ ] **Deprecate and Remove `forward_links`:** Once all call sites are updated to use `forward_nodes`, the `forward_links` method may become redundant and can be safely removed to simplify the `Node` class interface.

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
- Poetry for Python dependencies
- npm for JavaScript (with TypeScript sources)
- Multiple run scripts for different environments
- Docker support available

### Recommendations for New Contributors
1. Start with the Node refactoring task (well-documented)
2. Use `./run-dev.sh` for development
3. Check `app/config.py` for feature flags before implementing
4. Follow existing patterns in `app/storage/file_engine.py` for data operations

### Critical Files to Understand
- `app/agora.py:42` - Global graph instance (`G = api.Graph()`)
- `app/storage/file_engine.py:84` - Node lookup logic
- `app/render.py:37` - Wikilink parsing
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

*This analysis was conducted in August 2024. The codebase shows signs of mature, thoughtful development with room for systematic improvement.*

