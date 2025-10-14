# ClaimSight

**Cross-platform healthcare claims management system** built with GraphQL, Hasura, Apollo Client, and PromptQL.

A comprehensive learning application that teaches modern GraphQL development with **optional Docker** for PostgreSQL, working identically on Windows, macOS, and Linux.

## Features

- ✅ **GraphQL API** with Hasura - Auto-generated CRUD, relationships, subscriptions
- ✅ **Row-Level Security** - Database-enforced permissions for admin/member/provider roles
- ✅ **Real-Time Updates** - WebSocket subscriptions for live data
- ✅ **Custom Actions** - Eligibility verification via REST API integration
- ✅ **Apollo Client** - HTTP + WebSocket links, optimistic updates, normalized cache
- ✅ **React + TypeScript** - Modern frontend with TailwindCSS
- ✅ **Apollo Federation** - TRUE federation with `@key` directive, polyglot microservices
- ✅ **Spring Boot GraphQL** - Java-based GraphQL service with JPA
- ✅ **PromptQL Examples** - Natural language to SQL query concepts
- ✅ **Cross-Platform** - Native setup for Windows, macOS, Linux (no Docker)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, TailwindCSS |
| GraphQL Client | Apollo Client 3 (HTTP + WebSocket) |
| GraphQL Server | Hasura GraphQL Engine |
| Database | PostgreSQL 15+ with RLS |
| Business Logic | Node.js/Express (Actions & Subgraph) |
| NL Queries | PromptQL concepts |

---

## 🎓 Learning Labs

**New to GraphQL?** Follow our progressive learning labs:

| Lab | Topic | Time | Difficulty |
|-----|-------|------|------------|
| **[Phase 1](labs/phase-1-hasura-cloud/README.md)** | Hasura Cloud + PostgreSQL | 30 min | 🟢 Beginner |
| **[Phase 2](labs/phase-2-apollo-federation/README.md)** | Apollo GraphOS Federation | 45 min | 🟡 Intermediate |
| **[Phase 3](labs/phase-3-apollo-server/README.md)** | Apollo Server from Scratch | 1 hr | 🟡 Intermediate |
| **[Phase 4](labs/phase-4-add-to-federation/README.md)** | Add Apollo to Federation | 45 min | 🟡 Intermediate |
| **[Phase 5](labs/phase-5-spring-boot-graphql/README.md)** | Spring Boot GraphQL | 1 hr | 🟡 Intermediate |
| **[Phase 6](labs/phase-6-add-spring-boot-to-federation/README.md)** | Add Spring Boot to Federation | 45 min | 🟡 Intermediate |
| **[Phase 7](labs/phase-7-hasura-ddn/README.md)** | Hasura DDN Migration | 2-3 hrs | 🔴 Advanced |
| **[Phase 8](labs/phase-8-promptql/README.md)** | PromptQL + AI Integration | 1-2 hrs | 🔴 Advanced |

👉 **Start here:** [Labs Overview](labs/README.md)

---

## Quick Start

> **📘 Windows Users**: For a complete Docker-free setup using Hasura Cloud and native PostgreSQL, see the dedicated **[Windows Setup Guide](DOCUMENTS/WINDOWS_SETUP.md)** with step-by-step instructions for PowerShell, PostgreSQL installation, and cloud deployment.

### Prerequisites

