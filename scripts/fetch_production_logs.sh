#!/usr/bin/env bash
# Copyright 2026 Google LLC & The Agora Authors
#
# Fetch production logs from thecla (agora@thecla:/tmp/{uwsgi,agora}.log)
# Preserves historical logs with timestamps to prevent clobbering.
#
# Usage:
#   ./scripts/fetch_production_logs.sh [destination_dir]
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
DEST_DIR="${1:-${REPO_DIR}/logs}"

mkdir -p "${DEST_DIR}"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
UWSGI_TARGET="${DEST_DIR}/uwsgi_${TIMESTAMP}.log"
AGORA_TARGET="${DEST_DIR}/agora_${TIMESTAMP}.log"

echo "=== Fetching production logs from agora@thecla ==="
echo "Destination: ${DEST_DIR}"

if [[ -f "${UWSGI_TARGET}" ]]; then
    echo "Warning: ${UWSGI_TARGET} already exists. Aborting to avoid clobbering."
    exit 1
fi

echo "--> Fetching /tmp/uwsgi.log (compressed scp)..."
scp -C agora@thecla:/tmp/uwsgi.log "${UWSGI_TARGET}"
echo "    Saved as ${UWSGI_TARGET} ($(du -h "${UWSGI_TARGET}" | cut -f1))"

echo "--> Fetching /tmp/agora.log (compressed scp)..."
scp -C agora@thecla:/tmp/agora.log "${AGORA_TARGET}"
echo "    Saved as ${AGORA_TARGET} ($(du -h "${AGORA_TARGET}" | cut -f1))"

# Update convenient 'latest' symlinks
ln -sf "$(basename "${UWSGI_TARGET}")" "${DEST_DIR}/uwsgi_latest.log"
ln -sf "$(basename "${AGORA_TARGET}")" "${DEST_DIR}/agora_latest.log"

echo "=== Successfully fetched production logs ==="
echo "Latest symlinks updated:"
echo "  ${DEST_DIR}/uwsgi_latest.log -> $(readlink "${DEST_DIR}/uwsgi_latest.log")"
echo "  ${DEST_DIR}/agora_latest.log -> $(readlink "${DEST_DIR}/agora_latest.log")"
