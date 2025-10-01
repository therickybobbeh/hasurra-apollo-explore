#!/usr/bin/env bash
# ClaimSight Start All Services - macOS/Linux
# Starts all development services concurrently

set -e

echo "=== ClaimSight Development Environment ==="
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "ERROR: .env file not found"
    echo "Run 'npm run setup' first"
    exit 1
fi

# Load environment variables
export $(grep -v '^#' .env | xargs)

echo "Starting all services..."
echo "- Action handler (port 3001)"
echo "- Client app (port 5173)"
echo "- Subgraph (port 3002)"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Start all services using concurrently
npm run all:dev
