# Cloud Deployment Guide (Windows)

Complete guide to deploying ClaimSight to cloud services using free tiers and sandboxes. Perfect for Windows users who want to explore cloud-native GraphQL architectures.

---

## Overview

This guide walks through deploying ClaimSight components to cloud platforms using **free tiers only**:

- **Hasura Cloud** (Free tier) - GraphQL Engine
- **Neon** (Free tier) - PostgreSQL Database
- **Apollo Studio** (Free tier) - Federation monitoring & schema registry
- **Render/Railway** (Free tier) - Node.js services (subgraphs, gateway)
- **Vercel** (Free tier) - React frontend

**Windows-specific notes**: All cloud services work in browser or via npm packages - no Docker required!

---

## Architecture: Local → Cloud Migration

### Local (Docker) Architecture
```
┌─────────────────────────────────────────────┐
│  Docker Compose (localhost)                 │
├─────────────────────────────────────────────┤
│  PostgreSQL          :5432                  │
│  Hasura              :8080                  │
│  Action Handler      :3001                  │
│  Providers Subgraph  :3002                  │
│  Federation Gateway  :4000                  │
│  React Client        :5173                  │
└─────────────────────────────────────────────┘
```

### Cloud Architecture
```
┌──────────────────────────┐
│  Vercel (Edge Network)   │  ← React Client
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  Railway/Render          │  ← Gateway (port 4000)
└────┬─────────────┬───────┘
     │             │
     ▼             ▼
┌─────────┐  ┌─────────────┐
│ Railway │  │ Hasura Cloud│  ← GraphQL Engine
│ Render  │  └──────┬──────┘
│         │         │
│ Subgraph│         ▼
│ Handler │  ┌──────────────┐
└─────────┘  │ Neon/Supabase│  ← PostgreSQL
             └──────────────┘
```

---

## Prerequisites

### Required Accounts (All Free)

1. **Neon** - https://neon.tech
   - Free tier: 3GB storage, 10GB data transfer/month
   - No credit card required

2. **Hasura Cloud** - https://cloud.hasura.io
   - Free tier: 1 project, 60 req/min
   - Email signup only

3. **Railway** or **Render** - For Node.js services
   - Railway: https://railway.app (Free $5/month trial)
   - Render: https://render.com (Free tier with 750 hrs/month)

4. **Vercel** - https://vercel.com
   - Free tier: Unlimited deployments
   - GitHub integration

5. **Apollo Studio** (Optional) - https://studio.apollographql.com
   - Free tier: Schema registry, explorer
   - GitHub signup

### Local Tools (Windows)

```bash
# Install Node.js (if not already installed)
# Download from: https://nodejs.org

# Verify installation
node --version
npm --version

# Install Hasura CLI (via npm)
npm install -g hasura-cli

# Verify
hasura version

# Install Rover CLI (for Apollo Studio)
npm install -g @apollo/rover
```

---

## Step 1: Database Setup (Neon PostgreSQL)

### 1.1 Create Neon Account

1. Go to https://neon.tech
2. Click **Sign Up** (use GitHub or email)
3. Create new project: **claimsight-db**
4. Select region: **US East (Ohio)** (or closest to you)
5. PostgreSQL version: **16** (latest)

### 1.2 Get Connection String

After project creation, you'll see:

```
Connection string (copied):
postgres://username:password@ep-xyz-123.us-east-2.aws.neon.tech/neondb?sslmode=require
```

**Save this!** You'll need it for Hasura.

### 1.3 Run Database Schema Migration

On your **Windows machine**, navigate to project directory:

```bash
cd C:\Users\YourName\github\medica\poc-has-apal

# Create .env.cloud file
copy .env.example .env.cloud
```

Edit `.env.cloud`:
```env
# Neon PostgreSQL connection
DATABASE_URL=postgres://username:password@ep-xyz-123.us-east-2.aws.neon.tech/neondb?sslmode=require
```

Apply schema using Hasura CLI:

```bash
# Point Hasura CLI to Neon database
hasura migrate apply --database-name default --endpoint https://your-hasura-project.hasura.app --admin-secret <will-set-later>
```

**Note**: We'll set this up properly after Hasura Cloud is configured.

---

## Step 2: Hasura Cloud Setup

### 2.1 Create Hasura Cloud Project

1. Go to https://cloud.hasura.io
2. Click **Create New Project**
3. Project name: **claimsight**
4. Region: **US East** (match Neon region)
5. Plan: **Free**

### 2.2 Connect to Neon Database

