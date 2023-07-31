#!/bin/sh
# This assumes... many things :) See README.md, Dockerfile and ./run-*.sh for more.
# This runs an Agora Server in an interactive container, mounting 'agora' in your home directory as the Agora root.
# 
# For a supported way to run an Agora on containers, please refer to [[agora recipe]] for [[coop cloud]] in the Agora of Flancia: https://anagora.org/agora-recipe

docker run -it -p 5017:5017 -v ${HOME}/agora:/home/agora/agora -u agora git.coopcloud.tech/flancian/agora-server
