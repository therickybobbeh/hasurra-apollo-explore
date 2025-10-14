# Phase 3: Hasura DDN Migration

**Migrate from Hasura Cloud v2 to Hasura DDN (Data Delivery Network) v3**

Learn Hasura's next-generation platform with connector-based architecture, metadata-driven development, and global performance optimization.

---

## 🎯 Learning Objectives

By the end of this lab, you'll understand:

- **Architecture differences** between Hasura v2 and DDN v3
- **Connector-based data access** vs direct database connections
- **Metadata-driven development** with .hml files
- **CLI-first workflow** for modern CI/CD
- **Apollo Federation** with DDN as a subgraph

---

## 📋 Prerequisites

**Required:**
- ✅ Completed [Phase 1: Hasura Cloud](../phase-1-hasura-cloud/README.md)
- ✅ Completed [Phase 2: Apollo Federation](../phase-2-apollo-federation/README.md)
- ✅ Node.js 18+ installed
- ✅ Access to your Phase 1 Neon PostgreSQL database

**Accounts Needed:**
- Hasura DDN account (free tier available)
- Apollo GraphOS account (from Phase 2)

---

## ⏱️ Time Estimate

**Total: 2-3 hours**

- Part 1: Install DDN CLI & Setup (30 min)
- Part 2: Create DDN Project (45 min)
- Part 3: Configure Connectors (30 min)
- Part 4: Migrate Metadata (45 min)
- Part 5: Deploy & Test (30 min)

---

## 🏗️ What You'll Build

```
BEFORE (Hasura Cloud v2):          AFTER (Hasura DDN v3):
┌──────────────────┐              ┌──────────────────────┐
│  Hasura Cloud    │              │   Hasura DDN Cloud   │
│  ┌────────────┐  │              │  ┌──────────────┐    │
│  │  GraphQL   │  │              │  │  GraphQL     │    │
│  │   Engine   │  │              │  │   Engine     │    │
│  └─────┬──────┘  │              │  └──────┬───────┘    │
│        │         │              │         │            │
│  Direct DB       │              │  ┌──────▼────────┐   │
│  Connection      │              │  │  Connector    │   │
│        │         │              │  │  Layer        │   │
│        ▼         │              │  └──────┬────────┘   │
│  ┌────────────┐  │              │         │            │
│  │ PostgreSQL │  │              │         ▼            │
│  │ (Neon DB)  │  │              │  ┌─────────────┐    │
│  └────────────┘  │              │  │ PostgreSQL  │    │
│                  │              │  │  Connector  │    │
└──────────────────┘              │  └──────┬──────┘    │
                                  │         │            │
                                  │         ▼            │
                                  │  ┌─────────────┐    │
                                  │  │ PostgreSQL  │    │
                                  │  │ (Neon DB)   │    │
                                  │  └─────────────┘    │
                                  └──────────────────────┘
```

**Key Changes:**
- ✅ Connector layer (supports any data source, not just PostgreSQL)
- ✅ Metadata files (.hml) instead of JSON
- ✅ CLI-driven workflow
- ✅ Multi-region deployment capability
- ✅ Modular metadata for team collaboration

---

## 📚 Part 1: Install Hasura DDN CLI

### 1.1 Install the DDN CLI

**macOS/Linux:**
```bash
curl -L https://graphql-engine-cdn.hasura.io/ddn/cli/latest/get.sh | bash
```

**Windows:**
```powershell
irm https://graphql-engine-cdn.hasura.io/ddn/cli/latest/get.ps1 | iex
```

**Verify installation:**
```bash
ddn version
# Should show: Hasura DDN CLI v3.x.x
```

### 1.2 Login to Hasura DDN

```bash
ddn login
```

This will:
1. Open your browser
2. Authenticate with Hasura
3. Generate a Personal Access Token (PAT)
4. Save credentials locally

**Verify login:**
```bash
ddn whoami
# Should show your Hasura DDN username
```

---

## 📚 Part 2: Working with the DDN Project

### 2.1 Navigate to DDN Directory

Our project already has a fully configured DDN project in the `hasura-ddn/` directory:

