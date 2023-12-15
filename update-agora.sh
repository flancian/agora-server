#!/bin/bash

# Maybe not useful to others? But useful to update the 'bare' setup in anagora.org :)

npm run build
touch /tmp/agora-restart
sudo rm /tmp/agora-cache/*
