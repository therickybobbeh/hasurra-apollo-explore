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

### 1.2 Login to Hasura DDN (Optional for Local Development)

**Note:** Login is only required if you plan to deploy to DDN Cloud. For local-only work (which we're doing in this lab), you can skip this step.

If you want to login:

```bash
ddn auth login
```

This will:
1. Open your browser
2. Authenticate with Hasura
3. Generate a Personal Access Token (PAT)
4. Save credentials locally

**Verify login:**
```bash
ddn auth print-access-token
# Should show your access token
```

**For this lab, you can skip login and work entirely locally.**

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

### 4.1 Prepare the DataConnectorLink

First, let's set up the DataConnectorLink file that will hold our database schema:

```bash
cd hasura-ddn/claimsight/metadata

# Copy the template DataConnectorLink
cp postgres.hml.template postgres.hml
```

This creates a minimal DataConnectorLink with an empty schema. The introspection command will populate it with your database structure.

### 4.2 Understand the Difference

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

### 4.3 Start the PostgreSQL Connector

Before we can introspect, we need the connector service running:

```bash
cd hasura-ddn/claimsight/connector/postgres

# Start the connector service
docker compose --env-file ../../../.env up -d

# Verify it's healthy
docker compose ps
```

You should see `postgres-claimsight_postgres-1` running on port 4313 with **healthy** status.

**Why start it now?** The introspection command needs to query the connector service to discover the database schema.

### 4.4 Introspect the Database

Now let's introspect the database to discover its schema:

**What is introspection?** Automatically discovering and analyzing the database structure including:
1. **Schema Discovery**: Examining tables, views, and stored procedures
2. **Metadata Extraction**: Identifying columns, data types, and constraints
3. **Relationship Detection**: Finding foreign keys and inferring connections between tables

**DDN vs Hasura Cloud**: In Hasura Cloud v2, introspection happens directly in the GraphQL engine when you connect a database. In DDN v3, introspection happens through connectors, allowing a more flexible architecture that supports any data source.

```bash
cd ../../../  # Back to hasura-ddn/

# Update the connector (introspects database schema)
ddn connector-link update postgres
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
Or something along those lines of sucess, check to see if the any files generated

### 4.5 Generate Models from Tables

Now generate the GraphQL models from the discovered tables:

```bash
# Generate models for all tables
ddn model add postgres '*'
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

### 4.6 Review Generated Models

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

### 4.7 View Available Commands

DDN also generated mutation commands:

```bash
# List commands (Insert, Update, Delete)
ls claimsight/metadata/ | grep -E "(Insert|Update|Delete)" | head -10
```

These provide type-safe mutations for your tables. so for instance
```yaml
permissions:
  - role: admin
    expression: {}
```
lets you have role based access control and differnt permissions for differnt operations. can customize the authroization rules per command.

### 4.8 Check Relationships

Foreign key relationships were automatically detected and stored in the DataConnectorLink:

```bash
# Check for relationship information in the schema
grep -A 3 "foreign_keys" claimsight/metadata/postgres.hml | head -20
```

You'll see relationships like:
- `claims.member_id` → `members.id`
- `claims.provider_id` → `provider_records.id`
- `eligibility_checks.member_id` → `members.id`

These relationships enable powerful federated queries across your data!

---

## 📚 Part 5: Build and Test Locally

### 5.1 Build the Supergraph

**What is "building" in DDN?**

Think of building like **compiling your metadata into an executable GraphQL API**:

```
Source Code (Metadata)           Compiled Binary (Build Artifacts)
├── Claims.hml                   ├── open_dd.json (unified schema)
├── Members.hml          →       ├── metadata.json (introspection)
├── postgres.hml                 └── auth_config.json (security)
└── auth_config.hml
```

**Why build?**
1. **Validation**: Catches errors before runtime (missing permissions, broken relationships, type mismatches)
2. **Optimization**: Pre-computes the GraphQL schema for faster startup
3. **Packaging**: Creates a single deployable artifact from multiple .hml files
4. **Version Control**: Build output is immutable - same input = same output

**It's like:** TypeScript → JavaScript, or Java → bytecode. You can't run the metadata files directly - they need to be "compiled" first.

```bash
# Build the supergraph (validates all metadata)
ddn supergraph build local
```

**Expected output:**
```
INF Using Supergraph config file "supergraph.yaml" found in context.
INF Using localEnvFile ".env" found in context.
INF Supergraph built for local Engine successfully
INF Build artifacts exported to "engine/build"
```

You may also see warnings about:
- **Boolean expression logical operators** - Safe to ignore for now (enables AND/OR in filters)
- **AuthConfig v2 deprecated** - We're using a simpler auth config for the lab

**What gets created:**
```
engine/build/
├── open_dd.json           # Complete GraphQL schema + metadata
├── metadata.json          # For GraphQL introspection
└── auth_config.json       # Authentication rules
```

The DDN engine (starting in 5.2) will read these files to serve your GraphQL API.

### 5.2 Start the Local DDN Engine

The connector is already running from Part 4. Now let's start the DDN engine:

```bash
cd ../../../  # Back to hasura-ddn/

# Start the engine with Docker
ddn run docker-start
```

This starts:
- **DDN Engine** on port 3280
- **OpenTelemetry Collector** for observability

The engine will use the build artifacts we created and connect to the connector on port 4313.

### 5.3 Test the Local Endpoint

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

### 5.4 Open the Console (Two Options)

You have two ways to access the GraphQL console:

**Option A: Cloud Console (Recommended - continues to Lab 8)**

Navigate to the Hasura Cloud Console that connects to your **local** DDN:

```
https://console.hasura.io/local/graphql
```

**Important:** This is a cloud-hosted UI that connects to `localhost:3280`. Your data stays local!

**Option B: Local Console (Alternative)**

```bash
# Open the DDN console in your browser
ddn console --local
```

This opens a locally-hosted GraphiQL interface.

**We recommend Option A (Cloud Console)** as it provides a better experience and is required for Lab 8 (PromptQL).

### 5.5 Connect to Your Local DDN (Cloud Console)

If you chose Option A (Cloud Console), configure the connection:

1. On the connection screen, enter:
   - **GraphQL Endpoint:** `http://localhost:3280/graphql`
   - **Admin Secret:** Leave blank (not required for local)

2. Click **Connect**

You should see:
```
✓ Connected to local DDN instance
✓ Schema loaded successfully
✓ 5 models available: Claims, EligibilityChecks, Members, Notes, ProviderRecords
```

3. Try a sample query in the GraphiQL explorer:

```graphql
query TestConnection {
  claims(limit: 5) {
    id
    dos
    status
    chargeCents
    cpt
  }
}
```

4. You should see claim data returned from your local PostgreSQL database!

**What you've achieved:**
- ✅ Prepared DataConnectorLink (Part 4.1)
- ✅ Started connector service (Part 4.3)
- ✅ Introspected database schema (Part 4.4)
- ✅ Generated GraphQL models (Part 4.5)
- ✅ Built the supergraph (Part 5.1)
- ✅ Started DDN engine (Part 5.2)
- ✅ Tested GraphQL queries (Part 5.3)
- ✅ Connected cloud console to local DDN (Part 5.5)

Your DDN stack is now fully operational locally and accessible through the cloud console!

---

## 📚 Part 6 (Optional): Understanding Federation - DDN vs Apollo

> **⚠️ Important Decision Point**: This section is **optional** and only needed for specific use cases. Read this first to decide if you need Apollo Federation on top of DDN.

### 6.1 Do You Need Apollo Federation?

**TL;DR: If DDN is your only data source, you DON'T need Apollo Federation!**

DDN has its **own built-in federation** called a "supergraph":

```yaml
# DDN Native Federation (no Apollo needed)
DDN Supergraph
├── Subgraph 1: Claims Database (PostgreSQL)
├── Subgraph 2: Analytics Database (MongoDB)
└── Subgraph 3: Legacy System (MySQL)
```

This IS federation - it connects multiple data sources and allows cross-database relationships.

### 6.2 When You DO Need Apollo Federation

**Use Apollo Federation + DDN only if:**

#### **Scenario 1: Incremental Migration from Existing Apollo Setup**
You already have Apollo Federation with custom GraphQL microservices:
```
Apollo Gateway (existing infrastructure)
├── User Service (Node.js - custom business logic)
├── Product Service (Python - custom algorithms)
├── Payment Service (Go - PCI compliance requirements)
└── Hasura DDN (NEW - replacing your database access layer)
```

**Why**: You're adding DDN to an existing Apollo ecosystem, not starting fresh.

#### **Scenario 2: Hybrid Architecture - Custom Logic + Database Access**
You need both custom business logic AND database access:
```
Apollo Gateway
├── Risk Calculation Service (complex algorithms, ML models)
└── Data Layer (Hasura DDN - CRUD operations, relationships)
```

**Example Use Case**:
- **DDN handles**: Basic CRUD for claims, members, providers
- **Custom service handles**: Fraud detection, risk scoring, premium calculations

**Why**: Business logic that's too complex for database-level computation needs custom code.

#### **Scenario 3: Multi-Team Organization**
Different teams own different domains:
```
Apollo Gateway (Platform Team)
├── Team A: User Management Service
├── Team B: Product Catalog Service
└── Team C: Claims System (DDN)
```

**Why**: Organizational boundaries require separate services with independent deployment cycles.

### 6.3 Architecture Comparison

#### **DDN Supergraph Only** (Recommended for most projects)
```
Client → DDN Engine → Subgraphs
                      ├── PostgreSQL Connector
                      ├── MongoDB Connector
                      └── REST API Connector
```

**Pros:**
- ✅ Simpler architecture
- ✅ Single deployment
- ✅ Native relationship handling
- ✅ Better performance (no extra hop)

**Best For:**
- Greenfield projects
- Database-driven applications
- Single team ownership

#### **Apollo Federation + DDN** (Only when needed)
```
Client → Apollo Gateway → Subgraphs
                          ├── Custom Service 1
                          ├── Custom Service 2
                          └── DDN (wraps multiple databases)
```

**Pros:**
- ✅ Mix custom logic with database access
- ✅ Independent service deployment
- ✅ Multi-team ownership

**Cons:**
- ❌ More complex architecture
- ❌ Extra network hop (latency)
- ❌ More moving parts to maintain

**Best For:**
- Existing Apollo setups
- Microservices architectures
- Complex business logic requirements

### 6.4 Decision Matrix

| Your Situation | Use DDN Supergraph Only | Add Apollo Federation |
|----------------|-------------------------|----------------------|
| Starting fresh | ✅ Yes | ❌ No |
| Only database access needed | ✅ Yes | ❌ No |
| Multiple databases to connect | ✅ Yes | ❌ No |
| Custom business logic microservices | ❌ No | ✅ Yes |
| Existing Apollo setup | ❌ No | ✅ Yes |
| Multi-team with separate services | ❌ No | ✅ Yes |

### 6.5 For This Lab...

**We're using DDN supergraph only** because:
- We're connecting to a single PostgreSQL database
- No custom microservices with complex business logic
- ClaimSight is a database-driven application

**If you completed Phase 2 (Apollo Federation)**, that was to understand the federation concept. But for DDN, you don't need Apollo on top - DDN's supergraph does the job!

---

## 📚 Part 6.6 (Optional): If You Need Apollo Integration

> **Skip this section unless** you have existing Apollo Federation infrastructure or custom microservices.

### Integrating DDN with Apollo GraphOS

If you completed Phase 2 and want to add DDN as a subgraph to your Apollo Gateway:

```bash
# Set your Apollo credentials (from Phase 2)
export APOLLO_KEY="service:claimsight-api:your-key-here"
export APOLLO_GRAPH_REF="claimsight-api@current"

# Publish DDN as a subgraph
npx @apollo/rover subgraph publish $APOLLO_GRAPH_REF \
  --name hasura-ddn \
  --routing-url http://localhost:3280/graphql \
  --schema <(ddn supergraph build local --output -)
```

### Verify Federation Composition

```bash
npx @apollo/rover subgraph check $APOLLO_GRAPH_REF \
  --name hasura-ddn \
  --schema <(ddn supergraph build local --output -)
```

Should show:
```
✓ Composition successful
✓ No breaking changes detected
```

### Test Federated Query

If you have the Providers subgraph from Phase 2 running:

```graphql
query FederatedWithDDN {
  provider_records(limit: 5) {
    id
    name              # From DDN
    specialty         # From DDN
    rating            # From Providers custom subgraph
    reviewCount       # From Providers custom subgraph
  }
}
```

This shows DDN data mixed with custom service data through Apollo Gateway.

---

## 📊 Phase 7 Complete: What You've Learned

✅ **DDN Architecture** - Connector-based data access separates concerns
✅ **Metadata-driven** - Declarative .hml files instead of JSON
✅ **CLI Workflow** - Modern CI/CD with `ddn` commands
✅ **Local Development** - Full DDN stack running on localhost
✅ **Cloud Console** - Access local DDN through `console.hasura.io/local/graphql`
✅ **Migration Path** - Clear v2 → v3 transformation process
✅ **DDN Supergraph** - Native federation for multiple data sources
✅ **Apollo Federation (Optional)** - When and why to add it on top of DDN

---

## 🎯 Where You Are Now

You have a **fully functional local DDN environment**:
- ✅ DDN engine running on `localhost:3280`
- ✅ PostgreSQL connector introspected and running
- ✅ 5 models generated and queryable
- ✅ Cloud console connected at `https://console.hasura.io/local/graphql`

**Keep these running** for the next lab!

---

## 🆚 Hasura v2 vs DDN v3 Comparison

| Feature | Hasura v2 (Cloud) | Hasura DDN v3 |
|---------|-------------------|---------------|
| **Data Sources** | PostgreSQL, SQL Server, BigQuery | Any (via connectors) |
| **Metadata** | JSON (monolithic) | .hml files (modular) |
| **Workflow** | Console-first | CLI-first |
| **Team Collaboration** | Limited | Multi-repo, multi-team |
| **Global Deployment** | Single region | Multi-region automatic |
| **Federation** | Apollo required for multi-source | Native supergraph built-in |
| **Introspection** | Automatic | Connector-based |
| **Permissions** | JSON config | Declarative .hml |
| **Custom Logic Integration** | Actions/Remote schemas | Apollo Federation (when needed) |

---

## 🎯 Next Steps

### Recommended: Continue to Phase 7.5

**[Phase 7.5: Add PromptQL to Local DDN →](../phase-7.5-promptql/README.md)**

Add AI-powered natural language queries to your local DDN! Phase 7.5 picks up exactly where you are now - with the console already connected to your local DDN.

You'll learn to:
- Configure OpenAI for natural language queries
- Enhance semantic metadata for AI understanding
- Chat with your data using the PromptQL console
- Create reusable automation workflows

**Keep your DDN services running and proceed to Lab 7.5!**

### Alternative Options

**Option B: Deploy to Production**
- See [Deployment Guides](../../deployment/README.md)

**Option C: Explore More Features**
- Add custom business logic with Actions
- Set up row-level security with permissions
- Create scheduled triggers for automation

---

## 🐛 Troubleshooting

### Issue: `ddn supergraph build local` fails with "dial tcp: lookup data.pro.hasura.io: no such host"

**Cause:** The `.env` file contains a placeholder `HASURA_DDN_PAT` that the CLI is trying to use for cloud authentication.

**Solution:** For local development, comment out the PAT variable:

```bash
cd hasura-ddn/

# Edit .env and comment out HASURA_DDN_PAT
# Change:
#   HASURA_DDN_PAT="your-personal-access-token-here"
# To:
#   # HASURA_DDN_PAT is only needed for cloud deployments
#   # For local development, leave this unset or run: ddn auth login
#   # HASURA_DDN_PAT="your-personal-access-token-here"

# Now build will work
ddn supergraph build local
```

**Alternative:** If you need cloud access, login first:
```bash
ddn auth login
# This will set your PAT automatically
```

### Issue: OTEL collector fails with "requires a non-empty endpoint"

**What you see:**
```
otel-collector-1  | Error: invalid configuration: exporters::otlp: requires a non-empty "endpoint"
otel-collector-1 exited with code 1
```

**Is this a problem?** No! The OpenTelemetry collector is for observability/monitoring, not required for local development.

**Why it happens:** The OTEL collector needs a cloud endpoint configured to send telemetry data.

**Solution:** Safe to ignore for local development. The DDN engine will work perfectly without it. If you see:
```
engine-1 | starting server on [::]:3000
```

Then your engine is running successfully on **http://localhost:3280/graphql** (port 3000 in container → 3280 on host).

### Issue: PromptQL warning on startup

**What you see:**
```
Cannot print PromptQL secret key. PromptQL is not enabled for this project.
```

**Solution:** This is informational only. PromptQL (AI-powered queries) is optional and requires no special enable command - it's built into DDN CLI v2.28.0+. To use PromptQL features, continue to [Phase 8: PromptQL](../phase-8-promptql/README.md).

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
