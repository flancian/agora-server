#!/bin/bash
# Copyright 2025 Flancian
# Runs the Agora Federation Worker.

export PATH=$HOME/.local/bin:${PATH}
export FLASK_ENV="production"
export AGORA_CONFIG="ProductionConfig"
# Ensure we use the correct URL base for federation (matches Actor IDs in DB)
export URL_BASE="https://anagora.org"

echo "Starting Agora Federation Worker..."
exec uv run python3 scripts/federation_worker.py
