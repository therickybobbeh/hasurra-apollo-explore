#!/usr/bin/env bash
# ClaimSight Setup Script - macOS/Linux
# Checks prerequisites and sets up the development environment

set -e

echo "=== ClaimSight Setup (macOS/Linux) ==="
echo ""

# Check Node.js version
echo "Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js not found"
    echo "Install from: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version)
NODE_MAJOR=$(echo "$NODE_VERSION" | sed 's/v\([0-9]*\).*/\1/')

if [ "$NODE_MAJOR" -lt 18 ]; then
    echo "ERROR: Node.js 18+ required. Found: $NODE_VERSION"
    echo "Download from: https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js $NODE_VERSION"

# Check npm
echo "Checking npm..."
if ! command -v npm &> /dev/null; then
    echo "ERROR: npm not found"
    exit 1
fi

NPM_VERSION=$(npm --version)
echo "✓ npm $NPM_VERSION"

# Check PostgreSQL
echo ""
echo "Checking PostgreSQL..."
if command -v psql &> /dev/null; then
    PSQL_VERSION=$(psql --version)
    echo "✓ PostgreSQL found: $PSQL_VERSION"
else
    echo "WARNING: psql not found in PATH"
    echo "Install PostgreSQL:"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "  - Homebrew: brew install postgresql@15"
        echo "  - Postgres.app: https://postgresapp.com/"
    else
        echo "  - Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib"
        echo "  - Fedora/RHEL: sudo dnf install postgresql-server postgresql-contrib"
    fi
fi

# Check/Install Hasura CLI
echo ""
echo "Checking Hasura CLI..."
if command -v hasura &> /dev/null; then
    echo "✓ Hasura CLI found"
    hasura version
else
    echo "Hasura CLI not found."
    echo ""
    echo "To install Hasura CLI:"
    echo "1. Using npm (recommended):"
    echo "   npm install -g hasura-cli"
    echo ""
    echo "2. Using binary download:"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "   brew install hasura-cli"
    else
        echo "   curl -L https://github.com/hasura/graphql-engine/raw/stable/cli/get.sh | bash"
    fi
    echo ""
    read -p "Install via npm now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npm install -g hasura-cli
        echo "✓ Hasura CLI installed"
    else
        echo "Please install Hasura CLI manually and run setup again"
        exit 1
    fi
fi

# Copy .env.example to .env if not exists
echo ""
echo "Setting up environment file..."
if [ ! -f ".env" ]; then
    cp ".env.example" ".env"
    echo "✓ Created .env from .env.example"
    echo "Please edit .env with your database credentials"
else
    echo "✓ .env already exists"
fi

# Install root dependencies
echo ""
echo "Installing root dependencies..."
npm install
echo "✓ Root dependencies installed"

# Install client dependencies
echo ""
echo "Installing client dependencies..."
cd app/client
npm install
cd ../..
echo "✓ Client dependencies installed"

# Install server (subgraph) dependencies
echo ""
echo "Installing server (subgraph) dependencies..."
cd app/server
npm install
cd ../..
echo "✓ Server dependencies installed"

# Install action handler dependencies
echo ""
echo "Installing action handler dependencies..."
cd hasura/actions/handlers
npm install
cd ../../..
echo "✓ Action handler dependencies installed"

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "1. Edit .env with your PostgreSQL credentials"
echo "2. Create the database: createdb claimsight"
echo "   (Or use your preferred method)"
echo "3. Run: npm run seed"
echo "4. Run: npm run hasura:apply"
echo "5. Run: npm run dev"
echo ""