1. In Hasura Cloud dashboard, click **Launch Console**
2. Go to **Data** tab → **Connect Database**
3. Database Display Name: `default`
4. Data Source Driver: `PostgreSQL`
5. Connection String: Paste your Neon connection string
6. Click **Connect Database**

### 2.3 Apply Migrations

From your Windows terminal:

```bash
cd C:\Users\YourName\github\medica\poc-has-apal

# Update hasura/config.yaml endpoint
# Edit hasura/config.yaml and set:
# endpoint: https://claimsight.hasura.app

# Apply migrations
hasura migrate apply --database-name default --admin-secret myadminsecretkey

# Apply metadata (tables, relationships, permissions)
hasura metadata apply --admin-secret myadminsecretkey

# Run seeds (sample data)
hasura seed apply --database-name default --admin-secret myadminsecretkey
```

**Files referenced**:
- `hasura/config.yaml` - Hasura CLI configuration
- `hasura/migrations/` - Database schema migrations
- `hasura/metadata/` - Hasura metadata (tables, permissions, actions)
- `hasura/seeds/` - Sample data

### 2.4 Enable Apollo Federation

In Hasura Cloud console:

1. Click project name → **Env vars**
2. Add new environment variable:
   - Key: `HASURA_GRAPHQL_ENABLE_APOLLO_FEDERATION`
   - Value: `true`
3. Click **Add**

Hasura will restart automatically.

### 2.5 Set Admin Secret

1. In Hasura Cloud project settings → **Env vars**
2. Find `HASURA_GRAPHQL_ADMIN_SECRET`
3. Click **Edit** → Set value: `your-secure-admin-secret-here`
4. Save

**Save this admin secret!** You'll need it everywhere.

### 2.6 Configure CORS

1. In Env vars, add:
   - Key: `HASURA_GRAPHQL_CORS_DOMAIN`
   - Value: `*` (development) or your Vercel domain (production)

---

## Step 3: Deploy Action Handler (Railway/Render)

The action handler processes eligibility checks. We'll deploy to **Render** (free tier).

### 3.1 Prepare Code

On Windows, update `hasura/actions/handlers/.env`:

```env
# .env.production (create new file)
PORT=10000
HASURA_GRAPHQL_ENDPOINT=https://claimsight.hasura.app/v1/graphql
HASURA_GRAPHQL_ADMIN_SECRET=your-secure-admin-secret-here
```

**Files referenced**:
- `hasura/actions/handlers/src/index.ts` - Action handler implementation
- `hasura/actions/handlers/package.json` - Dependencies

### 3.2 Deploy to Render

1. Go to https://render.com → Sign up
2. Click **New** → **Web Service**
3. Connect GitHub repository (or manual deploy via Git)
4. Settings:
   - **Name**: `claimsight-actions`
   - **Root Directory**: `hasura/actions/handlers`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

5. Add environment variables:
   - `PORT`: `10000`
   - `HASURA_GRAPHQL_ENDPOINT`: `https://claimsight.hasura.app/v1/graphql`
   - `HASURA_GRAPHQL_ADMIN_SECRET`: `your-secure-admin-secret-here`

6. Click **Create Web Service**

**Deployment URL**: `https://claimsight-actions.onrender.com`

### 3.3 Update Hasura Actions

In Hasura Console → **Actions**:

1. Click `checkEligibility` action
2. Edit **Handler**: `https://claimsight-actions.onrender.com/checkEligibility`
3. Save

**Files referenced**:
- `hasura/metadata/actions.yaml` - Action definitions

---

## Step 4: Deploy Providers Subgraph (Render/Railway)

### 4.1 Prepare Subgraph

Update `app/server/.env.production`:

```env
PORT=10000
NODE_ENV=production
```

**Files referenced**:
- `app/server/src/index.ts` - Federated Provider type with @key
- `app/server/src/data/providers.ts` - Provider data
- `app/server/src/data/ratings.ts` - Rating data

### 4.2 Deploy to Render

1. Render dashboard → **New** → **Web Service**
2. Settings:
   - **Name**: `claimsight-providers-subgraph`
   - **Root Directory**: `app/server`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

3. Environment variables:
   - `PORT`: `10000`
   - `NODE_ENV`: `production`

4. Deploy

**Deployment URL**: `https://claimsight-providers-subgraph.onrender.com/graphql`

### 4.3 Verify Subgraph

Test the federation schema:

```bash
curl https://claimsight-providers-subgraph.onrender.com/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ _service { sdl } }"}'
```

