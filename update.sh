#!/bin/bash

# Maybe not useful to others? But useful to update the 'bare' setup in anagora.org :)

set -u

# systemctl --user needs the session bus, which may be unset over plain SSH.
export XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-/run/user/$(id -u)}"

BEFORE=$(git rev-parse HEAD 2>/dev/null || echo "")

git pull

npm install
npm run build

# A change to the Python environment (dependencies, lockfile, or the interpreter
# pinned in .python-version) rebuilds the virtualenv. The long-running uWSGI
# master keeps the sys.path it computed at startup, so a chain-reload
# (touch /tmp/agora-restart) would then fail to import modules -- exactly the
# outage from 2026-10-15, after .python-version bumped the venv from 3.13 to 3.12.
# In that case do a FULL restart: run-alpha.sh's `uv run uwsgi` resyncs the venv
# and a fresh master starts under it. Note we deliberately do NOT call `uv sync`
# here, so the venv is never mutated while the old master is still serving.
AFTER=$(git rev-parse HEAD 2>/dev/null || echo "")
if [ -n "$BEFORE" ] && [ "$BEFORE" != "$AFTER" ] && ! git diff --quiet "$BEFORE" "$AFTER" -- pyproject.toml uv.lock .python-version; then
    echo "Python environment changed (pyproject.toml/uv.lock/.python-version); full restarting agora-server..."
    systemctl --user restart agora-server
else
    echo "No Python environment change; requesting a graceful chain-reload."
    touch /tmp/agora-restart
fi

sudo /bin/sh -c 'rm /tmp/agora-cache/*'
