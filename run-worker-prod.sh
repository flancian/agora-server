#!/bin/bash
# Copyright 2025 Flancian
# Runs the Agora Server worker (cache builder).

export PATH=$HOME/.local/bin:${PATH}
export FLASK_ENV="production"
export AGORA_CONFIG="ProductionConfig"

echo "Starting Agora Server Worker..."
uv run python3 scripts/worker.py
echo "Worker finished."