Should return Provider type definition with `@key` directive.

---

## Step 5: Deploy Federation Gateway (Render/Railway)

### 5.1 Prepare Gateway

Update `app/gateway/.env.production`:

```env
PORT=10000
NODE_ENV=production
HASURA_GRAPHQL_ENDPOINT=https://claimsight.hasura.app/v1/graphql
HASURA_GRAPHQL_ADMIN_SECRET=your-secure-admin-secret-here
SUBGRAPH_URL=https://claimsight-providers-subgraph.onrender.com/graphql
GATEWAY_PORT=10000
```

**Files referenced**:
- `app/gateway/src/index.ts` - Gateway with IntrospectAndCompose
- `app/gateway/package.json`

### 5.2 Deploy to Render

1. Render → **New** → **Web Service**
2. Settings:
   - **Name**: `claimsight-gateway`
   - **Root Directory**: `app/gateway`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

3. Environment variables:
   - `PORT`: `10000`
   - `HASURA_GRAPHQL_ENDPOINT`: `https://claimsight.hasura.app/v1/graphql`
   - `HASURA_GRAPHQL_ADMIN_SECRET`: `your-secure-admin-secret-here`
   - `SUBGRAPH_URL`: `https://claimsight-providers-subgraph.onrender.com/graphql`
   - `GATEWAY_PORT`: `10000`

4. Deploy

**Gateway URL**: `https://claimsight-gateway.onrender.com/graphql`

### 5.3 Test Federation

Open Apollo Studio Sandbox: https://studio.apollographql.com/sandbox

1. Set endpoint: `https://claimsight-gateway.onrender.com/graphql`
2. Run test query:

```graphql
query TestFederation {
  # From Hasura subgraph
  members(limit: 3) {
    id
    first_name
    last_name
  }

  # From Providers subgraph (federated)
  providers {
    id
    name
    specialty
    rating
    ratingCount
    reviews {
      rating
      comment
    }
  }
}
```

---

## Step 6: Deploy React Frontend (Vercel)

### 6.1 Update Client Configuration

Edit `app/client/.env.production`:

```env
# Point to federation gateway
VITE_GRAPHQL_HTTP_URL=https://claimsight-gateway.onrender.com/graphql
VITE_GRAPHQL_WS_URL=wss://claimsight-gateway.onrender.com/graphql
VITE_HASURA_ADMIN_SECRET=your-secure-admin-secret-here
```

**Files referenced**:
- `app/client/src/apollo/client.ts` - Apollo Client configuration
- `app/client/src/App.tsx` - Main app component
- `app/client/vite.config.ts` - Vite configuration

### 6.2 Deploy to Vercel

#### Option A: GitHub Integration (Recommended)

1. Push code to GitHub
2. Go to https://vercel.com → **New Project**
3. Import your repository
4. Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `app/client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. Environment Variables:
   - `VITE_GRAPHQL_HTTP_URL`: `https://claimsight-gateway.onrender.com/graphql`
   - `VITE_GRAPHQL_WS_URL`: `wss://claimsight-gateway.onrender.com/graphql`
   - `VITE_HASURA_ADMIN_SECRET`: `your-secure-admin-secret-here`

6. Click **Deploy**

#### Option B: Vercel CLI (Windows)

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to client directory
cd app/client

# Deploy
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: claimsight
# - Directory: ./ (current)
# - Override settings? No

# Set environment variables
vercel env add VITE_GRAPHQL_HTTP_URL
# Paste: https://claimsight-gateway.onrender.com/graphql

vercel env add VITE_GRAPHQL_WS_URL
# Paste: wss://claimsight-gateway.onrender.com/graphql

vercel env add VITE_HASURA_ADMIN_SECRET
# Paste: your-secure-admin-secret-here

# Deploy to production
vercel --prod
```

**Deployment URL**: `https://claimsight.vercel.app`

### 6.3 Update CORS (Hasura Cloud)

1. Back to Hasura Cloud → Env vars
2. Update `HASURA_GRAPHQL_CORS_DOMAIN`:
   - Value: `https://claimsight.vercel.app`

---

## Step 7: Apollo Studio Integration (Optional)

Apollo Studio provides schema registry, federation monitoring, and query explorer.

### 7.1 Create Apollo Studio Account

1. Go to https://studio.apollographql.com
2. Sign up (free tier)
3. Create new graph: **ClaimSight**
4. Type: **Supergraph (Federation)**

### 7.2 Install Rover CLI

