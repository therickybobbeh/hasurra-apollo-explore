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

## 📚 Part 2: Create DDN Project

### 2.1 Initialize DDN Project

Our project already has a `ddn/` directory with example configs. Let's initialize it:

```bash
cd ddn/

# Initialize DDN project (interactive)
ddn project init
```

**Prompts:**
- **Project name:** `claimsight-ddn`
- **Description:** `ClaimSight Healthcare Management System - DDN`
- **Connector:** Select `PostgreSQL`

This creates:
- `ddn/` directory structure
- Initial configuration files
- Connector scaffolding

### 2.2 Review Project Structure

```bash
tree ddn/
```

Expected output:
```
ddn/
├── connector/
│   └── postgres/
│       └── connector.yaml
├── metadata/
│   ├── models/
│   │   ├── Members.hml
│   │   └── Providers.hml
│   └── relationships/
│       └── MembersClaims.hml
├── subgraph.yaml
└── .env.example
```

---

## 📚 Part 3: Configure PostgreSQL Connector

### 3.1 Get Your Neon Connection String

From **Phase 1**, you should have a Neon PostgreSQL database. Get the connection string:

**Option A: From Hasura Cloud Console**
1. Go to https://cloud.hasura.io
2. Select your project from Phase 1
3. Click "Data" tab → "Manage" → "Edit" on your database
4. Copy the connection string

**Option B: From Neon Dashboard**
1. Go to https://neon.tech
2. Select your database
3. Copy connection string from dashboard

**Format:**
```
postgresql://user:password@ep-example-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### 3.2 Configure Environment

```bash
cd ddn/

# Copy example env file
cp .env.example .env

# Edit .env
nano .env  # or use your preferred editor
```

Update with your connection string:
```bash
POSTGRESQL_CONNECTION_STRING=postgresql://your-user:your-password@your-host.neon.tech/your-db?sslmode=require
```

### 3.3 Test Connector

```bash
ddn connector introspect postgres
```

This should show all your tables:
```
✓ Connected to PostgreSQL
✓ Found 6 tables:
  - members
  - provider_records
  - claims
  - notes
  - eligibility_checks
  - migrations
```

---

## 📚 Part 4: Migrate Metadata from v2 to v3

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
version: v1
definition:
  name: Members
  objectType: members
  source:
    dataConnectorName: postgres
    collection: members
```

### 4.2 Generate Models from Database

```bash
# Auto-generate models for all tables
ddn connector introspect postgres --output metadata/models/

# This creates .hml files for each table
```

Expected output:
```
✓ Generated metadata/models/Members.hml
✓ Generated metadata/models/ProviderRecords.hml
✓ Generated metadata/models/Claims.hml
✓ Generated metadata/models/Notes.hml
✓ Generated metadata/models/EligibilityChecks.hml
```

### 4.3 Add Relationships

The introspection detects foreign keys, but let's verify relationships:

```bash
ddn connector introspect postgres --detect-relationships
```

This updates files in `metadata/relationships/`.

### 4.4 Add Apollo Federation Support

Edit `metadata/models/ProviderRecords.hml` to add federation:

```yaml
kind: Model
version: v1
definition:
  name: ProviderRecords
  objectType: provider_records
  source:
    dataConnectorName: postgres
    collection: provider_records

  # Add Apollo Federation
  apolloFederation:
    entitySource:
      - keyFields:
          - id

  graphql:
    selectUniques:
      - queryRootField: providerRecordById
        uniqueIdentifier:
          - id
    selectMany:
      queryRootField: provider_records
```

---

## 📚 Part 5: Deploy to Hasura DDN Cloud

### 5.1 Create DDN Project in Cloud

```bash
ddn project create claimsight-ddn
```

This creates a project in Hasura DDN cloud.

### 5.2 Build and Deploy

```bash
# Build the supergraph locally (validates metadata)
ddn supergraph build local

# If successful, deploy to cloud
ddn supergraph build create
```

**Expected output:**
```
✓ Building supergraph...
✓ Validating metadata...
✓ Generating GraphQL schema...
✓ Deploying to Hasura DDN...

🚀 Deployment successful!

GraphQL Endpoint: https://claimsight-ddn-abc123.ddn.hasura.app/graphql
Console: https://console.hasura.io/project/claimsight-ddn
```

### 5.3 Test the DDN Endpoint

```bash
# Get your DDN endpoint
ddn project info
```

Test with curl:
```bash
curl -X POST https://your-project.ddn.hasura.app/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ members { id first_name last_name } }"}'
```

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
- ✅ Complete [Phase 4: PromptQL + AI](../phase-4-promptql/README.md)

### Option B: Deploy to Production
- See [Deployment Guides](../../deployment/README.md)

### Option C: Integration Challenge
- Integrate DDN with PromptQL (see [Challenge 16](../../DOCUMENTS/CHALLENGES.md))

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
