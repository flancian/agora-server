#!/bin/bash
# Copyright 2020 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# This shouldn't be needed I think but systemd somehow wasn't reading this from ~/.profile
# I've been reading on systemd environment setup, but having this here might actually be preferable?

source $HOME/.poetry/env

npm run build
export FLASK_APP=app
export FLASK_ENV="development"
# lol
export AGORA_CONFIG="${1}DevelopmentConfig"
poetry run flask run -h 0.0.0.0 -p 5017
