#!/usr/bin/env bash
# ClaimSight Hasura Apply - macOS/Linux
# Applies Hasura metadata and migrations

set -e

echo "=== ClaimSight Hasura Apply ==="
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "ERROR: .env file not found"
    echo "Run 'npm run setup' first"
    exit 1
fi

# Load environment variables (skip VITE_TEST_USERS which has special chars)
set -a
source <(grep -v '^#' .env | grep -v '^VITE_TEST_USERS')
set +a

# Check Hasura CLI
if ! command -v hasura &> /dev/null; then
    echo "ERROR: Hasura CLI not found"
    echo "Install via: npm install -g hasura-cli"
    exit 1
fi

# Change to hasura directory
cd hasura

echo "Applying Hasura migrations..."
hasura migrate apply --database-name default

echo ""
echo "Applying Hasura metadata..."
hasura metadata apply

echo ""
echo "Reloading Hasura metadata..."
hasura metadata reload

# Return to root
cd ..

echo ""
echo "✓ Hasura metadata and migrations applied successfully!"
echo ""
echo "Hasura Console: $HASURA_GRAPHQL_ENDPOINT/console"
