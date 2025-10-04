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

import base64
import datetime
import json
import requests
import threading
from urllib.parse import urlparse

from Crypto.Hash import SHA256
from Crypto.PublicKey import RSA
from Crypto.Signature import pkcs1_15
from flask import current_app, g, url_for

def ap_key_setup():
    """Loads the RSA key pair from files, creating them if they don't exist."""
    if hasattr(g, 'private_key') and hasattr(g, 'public_key'):
        return
    # This function needs to be robust enough to be called from outside a request context,
    # so we can't rely on g for caching when run from a worker.
    # For now, we'll re-read from file, which is fine.
    # A more advanced implementation might use a module-level cache.
    try:
        with open('private.pem', 'rb') as fp:
            private_key = RSA.import_key(fp.read())
        with open('public.pem', 'rb') as fp:
            public_key = RSA.import_key(fp.read())
    except FileNotFoundError:
        private_key = RSA.generate(2048)
        public_key = private_key.public_key()
        with open('private.pem', 'wb') as fp:
            fp.write(private_key.export_key('PEM'))
        with open('public.pem', 'wb') as fp:
            fp.write(public_key.export_key('PEM'))
    
    # If in a request context, cache it on g.
    if g:
        g.private_key = private_key
        g.public_key = public_key
    
    return private_key, public_key

def send_signed_request(inbox_url, key_id, activity, private_key):
    """
    Signs and sends an ActivityPub activity to a remote inbox.
    """
    current_app.logger.info(f"Preparing to send signed request to {inbox_url}")
    
    inbox_domain = urlparse(inbox_url).netloc
    target_path = urlparse(inbox_url).path
    
    date_header = datetime.datetime.utcnow().strftime('%a, %d %b %Y %H:%M:%S GMT')
    
    body = json.dumps(activity, separators=(',', ':')).encode('utf-8')
    digest_header = 'SHA-256=' + base64.b64encode(SHA256.new(body).digest()).decode('utf-8')

    string_to_sign = (
        f'(request-target): post {target_path}\n'
        f'host: {inbox_domain}\n'
        f'date: {date_header}\n'
        f'digest: {digest_header}'
    )

    signer = pkcs1_15.new(private_key)
    signature = base64.b64encode(signer.sign(SHA256.new(string_to_sign.encode('utf-8'))))

    header = (
        f'keyId="{key_id}",'
        f'headers="(request-target) host date digest",'
        f'signature="{signature.decode("utf-8")}"'
    )

    headers = {
        'Host': inbox_domain,
        'Date': date_header,
        'Digest': digest_header,
        'Signature': header,
        'Content-Type': 'application/activity+json',
        'Accept': 'application/activity+json, application/ld+json'
    }
    current_app.logger.info(f"Sending signed request with headers: {headers}")

    try:
        response = requests.post(inbox_url, data=body, headers=headers, timeout=10)
        response.raise_for_status()
        current_app.logger.info(f"Successfully sent signed request to {inbox_url}. Response: {response.status_code}")
    except requests.RequestException as e:
        current_app.logger.error(f"Error sending signed request to {inbox_url}: {e}")
        if e.response is not None:
            current_app.logger.error(f"Response body: {e.response.text}")
