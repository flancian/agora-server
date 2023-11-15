FROM debian:bookworm-slim
RUN apt update && apt install -y curl
WORKDIR /workspace/agora-server
RUN curl -fsSL https://pixi.sh/install.sh | bash
COPY . .
RUN /root/.pixi/bin/pixi run pip_deps
CMD ["/root/.pixi/bin/pixi","run","dev"]