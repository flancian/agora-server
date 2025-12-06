#!/bin/bash
# Resets the SQLite cache tables while preserving user data and AI generations.

DB_PATH="${AGORA_PATH:-$HOME/agora}/agora.db"

if [ ! -f "$DB_PATH" ]; then
    echo "Database not found at $DB_PATH"
    exit 1
fi

echo "Resetting cache tables in $DB_PATH..."

sqlite3 "$DB_PATH" <<EOF
DELETE FROM subnodes;
DELETE FROM links;
DELETE FROM query_cache;
DELETE FROM graph_cache;
VACUUM;
EOF

echo "Done."