```bash
cd hasura-ddn/
```

This directory contains a complete, working Hasura DDN v3 setup that's ready to use.

### 2.2 Review Project Structure

```bash
ls -la
```

Expected structure:
```
hasura-ddn/
├── hasura.yaml              # Supergraph configuration
├── supergraph.yaml          # Supergraph definition
├── .env                     # Environment variables
├── claimsight/              # Subgraph directory
│   ├── subgraph.yaml        # Subgraph config
│   ├── auth_config.hml      # Authentication config
│   ├── connector/
│   │   └── postgres/        # PostgreSQL connector
│   │       ├── connector.yaml      # Connector definition
│   │       └── compose.yaml        # Connector Docker service
│   └── metadata/            # Models & commands (will be generated)
│       └── .keep            # Placeholder
├── engine/                  # Build artifacts (generated)
│   └── build/
└── compose.yaml            # Docker services
```

**Note:** The `metadata/` directory is mostly empty right now - we'll generate the models from the database in Part 4.

---

## 📚 Part 3: Start PostgreSQL Database

### 3.1 Start the Database

The DDN connector needs a running PostgreSQL database. This database is already populated with ClaimSight data from previous labs.

```bash
# Navigate to project root
cd ..

# Start PostgreSQL (and Hasura v2 from Lab 1)
docker compose up -d

# Verify it's running
docker compose ps
```

You should see:
- `claimsight-postgres` - PostgreSQL database (port 5432) - **healthy**
- `claimsight-hasura` - Hasura v2 from Lab 1 (port 8080)

### 3.2 Review Database Schema

Let's verify the pre-populated database has our tables:

```bash
# List all tables
docker exec claimsight-postgres psql -U claimsight -d claimsight \
  -c "\dt"
```

You should see 5 tables:
- `claims` - Medical claims
- `members` - Patient members
- `notes` - Clinical notes
- `provider_records` - Healthcare providers
- `eligibility_checks` - Insurance eligibility

**Note:** We're using the same database from Labs 1-6. DDN will connect to this existing database through a connector (which we'll start later in Part 5).

---

## 📚 Part 4: Generate Metadata from Database

### 4.1 Understand the Difference

**Hasura v2 Metadata (JSON):**
```json
{
  "version": 3,
  "sources": [{
    "name": "default",
    "tables": [{
      "table": {"schema": "public", "name": "members"},
      "select_permissions": [...]
    }]
  }]
}
```

**Hasura DDN Metadata (.hml files):**
```yaml
kind: Model
version: v2
definition:
  name: Claims
  objectType: Claims
  source:
    dataConnectorName: postgres
    collection: claims
  filterExpressionType: ClaimsBoolExp
  graphql:
    selectMany:
      queryRootField: claims
    selectUniques:
      - queryRootField: claimsById
        uniqueIdentifier:
          - id
```

### 4.2 Introspect the Database

Now let's introspect the database to discover its schema:</br>
Introspect means automatically discovering and analyzing the database structure including </br>
1. Schema Discovery: Examining tables, views, and stored procedures
2. Metadata Extraction: Identifying columns, data types, and constraints
3. Relationship Detection: Finding foreign keys and inferring connections between tables
</br>

This is the same as how we introsepct in hasura cloud, hasura builds directly from the graphql engine and happens when you connect a db, where as DDN will actually preform it through the connectors allowing a more flexable architecture. This approach with ddn will generate both the connector and configures the schema files

```bash
cd ../../../  # Back to hasura-ddn/

# Update the connector (introspects database schema)
ddn connector-link update postgres --subgraph claimsight
```

This command:
1. Connects to your PostgreSQL database
2. Discovers all tables, columns, and relationships
3. Generates `configuration.json` and `schema.json` in the connector directory

**Expected output:**
```
✓ Introspecting database...
✓ Found 5 tables
✓ Found 12 relationships
✓ Configuration updated
```

### 4.3 Generate Models from Tables

Now generate the GraphQL models from the discovered tables:

```bash
# Generate models for all tables
ddn model add postgres '*' --subgraph claimsight
```

