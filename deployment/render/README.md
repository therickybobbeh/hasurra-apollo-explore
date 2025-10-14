# Render.com Full Stack Deployment Guide

Deploy the entire ClaimSight stack (gateway, subgraphs, and frontend) to Render.com using **100% free tier**.

---

## 📋 Overview

**Render.com** is a unified cloud platform for deploying web services, databases, static sites, and cron jobs with simple configuration.

**What gets deployed:**
- ✅ Apollo Gateway (Node.js web service - **FREE**)
- ✅ Providers subgraph (Node.js web service - **FREE**)
- ✅ Action handlers (Node.js web service - **FREE**)
- ✅ React frontend (static site - **FREE**)
- ✅ PostgreSQL database via Hasura Cloud (included **FREE** with Hasura!)

**Time to complete:** 20-30 minutes (or 5 minutes with Blueprint)

**Cost: $0/month** ⭐

**Free Tier Includes:**
- Render.com: 750 hours/month of web services (services sleep after 15 min inactivity)
- Hasura Cloud: PostgreSQL database + GraphQL engine (60 req/min, 100MB storage)

**Perfect for:**
- ✅ Learning and temporary projects
- ✅ MVPs and demos
- ✅ Portfolio projects

---

## 🎯 Prerequisites

- [x] Hasura Cloud account with project created ([guide](../hasura-cloud/README.md))
- [x] Hasura Cloud database connection string (from Hasura Console)
- [x] GitHub account with repo pushed
- [x] Render.com account (sign up at https://render.com/ - **no credit card required**)

---

## 🚀 Quick Start: Blueprint Deployment

**Deploy entire stack in 5 minutes** using Render Blueprint (Infrastructure as Code).

**Prerequisites:** Hasura Cloud project already created ([guide](../hasura-cloud/README.md))

### Step 1: Create render.yaml

Create `render.yaml` in project root:

```yaml
# Render.com Blueprint for ClaimSight (100% Free Tier)
services:
  # Apollo Gateway
  - type: web
    name: claimsight-gateway
    runtime: node
    region: oregon
    plan: free # 750 hours/month (sleeps after 15 min)
    buildCommand: cd app/gateway && npm install
    startCommand: cd app/gateway && npm start
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 4000
      - key: HASURA_ENDPOINT
        sync: false # Set manually from Hasura Cloud
      - key: HASURA_ADMIN_SECRET
        sync: false # Set manually from Hasura Cloud
      - key: PROVIDERS_SUBGRAPH_URL
        fromService:
          type: web
          name: claimsight-providers
          property: host

  # Providers Subgraph
  - type: web
    name: claimsight-providers
    runtime: node
    region: oregon
    plan: free # 750 hours/month (sleeps after 15 min)
    buildCommand: cd app/server && npm install
    startCommand: cd app/server && npm start
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3002

  # Action Handlers
  - type: web
    name: claimsight-actions
    runtime: node
    region: oregon
    plan: free # 750 hours/month (sleeps after 15 min)
    buildCommand: cd hasura/actions/handlers && npm install
    startCommand: cd hasura/actions/handlers && npm start
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3001
      - key: DATABASE_URL
        sync: false # Set manually from Hasura Cloud database connection string

  # React Frontend
  - type: web
    name: claimsight-frontend
    runtime: static
    region: oregon
    plan: free # Unlimited static sites
    buildCommand: cd app/client && npm install && npm run build
    staticPublishPath: app/client/dist
    headers:
      - path: /*
        name: X-Frame-Options
        value: DENY
      - path: /*
        name: X-Content-Type-Options
        value: nosniff
    envVars:
      - key: VITE_GRAPHQL_ENDPOINT
        fromService:
          type: web
          name: claimsight-gateway
          property: host
```

### Step 2: Deploy Blueprint

1. Push `render.yaml` to GitHub:
   ```bash
   git add render.yaml
   git commit -m "Add Render blueprint"
   git push
   ```

2. Go to https://dashboard.render.com/
3. Click **"New +"** → **"Blueprint"**
4. Connect your GitHub repository
5. Render auto-detects `render.yaml`
6. Click **"Apply"**
7. Wait 3-5 minutes for all services to deploy

### Step 3: Set Environment Variables

After deployment, you need to set environment variables from Hasura Cloud:

1. Get your Hasura Cloud details:
   - Go to https://cloud.hasura.io/
   - Open your project
   - Copy **GraphQL Endpoint**: `https://your-project.hasura.app/v1/graphql`
   - Copy **Admin Secret** from Project Settings
   - Go to **Data** tab → Click database → **Connection Settings** → Copy **Connection String**

2. In Render dashboard, update each service:

**For claimsight-gateway:**
   - Click service → **Environment** tab
   - Set `HASURA_ENDPOINT`: `https://your-project.hasura.app/v1/graphql`
   - Set `HASURA_ADMIN_SECRET`: `your-admin-secret`

**For claimsight-actions:**
   - Click service → **Environment** tab
   - Set `DATABASE_URL`: `postgres://user:password@host:5432/database?sslmode=require`

3. Services will auto-redeploy with new environment variables.

✅ **Done!** Your entire stack is live on 100% free tier.

---

## 📚 Manual Deployment (Detailed Steps)

If you prefer manual control or want to understand each component:

### Part 1: Set Up PostgreSQL Database (Hasura Cloud)

**We're using Hasura Cloud's FREE PostgreSQL database** instead of Render's paid database ($7/mo).

#### 1.1 Create Hasura Cloud Project

Follow the [Hasura Cloud Deployment Guide](../hasura-cloud/README.md) to:
1. Create a free Hasura Cloud account
2. Create a new project (includes free PostgreSQL database)
3. Apply migrations and metadata
4. Get your database connection string

#### 1.2 Get Connection String

1. Go to https://cloud.hasura.io/
2. Open your project
3. Go to **Data** tab → Click database name
4. Click **"Manage"** → **"Connection Settings"**
5. Copy **Database URL**: `postgres://user:password@host:5432/database`
6. Save to `.env.render`:
   ```bash
   DATABASE_URL=postgres://user:password@host:5432/database?sslmode=require
   ```

**Note:** Always use `?sslmode=require` for production databases.

---

### Part 2: Deploy Providers Subgraph

#### 2.1 Create Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect GitHub repository
3. Configure:
   - **Name**: `claimsight-providers`
   - **Region**: Oregon
   - **Branch**: `main`
   - **Root Directory**: `app/server`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (750 hours/mo, sleeps after 15 min inactivity)

#### 2.2 Set Environment Variables

Add in **Environment** tab:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3002` |

#### 2.3 Add Health Check

- **Health Check Path**: `/health`

Add to `app/server/src/index.ts`:
```typescript
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});
```

#### 2.4 Deploy

Click **"Create Web Service"**

Wait ~5 minutes for first deploy.

Your subgraph is now at: `https://claimsight-providers.onrender.com`

