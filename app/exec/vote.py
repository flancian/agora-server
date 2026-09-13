#!/usr/bin/env python3
# Copyright 2026 Google LLC
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

import sys
import os
import re

def cli_main():
    arg = sys.argv[1] if len(sys.argv) > 1 else "vote"
    arg = arg.strip().lower()

    if arg in ("", "vote", "agora"):
        print("# [[Agora Deliberation & Voting]]")
        print()
        print("- An informed heterarchy and liquid democracy deliberation layer for the commons.")
        print("- To deliberate on any topic: visit [[vote/topic]] or tag `#for [[topic]]` or `#against [[topic]]` in your digital garden.")
        print("- Full Agora Vote Dashboard: https://anagora.org/vote")
    else:
        print(f"# [[Deliberation]]: [[{arg}]]")
        print()
        print(f"- View active Agora-wide stance breakdown at: https://anagora.org/vote/{arg}")
        print(f"- To deliberate or cast your stance: add `#for [[{arg}]]`, `#against [[{arg}]]`, or `#delegate [[person]]` to your garden notes.")

if __name__ == "__main__":
    cli_main()
else:
    # When imported by Flask in agora-server
    try:
        from . import bp
        from flask import render_template_string

        @bp.route("/exec/vote", defaults={"node": "vote"})
        @bp.route("/exec/vote/<path:node>")
        def exec_vote(node):
            return render_template_string("""
            <div class="subnode vote-subnode" style="padding: 12px; border-left: 4px solid var(--wikilink-color, #27ae60); background: rgba(0,0,0,0.02); margin: 10px 0;">
                <strong>🗳️ Deliberation on [[<a href="/vote/{{ node }}">{{ node }}</a>]]</strong>:
                <span style="margin-left: 10px;">
                    <a href="/vote/{{ node }}">View full Agora tally &amp; participate &rarr;</a>
                </span>
            </div>
            """, node=node)
    except ImportError:
        pass
