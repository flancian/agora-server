# To use

This Agora Server is meant to be used in conjunction with an Agora. An Agora is
a collection of digital gardens and other information sources that are assembled
into a distributed knowledge graph.

For an example Agora, and for more information on the Agora design, please refer to <https://flancia.org/go/agora>.

To see the Agora Server in action with the example Agora, please visit
<https://anagora.org>.

## The Agora Protocol

The Agora Protocol is not a formal network protocol, but rather a set of core principles that guide the project's design:

> *"Turn every dead end into a doorway."*

-   **Decentralization**: The filesystem is the ultimate source of truth. The server is a lens, not a silo.
-   **Nodes are Concepts, Subnodes are Utterances**: A key distinction where abstract topics (`[[Calculus]]`) are composed of concrete contributions (`@flancian/calculus.md`).
-   **Composition over Centralization**: Nodes are built by pulling and combining content from other, more specialized nodes.
-   **Everything Has a Place (No 404s)**: Every possible query resolves to a node, turning dead ends into invitations to contribute. Whether it's a broken link, an empty node, or an unwritten thought—every absence of information is an invitation to create.

# To develop

Install OS dependencies:
```
$ apt-get install python3 python3-pip
```

Install npm. Then install JavaScript dependencies:

```
npm install
```

Install uv (as per https://github.com/astral-sh/uv):
```
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Install Python dependencies:
```
uv sync
```

If you get a virtualenv-related error above, try removing virtualenv if you had installed it separately: `pip3 uninstall virtualenv`.

Then run the development server:
```
./run-dev.sh
```

Please see [CONTRIBUTING](CONTRIBUTING.md) for instructions on how to
contribute; it may require a one-time signing of a Google CLA.
See also [CONTRIBUTORS](CONTRIBUTORS.md) for the full list of people who have helped build the Agora.

Note this project *is not an official Google project*, and will not be supported by
Google. It was simply initiated by flancian@ while employed at Google, and
thus copyright belongs to Google as indicated in LICENSE and in various license
headers. This should be of essentially no effect to you or its users (beyond the
required signing of the CLA if you contribute), as it is released under an open
license; please reach out to flancian@ or some other maintainer if this concerns you.  

## If you have missing icons

The Agora Server makes ample use of unicode emojis for illustrating concepts and aiding navigation. If you are on GNU/Linux and see partial rendering (i.e. empty squares instead of icons), you probably need to install additional font packages. On Debian/Ubuntu:

```
sudo apt install fonts-noto-color-emoji fonts-symbola
```


## About the project
As you might have inferred from the above, this project is based on [Flask](https://flask.palletsprojects.com). ```/app``` hosts the Flask app. In it:

- ```app/__init__.py``` has the high level Flask setup.
- ```app/agora.py``` does rendering (url maps, views).
- ```app/db.py``` has logic to read/process notes. The db is actually the filesystem :)
- ```app/js-src``` has Javascript and Typescript sources.
- ```app/templates``` are Jinja2 templates.

# Production Deployment

The Agora is designed to be run as a `systemd` service using `uWSGI` for performance and reliability. The provided `agora-server.service` and `prod.ini` files are configured to support true zero-downtime deployments with a robust cache warming strategy.

## Zero-Downtime Deploys with Graceful Rolling Restarts

To update a running Agora without interrupting user traffic, you should use the `reload` command, not `restart`.

**Correct Workflow for Production Updates:**
```bash
# 1. Fetch the latest code
git pull

# 2. Update dependencies if needed
uv sync

# 3. Rebuild frontend assets if needed
npm run build

# 4. Trigger a zero-downtime reload
systemctl --user reload agora-server
```

### How it Works

This process is designed to be robust and prevent performance degradation during a deploy.

1.  **`systemctl reload`**: This command runs the `ExecReload` directive from the `.service` file, which simply `touch`es the file specified in `touch-chain-reload` in `prod.ini`.

2.  **`chain-reload = true`**: This uWSGI directive tells the master process not to restart all workers at once. Instead, it will reload them **one by one**.

3.  **`lazy-apps = true`**: This directive is critical. It tells each new worker to load the application code from scratch. This ensures the new worker picks up the updated code from the `git pull`.

4.  **Blocking Cache Warming**: The application's `create_app()` function contains logic that runs only within a uWSGI worker (`if uwsgi.worker_id() > 0:`). This logic performs the expensive cache warming (loading the entire graph into memory), which can take several seconds. Because this is a blocking part of the application's startup, uWSGI's master process **will wait** for the warmup to complete before it considers the new worker "ready".

5.  **The Rolling Restart**: The master process kills an old worker, spawns a new one, waits for it to finish its multi-second cache warmup, and only *then* does it proceed to kill the next old worker. This ensures that the Agora's full serving capacity is maintained throughout the reload process and that no user is ever served a slow response from a "cold" worker.

# API & Core Routes

The Agora Server provides a variety of endpoints for navigating the graph, extracting data, and reading content. Here is a TL;DR of the most important routes handled by `app/agora.py`.

## Core Navigation
-   `GET /`: The Agora homepage.
-   `GET /<node>`: The primary view. Renders the composite HTML view for a given topic, combining all user contributions (subnodes) and contextual panels (Stoas, Wikipedia, etc.).
-   `GET /@<user>`: The user profile view. Renders all nodes contributed to by a specific user.
-   `GET /random`: Safely redirects to a random node in the Agora.
-   `GET /latest`: A feed of the most recently modified contributions across all users.
-   `GET /go/<node>`: The "Go-Link" resolver. Parses the node for `[[go]]` links and automatically redirects the user (e.g., `/go/music`).

## Getting the Full Graph

The canonical way to get a full definition of the knowledge graph is through the `/graph/json/all` endpoint. This endpoint returns a single JSON object containing two keys:

-   `"nodes"`: A list of all nodes in the Agora.
-   `"links"`: A list of all edges, defining the connections between those nodes.

While the filesystem is the ultimate source of truth (the graph is built by parsing all subnode files in the `garden/` directory), this API endpoint is the recommended method for retrieving that truth in a clean, usable format.

*Note: You can also get the localized graph neighborhood for a single concept via `GET /graph/json/<node>`.*

## Extracting Raw Content

If you need to extract the combined plain-text content of a specific location without any HTML formatting or JavaScript:

-   `GET /raw/node/<node>`: Returns a concatenated Markdown document containing the text of all subnodes and pushed context for the specified node. It handles binary content gracefully by substituting placeholders. This is the recommended endpoint for feeding Agora data to LLMs or CLI tools.
-   `GET /raw/<path:subnode>`: Returns the exact raw file content (Markdown, Org-mode, Image) for a specific user's contribution (e.g., `/raw/garden/flancian/readme.md`).

## Feeds
-   `GET /feed/<node>`: Returns an RSS feed of changes to a specific node.
-   `GET /feed/@<user>`: Returns an RSS feed of all changes made by a specific user.

---

<details>
<summary>Branch Renaming Notice (2025-09-15)</summary>

Agora projects migrated their default branch from `master` to `main` in September 2025 to align with modern Git standards. Agora Server was migrated earlier.

If your local clone still points to `master`, run:

```bash
git checkout master
git branch -m master main
git fetch
git branch -u origin/main main
git remote prune origin
```

</details>
