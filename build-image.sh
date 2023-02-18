#!/bin/sh

docker build -t moonlion/agora-server:testing .
docker image push moonlion/agora-server:testing