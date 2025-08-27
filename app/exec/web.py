# Copyright 2025 Google LLC
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

from flask import Blueprint, request, jsonify
import requests

bp = Blueprint("web", __name__)

@bp.route("/api/check_embeddable")
def check_embeddable():
    url = request.args.get('url')
    if not url:
        return jsonify({"error": "URL parameter is required"}), 400

    headers = {
        'User-Agent': 'Agora-Server/1.0 (https://anagora.org/; mailto:0@flancia.org)'
    }

    try:
        # Use a HEAD request to be efficient and only get headers.
        response = requests.head(url, headers=headers, timeout=5, allow_redirects=True)
        
        x_frame_options = response.headers.get('X-Frame-Options', '').upper()
        if x_frame_options in ('DENY', 'SAMEORIGIN'):
            return jsonify({"embeddable": False})

        csp = response.headers.get('Content-Security-Policy', '')
        if 'frame-ancestors' in csp:
            if "'none'" in csp or "'self'" in csp and not url.startswith(request.host_url):
                return jsonify({"embeddable": False})

        return jsonify({"embeddable": True})

    except requests.exceptions.RequestException as e:
        # If the request fails for any reason (timeout, DNS error, etc.),
        # we'll hope for the best and let the client try to embed it.
        return jsonify({"embeddable": True})