This creates `.hml` files in `claimsight/metadata/` for:
- **Models** - `Claims.hml`, `Members.hml`, `Notes.hml`, etc.
- **Commands** - `InsertClaims.hml`, `UpdateClaims.hml`, `DeleteClaims.hml`, etc.
- **Type definitions** - `postgres-types.hml`

**Expected output:**
```
✓ Generating models...
✓ Created 5 models
✓ Created 15 commands
✓ Created type definitions
```

### 4.4 Review Generated Models

Let's explore what was created:

```bash
# List all generated models
ls claimsight/metadata/*.hml | grep -E "(Claims|Members|Notes|Provider)"

# View the Claims model
cat claimsight/metadata/Claims.hml
```

You'll see:
- **Model definitions** - How the table is exposed in GraphQL
- **Permissions** - Role-based access control (admin role configured)
- **Aggregate expressions** - For count, sum, avg operations
- **Order by expressions** - For sorting
- **Boolean expressions** - For filtering

### 4.5 View Available Commands

DDN also generated mutation commands:

```bash
# List commands (Insert, Update, Delete)
ls claimsight/metadata/ | grep -E "(Insert|Update|Delete)" | head -10
```

These provide type-safe mutations for your tables.

### 4.6 Check Relationships

Foreign key relationships were automatically detected:

```bash
# Check the connector schema for relationship information
grep -A 5 "foreign_keys" claimsight/connector/postgres/configuration.json | head -30
```

---

## 📚 Part 5: Build and Test Locally

### 5.1 Build the Supergraph

```bash
# Build the supergraph (validates all metadata)
ddn supergraph build local
```

**Expected output:**
```
✓ Building supergraph...
✓ Validating metadata...
✓ Generating GraphQL schema...
Build artifacts exported to "engine/build"
```

This creates the build artifacts in `engine/build/` directory.

### 5.2 Start the PostgreSQL Connector

The DDN engine needs the connector running to query the database:

```bash
cd claimsight/connector/postgres

# Start the connector service
docker compose --env-file ../../../.env up -d

# Verify it's running and healthy
docker compose ps
```

You should see `postgres-claimsight_postgres-1` running on port 4313 with "healthy" status.

**Architecture Note:** The connector translates DDN queries into PostgreSQL queries. It connects to `claimsight-postgres:5432` via Docker networking.

### 5.3 Start the Local DDN Engine

```bash
cd ../../../  # Back to hasura-ddn/

# Start the engine with Docker
ddn run docker-start
```

This starts:
- **DDN Engine** on port 3280
- **OpenTelemetry Collector** for observability

The engine will use the build artifacts we created and connect to the connector on port 4313.

### 5.4 Test the Local Endpoint

In a new terminal:

```bash
# Test introspection
curl -X POST http://localhost:3280/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __schema { queryType { name } } }"}'

# Query claims
curl -X POST http://localhost:3280/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ claims(limit: 5) { id dos cpt status chargeCents } }"}'

# Query members
curl -X POST http://localhost:3280/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ members(limit: 5) { id firstName lastName dob } }"}'
```

### 5.5 Open the Local Console

```bash
# Open the DDN console in your browser
ddn console --local
```

This opens a GraphiQL interface where you can explore the schema and run queries interactively.

**What you've achieved:**
- ✅ Introspected database schema (Part 4)
- ✅ Generated GraphQL models (Part 4)
- ✅ Built the supergraph (Part 5.1)
- ✅ Started connector service (Part 5.2)
- ✅ Started DDN engine (Part 5.3)
- ✅ Tested GraphQL queries (Part 5.4)

Your DDN stack is now fully operational locally!

---

## 📚 Part 6: Integrate with Apollo Federation

### 6.1 Update Apollo GraphOS with DDN Subgraph

Remember your Apollo setup from Phase 2? Let's replace the Hasura v2 subgraph with DDN.

```bash
# Set your Apollo credentials (from Phase 2)
export APOLLO_KEY="service:claimsight-api:your-key-here"
export APOLLO_GRAPH_REF="claimsight-api@current"

# Publish DDN as the Hasura subgraph (replaces v2)
ddn supergraph build publish --graph-ref $APOLLO_GRAPH_REF
```