On Windows:

```bash
npm install -g @apollo/rover

# Authenticate
rover config auth
# Follow browser prompt
```

### 7.3 Publish Subgraph Schemas

```bash
cd C:\Users\YourName\github\medica\poc-has-apal

# Get graph ref from Apollo Studio (format: graph-name@variant)
# Example: claimsight@current

# Set environment variable
$env:APOLLO_GRAPH_REF="claimsight@current"
$env:APOLLO_KEY="service:claimsight:your-api-key-from-studio"

# Publish Hasura schema
# First, introspect Hasura
rover graph introspect https://claimsight.hasura.app/v1/graphql `
  --header "x-hasura-admin-secret:your-secure-admin-secret-here" `
  > hasura-schema.graphql

rover subgraph publish $env:APOLLO_GRAPH_REF `
  --name hasura `
  --schema hasura-schema.graphql `
  --routing-url https://claimsight.hasura.app/v1/graphql

# Publish Providers subgraph
rover graph introspect https://claimsight-providers-subgraph.onrender.com/graphql `
  > providers-schema.graphql

rover subgraph publish $env:APOLLO_GRAPH_REF `
  --name providers `
  --schema providers-schema.graphql `
  --routing-url https://claimsight-providers-subgraph.onrender.com/graphql
```

### 7.4 View in Apollo Studio

1. Open Apollo Studio → Your graph
2. Navigate to **Schema** tab
3. See federated schema with both subgraphs!
4. Use **Explorer** tab to run queries

**Advanced Features** (Free tier):
- Schema changelog
- Field usage analytics
- Query performance tracking
- Schema checks (with CI/CD)

---

## Step 8: Testing the Full Stack

### 8.1 Health Checks

Test each service:

```bash
# Gateway health
curl https://claimsight-gateway.onrender.com/health

# Action handler health
curl https://claimsight-actions.onrender.com/health

# Providers subgraph health
curl https://claimsight-providers-subgraph.onrender.com/health
```

### 8.2 End-to-End Query

Open your deployed frontend: `https://claimsight.vercel.app`

1. Navigate to **Provider Ratings** page
2. Should see providers with ratings (from federation)
3. Navigate to **Claims** page
4. Should see claims with member data (from Hasura)
5. Test eligibility check action

### 8.3 Federation Query Test

Apollo Studio Sandbox → Connect to gateway:

```graphql
query CompleteDemo {
  # Hasura data
  members(limit: 2) {
    id
    first_name
    last_name
    dob
    claims {
      id
      status
      cpt
      billed_amount
    }
  }

  # Federated Provider data
  providers {
    id
    name
    specialty
    npi
    rating
    ratingCount
    reviews {
      rating
      comment
      date
    }
  }
}
```

---

## Architecture Diagram (Final Cloud Setup)

```
┌─────────────────────────────────────────────────────────┐
│  User Browser                                           │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  Vercel Edge Network (claimsight.vercel.app)            │
│  - React App (Vite)                                     │
│  - Apollo Client                                        │
└────────────────┬────────────────────────────────────────┘
                 │ GraphQL queries
                 ▼
┌─────────────────────────────────────────────────────────┐
│  Render: Federation Gateway (:10000)                    │
│  - IntrospectAndCompose                                 │
│  - Entity Resolution                                    │
│  - Query Planning                                       │
└───────┬────────────────────────┬────────────────────────┘
        │                        │
        ▼                        ▼
┌───────────────────┐   ┌────────────────────────────────┐
│ Hasura Cloud      │   │ Render: Providers Subgraph     │
│ (hasura.app)      │   │ (:10000)                       │
│                   │   │                                │
│ • members         │   │ Provider (@key: "id")          │
│ • claims          │   │ • rating                       │
│ • eligibility_    │   │ • ratingCount                  │
│   checks          │   │ • reviews                      │
│ • notes           │   │                                │
│ • provider_       │   │ Entity Resolution via          │
│   records         │   │ __resolveReference             │
│                   │   │                                │
│ Federation        │   └────────────────────────────────┘
│ enabled!          │
└────────┬──────────┘
         │
         ▼
┌────────────────────┐
│ Neon PostgreSQL    │
│ (neon.tech)        │
│                    │
│ Free tier:         │
│ - 3GB storage      │
│ - Serverless       │
└────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Render: Action Handler (:10000)                        │
│  - checkEligibility webhook                             │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Apollo Studio (Optional)                               │
│  - Schema Registry                                      │
│  - Federation Monitoring                                │
│  - Query Explorer                                       │
└─────────────────────────────────────────────────────────┘
```

