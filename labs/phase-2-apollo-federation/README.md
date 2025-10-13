# Apollo GraphOS Federation Guide - Phase 2

**Welcome to GraphQL Federation!** 🎉

In [Phase 1](../hasura-cloud/README.md), you built a single GraphQL API with Hasura Cloud. Now you'll learn how to **combine multiple GraphQL services** into one unified API using Apollo Federation.

---

## 📋 What You'll Build

By the end of this guide, you'll have:

1. **Apollo GraphOS Account** - Free schema registry (cloud)
2. **Hasura Subgraph** - Your existing API registered as "subgraph 1"
3. **Providers Subgraph** - New Node.js service with ratings/reviews ("subgraph 2")
4. **Unified Supergraph** - One API that queries both services seamlessly

### Before Federation (Phase 1):
```
Client → Hasura GraphQL API → PostgreSQL
```

### After Federation (Phase 2):
```
Client → Apollo Supergraph
         ├─→ Hasura Subgraph (claims, members)
         └─→ Providers Subgraph (ratings, reviews)
```

---

## 🎓 What You'll Learn

✅ **Why Federation Matters** - When and why to use multiple GraphQL services
✅ **Apollo Federation Directives** - `@key`, `@extends`, entity resolution
✅ **Supergraph Composition** - How Apollo combines multiple schemas
✅ **Schema Registry** - Version control for GraphQL schemas
✅ **Cross-Service Queries** - Fetching data from multiple services in one query

---

## ⏱️ Time & Cost

**Time:** 45 minutes
**Cost:** **FREE** ⭐ (for teams <10 people)

**Free Tier Includes:**
- Unlimited subgraph publishes
- Supergraph composition
- Schema checks
- Query analytics
- Distributed tracing

---

## 🎯 Prerequisites

**Required:**
- ✅ **Phase 1 Complete** - Hasura Cloud deployment ([guide](../hasura-cloud/README.md))
- ✅ **Hasura Endpoint** - Your `https://your-project.hasura.app/v1/graphql` URL
- ✅ **Admin Secret** - From Hasura Cloud project settings
- ✅ **Node.js 18+** installed locally
- ✅ **Project cloned** - The poc-has-apal repository on your machine

**Optional (for later deployment):**
- Render.com account (free - for deploying Providers subgraph)
- Git/GitHub (for version control)

---

## 💡 Why Federation? The Problem We're Solving

In Phase 1, you built a complete GraphQL API with Hasura. So why add federation?

**Scenario:** You want to add **provider ratings and reviews** to your system:

**Option 1: Add to Hasura database** ❌
- Ratings might come from a different data source (MongoDB, external API)
- Managed by a different team
- Requires custom business logic (average calculations, spam filtering)
- Tightly couples all data to one database

**Option 2: Create separate GraphQL service** ❌
- Now clients need to call TWO APIs
- Frontend must merge data from both
- Can't query providers with ratings in one request

**Option 3: Apollo Federation** ✅
- Keep Hasura managing healthcare data
- Create separate Providers subgraph for ratings
- Apollo Gateway combines both into ONE API
- Frontend queries ONE endpoint, gets data from both

**Result:** One unified API, multiple specialized services!

---

## 🚀 Step 1: Create Apollo Studio Account

### 1.1 Sign Up

1. Visit https://studio.apollographql.com/
2. Click **"Sign up"**
3. Choose sign-up method:
   - GitHub (recommended for CI/CD integration)
   - Google
   - Email

### 1.2 Welcome Screen

After signing up, you'll see **"Welcome to GraphOS Studio"** with a 3-step onboarding:

```
Step one: Install the Rover CLI
Step two: Authenticate
Step three: Add your first graph
```

**Don't worry!** We'll walk through these steps together.

---

## 🛠️ Step 2: Install Rover CLI

Apollo Studio will show you installation instructions. Follow along:

### 2.1 Install Rover

**Option 1: npm (Recommended - Works on all platforms)**
```bash
npm install --save-dev @apollo/rover

# Or use npx directly (no installation needed)
npx @apollo/rover --version
```

