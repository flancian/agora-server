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

- [x] **Create `app/node.py`:** Move the `Graph`, `Node`, `Subnode`, `User` classes and the global `G` instance from `app/storage/file_engine.py` to the new `app/node.py`.
- [x] **Refactor `app/storage/file_engine.py`:** Strip this file down to its essential file-access functions (e.g., a function that globs for all markdown files and returns a list of paths).
- [x] **Connect the Modules:** Update the `Graph` class in `app/node.py` to call the low-level functions in `app/storage/file_engine.py` to get its data.
- [x] **Update Method Signatures with Type Hints:** In `app/node.py`, add Python type hints to all relevant methods in the `Node` class (`-> list[Node]`).
- [x] **Create a New Test File:** Create `app/test_node.py` to validate the `Node` class's behavior.
- [x] **Add Contract-Enforcing Tests:** The new test file will validate the return types of the `Node` methods, ensuring they return `list[Node]` or `list[str]` as specified.
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

## Detailed Steps for Refactoring

**Phase 1: Restructure and Establish the Standard**

**Goal:** Move the graph-related classes and logic from `app/storage/file_engine.py` to `app/node.py`, and refactor the `Graph` class to use a storage engine.

**Steps:**

1.  [x] Create a new file `app/node.py`.
2.  [x] Move the `Node`, `Subnode`, and `User` class definitions from `app/storage/file_engine.py` to `app/node.py`.
3.  [x] Move the `Graph` class to `app/node.py`.
4.  [x] Modify the `Graph` class to accept a storage engine in its constructor. It should default to `FileEngine` for backward compatibility.
5.  [x] The `Graph` class should proxy its methods (`__getitem__`, `__contains__`, `search`, `random`, `write`) to the underlying storage engine.
6.  [x] Refactor `app/storage/file_engine.py` to be a low-level file access layer. It should no longer contain the main data classes.
7.  [x] Update all imports throughout the application to reference `app.node` for `Graph`, `Node`, `Subnode`, and `User`. This will involve changes in `app/__init__.py`, `app/views/`, and potentially other modules.
8.  [x] Resolve any circular dependencies that arise. A temporary solution might involve local imports within functions, to be cleaned up in later phases.

**Acceptance Criteria:**
- [x] The application runs without errors.
- [ ] All existing tests pass.
- [x] The `Node`, `Subnode`, `User`, and `Graph` classes are defined in `app/node.py`.
- [x] `app/storage/file_engine.py` only contains the `FileEngine` class.

## Phase 2: Implement Contract-Enforcing Tests

**Goal:** Ensure that the methods of the new `Node` class and `Graph` API return objects of the correct type. This will provide confidence as we refactor the rest of the application, which currently relies on duck typing and implicit contracts.

**Steps:**

1.  [in progress] Create a new test file `app/test_node.py`.
2.  [in progress] Write unit tests for the `Node` class.
    -   [in progress] Test that `node.wikilinks` returns a `list[str]`.
    -   [in progress] Test that `node.backlinks` returns a `list[Node]` (or an empty list for now, as it's a placeholder).
3.  [ ] Create a new test file `app/test_graph.py`.
4.  [ ] Write unit tests for the `Graph` class.

