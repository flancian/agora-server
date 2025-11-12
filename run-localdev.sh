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

# Exit gracefully on Ctrl+C
trap "echo 'Exiting localdev loop.' && kill \$FLASK_PID && exit" INT

export MISTRAL_API_KEY=$(cat ~/flancia/secret/api/mistral.txt)
export GEMINI_API_KEY=$(cat ~/flancia/secret/api/gemini.txt)
while true; do
    # Source the script to run it in the current shell process
    # This allows us to access the FLASK_PID variable
    . ./run-dev.sh Local
    wait $FLASK_PID
    sleep 2
done
