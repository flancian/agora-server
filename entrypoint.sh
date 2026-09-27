#!/bin/bash
# [[agora server]] container entrypoint.
# For a supported way to run an Agora on containers, please refer to [[agora recipe]] for [[coop cloud]] in the Agora of Flancia: https://anagora.org/agora-recipe

# If running in a live git repo with network, attempt pull
git pull 2>/dev/null || true

# If npm is installed (e.g. dev container), rebuild assets
if command -v npm >/dev/null 2>&1; then
    npm run build
fi

export FLASK_APP=app
export FLASK_ENV="${FLASK_ENV:-production}"
export AGORA_CONFIG="${AGORA_CONFIG:-ProductionConfig}"
export PORT="${PORT:-5017}"
export GUNICORN_WORKERS="${GUNICORN_WORKERS:-4}"

if [ "${FLASK_ENV}" = "development" ]; then
    exec uv run flask run -h 0.0.0.0 -p "${PORT}"
else
    exec uv run gunicorn -w "${GUNICORN_WORKERS}" -b "0.0.0.0:${PORT}" "app:create_app()"
fi
