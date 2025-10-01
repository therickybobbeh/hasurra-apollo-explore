# ClaimSight Start All Services - Windows PowerShell
# Starts all development services concurrently

$ErrorActionPreference = "Stop"

Write-Host "=== ClaimSight Development Environment ===" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-Not (Test-Path ".env")) {
    Write-Host "ERROR: .env file not found" -ForegroundColor Red
    Write-Host "Run 'npm run setup' first" -ForegroundColor Yellow
    exit 1
}

Write-Host "Starting all services..." -ForegroundColor Yellow
Write-Host "- Action handler (port 3001)" -ForegroundColor White
Write-Host "- Client app (port 5173)" -ForegroundColor White
Write-Host "- Subgraph (port 3002)" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Gray
Write-Host ""

# Start all services using concurrently
npm run all:dev
