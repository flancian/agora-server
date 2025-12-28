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

private_key = None
public_key = None

def ap_key_setup():
    """Loads the RSA key pair from files, creating them if they don't exist. Caches keys at module level."""
    global private_key, public_key
    
    if private_key and public_key:
        return private_key, public_key

    # Try to cache on g for request context, but also keep module-level for workers.
    if hasattr(g, 'private_key') and hasattr(g, 'public_key'):
        private_key = g.private_key
        public_key = g.public_key
        return private_key, public_key

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
        'Accept': 'application/activity+json, application/ld+json',
        'User-Agent': 'Agora/0.9.9 (https://anagora.org/; +https://github.com/flancian/agora-server)'
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

def verify_request(request):
    """
    Verifies the HTTP Signature of an incoming request.
    Returns True if valid, False otherwise.
    """
    # 1. Check for Signature header
    signature_header = request.headers.get('Signature')
    if not signature_header:
        current_app.logger.warning("Missing Signature header")
        return False
        
    # 2. Parse Signature header
    params = {}
    for part in signature_header.split(','):
        if '=' in part:
            key, value = part.split('=', 1)
            params[key.strip()] = value.strip().strip('"')
            
    key_id = params.get('keyId')
    signature = params.get('signature')
    headers_list = params.get('headers', '(request-target) host date digest').split(' ')
    
    if not key_id or not signature:
        current_app.logger.warning("Invalid Signature header format")
        return False
        
    # 3. Fetch Public Key (with caching ideally, but simple fetch for now)
    # WARNING: In production, caching and rate limiting are essential here.
    try:
        current_app.logger.info(f"Fetching public key from {key_id}")
        # Strip fragment if present, although requests usually handles it.
        # However, key_id is the ID of the Key object, which we need to fetch.
        # Sometimes the Key object is embedded in the Actor object.
        
        actor_response = requests.get(
            key_id, 
            headers={'Accept': 'application/activity+json, application/ld+json'},
            timeout=5
        )
        actor_response.raise_for_status()
        key_data = actor_response.json()
        
        # Logic to find the PEM.
        public_key_pem = None
        
        # Case A: Returned object is the Key itself.
        if 'publicKeyPem' in key_data:
            public_key_pem = key_data['publicKeyPem']
        # Case B: Returned object is the Actor, and contains the key.
        elif 'publicKey' in key_data and isinstance(key_data['publicKey'], dict):
             public_key_pem = key_data['publicKey'].get('publicKeyPem')
        # Case C: Key is wrapped in a 'publicKey' property but flattened? Unlikely.
        
        # If we fetched the key ID but didn't find the PEM, it might be because the key ID
        # resolves to the actor profile which *contains* the key.
        if not public_key_pem and 'owner' in key_data:
             # Try fetching the owner if it's different (recursion risk?)
             # Usually key_id and owner are related.
             pass

        if not public_key_pem:
             current_app.logger.warning(f"Could not find publicKeyPem in response from {key_id}")
             return False

        public_key = RSA.import_key(public_key_pem)
    except Exception as e:
        current_app.logger.error(f"Failed to fetch/parse public key from {key_id}: {e}")
        return False

    # 4. Construct comparison string
    comparison_lines = []
    for header_name in headers_list:
        if header_name == '(request-target)':
            comparison_lines.append(f'(request-target): post {request.path}')
        elif header_name == 'host':
            comparison_lines.append(f'host: {request.headers.get("Host")}')
        else:
             comparison_lines.append(f'{header_name}: {request.headers.get(header_name, "")}')
             
    comparison_string = '\n'.join(comparison_lines)
    
    # 5. Verify
    try:
        verifier = pkcs1_15.new(public_key)
        digest = SHA256.new(comparison_string.encode('utf-8'))
        verifier.verify(digest, base64.b64decode(signature))
        current_app.logger.info(f"Signature verification successful for {key_id}")
        return True
    except (ValueError, TypeError) as e:
         current_app.logger.warning(f"Signature verification failed: {e}")
         return False