Or manually with Rover:
```bash
npx @apollo/rover subgraph publish $APOLLO_GRAPH_REF \
  --name hasura \
  --routing-url https://your-project.ddn.hasura.app/graphql \
  --schema <(ddn supergraph build local --output -)
```

### 6.2 Verify Federation

```bash
npx @apollo/rover subgraph check $APOLLO_GRAPH_REF \
  --name hasura \
  --schema <(ddn supergraph build local --output -)
```

Should show:
```
✓ Composition successful
✓ No breaking changes detected
```

---

## 📚 Part 7: Test Federated Queries

### 7.1 Test DDN + Providers Subgraph

Your Providers subgraph from Phase 2 should still be running. Test the federated query:

```graphql
query FederatedWithDDN {
  provider_records(limit: 5) {
    id
    name              # From DDN (was Hasura v2)
    specialty         # From DDN
    rating            # From Providers subgraph
    reviewCount       # From Providers subgraph
  }
}
```

### 7.2 Compare Performance

DDN includes built-in performance monitoring. Check the DDN Console:

```
https://console.hasura.io/project/claimsight-ddn
```

Look for:
- Query latency
- Cache hit rates
- Connector performance

---

## 📊 Phase 3 Complete: What You've Learned

✅ **DDN Architecture** - Connector-based data access
✅ **Metadata-driven** - .hml files instead of JSON
✅ **CLI Workflow** - Modern CI/CD with `ddn` CLI
✅ **Migration Path** - v2 → v3 transformation
✅ **Apollo Federation** - DDN as a federated subgraph
✅ **Performance** - Global deployment and caching

---

## 🆚 Hasura v2 vs DDN v3 Comparison

| Feature | Hasura v2 (Cloud) | Hasura DDN v3 |
|---------|-------------------|---------------|
| **Data Sources** | PostgreSQL, SQL Server, BigQuery | Any (via connectors) |
| **Metadata** | JSON (monolithic) | .hml files (modular) |
| **Workflow** | Console-first | CLI-first |
| **Team Collaboration** | Limited | Multi-repo, multi-team |
| **Global Deployment** | Single region | Multi-region automatic |
| **Federation** | Supported | Native + enhanced |
| **Introspection** | Automatic | Connector-based |
| **Permissions** | JSON config | Declarative .hml |

---

## 🎯 Next Steps

### Option A: Continue Learning
- ✅ Complete [Phase 8: PromptQL + AI](../phase-8-promptql/README.md)

### Option B: Deploy to Production
- See [Deployment Guides](../../deployment/README.md)

### Option C: Integration Challenge
- Integrate DDN with PromptQL for AI-powered queries

---

## 🐛 Troubleshooting

### Issue: "DDN CLI not found"
**Solution:** Ensure DDN CLI is in your PATH:
```bash
which ddn
# If not found, reinstall or add to PATH
export PATH="$PATH:$HOME/.hasura/bin"
```

### Issue: "Connector introspection failed"
**Solution:** Check your connection string:
```bash
# Test connection manually
psql "postgresql://user:pass@host/db?sslmode=require"
```

### Issue: "Apollo publish fails - schema incompatible"
**Solution:** DDN generates slightly different schema. Check:
```bash
ddn supergraph build local --output schema.graphql
# Compare with v2 schema to find differences
```

### Issue: "Federation entity resolution not working"
**Solution:** Ensure `apolloFederation` is configured in your model:
```yaml
apolloFederation:
  entitySource:
    - keyFields:
        - id
```

---

## 📚 Resources

- [Hasura DDN Documentation](https://hasura.io/docs/3.0/)
- [DDN CLI Reference](https://hasura.io/docs/3.0/cli/overview/)
- [Migration Guide](https://hasura.io/docs/3.0/upgrade/guide/)
- [Connector Docs](https://hasura.io/docs/3.0/connectors/)

---

**🎉 Congratulations!** You've migrated to Hasura's next-generation platform!

[← Back to Labs Overview](../README.md) | [Next: Phase 4 - PromptQL →](../phase-4-promptql/README.md)
