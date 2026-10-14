#!/bin/bash
# Copyright 2026 Flancian
# Runs the Agora semantic embedder (owns the embedding model and vector indexing).

export PATH=$HOME/.local/bin:${PATH}
export FLASK_ENV="production"
export AGORA_CONFIG="ProductionConfig"

# Port the local web workers will call for query embeddings.
export AGORA_EMBEDDER_PORT="${AGORA_EMBEDDER_PORT:-5020}"

echo "Starting Agora Embedder on 127.0.0.1:${AGORA_EMBEDDER_PORT}..."
exec uv run python3 scripts/embedder.py
