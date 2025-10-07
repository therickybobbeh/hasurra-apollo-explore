# Hasura Cloud Deployment Guide

Deploy ClaimSight's database layer to Hasura Cloud with PostgreSQL.

---

## 📋 Overview

**Hasura Cloud** is a fully managed service that hosts your Hasura GraphQL Engine with built-in PostgreSQL, monitoring, and security features.

**What gets deployed:**
- ✅ Hasura GraphQL Engine (auto-updates)
- ✅ PostgreSQL database (auto-provisioned, managed)
- ✅ All database tables, relationships, permissions
- ✅ Hasura Actions (eligibility check)

**What you'll get:**
- GraphQL endpoint: `https://your-project.hasura.app/v1/graphql`
- Console: `https://cloud.hasura.io/project/{PROJECT_ID}/console`
- PostgreSQL connection string (for migrations)

**Time to complete:** 10-15 minutes

**Cost:** Free tier (60 requests/min, 100MB data transfer/mo)

---

## 🎯 Prerequisites

- [x] GitHub or GitLab account
- [x] Hasura Cloud account (sign up at https://cloud.hasura.io/)
- [x] Node.js 18+ installed
- [x] Hasura CLI (will install locally)
  ```bash
  # Install locally in your project
  npm install --save-dev hasura-cli

  # Or use npx directly (no installation needed)
  npx hasura-cli version
  ```

---

## 📦 Step 1: Create Hasura Cloud Project

### 1.1 Sign Up and Create Project

1. **Visit** https://cloud.hasura.io/
2. **Sign up** using GitHub, GitLab, or email
3. **Click** "New Project"
4. **Choose region** (select closest to your users):
   - US East (recommended for USA)
   - EU West (recommended for Europe)
   - Asia Pacific (recommended for Asia)
5. **Click** "Create Project"

Wait ~30 seconds for project to provision.

### 1.2 Note Your Project Details

Once created, you'll see:

- **GraphQL Endpoint:** `https://your-project-name.hasura.app/v1/graphql`
- **Admin Secret:** Automatically generated (shown once - save it!)
- **Project ID:** In the URL `cloud.hasura.io/project/{PROJECT_ID}`

**⚠️ Save your admin secret immediately!** Store in password manager or `.env` file:

```bash
# .env.cloud
HASURA_GRAPHQL_ENDPOINT=https://your-project-name.hasura.app/v1/graphql
HASURA_GRAPHQL_ADMIN_SECRET=your-admin-secret-here
```

---

## 🗄️ Step 2: Connect to Database

Hasura Cloud auto-provisions a PostgreSQL database for you.

### 2.1 Get Database URL

1. In Hasura Cloud Console, click **"Data"** tab
2. You'll see database already connected as **"default"**
3. Click **"Manage"** → **"Connection Settings"**
4. Copy **Database URL**: `postgres://user:password@host:5432/database`

### 2.2 Store Database URL Locally

```bash
# .env.cloud
DATABASE_URL=postgres://user:password@host:5432/database?sslmode=require
```

**Note:** Always use `?sslmode=require` for production databases.

---

## 🚀 Step 3: Apply Migrations and Metadata

Now push your local database schema to Hasura Cloud.

### 3.1 Initialize Hasura Project (if not already done)

```bash
# In your project root
cd /path/to/poc-has-apal

# Initialize Hasura configuration
npx hasura-cli init hasura --endpoint https://your-project-name.hasura.app
```

This creates `hasura/` directory with:
- `migrations/` - Database schema changes
- `metadata/` - Hasura configuration (permissions, relationships, actions)
- `seeds/` - Sample data

### 3.2 Configure Hasura CLI

Edit `hasura/config.yaml`:

```yaml
version: 3
endpoint: https://your-project-name.hasura.app
admin_secret: your-admin-secret-here
metadata_directory: metadata
migrations_directory: migrations
seeds_directory: seeds
```

**Or use environment variables:**

```bash
export HASURA_GRAPHQL_ENDPOINT=https://your-project-name.hasura.app
export HASURA_GRAPHQL_ADMIN_SECRET=your-admin-secret
```

### 3.3 Apply Migrations

Create database tables and RLS policies:

```bash
# Navigate to hasura directory
cd hasura

# Apply all migrations
npx hasura-cli migrate apply --database-name default

# Verify
npx hasura-cli migrate status --database-name default
```

**Expected output:**
```
INFO migrations applied
VERSION        NAME                           SOURCE STATUS  DATABASE STATUS
1234567890123  init                          Present Present
1234567890124  create_members_table          Present Present
1234567890125  create_claims_table           Present Present
1234567890126  create_rls_policies           Present Present
```

### 3.4 Apply Metadata

Configure Hasura (relationships, permissions, actions):

```bash
# Apply metadata
npx hasura-cli metadata apply

# Verify
npx hasura-cli metadata diff
```

**Expected output:** `✔ Metadata is consistent`

### 3.5 Apply Seeds (Optional)

Load sample data for testing:

```bash
# Apply seed data
npx hasura-cli seed apply --database-name default

# Or apply specific seed file
npx hasura-cli seed apply --database-name default --file seeds/default/members.sql
```

---

## ✅ Step 4: Verify Deployment

### 4.1 Open Hasura Console

Visit your Hasura Cloud project and click **"Launch Console"** or go directly to:
```
https://cloud.hasura.io/project/{PROJECT_ID}/console
```

### 4.2 Test GraphQL Queries

In the **API Explorer** tab, run test queries:

#### Query 1: List Members
```graphql
query GetMembers {
  members(limit: 5) {
    id
    first_name
    last_name
    dob
  }
}
```

**Expected:** List of members from seed data.

#### Query 2: Get Member with Claims
```graphql
query GetMemberWithClaims {
  members(limit: 1) {
    id
    first_name
    last_name
    claims {
      id
      status
      cpt
      billed_amount
      service_date
    }
  }
}
```

**Expected:** Member with nested claims array.

#### Query 3: Test Hasura Action
```graphql
mutation CheckEligibility {
  checkEligibility(input: {
    memberId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
    serviceDate: "2024-01-15"
    cpt: "99213"
  }) {
    eligible
    reason
    coverageDetails {
      planName
      copay
    }
  }
}
```

**Expected:** Eligibility response (may fail if action handler not deployed yet).

---

## 🔐 Step 5: Configure Security

### 5.1 Rotate Admin Secret (Recommended)

Don't use the default admin secret in production:

1. In Hasura Cloud Console → **Project Settings**
2. Click **"Env Vars"**
3. Find `HASURA_GRAPHQL_ADMIN_SECRET`
4. Click **"Edit"** → Generate new secret
5. Update local `.env.cloud` file with new secret

### 5.2 Configure JWT Authentication

For production, replace admin secret with JWT:

1. Generate JWT secret:
   ```bash
   openssl rand -base64 32
   ```

2. Add environment variable in Hasura Cloud:
   - Go to **Project Settings** → **Env Vars**
   - Click **"+ New Env Var"**
   - Key: `HASURA_GRAPHQL_JWT_SECRET`
   - Value:
     ```json
     {
       "type": "HS256",
       "key": "your-256-bit-secret-from-step-1"
     }
     ```
   - Click **"Add"**

3. Restart your project (automatic after env var change)

See [Challenge 15: JWT Authentication](../../DOCUMENTS/CHALLENGES.md#task-21-jwt-authentication-setup) for complete setup.

### 5.3 Set Query Limits

Protect against query depth attacks:

1. Go to **Project Settings** → **Env Vars**
2. Add these environment variables:

| Key | Value | Purpose |
|-----|-------|---------|
| `HASURA_GRAPHQL_QUERY_DEPTH_LIMIT` | `5` | Max query nesting depth |
| `HASURA_GRAPHQL_ENABLED_LOG_TYPES` | `startup,http-log,webhook-log` | Structured logging |
| `HASURA_GRAPHQL_ENABLE_CONSOLE` | `true` | Enable console (disable in prod) |
| `HASURA_GRAPHQL_DEV_MODE` | `false` | Production mode |

### 5.4 Configure Allowed Origins (CORS)

Restrict which domains can query your API:

1. Go to **Project Settings** → **Env Vars**
2. Add `HASURA_GRAPHQL_CORS_DOMAIN`:
   ```
   https://your-frontend.vercel.app, http://localhost:3000
   ```

---

## 🔗 Step 6: Configure Hasura Actions Handler

Hasura Actions require an external webhook. You have two options:

### Option A: Deploy to Render.com (Recommended)

See [../render/actions-handler-guide.md](../render/actions-handler-guide.md) for deploying the action handler.

Quick version:
```bash
# Push to GitHub
git add .
git commit -m "Add action handler"
git push

# On Render.com:
# 1. New Web Service
# 2. Connect GitHub repo
# 3. Root directory: hasura/actions/handlers
# 4. Build: npm install
# 5. Start: npm start
# 6. Port: 3001
```

### Option B: Use Hasura Cloud Functions (Enterprise)

Available on Hasura Cloud Enterprise plan only.

### 6.1 Update Action Handler URL

1. In Hasura Console → **Actions** tab
2. Click **"checkEligibility"** action
3. Update **Handler URL** to your deployed handler:
   ```
   https://your-action-handler.onrender.com/eligibility
   ```
4. Click **"Save"**

### 6.2 Test Action Again

```graphql
mutation TestAction {
  checkEligibility(input: {
    memberId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
    serviceDate: "2024-01-15"
    cpt: "99213"
  }) {
    eligible
    reason
    coverageDetails {
      planName
      copay
      deductibleRemaining
    }
  }
}
```

**Expected:** Real eligibility response from deployed handler.

---

## 📊 Step 7: Enable Monitoring

Hasura Cloud includes built-in monitoring.

### 7.1 View Metrics

1. In Hasura Cloud Console → **Monitoring** tab
2. View:
   - **Request Rate:** Queries per second
   - **Error Rate:** Failed queries
   - **Latency:** P50, P95, P99 response times
   - **Active Subscriptions:** WebSocket connections

### 7.2 Set Up Alerts (Pro Plan)

Available on Pro plan and above:

1. Go to **Project Settings** → **Alerts**
2. Click **"New Alert"**
3. Configure:
   - Trigger: Error rate > 5%
   - Notification: Email or Slack
   - Cooldown: 5 minutes

### 7.3 View Query Analytics (Pro Plan)

1. Go to **Monitoring** → **Operations**
2. See:
   - Most executed operations
   - Slowest queries
   - Operations by client name

---

## 🔄 Step 8: Set Up Continuous Deployment

Automate migrations and metadata updates using GitHub Actions.

### 8.1 Create GitHub Action Workflow

Create `.github/workflows/hasura-deploy.yml`:

```yaml
name: Deploy to Hasura Cloud

on:
  push:
    branches:
      - main
    paths:
      - 'hasura/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Apply Migrations
        env:
          HASURA_GRAPHQL_ENDPOINT: ${{ secrets.HASURA_GRAPHQL_ENDPOINT }}
          HASURA_GRAPHQL_ADMIN_SECRET: ${{ secrets.HASURA_GRAPHQL_ADMIN_SECRET }}
        run: |
          cd hasura
          npx hasura-cli migrate apply --database-name default

      - name: Apply Metadata
        env:
          HASURA_GRAPHQL_ENDPOINT: ${{ secrets.HASURA_GRAPHQL_ENDPOINT }}
          HASURA_GRAPHQL_ADMIN_SECRET: ${{ secrets.HASURA_GRAPHQL_ADMIN_SECRET }}
        run: |
          cd hasura
          npx hasura-cli metadata apply
```

### 8.2 Add GitHub Secrets

1. Go to GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **"New repository secret"**
3. Add:
   - `HASURA_GRAPHQL_ENDPOINT`: Your Hasura Cloud URL
   - `HASURA_GRAPHQL_ADMIN_SECRET`: Your admin secret

Now migrations and metadata auto-deploy on every push to `main`!

---

## ✅ Success Checklist

- [ ] Hasura Cloud project created
- [ ] PostgreSQL database connected
- [ ] Migrations applied successfully
- [ ] Metadata applied successfully
- [ ] Seed data loaded (optional)
- [ ] Test queries work in console
- [ ] Admin secret rotated
- [ ] JWT authentication configured (for production)
- [ ] Query depth limit set
- [ ] CORS configured for frontend
- [ ] Action handler deployed and configured
- [ ] Monitoring enabled
- [ ] CI/CD workflow set up (optional)

---

## 🚀 Next Steps

### Quick Start Path (No Federation)
Deploy your React frontend to connect directly to Hasura:
- **Next:** [Vercel Deployment](../vercel/README.md)

### Full Federation Path (Recommended)
Set up Apollo Gateway with custom subgraphs:
- **Next:** [Apollo GraphOS Setup](../apollo-graphos/README.md)
- Then: [Render.com Deployment](../render/README.md) for gateway + subgraphs

---

## 🔧 Troubleshooting

### Issue: Migrations fail with "relation already exists"

**Cause:** Database already has tables from previous deployment.

**Solution:**
```bash
# Reset database (WARNING: Deletes all data!)
npx hasura-cli migrate apply --down all --database-name default

# Re-apply migrations
npx hasura-cli migrate apply --database-name default
```

### Issue: "x-hasura-admin-secret missing or incorrect"

**Cause:** Admin secret mismatch.

**Solution:**
1. Check admin secret in Hasura Cloud Console → **Project Settings** → **Env Vars**
2. Update local `.env.cloud` file
3. Retry command with correct secret

### Issue: Action handler returns 404

**Cause:** Action handler not deployed or incorrect URL.

**Solution:**
1. Verify handler is deployed and accessible: `curl https://your-handler.onrender.com/eligibility`
2. Update handler URL in Hasura Console → **Actions**
3. Test action again

### Issue: CORS error from frontend

**Cause:** Frontend domain not in allowed origins.

**Solution:**
1. Add frontend domain to `HASURA_GRAPHQL_CORS_DOMAIN` in Hasura Cloud
2. Include `http://localhost:3000` for local development
3. Restart project (automatic after env var change)

### Issue: Query depth error even after setting limit

**Cause:** Environment variable not applied.

**Solution:**
1. Verify `HASURA_GRAPHQL_QUERY_DEPTH_LIMIT=5` in Project Settings → Env Vars
2. Ensure project restarted after adding env var
3. Test with deep query (should fail with depth limit error)

---

## 📚 Resources

- [Hasura Cloud Documentation](https://hasura.io/docs/latest/graphql/cloud/index.html)
- [Hasura CLI Reference](https://hasura.io/docs/latest/graphql/core/hasura-cli/index.html)
- [Hasura Migrations Guide](https://hasura.io/docs/latest/graphql/core/migrations/index.html)
- [Challenge 15: Security Hardening](../../DOCUMENTS/CHALLENGES.md#challenge-15--security-hardening--hipaa-compliance)

---

**Hasura Cloud deployment complete!** 🎉

Your GraphQL API is now live at `https://your-project.hasura.app/v1/graphql`