**Option 2: System-wide install (as shown in Apollo Studio)**

*macOS / Linux:*
```bash
curl -sSL https://rover.apollo.dev/nix/latest | sh
```

*Windows (PowerShell):*
```powershell
iwr 'https://rover.apollo.dev/win/latest' | iex
```

### 2.2 Verify Installation

```bash
# If using npm
npx @apollo/rover --version

# If installed system-wide
rover --version
```

**Expected:** `Rover 0.x.x`

---

## 🔑 Step 3: Authenticate Rover & Create Graph

### 3.1 Create Personal API Key

Apollo Studio will prompt you to authenticate. Here's how:

1. In Apollo Studio, you should see **"Step two: Authenticate"**
2. Click **"Create a personal API key"** or go to your profile settings
3. **User Settings** → **Personal API Keys** → **Create New Key**
4. **Key name**: `My Development Key` or `Rover CLI`
5. Click **"Create Key"**
6. **Copy the key immediately!** It's only shown once.

**Format:** `user:gh.YourUsername:xxxxxxxxxxxxx`

### 3.2 Authenticate Rover

Back in your terminal, run:

```bash
rover config auth
```

**Prompt:**
```
Go to https://studio.apollographql.com/user-settings/api-keys
to get your API key.

Apollo Studio API key:
```

**Paste your personal API key and press Enter.**

**Expected output:**
```
Successfully saved API key.
```

### 3.3 Create Your First Graph

Now you're ready to create a graph! Apollo Studio shows two options:

1. **Add existing graph** - Create/register a supergraph in Apollo Studio
2. **rover init** - Create a demo graph locally (skip this)

