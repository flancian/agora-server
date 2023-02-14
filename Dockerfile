FROM alpine
LABEL org.opencontainers.image.authors="veronika.m.winters@gmail.com"
USER root
RUN apk add npm python3 py3-flask poetry gcc python3-dev linux-headers vim musl-dev bash
WORKDIR /agora-server
COPY pyproject.toml .
COPY poetry.lock .
RUN poetry install
COPY . .
ENTRYPOINT ./entrypoint.sh
CMD sh run-dev.sh