#!/bin/sh

DOCKER_BUILDKIT=1
docker build -t moonlion/agora-server:prime .
docker image push moonlion/agora-server:prime