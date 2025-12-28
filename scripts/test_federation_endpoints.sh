#!/bin/bash
# scripts/test_federation_endpoints.sh
# Tests public ActivityPub endpoints for an Agora instance.
# Usage: ./test_federation_endpoints.sh [domain] [username]

DOMAIN="${1:-anagora.org}"
USER="${2:-flancian}"
PROTO="https"

# If domain starts with http, parse it
if [[ "$DOMAIN" == http* ]]; then
    PROTO=$(echo "$DOMAIN" | cut -d: -f1)
    DOMAIN=$(echo "$DOMAIN" | cut -d/ -f3)
fi

BASE_URL="$PROTO://$DOMAIN"
ACCT="acct:$USER@$DOMAIN"

echo "🔍 Testing Federation Endpoints for $ACCT at $BASE_URL"
echo "---------------------------------------------------"

# Helper function
check_url() {
    local name="$1"
    local url="$2"
    local accept="$3"
    
    echo -n "Checking $name... "
    
    # Capture HTTP Code, Response Body, and Timing
    # We use a temporary file to store the body because capturing both in one go is tricky in bash
    tmp_body=$(mktemp)
    # Fetch stats: http_code and time_total separated by a space
    stats=$(curl -s -o "$tmp_body" -w "%{http_code} %{time_total}" -H "Accept: $accept" -L "$url")
    
    code=$(echo "$stats" | awk '{print $1}')
    latency=$(echo "$stats" | awk '{print $2}')
    
    if [[ "$code" == "200" || "$code" == "202" ]]; then
        echo "✅ PASS ($code) - ${latency}s"
        rm "$tmp_body"
        echo ""
        return 0
    elif [[ "$code" == "405" ]]; then
        echo "✅ PASS ($code - Method Not Allowed, but reachable) - ${latency}s"
        rm "$tmp_body"
        echo ""
        return 0
    else
        echo "❌ FAIL ($code) - ${latency}s"
        echo "   URL: $url"
        echo "   Response: $(cat "$tmp_body" | head -c 100)..."
        rm "$tmp_body"
        echo ""
        return 1
    fi
}

# 1. WebFinger
check_url "WebFinger" "$BASE_URL/.well-known/webfinger?resource=$ACCT" "application/jrd+json"

# 2. Actor Profile
check_url "Actor Profile" "$BASE_URL/users/$USER" "application/activity+json"

# 3. Outbox
check_url "Outbox" "$BASE_URL/u/$USER/outbox" "application/activity+json"

# 4. User Inbox (POST only, so GET might return 405, which proves it's not 401/403)
check_url "User Inbox" "$BASE_URL/u/$USER/inbox" "application/activity+json"

# 5. Shared Inbox
check_url "Shared Inbox" "$BASE_URL/inbox" "application/activity+json"

# 6. Host Meta (Optional but good)
check_url "Host-Meta" "$BASE_URL/.well-known/host-meta" "application/xml"

# 7. NodeInfo (Discovery)
check_url "NodeInfo" "$BASE_URL/.well-known/nodeinfo" "application/json"

echo "---------------------------------------------------"
echo "Done."
