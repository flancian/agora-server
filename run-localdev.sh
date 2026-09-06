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

export MISTRAL_API_KEY=$(cat ~/flancia/secret/api/mistral.txt)
export GEMINI_API_KEY=$(cat ~/flancia/secret/api/gemini.txt)
while true; do
    timeout --kill-after=5s 3600 ./run-dev.sh Local
    if lsof -ti:5017 >/dev/null 2>&1; then
        kill -9 $(lsof -ti:5017) 2>/dev/null || true
    fi
    sleep 2
done
