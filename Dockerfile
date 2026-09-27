# [[agora server]]
#
# Part of the [[Agora of Flancia]] — an open knowledge commons.
# https://anagora.org/agora-server
#
# Runs the main Agora web application: renders nodes, subnodes, wikilinks,
# search, graph visualizations, and the distributed knowledge commons.
#
# In 2023, this started as a Debian container for [[coop cloud]] (based on Docker Swarm)
# and [[agora recipe]].
# In 2026, we modernized it to a multi-stage Python 3.12 + [[uv]] build with esbuild asset
# bundling for [[flan.agor.ai]] and [[podman]]:
# See https://anagora.org/agora-recipe for more.
#
# To build with [[podman]] or [[docker]]:
#
#   $ podman build -t agora-server .
#
# To drop into a debugging shell in the container:
#
#   $ podman run -it --entrypoint /bin/bash agora-server
#
# Aside: if you are running podman rootless, check that you can write to 'agora' in the container:
#
#   $ podman unshare chgrp -R 1000 agora
#
# To then run an Agora Server interactively on port 5017 (mounting your Agora root):
#
#   $ podman run -it -p 5017:5017 -v ${HOME}/agora:/home/agora/agora:Z -u agora agora-server
#
# To run the full stack with [[podman-compose]] / [[docker compose]] from [[agora]]:
#
#   $ podman-compose up
#
# Enjoy! For the benefit of all beings.

# --- Stage 1: Build frontend assets with Node & esbuild ---
FROM node:20-slim AS assets

WORKDIR /app
COPY package*.json ./
RUN npm ci || npm install
COPY app/js-src ./app/js-src
RUN npm run build

# --- Stage 2: Production Python runtime ---
FROM python:3.12-slim AS runtime

LABEL maintainer="Flancian <0@flancia.org>"
LABEL org.opencontainers.image.source="https://github.com/flancian/agora-server"
LABEL org.opencontainers.image.description="Agora Server: rendering the knowledge commons"

# Install system dependencies (build-essential/python3-dev for uWSGI, git, curl, ca-certificates)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3-dev \
    git \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install uv from official image (fast, reproducible Python tooling)
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# We run as the agora user (UID 1000)
RUN groupadd -r agora -g 1000 && useradd -u 1000 -r -g agora -s /bin/bash -c "Agora" agora \
    && mkdir -p /home/agora/agora /home/agora/agora-server \
    && chown -R agora:agora /home/agora

WORKDIR /home/agora/agora-server
USER agora
ENV PATH="/home/agora/.local/bin:$PATH"

# Install Python dependencies first for caching layers
COPY --chown=agora:agora pyproject.toml README.md ./
RUN uv sync --no-install-project

# Copy application code from local context
COPY --chown=agora:agora . .
# Copy compiled static assets from the node build stage
COPY --from=assets --chown=agora:agora /app/app/static/js ./app/static/js
RUN uv sync

EXPOSE 5017
ENV FLASK_APP=app
ENV FLASK_ENV=production
ENV AGORA_PATH=/home/agora/agora
ENV AGORA_CONFIG=ProductionConfig

CMD ["./entrypoint.sh"]

