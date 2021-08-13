#!/bin/bash

(command -v python3 && command -v pip3) || (echo 'Please install Python3 and pip using your OS packaging system. In Debian: sudo apt-get install python3 python3-venv python3-pip' && exit 42)

python3 -m venv venv &&
. venv/bin/activate &&
pip3 install -r requirements.txt
