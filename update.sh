#!/bin/bash

# Maybe not useful to others? But useful to update the 'bare' setup in anagora.org :)

git pull
poetry install
npm run build
touch /tmp/agora-restart
sudo /bin/sh -c 'rm /tmp/agora-cache/*'
