> [!IMPORTANT]
> **Branch Renaming Notice (Effective 2025-09-15)**
>
> Agora projects will migrate their default branch from `master` to `main` on or after **September, 2025**, to align with modern Git standards.
>
> Agora Server was already migrated earlier. If you are in a master branch after the time of migration and you see no changes, please migrate to main as per the following instructions.
>
> While GitHub will automatically redirect web links, this change requires this one-time update for any local clones.
>
> Please run the following commands to update your local repository:
>
> ```bash
> # Switch to your local master branch
> git checkout master
>
> # Rename it to main
> git branch -m master main
>
> # Fetch the latest changes from the remote
> git fetch
>
> # Point your new main branch to the remote main branch
> git branch -u origin/main main
>
> # (Optional) Clean up old remote tracking branch
> git remote prune origin
> ```
>
> Thank you for your understanding as we keep the Agora aligned with current best practices!

---

# To use

This Agora Server is meant to be used in conjunction with an Agora. An Agora is
a collection of digital gardens and other information sources that are assembled
into a distributed knowledge graph.

For an example Agora, and for more information on the Agora design, please refer to <https://flancia.org/go/agora>.

To see the Agora Server in action with the example Agora, please visit
<https://anagora.org>.

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

# API

The Agora Server provides a simple JSON API for accessing graph data.

## Getting the Full Graph

The canonical way to get a full definition of the knowledge graph is through the `/graph/json/all` endpoint. This endpoint returns a single JSON object containing two keys:

-   `"nodes"`: A list of all nodes in the Agora.
-   `"links"`: A list of all edges, defining the connections between those nodes.

While the filesystem is the ultimate source of truth (the graph is built by parsing all subnode files in the `garden/` directory), this API endpoint is the recommended method for retrieving that truth in a clean, usable format.