---

### Part 3: Deploy Action Handlers

#### 3.1 Create Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect same GitHub repo
3. Configure:
   - **Name**: `claimsight-actions`
   - **Region**: Oregon
   - **Branch**: `main`
   - **Root Directory**: `hasura/actions/handlers`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

#### 3.2 Set Environment Variables

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3001` |
| `DATABASE_URL` | (Copy from Hasura Cloud database connection string) |

#### 3.3 Deploy

Click **"Create Web Service"**

Action handler is now at: `https://claimsight-actions.onrender.com`

---

### Part 4: Deploy Apollo Gateway

#### 4.1 Create Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect same GitHub repo
3. Configure:
   - **Name**: `claimsight-gateway`
   - **Region**: Oregon
   - **Branch**: `main`
   - **Root Directory**: `app/gateway`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (750 hours/mo, sleeps after 15 min inactivity)

#### 4.2 Set Environment Variables

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `4000` |
| `HASURA_ENDPOINT` | `https://your-project.hasura.app/v1/graphql` |
| `HASURA_ADMIN_SECRET` | `your-hasura-secret` |
| `PROVIDERS_SUBGRAPH_URL` | `https://claimsight-providers.onrender.com` |

**Or use Apollo GraphOS:**

| Key | Value |
|-----|-------|
| `APOLLO_KEY` | `service:your-graph:your-key` |
| `APOLLO_GRAPH_REF` | `your-graph@main` |

#### 4.3 Add Health Check

- **Health Check Path**: `/health`

Add to `app/gateway/src/index.ts`:
```typescript
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', gateway: 'ready' });
});
```

#### 4.4 Deploy

Click **"Create Web Service"**

Gateway is now at: `https://claimsight-gateway.onrender.com`

---

### Part 5: Deploy React Frontend

#### 5.1 Create Static Site

1. Click **"New +"** → **"Static Site"**
2. Connect same GitHub repo
3. Configure:
   - **Name**: `claimsight-frontend`
   - **Branch**: `main`
   - **Root Directory**: `app/client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

#### 5.2 Set Environment Variables

| Key | Value |
|-----|-------|
| `VITE_GRAPHQL_ENDPOINT` | `https://claimsight-gateway.onrender.com/graphql` |

**Don't set admin secret in frontend!** Use JWT authentication in production.

