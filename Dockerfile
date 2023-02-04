FROM alpine
MAINTAINER V "veronika.m.winters@gmail.com"
USER root
RUN apk add npm python3 py3-flask poetry gcc python3-dev linux-headers vim musl-dev
WORKDIR /agora-server
COPY pyproject.toml .
COPY poetry.lock .
RUN poetry install
COPY . .
CMD sh run-dev.sh