# ClaimSight Database Seeder - Windows PowerShell
# Runs the Node.js database seeder script

$ErrorActionPreference = "Stop"

Write-Host "=== ClaimSight Database Seeder ===" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-Not (Test-Path ".env")) {
    Write-Host "ERROR: .env file not found" -ForegroundColor Red
    Write-Host "Run 'npm run setup' first" -ForegroundColor Yellow
    exit 1
}

# Load environment variables
Write-Host "Loading environment variables..." -ForegroundColor Yellow
Get-Content ".env" | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $name = $matches[1]
        $value = $matches[2]
        [Environment]::SetEnvironmentVariable($name, $value, "Process")
    }
}

# Run the Node.js seeder
Write-Host "Running database seeder..." -ForegroundColor Yellow
Write-Host ""

node db/seed.js

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Database seeded successfully!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "ERROR: Seeding failed" -ForegroundColor Red
    exit 1
}
