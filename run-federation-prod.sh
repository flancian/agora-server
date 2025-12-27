#!/bin/bash
# Copyright 2025 Flancian
# Runs the Agora Federation Worker.

export PATH=$HOME/.local/bin:${PATH}
export FLASK_ENV="production"
export AGORA_CONFIG="ProductionConfig"

echo "Starting Agora Federation Worker..."
uv run python3 scripts/federation_worker.py
