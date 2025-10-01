# ClaimSight Setup Script - Windows PowerShell
# Checks prerequisites and sets up the development environment

$ErrorActionPreference = "Stop"

Write-Host "=== ClaimSight Setup (Windows) ===" -ForegroundColor Cyan
Write-Host ""

# Check Node.js version
Write-Host "Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    $nodeMajor = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($nodeMajor -lt 18) {
        Write-Host "ERROR: Node.js 18+ required. Found: $nodeVersion" -ForegroundColor Red
        Write-Host "Download from: https://nodejs.org/" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Node.js not found. Install from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check npm
Write-Host "Checking npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✓ npm $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: npm not found" -ForegroundColor Red
    exit 1
}

# Check PostgreSQL
Write-Host ""
Write-Host "Checking PostgreSQL..." -ForegroundColor Yellow
try {
    $psqlVersion = psql --version
    Write-Host "✓ PostgreSQL found: $psqlVersion" -ForegroundColor Green
} catch {
    Write-Host "WARNING: psql not found in PATH" -ForegroundColor Yellow
    Write-Host "Install PostgreSQL from: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    Write-Host "Or use Postgres.app, EDB Installer, or Docker alternative" -ForegroundColor Yellow
}

# Check/Install Hasura CLI
Write-Host ""
Write-Host "Checking Hasura CLI..." -ForegroundColor Yellow
try {
    $hasuraVersion = hasura version
    Write-Host "✓ Hasura CLI found" -ForegroundColor Green
} catch {
    Write-Host "Hasura CLI not found. Installing..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To install Hasura CLI on Windows:" -ForegroundColor Cyan
    Write-Host "1. Using npm (recommended):" -ForegroundColor White
    Write-Host "   npm install -g hasura-cli" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Using binary download:" -ForegroundColor White
    Write-Host "   https://hasura.io/docs/latest/hasura-cli/install-hasura-cli/" -ForegroundColor Gray
    Write-Host ""
    $install = Read-Host "Install via npm now? (y/n)"
    if ($install -eq "y") {
        npm install -g hasura-cli
        Write-Host "✓ Hasura CLI installed" -ForegroundColor Green
    } else {
        Write-Host "Please install Hasura CLI manually and run setup again" -ForegroundColor Yellow
        exit 1
    }
}

# Copy .env.example to .env if not exists
Write-Host ""
Write-Host "Setting up environment file..." -ForegroundColor Yellow
if (-Not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✓ Created .env from .env.example" -ForegroundColor Green
    Write-Host "Please edit .env with your database credentials" -ForegroundColor Yellow
} else {
    Write-Host "✓ .env already exists" -ForegroundColor Green
}

# Install root dependencies
Write-Host ""
Write-Host "Installing root dependencies..." -ForegroundColor Yellow
npm install
Write-Host "✓ Root dependencies installed" -ForegroundColor Green

# Install client dependencies
Write-Host ""
Write-Host "Installing client dependencies..." -ForegroundColor Yellow
Set-Location "app/client"
npm install
Set-Location "../.."
Write-Host "✓ Client dependencies installed" -ForegroundColor Green

# Install server (subgraph) dependencies
Write-Host ""
Write-Host "Installing server (subgraph) dependencies..." -ForegroundColor Yellow
Set-Location "app/server"
npm install
Set-Location "../.."
Write-Host "✓ Server dependencies installed" -ForegroundColor Green

# Install action handler dependencies
Write-Host ""
Write-Host "Installing action handler dependencies..." -ForegroundColor Yellow
Set-Location "hasura/actions/handlers"
npm install
Set-Location "../../.."
Write-Host "✓ Action handler dependencies installed" -ForegroundColor Green

Write-Host ""
Write-Host "=== Setup Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit .env with your PostgreSQL credentials" -ForegroundColor White
Write-Host "2. Create the database: createdb claimsight" -ForegroundColor White
Write-Host "   (Or use pgAdmin/another tool)" -ForegroundColor Gray
Write-Host "3. Run: npm run seed" -ForegroundColor White
Write-Host "4. Run: npm run hasura:apply" -ForegroundColor White
Write-Host "5. Run: npm run dev" -ForegroundColor White
Write-Host ""
