#!/bin/bash

ERROR=0

if ! command -v python3 || ! command -v pip3; then
    echo 'Please install Python3 and pip using your OS packaging system. In Debian: sudo apt-get install python3 python3-venv python3-pip'
    exit 42
fi


if ! command -v npm || ! command -v esbuild; then
    echo 'Please install npm and esbuild using your OS packaging system (this is needed for client development). In Debian: sudo apt-get install npm esbuild' 
    exit 43
fi

python3 -m venv venv &&
. venv/bin/activate &&
pip3 install -r requirements.txt

echo "see agora-server.service and https://anagora.org/systemd for pointers on how to set up a production agora as a system service."
