# Copyright 2021 Google LLC
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

from . import bp, Response


@bp.route("/exec/dice")
def dice():
    return Response(
        f"This is where a dice UI would show up if we had one!", mimetype="text/html"
    )


@bp.route("/exec/dice/<n>")
def dice_throw(n):
    import random

    r = random.randint(1, int(n))
    return Response(f"{r}", mimetype="text/html")