---

## Troubleshooting (Windows-Specific)

### Issue: npm install fails with permission errors

**Solution**: Run PowerShell as Administrator

```powershell
# Or set execution policy
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### Issue: hasura CLI not found

**Solution**: Add npm global bin to PATH

```powershell
# Find npm global path
npm config get prefix

# Add to PATH (example):
# C:\Users\YourName\AppData\Roaming\npm
```

### Issue: Git not pushing to remote

**Solution**: Authenticate with GitHub CLI or SSH

```bash
# GitHub CLI (recommended for Windows)
# Download from: https://cli.github.com/

gh auth login
```

### Issue: CORS errors in browser

**Solution**: Check Hasura CORS domain setting

1. Hasura Cloud → Env vars
2. `HASURA_GRAPHQL_CORS_DOMAIN` = `https://claimsight.vercel.app`
3. For development, use: `*`

### Issue: Gateway can't reach subgraphs

**Solution**: Verify all Render services are awake

- Free tier services sleep after 15 minutes inactivity
- First request takes 30-60 seconds to wake
- Check Render dashboard → Service logs

### Issue: Environment variables not loading

**Solution**:

For Render:
1. Dashboard → Service → Environment
2. Manually add each variable
3. Redeploy

For Vercel:
```bash
vercel env pull
# Creates .env.local with all env vars
```

---

## Cost Breakdown (Free Tier Limits)

| Service | Free Tier | Limits | Upgrade Cost |
|---------|-----------|--------|--------------|
| **Neon** | ✅ Free forever | 3GB storage, 10GB transfer/mo | $19/mo (Launch) |
| **Hasura Cloud** | ✅ Free forever | 1 project, 60 req/min | $99/mo (Standard) |
| **Render** | ✅ Free | 750 hrs/mo, sleeps after 15min | $7/mo (per service) |
| **Vercel** | ✅ Free forever | 100GB bandwidth/mo | $20/mo (Pro) |
| **Apollo Studio** | ✅ Free forever | 10M queries/mo | $0 (Explorer is free) |

**Total monthly cost**: **$0** for development/learning!

---

## Advanced Topics

### Monitoring with Apollo Studio

1. Add Apollo Studio integration to gateway (`app/gateway/src/index.ts`):

```typescript
import { ApolloServerPluginUsageReporting } from '@apollo/server/plugin/usageReporting';

const server = new ApolloServer({
  gateway,
  plugins: [
    ApolloServerPluginUsageReporting({
      sendVariableValues: { all: true },
    }),
  ],
});
```

2. Add environment variable to Render (Gateway service):
   - `APOLLO_KEY`: `service:claimsight:your-api-key`
   - `APOLLO_GRAPH_REF`: `claimsight@current`

3. Redeploy gateway

4. View metrics in Apollo Studio → **Insights** tab

### CI/CD with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloud

on:
  push:
    branches: [main]

jobs:
  deploy-gateway:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - name: Deploy to Render
        run: |
          curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK_GATEWAY }}

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        run: |
          npx vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

### Schema Checks with Rover

Before deploying schema changes:

```bash
# Check if schema change breaks existing queries
rover subgraph check claimsight@current `
  --name providers `
  --schema app/server/schema.graphql
```

Apollo Studio will analyze and report breaking changes!

---

## Next Steps

1. ✅ Deploy all services to cloud (Neon, Hasura, Render, Vercel)
2. ✅ Test federation end-to-end
3. ✅ Set up Apollo Studio monitoring
4. ⭐ Add custom domain to Vercel
5. ⭐ Set up GitHub Actions for CI/CD
6. ⭐ Implement schema versioning with Rover
7. ⭐ Add authentication (Auth0, Clerk, etc.)
8. ⭐ Monitor query performance in Apollo Studio

---

## Resources

- 📖 [Neon Docs](https://neon.tech/docs/introduction)
- 📖 [Hasura Cloud Docs](https://hasura.io/docs/latest/hasura-cloud/overview/)
- 📖 [Render Docs](https://render.com/docs)
- 📖 [Vercel Docs](https://vercel.com/docs)
- 📖 [Apollo Studio Docs](https://www.apollographql.com/docs/studio/)
- 📖 [Rover CLI Docs](https://www.apollographql.com/docs/rover/)

---

**Congratulations!** 🎉 You've deployed a complete federated GraphQL stack to the cloud using only free tiers!