#### 5.3 Add Security Headers

In **Headers** section, add:

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

#### 5.4 Deploy

Click **"Create Static Site"**

Frontend is now at: `https://claimsight-frontend.onrender.com`

---

## ✅ Step 3: Verify Full Stack

### 3.1 Test Each Service

**Database:**
```bash
psql $DATABASE_URL -c "SELECT COUNT(*) FROM members;"
```
Expected: Member count from seed data.

**Providers Subgraph:**
```bash
curl https://claimsight-providers.onrender.com/health
```
Expected: `{"status":"healthy"}`

**Action Handlers:**
```bash
curl https://claimsight-actions.onrender.com/health
```
Expected: `{"status":"healthy"}`

**Gateway:**
```bash
curl -X POST https://claimsight-gateway.onrender.com/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}'
```
Expected: `{"data":{"__typename":"Query"}}`

**Frontend:**

Visit `https://claimsight-frontend.onrender.com` in browser.
Expected: App loads, members list displays.

### 3.2 Test Federation

```bash
curl -X POST https://claimsight-gateway.onrender.com/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { providers { id name rating } }"
  }'
```

Expected: Providers with ratings (federated data from both subgraphs).

---

## 🔐 Step 4: Security Hardening

### 4.1 Rotate Database Password

1. Go to database dashboard
2. Click **"Settings"** → **"Rotate Password"**
3. Update `DATABASE_URL` in all services using the database

### 4.2 Restrict Database Access (Optional)

For production, limit database connections:

