#!/bin/sh

docker build -t moonlion/agora-server:prime .
docker image push moonlion/agora-server:prime