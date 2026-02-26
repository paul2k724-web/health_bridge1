#!/bin/bash

BASE_URL="http://localhost:5000/api"

echo "=========================================="
echo "HealthBridge Marketplace Test Flow"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "\n${BLUE}Step 1: Register Provider${NC}"
PROVIDER_RESP=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Test Provider",
    "email": "provider-test-'$(date +%s)'@test.com",
    "phone": "+91'$(shuf -i 7000000000-9999999999 -n 1)'",
    "password": "Test@123",
    "role": "provider"
  }')
echo "$PROVIDER_RESP" | head -200

PROVIDER_TOKEN=$(echo "$PROVIDER_RESP" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
PROVIDER_ID=$(echo "$PROVIDER_RESP" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)

echo -e "\n${GREEN}Provider ID: $PROVIDER_ID${NC}"
echo -e "${GREEN}Token obtained: ${PROVIDER:0:30}...${NC}"

echo -e "\n${BLUE}Step 2: Complete Provider Onboarding Step 1 (Profile)${NC}"
curl -s -X POST "$BASE_URL/provider/onboarding/step1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PROVIDER_TOKEN" \
  -d '{
    "providerType": "doctor",
    "specialization": "General Physician",
    "experience": 5,
    "bio": "Experienced general physician providing home healthcare services"
  }' | head -100

echo -e "\n${BLUE}Step 3: Complete Provider Onboarding Step 2 (Services)${NC}"
curl -s -X POST "$BASE_URL/provider/onboarding/step2" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PROVIDER_TOKEN" \
  -d '{
    "serviceCategories": ["699969764f0e7ae255543fa5", "699969764f0e7ae255543fa8"]
  }' | head -100

echo -e "\n${BLUE}Step 4: Complete Provider Onboarding Step 3 (Documents - Skip for now)${NC}"
curl -s -X POST "$BASE_URL/provider/onboarding/step3" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PROVIDER_TOKEN" \
  -d '{}' | head -100

echo -e "\n${BLUE}Step 5: Complete Provider Onboarding Step 4 (Location)${NC}"
curl -s -X POST "$BASE_URL/provider/onboarding/step4" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PROVIDER_TOKEN" \
  -d '{
    "baseLocation": {
      "type": "Point",
      "coordinates": [77.2090, 28.6139]
    },
    "serviceRadius": 15,
    "address": "Connaught Place, New Delhi, India"
  }' | head -100

echo -e "\n${BLUE}Step 6: Accept Agreement & Submit${NC}"
curl -s -X POST "$BASE_URL/provider/onboarding/accept-agreement" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PROVIDER_TOKEN" | head -100

curl -s -X POST "$BASE_URL/provider/onboarding/submit" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PROVIDER_TOKEN" | head -100

echo -e "\n${BLUE}Step 7: Check Provider Status${NC}"
curl -s -X GET "$BASE_URL/provider/profile" \
  -H "Authorization: Bearer $PROVIDER_TOKEN" | head -200

echo -e "\n${GREEN}=========================================="
echo "Provider onboarding complete!"
echo "Status should be 'pending' - needs admin approval"
echo "==========================================${NC}"

echo -e "\n${BLUE}Now open the browser and:${NC}"
echo "1. Login as admin to approve provider"
echo "2. Login as customer to create booking"
echo "3. Admin confirms booking"
echo "4. Provider sees and accepts job"
echo ""
echo "Provider Token (save for later):"
echo "$PROVIDER_TOKEN"
