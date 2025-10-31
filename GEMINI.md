This file provides a summary of my core understanding of the Agora project, which I use as my primary context for our sessions.

For a detailed plan of future work, see [[ROADMAP.md]].
For a log of completed work, see [[DONE.md]].
For essays and poems on the project's philosophy, see [[PHILOSOPHY.md]].

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

---

## Agora Core Concepts (as of 2025-09-29)

*This is a summary of my understanding of the project's architecture and user experience principles.*

-   **The Default View is a Composite**: The main user experience is not just a single page, but a composition of a central topic and a suite of satellite information panels. The "default view" for any given node is a collection of:
    -   The **Node Proper**: The collection of subnodes (user contributions) that define the node.
    -   **Contextual Sections**: A series of `<details>` summaries that provide automatically-fetched context about the node's topic from various sources.
-   **Nodes are Collections, Subnodes are Resources**: A key architectural pattern is the distinction between nodes and subnodes.
    -   A **Node** (`[[wikilink]]`) represents a topic, a location, or a collection of things. It is an abstract concept.
    -   A **Subnode** (`@user/document.md`) is a specific, concrete resource or "utterance" contributed by a user that is associated with a node.