1. Go to database dashboard
2. Click **"Settings"** → **"IP Allow List"**
3. Add only your service IPs (available in each service's dashboard)

### 4.3 Enable JWT Authentication

Implement JWT authentication for production use.

Remove admin secret from frontend environment variables.

### 4.4 Configure CORS

In gateway, add CORS middleware:

```typescript
import cors from 'cors';

app.use(cors({
  origin: [
    'https://claimsight-frontend.onrender.com',
    'http://localhost:3000', // For development
  ],
  credentials: true,
}));
```

---

## 🔄 Step 5: Set Up CI/CD

Render automatically redeploys on git push!

### 5.1 Configure Auto-Deploy

Already enabled by default. Any push to `main` branch triggers redeployment of all services.

### 5.2 Add Deploy Hooks (Optional)

For manual or external triggers:

1. Go to service dashboard
2. Click **"Settings"** → **"Deploy Hook"**
3. Copy webhook URL
4. Trigger deployment via HTTP POST:
   ```bash
   curl -X POST https://api.render.com/deploy/srv-xxx?key=yyy
   ```

### 5.3 Set Up Staging Environment

Create a staging branch:

```bash
git checkout -b staging
git push origin staging
```

In Render dashboard, add new services pointing to `staging` branch.

Now you have:
- `main` → Production (`https://claimsight-gateway.onrender.com`)
- `staging` → Staging (`https://claimsight-gateway-staging.onrender.com`)

---

## 📊 Step 6: Monitoring and Logs

### 6.1 View Service Logs

1. Click on any service
2. Go to **"Logs"** tab
3. View real-time logs
4. Filter by:
   - Time range
   - Log level (info, error, warn)
   - Search text

### 6.2 Set Up Log Alerts (Paid Plans)

Available on Team plan ($19/user/month):

1. Go to **"Notifications"** in service settings
2. Add **"Log-based Alert"**
3. Configure:
   - Pattern: `ERROR` or custom regex
   - Notification: Email or Slack
   - Cooldown: 5 minutes

### 6.3 Monitor Performance

Render provides built-in metrics:
- **CPU usage**: % of allocated CPU
- **Memory usage**: MB used
- **Response time**: P50, P95, P99
- **Request rate**: Requests/second

---

## 💰 Step 7: Cost Summary

### 7.1 Current Costs (100% Free Tier)

| Service | Plan | Cost |
|---------|------|------|
| PostgreSQL (Hasura Cloud) | Free | $0 |
| Gateway | Free | $0 |
| Providers Subgraph | Free | $0 |
| Action Handlers | Free | $0 |
| Frontend | Free | $0 |
| **Total** | | **$0/month** ⭐ |

**Free Tier Limits:**
- Hasura Cloud: 60 req/min, 100MB storage, 100MB data transfer/mo
- Render.com: 750 hours/month of web services per service
- Services sleep after 15 minutes of inactivity (30s wake-up time)

### 7.2 Free Tier Best Practices

**Perfect for:**
- ✅ Learning and temporary projects (lasting weeks to months)
- ✅ MVPs and demos
- ✅ Portfolio projects
- ✅ Development/staging environments

**Not ideal for:**
- ❌ High-traffic production apps (>60 req/min)
- ❌ Large datasets (>100MB)
- ❌ Apps requiring instant response (no cold starts)

### 7.3 Upgrading to Paid Tier (If Needed)

If you outgrow the free tier:
- Render.com Starter plan: $7/mo per service (always-on, no sleep)
- Hasura Cloud Pro: $99/mo (higher limits, SLA)
- Total estimated: $28-50/mo for always-on production

---

## ✅ Success Checklist

- [ ] Hasura Cloud project created with PostgreSQL database
- [ ] Database migrations and metadata applied via Hasura
- [ ] Providers subgraph deployed and health check passing
- [ ] Action handlers deployed and accessible
- [ ] Apollo Gateway deployed with correct env vars
- [ ] React frontend deployed and loading
- [ ] All services can communicate (no CORS/network errors)
- [ ] Federation working (Provider with ratings query succeeds)
- [ ] Security headers configured
- [ ] JWT authentication enabled (no admin secret in frontend)
- [ ] Auto-deploy configured
- [ ] Logs and monitoring set up
- [ ] Custom domain configured (optional)

---

## 🚀 Next Steps

### Your full stack is live!

**What you have:**
- ✅ Complete federated GraphQL API
- ✅ Production database with backups
- ✅ React frontend with CDN
- ✅ Automatic deployments
- ✅ Health monitoring

**Optional enhancements:**
1. **Add custom domain** (see Render docs)
2. **Set up Apollo GraphOS** for schema management ([guide](../apollo-graphos/README.md))
3. **Enable Hasura Cloud** for better Hasura management ([guide](../hasura-cloud/README.md))
4. **Add monitoring** (Sentry, DataDog, New Relic)
5. **Complete security hardening** (implement comprehensive security best practices)

---

## 🔧 Troubleshooting

### Issue: Service won't start - "Build failed"

**Cause:** Missing dependencies or incorrect build command.

**Solution:**
1. Check build logs in Render dashboard
2. Verify `package.json` has all dependencies
3. Test build locally:
   ```bash
   cd app/gateway
   npm install
   npm run build # If applicable
   npm start
   ```
4. Update build command in Render if needed

### Issue: "Cannot connect to database"

**Cause:** `DATABASE_URL` not set or incorrect.

**Solution:**
1. Go to database dashboard → **Connection Info**
2. Copy Internal Database URL
3. Update environment variable in service
4. Redeploy service

### Issue: Gateway can't reach subgraph

**Cause:** Incorrect `PROVIDERS_SUBGRAPH_URL` or subgraph not deployed.

**Solution:**
1. Verify subgraph is deployed and health check passes
2. Copy subgraph URL from Render dashboard
3. Update gateway environment variable
4. Ensure both services are in same region (for best performance)

### Issue: Frontend shows CORS error

**Cause:** Gateway not configured to allow frontend domain.

**Solution:**
Add CORS middleware in gateway (`app/gateway/src/index.ts`):
```typescript
import cors from 'cors';

app.use(cors({
  origin: 'https://claimsight-frontend.onrender.com',
  credentials: true,
}));
```

Redeploy gateway.

### Issue: Service keeps spinning down (Free tier)

**Cause:** Free tier services spin down after 15 minutes of inactivity (this is expected behavior).

**Solution:**

**Option 1: Accept the sleep behavior (Recommended for learning/demos)**
- Services wake up automatically on first request (~30s wake-up time)
- Perfect for temporary projects and learning
- 100% free

**Option 2: Keep services awake with cron job**
- Use UptimeRobot or similar to ping services every 14 minutes
- Free tier still applies
- Note: This uses up your 750 free hours faster

**Option 3: Upgrade to paid tier (For production)**
- Render.com Starter plan: $7/mo per service (always-on, no sleep)
- Only needed if you require instant response times

### Issue: Database connection limit reached

**Cause:** Too many open connections.

**Solution:**
1. Upgrade database plan (Starter = 20 connections, Pro = 100+)
2. Use connection pooling (already enabled on Render)
3. Close idle connections in app code

---

## 📚 Resources

- [Render Documentation](https://render.com/docs)
- [Render Blueprint Reference](https://render.com/docs/blueprint-spec)
- [PostgreSQL on Render](https://render.com/docs/databases)
- [Deploy Node.js on Render](https://render.com/docs/deploy-node-express-app)

---

**Render.com deployment complete!** 🎉

Your full ClaimSight stack is live with:
- PostgreSQL database
- Apollo Gateway
- Providers subgraph
- Action handlers
- React frontend

All services auto-deploy on git push and include health monitoring!
