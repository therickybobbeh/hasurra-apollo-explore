# ClaimSight Hasura Apply - Windows PowerShell
# Applies Hasura metadata and migrations

$ErrorActionPreference = "Stop"

Write-Host "=== ClaimSight Hasura Apply ===" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-Not (Test-Path ".env")) {
    Write-Host "ERROR: .env file not found" -ForegroundColor Red
    Write-Host "Run 'npm run setup' first" -ForegroundColor Yellow
    exit 1
}

# Check Hasura CLI
try {
    hasura version | Out-Null
} catch {
    Write-Host "ERROR: Hasura CLI not found" -ForegroundColor Red
    Write-Host "Install via: npm install -g hasura-cli" -ForegroundColor Yellow
    exit 1
}

# Change to hasura directory
Set-Location "hasura"

Write-Host "Applying Hasura migrations..." -ForegroundColor Yellow
hasura migrate apply --database-name default

Write-Host ""
Write-Host "Applying Hasura metadata..." -ForegroundColor Yellow
hasura metadata apply

Write-Host ""
Write-Host "Reloading Hasura metadata..." -ForegroundColor Yellow
hasura metadata reload

# Return to root
Set-Location ".."

Write-Host ""
Write-Host "✓ Hasura metadata and migrations applied successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Hasura Console: $env:HASURA_GRAPHQL_ENDPOINT/console" -ForegroundColor Cyan
