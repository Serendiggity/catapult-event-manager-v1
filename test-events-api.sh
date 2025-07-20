#!/bin/bash

API_URL="http://localhost:3001/api/events"

echo "=== Testing Event CRUD API ==="
echo ""

# Test 1: Get all events (should be empty initially)
echo "1. GET /api/events"
curl -X GET $API_URL
echo -e "\n"

# Test 2: Create a new event
echo "2. POST /api/events"
EVENT_DATA='{
  "title": "Tech Conference 2024",
  "description": "Annual technology conference",
  "location": "San Francisco Convention Center",
  "date": "2024-12-15T09:00:00Z",
  "capacity": 500
}'
RESPONSE=$(curl -s -X POST $API_URL \
  -H "Content-Type: application/json" \
  -d "$EVENT_DATA")
echo $RESPONSE
EVENT_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*' | sed 's/"id":"//')
echo -e "\n"

# Test 3: Get single event
if [ ! -z "$EVENT_ID" ]; then
  echo "3. GET /api/events/$EVENT_ID"
  curl -X GET "$API_URL/$EVENT_ID"
  echo -e "\n"
  
  # Test 4: Update event
  echo "4. PUT /api/events/$EVENT_ID"
  UPDATE_DATA='{
    "title": "Tech Conference 2024 - Updated",
    "capacity": 600
  }'
  curl -X PUT "$API_URL/$EVENT_ID" \
    -H "Content-Type: application/json" \
    -d "$UPDATE_DATA"
  echo -e "\n"
  
  # Test 5: Get all events again
  echo "5. GET /api/events (after update)"
  curl -X GET $API_URL
  echo -e "\n"
  
  # Test 6: Delete event
  echo "6. DELETE /api/events/$EVENT_ID"
  curl -X DELETE "$API_URL/$EVENT_ID"
  echo -e "\n"
  
  # Test 7: Verify deletion
  echo "7. GET /api/events (after delete)"
  curl -X GET $API_URL
  echo -e "\n"
fi

echo "=== Tests Complete ===" 