# Local Development Lab

**For local development setup and testing** - Use this for learning GraphQL and federation concepts on your local machine.

> **Note:** For cloud deployment (recommended), see the parent [deployment](../) directory guides.

---

## 📋 Overview

The local lab allows you to run the complete ClaimSight stack on your machine:
- PostgreSQL database (via Docker or native installation)
- Hasura GraphQL Engine (local binary or Docker)
- Apollo Federation gateway
- Provider ratings subgraph
- React frontend

**When to use local development:**
- ✅ Learning GraphQL and federation concepts offline
- ✅ Developing new features without cloud costs
- ✅ Testing schema changes before deployment
- ✅ Working without internet connection

**When to use cloud deployment:**
- ✅ Sharing demos with others
- ✅ Deploying to production
- ✅ Learning cloud-native architecture
- ✅ Avoiding local infrastructure setup

---

## 🚀 Quick Start

### Prerequisites

**All Platforms:**
- Node.js 18+ ([nodejs.org](https://nodejs.org/))
- PostgreSQL 15+ OR Docker

**Platform-Specific Guides:**
- **Windows:** See [WINDOWS_SETUP.md](../../DOCUMENTS/WINDOWS_SETUP.md) for Docker-free native setup
- **macOS/Linux:** See main [README.md](../../README.md) for Homebrew/apt setup

### Option A: Docker (Recommended - Easiest)

```bash
# From project root
docker-compose up -d
npm run setup
npm run seed
npm run hasura:apply
npm run federated:dev
```

**Access Points:**
- Frontend: http://localhost:5173
- Gateway: http://localhost:4000/graphql
- Hasura Console: http://localhost:8080

### Option B: Native PostgreSQL (No Docker)

**Windows Users:**
Follow the complete [Windows Setup Guide](../../DOCUMENTS/WINDOWS_SETUP.md) for step-by-step instructions.

**macOS/Linux:**
```bash
# Install PostgreSQL
brew install postgresql@15   # macOS
# OR
sudo apt-get install postgresql-15   # Linux

# Create database
createdb claimsight

# Setup
npm run setup
npm run seed
npm run hasura:apply
npm run federated:dev
```

---

## 🎓 Learning Path (Local)

### 1. Start with Direct Mode (Simpler)
```bash
npm run dev
```

**What you get:**
- Hasura GraphQL API only
- No Apollo Federation complexity
- Faster startup
- Good for learning Challenges 1-6

**Frontend connects to:** Hasura directly (http://localhost:8080/v1/graphql)

### 2. Move to Federated Mode (Advanced)
```bash
npm run federated:dev
```

**What you get:**
- Apollo Gateway (port 4000)
- Providers subgraph (port 3002) with ratings
- Federation entity resolution
- Full feature set

**Frontend connects to:** Gateway (http://localhost:4000/graphql)

---

## 📁 Local Development Resources

### Setup Guides
- [Main README](../../README.md) - Quick start for macOS/Linux
- [Windows Setup Guide](../../DOCUMENTS/WINDOWS_SETUP.md) - Complete Windows walkthrough
- [Architecture Overview](../../DOCUMENTS/ARCHITECTURE_OVERVIEW.md) - System design
- [Federation Guide](../../DOCUMENTS/FEDERATION_GUIDE.md) - Understanding Apollo Federation

### Configuration Files
- [`docker-compose.yml`](../../docker-compose.yml) - PostgreSQL container setup
- [`.env.example`](../../.env.example) - Local environment template
- [`hasura/config.yaml`](../../hasura/config.yaml) - Hasura CLI configuration

### Database Files
- [`db/schema.sql`](../../db/schema.sql) - Database schema
- [`db/indexes.sql`](../../db/indexes.sql) - Performance indexes
- [`db/rls.sql`](../../db/rls.sql) - Row-level security policies
- [`db/seed.js`](../../db/seed.js) - Sample data generator

---

## 🔄 Local vs Cloud Configuration

### Database Connection

**Local (Docker):**
```bash
# .env
DATABASE_URL=postgresql://claimsight:claimsight_dev@localhost:5432/claimsight
```

**Local (Native PostgreSQL):**
```bash
# .env
PGHOST=localhost
PGPORT=5432
PGUSER=claimsight
PGPASSWORD=claimsight_dev
PGDATABASE=claimsight
```

**Cloud (Hasura Cloud + Neon):**
```bash
# .env.cloud
DATABASE_URL=postgres://user:password@ep-xxxxx.region.aws.neon.tech/dbname?sslmode=require
```

### Hasura Endpoint

**Local:**
```bash
# Frontend .env
VITE_GRAPHQL_HTTP_URL=http://localhost:8080/v1/graphql
VITE_GRAPHQL_WS_URL=ws://localhost:8080/v1/graphql
```

**Cloud:**
```bash
# Frontend .env
VITE_GRAPHQL_HTTP_URL=https://your-project.hasura.app/v1/graphql
VITE_GRAPHQL_WS_URL=wss://your-project.hasura.app/v1/graphql
```

---

## 🛠️ Common Local Development Tasks

### Reset Database
```bash
# Drop and recreate database
dropdb claimsight && createdb claimsight
npm run seed
npm run hasura:apply
```

### Update Hasura Metadata
```bash
# After changing permissions, relationships, or actions
npm run hasura:apply
```

### Generate Fresh Seed Data
```bash
# Generates new random data
npm run seed
```

### Test Federation Locally
```bash
# Start federated mode
npm run federated:dev

# In another terminal, test entity resolution
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ providerRecords { id name rating reviewCount } }"}'
```

### Switch Between Development Modes

**To Direct Mode (Hasura only):**
1. Stop services (Ctrl+C)
2. Update `app/client/.env`:
   ```bash
   VITE_GRAPHQL_HTTP_URL=http://localhost:8080/v1/graphql
   ```
3. Run `npm run dev`

**To Federated Mode (Gateway):**
1. Stop services (Ctrl+C)
2. Update `app/client/.env`:
   ```bash
   VITE_GRAPHQL_HTTP_URL=http://localhost:4000/graphql
   ```
3. Run `npm run federated:dev`

---

## 🐛 Troubleshooting Local Setup

### Issue: Can't connect to PostgreSQL

**Docker:**
```bash
# Check if container is running
docker ps

# View logs
docker-compose logs postgres

# Restart
docker-compose restart postgres
```

**Native:**
```bash
# Check if PostgreSQL is running (macOS)
brew services list

# Start service
brew services start postgresql@15

# Windows: Use Services app or pg_ctl
```

### Issue: Hasura can't connect to database

```bash
# Verify DATABASE_URL in .env
# Ensure PostgreSQL is accepting connections
psql -h localhost -U claimsight -d claimsight

# Check firewall/security settings
```

### Issue: Port already in use

```bash
# Find process using port (example: 8080)
# macOS/Linux:
lsof -i :8080

# Windows:
netstat -ano | findstr :8080

# Kill process or change port in configuration
```

### Issue: Federation gateway errors

```bash
# Verify subgraph is running
curl http://localhost:3002/health

# Check Hasura is accessible
curl http://localhost:8080/v1/version

# Review gateway logs for specific errors
```

---

## 📚 Related Documentation

### Guides
- [Testing Guide](../../DOCUMENTS/TESTING_GUIDE.md) - Local testing strategies
- [Best Practices](../../DOCUMENTS/BEST_PRACTICES.md) - Code quality standards
- [Role Switcher](../../DOCUMENTS/ROLE_SWITCHER.md) - Testing different user roles locally

---

## 🚀 Moving from Local to Cloud

**Ready to deploy?** See the cloud deployment guides:

1. **[Phase 1: Hasura Cloud](../hasura-cloud/README.md)** - Deploy database + GraphQL API (30 min)
2. **[Phase 2: Apollo GraphOS](../apollo-graphos/README.md)** - Add federation (45 min)
3. **[Phase 3: Full Stack](../render/README.md)** - Deploy gateway + frontend (1-2 hrs)

**Cost:** $0/month with free tiers!

---

## 📊 Local vs Cloud Comparison

| Feature | Local Development | Cloud Deployment |
|---------|------------------|------------------|
| **Setup Time** | 15-30 min | 30-60 min |
| **Cost** | Free | Free (with tier limits) |
| **Internet Required** | Only for npm install | Always |
| **Share with Others** | ❌ No | ✅ Yes |
| **Performance** | Fast (local network) | Varies (geography) |
| **Database Size** | Unlimited | 100MB-0.5GB (free tier) |
| **Uptime** | When you run it | 24/7 |
| **Best For** | Development, learning | Demos, production |

---

**Questions about local setup?** Check the platform-specific guides above or main [README.md](../../README.md).

**Ready for cloud?** Head to the main [deployment directory](../) to get started!