**Choose: "Add existing graph"** (we'll create a new supergraph)

You'll see a form like this:

```
Add a graph
Adding your graph to GraphOS lets you explore it in Studio...

Graph title: My Graph
Graph ID: My-Graph-ly6ftf
Graph architecture: Supergraph
Default federation version: Federation 2.12
Visibility: Public to organization
```

**Fill in the form:**

1. **Graph title:** `ClaimSight API`
2. **Graph ID:** Change to `claimsight-api` (lowercase, no random suffix)
   - Delete the auto-generated ID
   - Type: `claimsight-api`
3. **Graph architecture:** Keep **"Supergraph"** selected ✅
4. **Default federation version:** Keep **"Federation 2.12"** (or latest) ✅
5. **Visibility:** Keep **"Public"** (visible to your organization)
6. Click **"Next"** or **"Create Graph"**

**Important:** Make sure "Supergraph" is selected for Graph architecture - this enables federation!

### 3.4 Graph Created - Next Steps Screen

After clicking "Create Graph", you'll see a screen with:

```
Think of this as your README. It lets you add notes, usage tips,
or setup instructions to help your team...

To continue, publish your first subgraph:

$ APOLLO_KEY=service:claimsight-api:•••••••••••••••••••••• \
  rover subgraph publish claimsight-api@current \
  --schema "path-to-your-subgraph-schema.{graphql,gql}" \
  --name your-subgraph-name \
  --routing-url "your-subgraph-public-endpoint"
```

**Don't run this command yet!** We'll publish subgraphs in Step 7.

**What to note:**

1. **APOLLO_KEY** - Apollo shows your graph API key here (dots for security)
   - Copy this key! It's the same format as: `service:claimsight-api:xxxxx`
   - Save it to `.env.apollo` (if you didn't in Step 4)

2. **Graph ref** - Look at the command: `claimsight-api@current`
   - Format: `{graph-id}@{variant}`
   - Your graph ID: `claimsight-api`
   - Variant name: `current` (Apollo's default - same as `main`)

**Save these values:**

```bash
# .env.apollo (project root)
APOLLO_KEY=service:claimsight-api:your-key-from-screen
APOLLO_GRAPH_REF=claimsight-api@current
```

**Note:** Apollo uses `@current` as the default variant. You can use `@current` or `@main` - they work the same way.

**You can close this screen or leave it open.** We'll come back to publish schemas in Step 7!

---

## 🔐 Step 4: Save Your Graph API Key

**Good news!** Apollo automatically created a **graph API key** when you created the graph (shown in Step 3.4).

### 4.1 Copy the API Key

On the "Next Steps" screen from Step 3.4, Apollo shows:

```bash
APOLLO_KEY=service:claimsight-api:••••••••••••••••••••••
```

**To reveal and copy the full key:**

1. Click on the key (the dots) or look for a "copy" button
2. **Copy the entire key** - format: `service:claimsight-api:xxxxxxxxxxxxx`

**Alternative:** If you can't see the full key:

1. In your graph, click **"Settings"** (gear icon)
2. Go to **"This Graph"** → **"API Keys"** tab
3. You'll see your automatically-created key
4. Click to copy it

### 4.2 Save to .env.apollo

Create your Apollo configuration file:

```bash
# From project root
cp .env.apollo.example .env.apollo
```

Then edit `.env.apollo` with your actual values:

```bash
# .env.apollo (project root)
APOLLO_KEY=service:claimsight-api:your-full-key-here
APOLLO_GRAPH_REF=claimsight-api@current
```

**⚠️ Never commit API keys to Git!**
- ✅ `.env.apollo` is already in `.gitignore`
- ✅ `.env.apollo.example` is committed (safe template)

### 4.3 Key Types Summary

You now have **two API keys**:

| Key Type | Format | Purpose |
|----------|--------|---------|
| **Personal API key** | `user:gh.YourName:xxxxx` | Rover CLI authentication (Step 3.2) |
| **Graph API key** | `service:claimsight-api:xxxxx` | Publishing schemas, CI/CD (this step) |

**For the rest of this guide, we'll use the graph API key.**

---

**✅ Checkpoint:** You should now have:
- [ ] Apollo Studio account created
- [ ] Rover CLI installed and authenticated
- [ ] Graph created: `claimsight-api`
- [ ] Graph API key saved in `.env.apollo`

---

## 🏗️ Step 5: Create Providers Subgraph

Now let's create the **second subgraph** that will add ratings to providers!

### 5.1 Understand the Providers Subgraph

The Providers subgraph is already built in the project at `app/server/`.

**What it does:**
- Extends `ProviderRecord` type from Hasura with ratings data
- Stores ratings in memory (for demo - could use MongoDB, Redis, etc.)
- Implements Apollo Federation `@key` directive for entity resolution

**Schema preview:**
```graphql
# app/server/src/schema.graphql
extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key", "@external"])

type ProviderRecord @key(fields: "id") {
  id: ID! @external
  rating: Float
  reviewCount: Int
  reviews: [Review!]!
}

type Review {
  id: ID!
  providerId: ID!
  memberName: String
  rating: Int!
  comment: String
  createdAt: String
}
```

**Key concepts:**
- `@key(fields: "id")` - Tells Apollo how to identify ProviderRecords across subgraphs
- `@external` - The `id` field comes from Hasura, not this subgraph
- `extend` - This subgraph adds to existing ProviderRecord type

### 5.2 Install Subgraph Dependencies

```bash
# Navigate to Providers subgraph directory
cd app/server

# Install dependencies
npm install
```

**Installed packages include:**
- `@apollo/subgraph` - Federation support
- `graphql` - GraphQL execution
- `express` - HTTP server

### 5.3 Run Providers Subgraph Locally

```bash
# From app/server directory
npm start

# Or from project root
npm run server
```

**Expected output:**
```
🚀 Providers Subgraph ready at http://localhost:3002/
```

**Test it:**
```bash
# Health check
curl http://localhost:3002/health

# Expected: {"status":"ok","service":"provider-ratings-subgraph"}

# GraphQL query (check if schema is valid)
curl -X POST http://localhost:3002/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ _service { sdl } }"}'

# Should return the federation schema SDL
```

### 5.4 Test Sample Ratings Data

The subgraph starts with some seed data. Let's verify it:

```bash
# Query providers with ratings
curl -X POST http://localhost:3002/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ providers { id name rating ratingCount } }"}'
```

**Expected response:**
```json
{
  "data": {
    "providers": [
      {
        "id": "734f62da-879d-45bb-b07b-8163182ef917",
        "name": "Dr. Sarah Smith",
        "rating": 4.8,
        "ratingCount": 24
      }
    ]
  }
}
```

**Note:** This subgraph has its own mock provider data for standalone testing. When federated, Apollo Gateway will use Hasura's provider data and add ratings from this subgraph!

---

## 🔄 Step 6: Test Federation Locally

Before publishing to Apollo GraphOS, test federation on your machine.

### 6.1 Run Gateway Locally

The gateway combines Hasura + Providers subgraphs.

```bash
# From project root - runs ALL services for Phase 2
npm run phase2:dev

# Alternative (same result)
npm run federated:dev
```

**This starts:**
- ✅ Action Handler (port 3001)
- ✅ Providers Subgraph (port 3002)
- ✅ Apollo Gateway (port 4000) - connects to Hasura Cloud + Providers
- ✅ React Frontend (port 5173)

**Hasura runs separately** in Hasura Cloud (from Phase 1).

### 6.2 Enable Federation in Hasura Cloud

Before the gateway can connect, you need to enable Apollo Federation in your Hasura Cloud instance:

1. Go to https://cloud.hasura.io/
2. Open your project from Phase 1
3. Click **"Env vars"** in the left sidebar
4. Click **"New Env Var"**
5. Add:
   - **Key:** `HASURA_GRAPHQL_ENABLE_APOLLO_FEDERATION`
   - **Value:** `true`
6. Click **"Add"**

**Hasura will restart automatically** (takes ~10-15 seconds).

**Why needed?** This tells Hasura to expose the `_service { sdl }` query that Apollo Gateway uses for federation.

### 6.3 Configure Hasura Tables for Federation

Now you need to enable Apollo Federation on specific tables so other subgraphs can reference them.

**Option 1: Apply Pre-Configured Metadata (Fastest)** ⚡

The project includes metadata files with federation already configured. Use the Hasura CLI to apply them:

```bash
# Install Hasura CLI
npm install -g hasura-cli

# Configure (one-time setup)
cd hasura
nano config.yaml  # Edit with your Hasura endpoint and admin secret

# Apply metadata (includes federation config)
hasura metadata apply
```

✅ This automatically enables federation on members, providers, and claims tables!

📖 **See:** [Hasura Metadata Setup Guide](../../docs/hasura-metadata-setup.md) for detailed instructions.

**Option 2: Using the Hasura Console (Manual)**

1. In Hasura Console, click **"Data"** → **"public"** → **"members"**
2. Click the **"Modify"** tab
3. Scroll to **"Enable Apollo Federation"** section
4. **Toggle the switch to ON** ✅
5. Click **"Save"**

Repeat for these tables:
- ✅ `members` - Will be referenced by Appointments and Medications subgraphs
- ✅ `providers` - Will be extended by Providers subgraph with ratings

**Option 3: Using the Automation Script**

Run this from the project root:
```bash
./scripts/configure-hasura-federation.sh
```

This automatically enables federation on members, providers, and claims tables via Metadata API.

**Verify configuration:**

In Hasura Console → API tab, run:
```graphql
{
  _service {
    sdl
  }
}
```

Look for `@key(fields: "id")` directives on `member_records` and `provider_records` types. ✅

**📖 Detailed Guide:** See [Configure Hasura Federation](./configure-hasura-federation.md) for troubleshooting and more methods.

### 6.4 Configure Gateway for Your Hasura Endpoint

The gateway loads environment variables from the **project root `.env`** file. Update it to use Hasura Cloud:

```bash
# Edit .env in project root
# Comment out local Hasura, add Cloud settings:

# Local Hasura (commented out when using Hasura Cloud)
# HASURA_GRAPHQL_ENDPOINT=http://localhost:8080
# HASURA_GRAPHQL_ADMIN_SECRET=claimsight_admin_secret_change_me

# Hasura Cloud (Phase 2 - Federation)
# NOTE: Base URL only - gateway code adds /v1/graphql
HASURA_GRAPHQL_ENDPOINT=https://your-project.hasura.app
HASURA_GRAPHQL_ADMIN_SECRET=your-admin-secret-from-phase-1
```

**Important:**
- Use **base URL only** (without `/v1/graphql`) - the gateway code adds it
- The gateway reads from project root `.env`, not `app/gateway/.env`
- To switch back to local Hasura later, uncomment the local settings

**Note:** The `.env` file is gitignored - your secrets are safe!

### 6.5 Test Federated Query

Now start the federated stack:

```bash
# From project root
npm run phase2:dev
```

**Expected output:**
```
✓ Eligibility action handler running on port 3001
✓ Provider ratings subgraph running on port 3002
✓ Hasura is ready with Apollo Federation enabled
🚀 Apollo Federation Gateway ready!
   GraphQL endpoint: http://localhost:4000/graphql
```

**If you see "Hasura did not become ready in time":**
- Check that you added the `HASURA_GRAPHQL_ENABLE_APOLLO_FEDERATION=true` env var
- Wait for Hasura Cloud to finish restarting
- Check your `app/gateway/.env` has the correct HASURA_ENDPOINT

Open http://localhost:4000/graphql in your browser (Apollo Explorer).

**Try this query:**
```graphql
query FederatedProviders {
  provider_records(limit: 5) {
    id
    name              # From Hasura subgraph
    specialty         # From Hasura subgraph
    npi               # From Hasura subgraph
    rating            # From Providers subgraph! 🎉
    reviewCount       # From Providers subgraph! 🎉
  }
}
```

**What's happening:**
1. Gateway receives query
2. Sends `provider_records` query to **Hasura** → gets `id`, `name`, `specialty`, `npi`
3. For each provider, sends `id` to **Providers subgraph** → gets `rating`, `reviewCount`
4. Gateway merges results into one response!

This is **entity resolution** - the core of Apollo Federation!

### 6.6 Checkpoint ✅

Before continuing, verify:
- [ ] Providers subgraph running on port 3002
- [ ] Gateway running on port 4000
- [ ] Federated query returns data from BOTH Hasura and Providers

**If working:** Continue to publish schemas to Apollo GraphOS!

---

## 📤 Step 7: Publish Subgraph Schemas to Apollo GraphOS

Now that federation works locally, let's publish schemas to Apollo GraphOS so you can deploy to the cloud!

### 7.1 Export Hasura Schema (OPTIONAL)

**NOTE: This step is optional.** The gateway automatically introspects and fetches schemas when it starts. This is only if you want a local copy for reference.

If you want to export the schema manually:

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

### 7.2 Publish Hasura Subgraph

```bash
# Navigate to project root
cd /path/to/poc-has-apal

# Set environment variables (if not already set)
export APOLLO_KEY=service:claimsight-api:your-key-from-step-4
export APOLLO_GRAPH_REF=claimsight-api@current

# Publish Hasura subgraph
npx @apollo/rover subgraph publish $APOLLO_GRAPH_REF \
  --name hasura \
  --routing-url https://your-project.hasura.app/v1/graphql \
  --schema ./schemas/hasura-schema.graphql
```

**Expected output:**
```
Publishing SDL to claimsight-api@current using credentials from the default profile.
A new subgraph called 'hasura' was created in 'claimsight-api@current'
The gateway for 'claimsight-api@current' was updated with a new schema, composed from the updated 'hasura' subgraph

✅ Subgraph 'hasura' published successfully!
```

### 7.3 Publish Providers Subgraph

```bash
# Publish Providers subgraph
npx @apollo/rover subgraph publish $APOLLO_GRAPH_REF \
  --name providers \
  --routing-url http://localhost:3002 \
  --schema ./app/server/src/schema.graphql
```

**Note:** We're using `http://localhost:3002` as the routing URL for now (local testing). When you deploy to Render.com in Phase 3, you'll update this to the production URL.

**Expected output:**
```
Publishing SDL to claimsight-api@current using credentials from the default profile.
A new subgraph called 'providers' was created in 'claimsight-api@current'
The gateway for 'claimsight-api@current' was updated with a new schema, composed from the updated 'providers' subgraph

✅ Subgraph 'providers' published successfully!
```

### 7.4 Verify Supergraph Composition

```bash
# Check composition status
npx @apollo/rover subgraph check $APOLLO_GRAPH_REF \
  --name hasura \
  --schema ./schemas/hasura-schema.graphql
```

**Expected:** `✓ Composition successful`

---

## 🌐 Step 8: View Schema in Apollo Studio

### 8.1 Open Schema Tab

1. Go to https://studio.apollographql.com/
2. Select your graph: **ClaimSight API**
3. Click **"Schema"** tab

### 8.2 Explore Federated Schema

You'll see:
- **Supergraph SDL**: Combined schema from all subgraphs
- **Subgraphs**: List of subgraphs (hasura, providers)
- **Federation Directives**: `@key`, `@external`, `@requires`

### 8.3 Inspect Entity Resolution

1. Click **"Types"** in left sidebar
2. Find **"ProviderRecord"** type
3. You'll see:
   ```graphql
   type ProviderRecord @key(fields: "id") {
     id: ID!
     name: String           # From Hasura
     specialty: String      # From Hasura
     npi: String            # From Hasura
     rating: Float          # From Providers subgraph 🎉
     reviewCount: Int       # From Providers subgraph 🎉
     reviews: [Review!]!    # From Providers subgraph 🎉
   }
   ```

### 8.4 View Subgraph Distribution

Click on any field to see which subgraph resolves it:
- `ProviderRecord.name` → **hasura**
- `ProviderRecord.rating` → **providers**

**This is the power of federation!** One type, data from multiple services.

---

## 🎉 Phase 2 Complete - What You've Learned

**Congratulations!** You've successfully implemented GraphQL Federation.

**What you built:**
- ✅ Apollo GraphOS account with supergraph
- ✅ Hasura Cloud as federated subgraph #1
- ✅ Custom Providers subgraph #2 (ratings/reviews)
- ✅ Local federation testing
- ✅ Schemas published to Apollo Studio

**What you learned:**
- ✅ Why federation matters (multiple data sources, teams)
- ✅ Entity resolution with `@key` directive
- ✅ Supergraph composition
- ✅ Schema registry benefits

**Try this query in Apollo Studio Explorer:**
```graphql
query PhaseComplete {
  provider_records(limit: 3) {
    name
    rating        # This comes from a DIFFERENT service!
    reviewCount   # Federation makes it seamless
  }
}
```

---

## 🚀 Next Steps - Phase 3: Production Deployment

**What you have now:**
- Federation working locally
- Schemas in Apollo Studio

**What's next:**
- Deploy Providers subgraph to Render.com (cloud)
- Deploy Apollo Gateway to Render.com (cloud)
- Deploy React frontend to Vercel

**Continue when ready:** [Phase 3: Full Stack Deployment](../render/README.md)

---

## 📚 Advanced Topics (Optional)

The sections below are optional enhancements for production deployments.

---

## 🔄 Advanced: Configure Gateway for Managed Federation

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
   - `APOLLO_GRAPH_REF`: `claimsight-api@current`

**For local development:**
```bash
# .env
APOLLO_KEY=service:claimsight-api:your-key
APOLLO_GRAPH_REF=claimsight-api@current
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
APOLLO_GRAPH_REF=claimsight-api@current
# or use @main if you prefer (they're equivalent)
```

**Variant naming is flexible!** Use whatever makes sense for your team:
- `@current` - Apollo's default (same as production)
- `@main` or `@prod` - Common for production
- `@staging` or `@dev` - Pre-production environments

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
export APOLLO_GRAPH_REF=claimsight-api@current
# or
export APOLLO_GRAPH_REF=claimsight-api@main

# NOT: claimsight-api/main (wrong separator)
# NOT: claimsight-api (missing variant)
```

**Note:** Apollo Studio now uses `@current` by default, but `@main`, `@staging`, `@prod` all work - they're just labels for different environments.

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
