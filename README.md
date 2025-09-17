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

## Zero-Downtime Deploys and Cache Warming

The Agora is configured to support zero-downtime deployments in production when run as a `systemd` service. This is achieved using uWSGI's graceful reload mechanism combined with a cache warming strategy to prevent slow responses after a restart.

### How it Works

1.  The `agora-server.service` unit is configured with an `ExecReload` command that touches a file (`/tmp/agora-restart`).
2.  Running `systemctl --user reload agora-server` triggers uWSGI to perform a "rolling restart": it starts new worker processes while the old ones continue to serve traffic.
3.  The `prod.ini` configuration uses `lazy-apps = true`, which loads the Flask application independently in each new worker process.
4.  A `@postfork` hook in `app/agora.py` is triggered in each new worker. This hook sends a request to a special `/warm-cache` endpoint to populate the in-memory caches *before* the worker is added to the pool to serve live traffic.
5.  Once the new workers are ready, the old ones are gracefully shut down.

### Risks and Considerations

-   **Memory Usage**: `lazy-apps = true` can lead to slightly higher memory consumption. Normally, workers can share memory pages from the master process (Copy-on-Write). With lazy loading, each worker loads the application's code into memory independently, reducing this sharing.
-   **No Functional Changes Expected**: This change should not alter the application's logic. However, it changes *when* the application is initialized. Any code at the module level is now executed once per worker, rather than once in the master process.
-   **Cache Warming Failures**: If the `/warm-cache` endpoint fails for any reason, the new worker will still start, but its cache will be "cold." The first user request served by that specific worker will be slower as it will have to populate the cache on-demand. The failure is logged to the uWSGI log file.
-   **Server Compatibility**: The cache warming logic is specific to uWSGI and will be safely skipped if the application is run under a different server (e.g., the Flask development server), as it is wrapped in a `try...except ImportError`.
