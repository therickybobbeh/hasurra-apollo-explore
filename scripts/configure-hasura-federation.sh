#!/bin/bash

# Configure Hasura tables for Apollo Federation
# This script enables federation on tables that other subgraphs reference

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Configuring Hasura Apollo Federation${NC}\n"

# Check if .env file exists
if [ ! -f .env ]; then
  echo -e "${RED}❌ Error: .env file not found${NC}"
  echo "Please create .env file with HASURA_GRAPHQL_ENDPOINT and HASURA_GRAPHQL_ADMIN_SECRET"
  exit 1
fi

# Load environment variables
source .env

# Verify required environment variables
if [ -z "$HASURA_GRAPHQL_ENDPOINT" ]; then
  echo -e "${RED}❌ Error: HASURA_GRAPHQL_ENDPOINT not set in .env${NC}"
  exit 1
fi

if [ -z "$HASURA_GRAPHQL_ADMIN_SECRET" ]; then
  echo -e "${RED}❌ Error: HASURA_GRAPHQL_ADMIN_SECRET not set in .env${NC}"
  exit 1
fi

# Construct metadata endpoint
HASURA_ENDPOINT="${HASURA_GRAPHQL_ENDPOINT}/v1/metadata"
ADMIN_SECRET="${HASURA_GRAPHQL_ADMIN_SECRET}"

echo -e "${BLUE}Endpoint: ${HASURA_ENDPOINT}${NC}"
echo -e "${BLUE}Using admin secret: ${ADMIN_SECRET:0:10}...${NC}\n"

# Function to enable federation on a table
enable_federation() {
  local table_name=$1
  local table_label=$2

  echo -e "${YELLOW}Configuring ${table_label}...${NC}"

  response=$(curl -s -X POST \
    "${HASURA_ENDPOINT}" \
    -H "Content-Type: application/json" \
    -H "x-hasura-admin-secret: ${ADMIN_SECRET}" \
    -d '{
      "type": "pg_set_apollo_federation_config",
      "args": {
        "source": "default",
        "table": {
          "schema": "public",
          "name": "'"${table_name}"'"
        },
        "apollo_federation_config": {
          "enable": "v1"
        }
      }
    }')

  # Check if response contains error
  if echo "$response" | grep -q "error"; then
    echo -e "${RED}❌ Error configuring ${table_label}:${NC}"
    echo "$response" | jq '.'
    return 1
  else
    echo -e "${GREEN}✓ Enabled federation on ${table_label}${NC}\n"
    return 0
  fi
}

# Check if jq is available for JSON parsing
if ! command -v jq &> /dev/null; then
  echo -e "${YELLOW}Note: jq not found. Install with 'brew install jq' for better error messages.${NC}\n"
fi

# Enable federation on each table
errors=0

enable_federation "members" "members table" || ((errors++))
enable_federation "provider_records" "provider_records table" || ((errors++))
enable_federation "claims" "claims table" || ((errors++))

echo ""

if [ $errors -eq 0 ]; then
  echo -e "${GREEN}✅ Apollo Federation configuration complete!${NC}\n"
  echo -e "${BLUE}To verify, run this query in Hasura Console:${NC}"
  echo -e "${YELLOW}{ _service { sdl } }${NC}\n"
  echo -e "${BLUE}Look for @key directives on member_records, provider_records, and claim_records types.${NC}\n"
else
  echo -e "${RED}❌ Configuration completed with $errors error(s)${NC}"
  echo -e "${YELLOW}Check the error messages above for details.${NC}\n"
  exit 1
fi
