#!/bin/bash

# Test script for Render deployment
# Usage: ./test_render_deployment.sh YOUR_RENDER_URL

if [ -z "$1" ]; then
    echo "Usage: ./test_render_deployment.sh YOUR_RENDER_URL"
    echo "Example: ./test_render_deployment.sh https://career-agent-api.onrender.com"
    exit 1
fi

API_URL=$1

echo "🧪 Testing Render Deployment at $API_URL"
echo "========================================"
echo ""

echo "1. Testing health endpoint..."
curl -s "$API_URL/health" | python3 -m json.tool
echo ""

echo "2. Testing root endpoint..."
curl -s "$API_URL/" | python3 -m json.tool | head -20
echo ""

echo "3. Creating test user..."
USER_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/users" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User"}')

echo "$USER_RESPONSE" | python3 -m json.tool
echo ""

API_KEY=$(echo "$USER_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['api_key'])")

echo "4. Uploading test context..."
CONTEXT_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/upload-context" \
  -H "X-API-Key: $API_KEY" \
  -F "context_text=# Test Career Context

## Experience
- Test experience at Test Company
- Built test products

## Skills
- Python
- Product Management")

echo "$CONTEXT_RESPONSE" | python3 -m json.tool
echo ""

echo "5. Testing cover letter generation..."
sleep 2  # Wait for agent initialization
COVER_LETTER=$(curl -s -X POST "$API_URL/api/v1/cover-letter" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"company_name":"Google","role_title":"Product Manager","tone":"professional"}')

echo "$COVER_LETTER" | python3 -c "import sys, json; data=json.load(sys.stdin); print('Success:', data['success']); print('Content preview:', data['content'][:200])"

echo ""
echo "✅ Testing complete!"







