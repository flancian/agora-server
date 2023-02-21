FROM alpine
LABEL org.opencontainers.image.authors="veronika.m.winters@gmail.com"
USER root
RUN apk add python3 npm poetry build-base python3-dev musl-dev linux-headers
WORKDIR /agora-bridge
COPY . .
RUN poetry install
RUN npm install
CMD ["/agora-bridge/run-dev.sh"]
ENTRYPOINT ["/agora-bridge/entrypoint.sh"]