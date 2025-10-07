# Apollo GraphOS Deployment Guide

Set up Apollo GraphOS for schema registry, managed federation, and observability.

---

## 📋 Overview

**Apollo GraphOS** (formerly Apollo Studio) is a cloud platform for managing federated GraphQL APIs with schema registry, monitoring, and analytics.

**What it provides:**
- ✅ **Schema Registry** - Version control for GraphQL schemas
- ✅ **Managed Federation** - Automatic gateway configuration
- ✅ **Schema Checks** - Validate breaking changes before deploy
- ✅ **Query Analytics** - Operation performance and usage tracking
- ✅ **Distributed Tracing** - See query execution across subgraphs
- ✅ **Field Usage** - Track which fields clients actually use

**Time to complete:** 15-20 minutes

**Cost:** Free for teams <10 people, then $49/user/month

---

## 🎯 Prerequisites

- [x] Hasura Cloud deployment complete ([see guide](../hasura-cloud/README.md))
- [x] Providers subgraph deployed ([see render guide](../render/README.md))
- [x] Apollo Studio account (sign up at https://studio.apollographql.com/)
- [x] Node.js 18+ installed locally

---

## 🚀 Step 1: Create Apollo Studio Account

### 1.1 Sign Up

1. Visit https://studio.apollographql.com/
2. Click **"Sign up"**
3. Choose sign-up method:
   - GitHub (recommended for CI/CD integration)
   - Google
   - Email

### 1.2 Create Organization

1. After sign-up, you'll be prompted to create an organization
2. **Organization name**: `claimsight` (or your company name)
3. **Plan**: Select **"Free"** (upgradable later)
4. Click **"Create organization"**

---

## 📊 Step 2: Create Graph

### 2.1 Create New Graph

1. In Apollo Studio dashboard, click **"New Graph"**
2. **Graph title**: `ClaimSight API`
3. **Graph ID**: `claimsight-api` (lowercase, no spaces)
4. **Graph type**: Select **"Supergraph (Federation)"**
5. Click **"Create"**

### 2.2 Note Your Graph Ref

Your **graph ref** format: `{graph-id}@{variant}`

Example: `claimsight-api@main`

- `claimsight-api`: Your graph ID
- `main`: Variant (environment - use `main` for production, `staging` for staging)

**Save this!** You'll need it for publishing schemas.

---

## 🔑 Step 3: Generate API Key

### 3.1 Create Graph API Key

1. In your graph dashboard, click **"Settings"** (gear icon)
2. Go to **"API Keys"** tab
3. Click **"Create New Key"**
4. **Key name**: `Rover CLI` (or descriptive name)
5. **Role**: **"Graph Admin"** (needed for schema publishing)
6. Click **"Create Key"**

### 3.2 Save API Key

**Copy the API key immediately!** It's only shown once.

Store securely:
```bash
# .env.apollo
APOLLO_KEY=service:claimsight-api:your-api-key-here
APOLLO_GRAPH_REF=claimsight-api@main
```

**⚠️ Never commit API keys to Git!** Add `.env.apollo` to `.gitignore`.

---

## 🛠️ Step 4: Install Rover CLI

**Rover** is Apollo's CLI for interacting with GraphOS.

### 4.1 Install Rover Locally

**Recommended: npm install (all platforms)**
```bash
# Install locally in your project
npm install --save-dev @apollo/rover

# Or use npx directly (no installation needed)
npx @apollo/rover --version
```

**Alternative: System-wide install (optional)**

*macOS / Linux:*
```bash
curl -sSL https://rover.apollo.dev/nix/latest | sh
```

*Windows (PowerShell):*
```powershell
iwr 'https://rover.apollo.dev/win/latest' | iex
```

### 4.2 Verify Installation

```bash
# If installed locally
npx @apollo/rover --version

# If installed system-wide
rover --version
```

**Expected:** `Rover 0.x.x`

### 4.3 Configure Rover

Set your API key as environment variable:

```bash
# macOS / Linux
export APOLLO_KEY=service:claimsight-api:your-api-key-here
export APOLLO_GRAPH_REF=claimsight-api@main

# Windows (PowerShell)
$env:APOLLO_KEY="service:claimsight-api:your-api-key-here"
$env:APOLLO_GRAPH_REF="claimsight-api@main"
```

**Or create Rover config:**
```bash
# Create config file
npx @apollo/rover config auth

# Enter your API key when prompted
```

---

## 📤 Step 5: Publish Subgraph Schemas

### 5.1 Export Hasura Schema

First, get your Hasura schema in GraphQL SDL format:

```bash
# Install dependencies
npm install -g graphql-cli

# Export Hasura schema
graphql-cli get-schema \
  --endpoint https://your-project.hasura.app/v1/graphql \
  --header "x-hasura-admin-secret: your-secret" \
  --output ./schemas/hasura-schema.graphql
```

**Or use introspection query directly:**

Create `scripts/export-hasura-schema.sh`:
```bash
#!/bin/bash
curl -X POST \
  https://your-project.hasura.app/v1/graphql \
  -H "x-hasura-admin-secret: your-secret" \
  -H "Content-Type: application/json" \
  -d '{"query":"query IntrospectionQuery { __schema { types { name kind fields { name type { name kind ofType { name kind } } } } } }"}' \
  | jq '.data' > schemas/hasura-schema.json

# Convert introspection JSON to SDL using graphql-cli or similar tool
```

### 5.2 Publish Hasura Subgraph

```bash
# Navigate to project root
cd /path/to/poc-has-apal

# Publish Hasura subgraph
npx @apollo/npx @apollo/rover subgraph publish $APOLLO_GRAPH_REF \
  --name hasura \
  --routing-url https://your-project.hasura.app/v1/graphql \
  --schema ./schemas/hasura-schema.graphql
```

**Expected output:**
```
Publishing SDL to claimsight-api@main using credentials from the default profile.
A new subgraph called 'hasura' was created in 'claimsight-api@main'
The gateway for 'claimsight-api@main' was updated with a new schema, composed from the updated 'hasura' subgraph

✅ Subgraph 'hasura' published successfully!
```

### 5.3 Publish Providers Subgraph

```bash
# Publish Providers subgraph
npx @apollo/rover subgraph publish $APOLLO_GRAPH_REF \
  --name providers \
  --routing-url https://your-providers-subgraph.onrender.com \
  --schema ./app/server/src/schema.graphql
```

**Expected output:**
```
Publishing SDL to claimsight-api@main using credentials from the default profile.
A new subgraph called 'providers' was created in 'claimsight-api@main'
The gateway for 'claimsight-api@main' was updated with a new schema, composed from the updated 'providers' subgraph

✅ Subgraph 'providers' published successfully!
```

### 5.4 Verify Supergraph Composition

```bash
# Check composition status
npx @apollo/rover subgraph check $APOLLO_GRAPH_REF \
  --name hasura \
  --schema ./schemas/hasura-schema.graphql
```

**Expected:** `✓ Composition successful`

---

## 🌐 Step 6: View Schema in Apollo Studio

### 6.1 Open Schema Tab

1. Go to https://studio.apollographql.com/
2. Select your graph: **ClaimSight API**
3. Click **"Schema"** tab

### 6.2 Explore Federated Schema

You'll see:
- **Supergraph SDL**: Combined schema from all subgraphs
- **Subgraphs**: List of subgraphs (hasura, providers)
- **Federation Directives**: `@key`, `@external`, `@requires`

### 6.3 Inspect Entity Resolution

1. Click **"Types"** in left sidebar
2. Find **"Provider"** type
3. You'll see:
   ```graphql
   type Provider @key(fields: "id") {
     id: ID!
     name: String           # From Hasura
     specialty: String      # From Hasura
     npi: String            # From Hasura
     rating: Float          # From Providers subgraph
     ratingCount: Int       # From Providers subgraph
     reviews: [Review!]!    # From Providers subgraph
   }
   ```

### 6.4 View Subgraph Distribution

Click on any field to see which subgraph resolves it:
- `Provider.name` → **hasura**
- `Provider.rating` → **providers**

---

## 🔄 Step 7: Configure Gateway to Use Managed Federation

Update your Apollo Gateway to pull schema from GraphOS instead of using local files.

### 7.1 Update Gateway Configuration

Edit `app/gateway/src/index.ts`:

```typescript
import { ApolloGateway, IntrospectAndCompose } from '@apollo/gateway';
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';

// Option 1: Managed Federation (GraphOS)
const gateway = new ApolloGateway({
  // Pull schema from GraphOS
  // No serviceList needed!
});

// Option 2: Local Development (keep for local)
// const gateway = new ApolloGateway({
//   supergraphSdl: new IntrospectAndCompose({
//     subgraphs: [
//       { name: 'hasura', url: process.env.HASURA_ENDPOINT },
//       { name: 'providers', url: process.env.PROVIDERS_SUBGRAPH_URL },
//     ],
//   }),
// });

const server = new ApolloServer({
  gateway,
});

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
});

console.log(`🚀 Gateway ready at ${url}`);
```

### 7.2 Set Environment Variables

Set `APOLLO_KEY` and `APOLLO_GRAPH_REF` in your gateway deployment:

**For Render.com:**
1. Go to your gateway service on Render.com
2. Navigate to **Environment** tab
3. Add:
   - `APOLLO_KEY`: Your graph API key
   - `APOLLO_GRAPH_REF`: `claimsight-api@main`

**For local development:**
```bash
# .env
APOLLO_KEY=service:claimsight-api:your-key
APOLLO_GRAPH_REF=claimsight-api@main
```

### 7.3 Redeploy Gateway

```bash
# Render.com auto-deploys on git push
git add .
git commit -m "Enable managed federation"
git push

# Or manually trigger deploy in Render dashboard
```

---

## 📈 Step 8: Enable Query Analytics

### 8.1 Configure Gateway to Report Metrics

Metrics are automatically reported when using managed federation!

Verify by checking gateway logs:
```
Apollo Gateway: Reporting metrics to Apollo Studio
```

### 8.2 View Metrics in Studio

1. Go to Apollo Studio → Your Graph
2. Click **"Operations"** tab
3. Wait 1-2 minutes for data to appear
4. You'll see:
   - **Request rate**: Queries per minute
   - **Error rate**: Failed operations percentage
   - **Latency**: P50, P95, P99 response times
   - **Most executed operations**: Top queries

### 8.3 Explore Operation Details

Click any operation to see:
- Execution trace (which subgraphs were called)
- Field-level timings
- Error details
- Client information (if configured)

---

## 🔍 Step 9: Enable Distributed Tracing

See exactly how queries execute across subgraphs.

### 9.1 Add Trace Plugin to Gateway

Edit `app/gateway/src/index.ts`:

```typescript
import { ApolloServerPluginInlineTrace } from '@apollo/server/plugin/inlineTrace';

const server = new ApolloServer({
  gateway,
  plugins: [
    ApolloServerPluginInlineTrace(),
  ],
});
```

### 9.2 View Traces in Studio

1. In Operations tab, click any operation
2. Click **"View trace"** button
3. See visual timeline:
   ```
   Query execution: 234ms
   ├─ hasura.members (120ms)
   │  └─ PostgreSQL query (100ms)
   ├─ providers._entities (80ms)
   │  └─ ratings lookup (60ms)
   └─ Response formatting (34ms)
   ```

This helps identify slow subgraphs and optimize queries!

---

## ✅ Step 10: Set Up Schema Checks

Prevent breaking changes with automated schema validation.

### 10.1 Configure Schema Checks

Schema checks run automatically when you publish a subgraph schema.

Test it:
```bash
# Check if schema change would break clients
npx @apollo/rover subgraph check $APOLLO_GRAPH_REF \
  --name hasura \
  --schema ./schemas/hasura-schema-v2.graphql
```

**Output shows:**
- ✅ **Compatible changes**: New fields, deprecations
- ⚠️ **Breaking changes**: Removed fields, type changes
- 📊 **Client impact**: Which operations would break

### 10.2 Add GitHub Action for Schema Checks

Create `.github/workflows/schema-check.yml`:

```yaml
name: Apollo Schema Check

on:
  pull_request:
    paths:
      - 'app/server/src/schema.graphql'
      - 'hasura/metadata/**'

jobs:
  schema-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Check Providers Subgraph
        env:
          APOLLO_KEY: ${{ secrets.APOLLO_KEY }}
        run: |
          npx @apollo/rover subgraph check ${{ secrets.APOLLO_GRAPH_REF }} \
            --name providers \
            --schema ./app/server/src/schema.graphql

      - name: Check Hasura Subgraph
        env:
          APOLLO_KEY: ${{ secrets.APOLLO_KEY }}
        run: |
          # Export Hasura schema and check
          # ... (schema export steps)
          npx @apollo/rover subgraph check ${{ secrets.APOLLO_GRAPH_REF }} \
            --name hasura \
            --schema ./schemas/hasura-schema.graphql
```

**Add GitHub secrets:**
- `APOLLO_KEY`
- `APOLLO_GRAPH_REF`

Now schema checks run on every PR!

---

## 🏷️ Step 11: Set Up Multiple Environments

Use **variants** to manage staging vs production.

### 11.1 Create Staging Variant

```bash
# Publish to staging variant
export APOLLO_GRAPH_REF=claimsight-api@staging

npx @apollo/rover subgraph publish $APOLLO_GRAPH_REF \
  --name hasura \
  --routing-url https://your-staging-hasura.app/v1/graphql \
  --schema ./schemas/hasura-schema.graphql

npx @apollo/rover subgraph publish $APOLLO_GRAPH_REF \
  --name providers \
  --routing-url https://your-staging-providers.onrender.com \
  --schema ./app/server/src/schema.graphql
```

### 11.2 Configure Gateway Variants

**Staging gateway:**
```bash
APOLLO_GRAPH_REF=claimsight-api@staging
```

**Production gateway:**
```bash
APOLLO_GRAPH_REF=claimsight-api@main
```

Now you can test schema changes in staging before promoting to production!

---

## 📊 Step 12: Track Field Usage

Understand which GraphQL fields clients actually use.

### 12.1 Enable Field Usage Reporting

Already enabled with managed federation! Usage is tracked automatically.

### 12.2 View Field Usage

1. In Apollo Studio, go to **"Schema"** tab
2. Click **"Fields"** in sidebar
3. Sort by **"Request count"**
4. See:
   - How many times each field was queried
   - Which fields are never used (candidates for deprecation)
   - Most expensive fields (high latency)

### 12.3 Deprecate Unused Fields

Mark fields as deprecated in your schema:

```graphql
type Provider {
  id: ID!
  name: String
  oldField: String @deprecated(reason: "Use newField instead. Will be removed on 2024-12-01")
  newField: String
}
```

Clients get warnings when using deprecated fields!

---

## ✅ Success Checklist

- [ ] Apollo Studio account created
- [ ] Graph created (supergraph/federation type)
- [ ] API key generated and saved securely
- [ ] Rover CLI installed and configured
- [ ] Hasura subgraph published
- [ ] Providers subgraph published
- [ ] Supergraph composition successful
- [ ] Gateway configured for managed federation
- [ ] Metrics reporting to Apollo Studio
- [ ] Distributed tracing enabled
- [ ] Schema checks configured
- [ ] Multiple environments set up (staging + main)
- [ ] Field usage tracking verified

---

## 🚀 Next Steps

### Deploy Gateway with Managed Federation
Your gateway now pulls schema from GraphOS:
- **Next:** [Render.com Gateway Deployment](../render/gateway-guide.md)

### Deploy Frontend
Connect React app to your federated gateway:
- **Next:** [Vercel Deployment](../vercel/README.md)

---

## 🔧 Troubleshooting

### Issue: "Invalid graph ref" when publishing

**Cause:** Graph ref format incorrect.

**Solution:**
```bash
# Correct format: {graph-id}@{variant}
export APOLLO_GRAPH_REF=claimsight-api@main

# NOT: claimsight-api/main (wrong separator)
# NOT: claimsight-api (missing variant)
```

### Issue: "Composition failed" error

**Cause:** Federation directives conflict or missing `@key` on entities.

**Solution:**
1. Check error message for conflicting fields
2. Ensure all entities have `@key` directive:
   ```graphql
   type Provider @key(fields: "id") {
     id: ID!
     # ...
   }
   ```
3. Verify `@external` fields are marked correctly

### Issue: Gateway not connecting to GraphOS

**Cause:** Missing or incorrect `APOLLO_KEY` / `APOLLO_GRAPH_REF`.

**Solution:**
1. Verify environment variables in gateway:
   ```bash
   echo $APOLLO_KEY
   echo $APOLLO_GRAPH_REF
   ```
2. Check gateway logs for connection errors
3. Ensure API key has "Graph Admin" role

### Issue: No metrics showing in Studio

**Cause:** Metrics plugin not configured or gateway not using managed federation.

**Solution:**
1. Verify gateway is pulling schema from GraphOS (not local `IntrospectAndCompose`)
2. Check `ApolloServerPluginInlineTrace` plugin is added
3. Wait 2-3 minutes for initial data to appear

### Issue: Schema check fails with "Cannot query field"

**Cause:** Breaking change detected.

**Solution:**
1. Review schema check output to see affected operations
2. Either:
   - Revert breaking change
   - Deprecate field instead of removing
   - Update all clients before schema change
3. Re-run schema check after fix

---

## 📚 Resources

- [Apollo GraphOS Documentation](https://www.apollographql.com/docs/graphos/)
- [Rover CLI Reference](https://www.apollographql.com/docs/rover/)
- [Federation Specification](https://www.apollographql.com/docs/federation/)
- [Apollo Schema Checks](https://www.apollographql.com/docs/graphos/delivery/schema-checks/)
- [Challenge 7: Apollo Federation](../../DOCUMENTS/CHALLENGES.md#challenge-7-apollo-federation)

---

**Apollo GraphOS setup complete!** 🎉

Your federated schema is now managed in the cloud with:
- ✅ Schema registry
- ✅ Managed federation
- ✅ Query analytics
- ✅ Distributed tracing
- ✅ Schema validation