**All Platforms:**
- Node.js 18+ ([nodejs.org](https://nodejs.org/))
- PostgreSQL 15+ ([postgresql.org](https://www.postgresql.org/download/)) **OR** Docker for containerized PostgreSQL
- Hasura CLI (installed via npm during setup)

**Platform-Specific:**

<details>
<summary><strong>Windows</strong></summary>

```powershell
# Install Node.js from nodejs.org
# Install PostgreSQL from postgresql.org or use EDB Installer

# Check installations
node --version  # Should be 18+
psql --version  # Should be 15+
```
</details>

<details>
<summary><strong>macOS</strong></summary>

```bash
# Using Homebrew
brew install node postgresql@15

# Or download from websites
# Node: nodejs.org
# PostgreSQL: postgresapp.com or postgresql.org

# Check installations
node --version  # Should be 18+
psql --version  # Should be 15+
```
</details>

<details>
<summary><strong>Linux (Ubuntu/Debian)</strong></summary>

```bash
# Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PostgreSQL
sudo apt-get install postgresql-15

# Check installations
node --version  # Should be 18+
psql --version  # Should be 15+
```
</details>

### Installation

**Step 1: Setup Environment**

```bash
# Windows (PowerShell)
copy .env.example .env

# macOS/Linux
cp .env.example .env
```

Edit `.env` with your PostgreSQL credentials:
```bash
PGHOST=localhost
PGPORT=5432
PGUSER=claimsight
PGPASSWORD=claimsight_dev
PGDATABASE=claimsight
```

**Step 2: Start PostgreSQL**

**Option A: Using Docker (Easiest)**
```bash
docker-compose up -d
```

This starts PostgreSQL 15 in a container with the database already created.

**Option B: Local PostgreSQL**
```bash
# Windows (if psql in PATH)
createdb claimsight

# macOS/Linux
createdb claimsight

# Or use pgAdmin, DBeaver, or another GUI tool
```

**Step 3: Install Dependencies & Setup**

```bash
npm run setup
```

This will:
- Install Node.js dependencies
- Install Hasura CLI (if not present)
- Set up all project packages

**Step 4: Seed Database**

```bash
npm run seed
```

Creates schema, indexes, RLS policies, and inserts 150+ rows of realistic healthcare data.

**Step 5: Apply Hasura Configuration**

```bash
npm run hasura:apply
```

Configures Hasura with metadata, relationships, and permissions.

**Step 6: Start All Services**

**Two Development Modes:**

<details open>
<summary><strong>Option A: Federated Mode (Recommended for Full Features)</strong></summary>

```bash
npm run federated:dev
```

Starts **all services** including Apollo Federation:
- **Action Handler** (port 3001) - Eligibility check API
- **Ratings Subgraph** (port 3002) - Provider ratings API
- **Apollo Gateway** (port 4000) - **Federation endpoint** ⭐
- **Client App** (port 5173) - React frontend (connects to gateway)

**Features:**
- ✅ Full Apollo Federation capabilities
- ✅ Provider ratings and reviews (federated data)
- ✅ Gateway combines Hasura + ratings subgraph
- ✅ Demonstrates entity resolution across services

**When to use:** Learning federation, building with multiple data sources, or exploring the ratings feature.

</details>

<details>
<summary><strong>Option B: Direct Mode (Simpler, Faster Startup)</strong></summary>

```bash
npm run dev
```

Starts **core services only**:
- **Action Handler** (port 3001) - Eligibility check API
- **Client App** (port 5173) - React frontend (connects directly to Hasura)

**Features:**
- ✅ Simpler setup
- ✅ Faster startup time
- ✅ All core functionality (claims, notes, eligibility)
- ❌ No provider ratings (requires federation)

**When to use:** Learning GraphQL basics, focusing on Hasura, or skipping federation for now.

</details>

> **💡 Tip:** The default `.env` points to the gateway (port 4000). To use direct mode, update `.env`:
> ```bash
> VITE_GRAPHQL_HTTP_URL=http://localhost:8080/v1/graphql
> VITE_GRAPHQL_WS_URL=ws://localhost:8080/v1/graphql
> ```

**Step 7: Start Hasura**

<details>
<summary><strong>Option A: Hasura Cloud (Recommended)</strong></summary>

1. Sign up at [cloud.hasura.io](https://cloud.hasura.io/)
2. Create new project
3. Connect your PostgreSQL database
4. Update `.env` with cloud endpoint
5. Run `npm run hasura:apply`
</details>

<details>
<summary><strong>Option B: Local Binary</strong></summary>

**Windows:**
```powershell
# Download from https://github.com/hasura/graphql-engine/releases
# Run with environment variables from .env
```

**macOS:**
```bash
brew install hasura-cli
hasura console --endpoint http://localhost:8080 --admin-secret claimsight_admin_secret_change_me
```

**Linux:**
```bash
curl -L https://github.com/hasura/graphql-engine/releases/latest/download/cli-hasura-linux-amd64 -o hasura
chmod +x hasura
./hasura console --endpoint http://localhost:8080
```
</details>

### Access Points

| Service | URL | Description | Mode |
|---------|-----|-------------|------|
| **Frontend** | http://localhost:5173 | React app | Both |
| **Apollo Gateway** | http://localhost:4000/graphql | **Federated GraphQL endpoint** ⭐ | Federated |
| **Hasura Console** | http://localhost:8080/console | GraphQL API explorer | Both |
| **Hasura GraphQL** | http://localhost:8080/v1/graphql | Direct GraphQL endpoint | Both |
| **Action Handler** | http://localhost:3001 | Eligibility API | Both |
| **Ratings Subgraph** | http://localhost:3002/graphql | Provider ratings API | Federated |

**Note:** In federated mode, the client connects to the gateway (4000) which combines Hasura + ratings. In direct mode, the client connects to Hasura (8080) directly.

## Project Structure

```
claimsight/
├── app/
│   ├── client/              # React frontend
│   │   ├── src/
│   │   │   ├── apollo/      # Apollo Client setup
│   │   │   ├── components/  # React components
│   │   │   ├── graphql/     # Queries, mutations, subscriptions
│   │   │   └── types/       # TypeScript types
│   │   └── package.json
│   └── server/              # Apollo subgraph (optional)
│       └── src/
├── db/
│   ├── schema.sql           # Database schema
│   ├── indexes.sql          # Performance indexes
│   ├── rls.sql              # Row-level security
│   └── seed.js              # Node.js seeder
├── hasura/
│   ├── metadata/            # Hasura configuration
│   ├── migrations/          # Database migrations
│   └── actions/
│       └── handlers/        # Custom business logic
├── promptql/
│   ├── config/              # PromptQL configuration
│   └── examples/            # Example queries
├── scripts/
│   ├── setup.ps1/.sh        # Cross-platform setup
│   ├── seed.ps1/.sh         # Database seeding
│   ├── apply-hasura.ps1/.sh # Hasura configuration
│   └── start-all.ps1/.sh    # Start all services
├── DOCUMENTS/
│   ├── UML/                 # Architecture diagrams
│   ├── ADRs/                # Architecture decisions
│   ├── BEST_PRACTICES.md
│   ├── ARCHITECTURE_OVERVIEW.md
│   └── LEARNING_CHECKLIST.md
└── README.md
```

## Usage Examples

### Testing Different Roles with Role Switcher

The frontend includes a **role switcher dropdown** in the top-right corner that allows you to switch between different users/roles without restarting the app.

**Pre-configured test users:**
- 🟣 **Admin User** - Full access to all data
- 🔵 **Member: Michael Lopez** - Only sees own claims (8 claims)
- 🔵 **Member: Linda Davis** - Only sees own claims (6 claims)
- 🟢 **Provider: Dr. Smith** - Only sees claims where they're the provider

Click the dropdown, select a user, and the page will reload with new permissions applied.

**Note:** Test users are hardcoded in `app/client/src/init.ts` and `app/client/src/context/RoleContext.tsx` as a fallback. The app first tries to load from `VITE_TEST_USERS` in `.env`, then falls back to hardcoded values.

**To add custom test users**, either:
1. Update `VITE_TEST_USERS` in `.env` (recommended for temporary changes)
2. Update hardcoded users in `init.ts` and `RoleContext.tsx` (recommended for permanent changes)

```bash
# Get IDs from database
docker exec claimsight-postgres psql -U claimsight -c \
  "SELECT id, first_name, last_name FROM members WHERE id IN (
    SELECT DISTINCT member_id FROM claims
  ) LIMIT 5;"

# Add to .env as JSON array
VITE_TEST_USERS=[{"role":"member","label":"Member: Jane Doe","memberId":"uuid-here"}]
```

See [ROLE_SWITCHER.md](DOCUMENTS/ROLE_SWITCHER.md) for detailed documentation.

### GraphQL Examples

**Query Claims:**
```graphql
query GetDeniedClaims {
  claims(where: { status: { _eq: "DENIED" } }, limit: 10) {
    id
    dos
    cpt
    denial_reason
    member {
      first_name
      last_name
    }
  }
}
```

**Add Note with Optimistic Update:**
```graphql
mutation AddNote($memberId: uuid!, $body: String!) {
  insert_notes_one(object: { member_id: $memberId, body: $body }) {
    id
    created_at
    body
  }
}
```

**Subscribe to Claims:**
```graphql
subscription WatchClaims($memberId: uuid!) {
  claims(where: { member_id: { _eq: $memberId } }) {
    id
    status
    updated_at
  }
}
```

**Run Eligibility Check (Custom Action):**
```graphql
mutation CheckEligibility($memberId: uuid!) {
  submitEligibilityCheck(memberId: $memberId) {
    id
    result
    checked_at
  }
}
```

## Learning Path

Follow the [labs](labs/README.md) for a progressive learning experience, building from Hasura Cloud basics through Apollo Federation and polyglot microservices architecture.

## Apollo Federation (Optional)

ClaimSight demonstrates **Apollo Federation** by extending the `Provider` type with ratings from a separate subgraph.

### Quick Start

```bash
# Start all services including federation gateway
npm run federated:dev
```

This starts:
- Hasura (port 8080) - Main GraphQL API
- Ratings subgraph (port 3002) - Provider ratings
- Federation gateway (port 4000) - **Unified endpoint** ⭐
- React client (port 5173)

### Query Federated Data

```graphql
query ProviderWithRatings {
  providers {
    name
    specialty    # From Hasura
    rating       # From subgraph!
    reviews {    # From subgraph!
      comment
    }
  }
}
```

### Visualize in Apollo Studio

Sign up for free at [studio.apollographql.com](https://studio.apollographql.com/) to:
- 📊 Visualize your federated graph
- 🔍 Explore schema with interactive query builder
- 📈 Monitor query performance
- ✅ Validate schema changes

**See [FEDERATION_GUIDE.md](DOCUMENTS/FEDERATION_GUIDE.md) for complete documentation.**

---

## Documentation

- 📘 **[Best Practices](DOCUMENTS/BEST_PRACTICES.md)** - Development guidelines
- 🏗️ **[Architecture Overview](DOCUMENTS/ARCHITECTURE_OVERVIEW.md)** - System design and data flow
- 🔄 **[Role Switcher](DOCUMENTS/ROLE_SWITCHER.md)** - Test different permissions in real-time
- 🪟 **[Windows Setup Guide](DOCUMENTS/WINDOWS_SETUP.md)** - Docker-free setup with Hasura Cloud
- 🌐 **[Federation Guide](DOCUMENTS/FEDERATION_GUIDE.md)** - Apollo Federation setup and visualization
- 📋 **[UML Diagrams](DOCUMENTS/UML/)** - Visual architecture
- 📝 **[ADRs](DOCUMENTS/ADRs/)** - Architecture decision records

## Troubleshooting

<details>
<summary><strong>Windows: Want to Avoid Docker?</strong></summary>

See the comprehensive **[Windows Setup Guide](DOCUMENTS/WINDOWS_SETUP.md)** for:
- Native PostgreSQL installation
- Hasura Cloud free tier setup
- Action handler deployment options (ngrok, Railway, Render)
- PowerShell-specific instructions
- Cloud database alternatives (Neon, Supabase)
</details>

<details>
<summary><strong>Windows: PowerShell Execution Policy Error</strong></summary>

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy Bypass -Force
```
</details>

<details>
<summary><strong>Database Connection Refused</strong></summary>

Check PostgreSQL is running:
```bash
# macOS
brew services list

# Linux
sudo systemctl status postgresql

# Windows
# Check Services for "postgresql-x64-15"
```
</details>

<details>
<summary><strong>Hasura Metadata Apply Failed</strong></summary>

Ensure database is seeded first:
```bash
npm run seed
npm run hasura:apply
```
</details>

<details>
<summary><strong>Port Already in Use</strong></summary>

Change ports in `.env`:
```bash
ACTION_HANDLER_PORT=3001
SUBGRAPH_PORT=3002
# Vite port in app/client/vite.config.ts
```
</details>

<details>
<summary><strong>Frontend Shows No Data</strong></summary>

1. Check Hasura is running
2. Verify GraphQL endpoint in `.env`
3. Check browser console for errors
4. Test query in Hasura Console first
</details>

<details>
<summary><strong>Action Handler Connection Refused (Eligibility Check Fails)</strong></summary>

If eligibility checks fail with "connection refused" errors, this is likely a Docker networking issue:

**Problem**: Hasura running in Docker can't reach `localhost:3001` on the host machine.

**Solution**: Update action handler URL to use `host.docker.internal`:

```bash
# In hasura/metadata/actions.yaml
handler: http://host.docker.internal:3001/eligibility
```

Then reapply metadata:
```bash
npm run hasura:apply
```

**Why**: Docker containers have their own network namespace. `localhost` inside a container refers to the container itself, not the host machine. Use `host.docker.internal` (Docker Desktop) or `172.17.0.1` (Linux) to reach the host.
</details>

## Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run setup` | Install dependencies, setup environment |
| `npm run seed` | Create schema and seed database |
| `npm run hasura:apply` | Apply Hasura metadata and migrations |
| `npm run dev` | Start all development services |
| `npm run client:dev` | Start frontend only |
| `npm run action:dev` | Start action handler only |
| `npm run subgraph:dev` | Start subgraph only |

## Docker Commands

| Command | Description |
|---------|-------------|
| `docker-compose up -d` | Start PostgreSQL in background |
| `docker-compose down` | Stop PostgreSQL |
| `docker-compose logs -f postgres` | View PostgreSQL logs |
| `docker-compose ps` | Check container status |
| `docker exec -it claimsight-postgres psql -U claimsight` | Connect to PostgreSQL |

## Contributing

This is a learning project. To extend it:

1. Follow patterns in existing code
2. Add tests for new features
3. Update documentation
4. Create ADR for significant decisions

## License

MIT

## Acknowledgments

Built with:
- [Hasura](https://hasura.io/) - GraphQL Engine
- [Apollo](https://www.apollographql.com/) - GraphQL Client & Server
- [React](https://react.dev/) - UI Framework
- [PostgreSQL](https://www.postgresql.org/) - Database
- [Vite](https://vitejs.dev/) - Build Tool

## Resetting the Lab

To restore the project to a clean state for new learners:

```bash
# Stop all services
docker-compose down -v

# Remove generated files (migrations are gitignored)
rm -rf hasura/migrations/default/*

# Start fresh
docker-compose up -d
npm run seed
npm run hasura:apply
npm run dev
```

The `.gitignore` is configured to keep the repository in a fresh state - migrations and Docker volumes are not committed.

## Support

- 📖 **Docs:** [DOCUMENTS/](DOCUMENTS/)
- 💬 **Issues:** Create a GitHub issue
- 🎓 **Labs:** [labs/README.md](labs/README.md)

---

**Built for learning modern GraphQL development on Windows, macOS, and Linux.**
