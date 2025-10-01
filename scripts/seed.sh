#!/usr/bin/env bash
# ClaimSight Database Seeder - macOS/Linux
# Runs the Node.js database seeder script

set -e

echo "=== ClaimSight Database Seeder ==="
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "ERROR: .env file not found"
    echo "Run 'npm run setup' first"
    exit 1
fi

# Load environment variables (skip VITE_TEST_USERS which has special chars)
echo "Loading environment variables..."
set -a
source <(grep -v '^#' .env | grep -v '^VITE_TEST_USERS')
set +a

# Run the Node.js seeder
echo "Running database seeder..."
echo ""

node db/seed.js

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Database seeded successfully!"
else
    echo ""
    echo "ERROR: Seeding failed"
    exit 1
fi
