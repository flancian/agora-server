# In development, but this should work. 
#
# Results in a simple agora-server container running repository pulls only. This is meant to be used with docker-compose and [[coop cloud]] (based on docker swarm) to run alongside an [[agora server]] (which runs the UI/renders nodes).

# As of 2023, you probably want to look at the [[coop cloud]] recipe if you are considering running an Agora for your community :) https://anagora.org/agora-recipe for more.
#
# To build (you should be able to replace docker with podman):
#
# $ docker build -t agora-server .
#
# To drop into a debugging shell in the container:
#
# $ docker run -it --entrypoint /bin/bash agora-server
#
# Aisde: if you are running podman rootless, check that you can write to 'agora' in the container. You may need to:
#
# $ podman unshare chgrp -R 1001 agora  # I only tested this with podman so far.
#
# To then run an Agora Server interactively port 5017 (this assumes $HOME/agora contains an Agora, replace that path with your Agora root):
#
# $ docker run -it -p 5017:5017 -v ${HOME}/agora:/home/agora/agora:Z -u agora agora-server
#
# To run the Agora Server detached (in serving mode): 
#
# $ docker run -dt -p 5017:5017 -v ${HOME}/agora:/home/agora/agora:Z -u agora agora-server
#
# To run the reference Agora Server directly from upstream packages, skipping building:
#
# $ docker run -dt -p 5017:5017 -v ${HOME}/agora:/home/agora/agora:Z -u agora git.coopcloud.tech/flancian/agora-server
#
# Enjoy!

FROM debian

MAINTAINER Flancian "0@flancia.org"

# We install first as root.
USER root

RUN apt-get update
RUN apt-get install -y git python3 python3-pip python3-poetry npm
# We don't need these files in the finished container; this should run after all apt-get invocations.
RUN rm -rf /var/lib/apt/lists/*
# We run as agora user
RUN groupadd -r agora -g 1000 && useradd -u 1000 -r -g agora -s /bin/bash -c "Agora" agora
# /home/agora/agora is the agora root; /home/agora/agora-server is where we'll run.
RUN mkdir -p /home/agora && chown -R agora:agora /home/agora

WORKDIR /home/agora
USER agora

RUN mkdir /home/agora/agora

RUN git clone https://github.com/flancian/agora-server.git

# This technically shouldn't be needed as we expect the user to mount an Agora as a volume, 
# but it makes the Agora easier to run off-the-shelf from head. 
# RUN git clone https://github.com/flancian/agora.git
# RUN git clone https://gitlab.com/flancia/agora.git
# Disabled for now as it's probably better to mount the Agora root as a volume.
# That volume should end up in /home/agora/agora.

WORKDIR /home/agora/agora-server
RUN npm install

# This seems to work around some version issues. Why it's needed I can't currently tell.
RUN poetry lock
RUN poetry install
EXPOSE 5017

CMD ./entrypoint.sh

# For debugging only.
# CMD bash
