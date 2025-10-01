# ClaimSight

**Cross-platform healthcare claims management system** built with GraphQL, Hasura, Apollo Client, and PromptQL.

A comprehensive learning application that teaches modern GraphQL development **without Docker**, working identically on Windows, macOS, and Linux.

## Features

- ✅ **GraphQL API** with Hasura - Auto-generated CRUD, relationships, subscriptions
- ✅ **Row-Level Security** - Database-enforced permissions for admin/member/provider roles
- ✅ **Real-Time Updates** - WebSocket subscriptions for live data
- ✅ **Custom Actions** - Eligibility verification via REST API integration
- ✅ **Apollo Client** - HTTP + WebSocket links, optimistic updates, normalized cache
- ✅ **React + TypeScript** - Modern frontend with TailwindCSS
- ✅ **Apollo Federation** - Optional provider ratings subgraph
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

## Quick Start

### Prerequisites

**All Platforms:**
- Node.js 18+ ([nodejs.org](https://nodejs.org/))
- PostgreSQL 15+ ([postgresql.org](https://www.postgresql.org/download/))
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

**Step 2: Create Database**

```bash
# Windows (if psql in PATH)
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

```bash
npm run dev
```

Starts:
- **Action Handler** (port 3001) - Eligibility check API
- **Client App** (port 5173) - React frontend
- **Subgraph** (port 3002) - Provider ratings (optional)

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

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:5173 | React app |
| **Hasura Console** | http://localhost:8080/console | GraphQL API explorer |
| **Hasura GraphQL** | http://localhost:8080/v1/graphql | GraphQL endpoint |
| **Action Handler** | http://localhost:3001 | Eligibility API |
| **Subgraph** | http://localhost:3002/graphql | Ratings API |

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

### Testing Different Roles

**Admin (Full Access):**
```bash
# In .env
VITE_DEV_ROLE=admin
```

**Member (Own Data Only):**
```bash
# Get a member ID from database
psql -d claimsight -c "SELECT id, first_name, last_name FROM members LIMIT 1;"

# In .env
VITE_DEV_ROLE=member
VITE_DEV_MEMBER_ID=<uuid-from-query>
```

**Provider (Patient Data Only):**
```bash
# Get a provider ID from database
psql -d claimsight -c "SELECT id, name FROM providers LIMIT 1;"

# In .env
VITE_DEV_ROLE=provider
VITE_DEV_PROVIDER_ID=<uuid-from-query>
```

Restart the frontend to apply changes.

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

Follow the [LEARNING_CHECKLIST.md](DOCUMENTS/LEARNING_CHECKLIST.md) for a structured tutorial:

1. **Setup & Exploration** (30 min) - Environment setup, database exploration
2. **GraphQL Basics** (45 min) - Queries, filters, relationships
3. **Mutations** (30 min) - Insert, update, delete operations
4. **Hasura Features** (45 min) - Permissions, actions, subscriptions
5. **Apollo Client** (60 min) - React integration, cache, optimistic updates
6. **Advanced Features** (45 min) - Fragments, federation, PromptQL
7. **Customize & Extend** - Build your own features

## Documentation

- 📘 **[Best Practices](DOCUMENTS/BEST_PRACTICES.md)** - Development guidelines
- 🏗️ **[Architecture Overview](DOCUMENTS/ARCHITECTURE_OVERVIEW.md)** - System design and data flow
- ✅ **[Learning Checklist](DOCUMENTS/LEARNING_CHECKLIST.md)** - Step-by-step tutorial
- 📋 **[UML Diagrams](DOCUMENTS/UML/)** - Visual architecture
- 📝 **[ADRs](DOCUMENTS/ADRs/)** - Architecture decision records

## Troubleshooting

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

## Support

- 📖 **Docs:** [DOCUMENTS/](DOCUMENTS/)
- 💬 **Issues:** Create a GitHub issue
- 🎓 **Learning:** [LEARNING_CHECKLIST.md](DOCUMENTS/LEARNING_CHECKLIST.md)

---

**Built for learning modern GraphQL development on Windows, macOS, and Linux.**
