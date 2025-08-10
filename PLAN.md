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

## Benefits Achieved

1. **Cleaner Architecture**: Graph logic separated from file I/O
2. **Better Maintainability**: Core classes in dedicated `app/graph.py` 
3. **Type Safety**: Comprehensive type hints prevent runtime errors
4. **Zero Breaking Changes**: All existing code continues to work
5. **Future-Ready**: Foundation for GraphQL APIs, better testing, etc.

## Next Steps (Future Work)

The core refactoring is complete! Future improvements could include:

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

