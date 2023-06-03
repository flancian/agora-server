FROM alpine
LABEL org.opencontainers.image.authors="veronika.m.winters@gmail.com"
USER root
RUN apk add python3 npm poetry build-base python3-dev musl-dev linux-headers
WORKDIR /agora-bridge
COPY ./poetry.lock ./poetry.lock
COPY ./pyproject.toml ./pyproject.toml
RUN poetry install
COPY ./package-lock.json .
COPY ./package.json .
RUN npm install
COPY . .
CMD ["/agora-bridge/run-dev.sh"]
ENTRYPOINT ["/agora-bridge/entrypoint.sh"]