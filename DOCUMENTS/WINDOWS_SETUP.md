# ClaimSight - Windows Setup Guide (No Docker)

Complete setup instructions for Windows users who want to run ClaimSight **without Docker**, using native PostgreSQL and Hasura Cloud free tier.

---

## Overview

This guide walks you through setting up ClaimSight on Windows using:
- ✅ **Native PostgreSQL** (no Docker required)
- ✅ **Hasura Cloud** (free tier/trial)
- ✅ **PowerShell** scripts included in the project
- ✅ **Node.js** for the action handler and frontend

**Estimated Setup Time**: 30-45 minutes

---

## Prerequisites

### 1. Install Node.js 18+

**Download**: [nodejs.org](https://nodejs.org/)

1. Download the **LTS version** (18.x or higher)
2. Run the installer
3. Keep default settings (includes npm and adds to PATH)
4. Verify installation:

```powershell
node --version
# Should output: v18.x.x or higher

npm --version
# Should output: 9.x.x or higher
```

---

### 2. Install PostgreSQL 15+

**Option A: Official PostgreSQL Installer (Recommended)**

1. Download from [postgresql.org/download/windows](https://www.postgresql.org/download/windows/)
2. Run the installer
3. During installation:
   - Set a **master password** (remember this!)
   - Default port: **5432** (keep this)
   - Install **pgAdmin 4** (GUI tool - recommended)
   - Components to install: PostgreSQL Server, pgAdmin 4, Command Line Tools

4. Add PostgreSQL to your PATH:
   - Open **System Environment Variables**
   - Edit **Path** variable
   - Add: `C:\Program Files\PostgreSQL\15\bin` (adjust version if needed)

5. Verify installation:

```powershell
psql --version
# Should output: psql (PostgreSQL) 15.x
```

**Option B: EDB Installer**

Enterprise DB provides an alternative installer with additional tools. Follow similar steps.

---

### 3. Set Up PowerShell (If Needed)

If you encounter "script execution disabled" errors:

```powershell
# Run PowerShell as Administrator
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned

# Or bypass for current session only:
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

---

## Step 1: Clone and Setup Project

### 1.1 Clone Repository

```powershell
cd C:\your\projects\directory
git clone <repository-url>
cd poc-has-apal
```

### 1.2 Run Setup Script

```powershell
npm run setup
```

This will:
- Check Node.js and PostgreSQL versions
- Install Hasura CLI globally
- Install all project dependencies
- Create `.env` file from `.env.example`

**Note**: The script may warn if `psql` is not in PATH. That's okay if you plan to use pgAdmin.

---

## Step 2: Create PostgreSQL Database

### Option A: Using pgAdmin (GUI)

1. Open **pgAdmin 4** from Start Menu
2. Connect to PostgreSQL (use your master password)
3. Right-click **Databases** → **Create** → **Database**
4. Database name: `claimsight`
5. Owner: `postgres` (default)
6. Click **Save**

### Option B: Using psql Command Line

```powershell
# Connect as postgres user
psql -U postgres

# In psql prompt:
CREATE DATABASE claimsight;
CREATE USER claimsight WITH PASSWORD 'claimsight_dev';
GRANT ALL PRIVILEGES ON DATABASE claimsight TO claimsight;

# Exit psql
\q
```

### Option C: Use Cloud PostgreSQL (Alternative)

If you don't want to run PostgreSQL locally, use a free cloud database:

**Neon (Recommended)**:
1. Sign up at [neon.tech](https://neon.tech/)
2. Create a new project
3. Copy the connection string
4. Skip to Step 3 and use the Neon connection string

**Supabase**:
1. Sign up at [supabase.com](https://supabase.com/)
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string

---

## Step 3: Configure Environment Variables

Edit `.env` in the project root:

### For Local PostgreSQL:

```env
# PostgreSQL Connection (Local)
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=your_postgres_password
PGDATABASE=claimsight

# Hasura Configuration (We'll update this after creating Hasura Cloud project)
HASURA_GRAPHQL_ENDPOINT=https://your-project.hasura.app
HASURA_GRAPHQL_ADMIN_SECRET=your_secure_admin_secret
HASURA_GRAPHQL_DATABASE_URL=postgresql://postgres:your_postgres_password@localhost:5432/claimsight

# GraphQL Endpoints (Update after Hasura Cloud setup)
VITE_GRAPHQL_HTTP_URL=https://your-project.hasura.app/v1/graphql
VITE_GRAPHQL_WS_URL=wss://your-project.hasura.app/v1/graphql

# Admin Secret (for client - same as Hasura)
VITE_HASURA_ADMIN_SECRET=your_secure_admin_secret

# Test Users (Update after seeding - see ROLE_SWITCHER.md)
VITE_TEST_USERS=[{"role":"admin","label":"Admin User"},{"role":"member","label":"Member - Michael Lopez","memberId":"0b057d39-0b9d-4265-a92c-d9fd8f22a7a6"},{"role":"member","label":"Member - Linda Davis","memberId":"bf6a2a56-c1a0-42cd-85df-5c6254fc98b2"},{"role":"provider","label":"Provider - Dr. Smith","providerId":"734f62da-879d-45bb-b07b-8163182ef917"}]

# Action Handler
ACTION_HANDLER_PORT=3001
ACTION_HANDLER_URL=http://localhost:3001

# Subgraph (Optional)
SUBGRAPH_PORT=3002
SUBGRAPH_URL=http://localhost:3002/graphql
```

### For Cloud PostgreSQL (Neon/Supabase):

Replace the PostgreSQL variables with your cloud connection string:

```env
PGHOST=your-db-host.neon.tech
PGPORT=5432
PGUSER=your_username
PGPASSWORD=your_password
PGDATABASE=your_database

HASURA_GRAPHQL_DATABASE_URL=postgresql://your_username:your_password@your-db-host.neon.tech:5432/your_database?sslmode=require
```

**Important**: Keep `?sslmode=require` for cloud databases!

---

## Step 4: Seed Database

Run the seeding script to create schema and insert sample data:

```powershell
npm run seed
```

This creates:
- Database schema (members, claims, providers, notes, eligibility_checks)
- Row-Level Security (RLS) policies
- Indexes for performance
- 150+ rows of realistic healthcare data

**Expected output**:
```
✓ Connected to database
✓ Schema created
✓ Indexes created
✓ RLS policies applied
✓ Seeded 50 members
✓ Seeded 15 providers
✓ Seeded 150 claims
✓ Seeded 75 notes
✓ Seeded 30 eligibility checks
```

---

## Step 5: Create Hasura Cloud Project

### 5.1 Sign Up for Hasura Cloud

1. Go to [cloud.hasura.io](https://cloud.hasura.io/)
2. Sign up with GitHub, Google, or email
3. **Free tier includes**:
   - 1 project
   - Unlimited API requests
   - 1GB data pass-through/month
   - Community support

### 5.2 Create New Project

1. Click **"Create Project"**
2. Project name: `claimsight-dev` (or your choice)
3. Region: Choose closest to you (e.g., `us-east-1`)
4. Click **"Create Project"**

### 5.3 Connect Database

**Option A: Connect Local PostgreSQL**

1. In Hasura Console, go to **Data** tab
2. Click **"Connect Database"**
3. Choose **"Connect existing database"**
4. Database name: `default`
5. Connection string:

   For local PostgreSQL, you need to expose it to the internet. This is **NOT recommended for production**, only for development:

   **Using ngrok (Simplest)**:
   ```powershell
   # Install ngrok: https://ngrok.com/download
   ngrok tcp 5432
   ```

   Copy the forwarding URL (e.g., `tcp://0.tcp.ngrok.io:12345`) and create connection string:
   ```
   postgresql://postgres:your_password@0.tcp.ngrok.io:12345/claimsight
   ```

   **Security Note**: ngrok exposes your database to the internet. Only use for development and close ngrok when done.

**Option B: Use Cloud PostgreSQL (Recommended)**

If you're using Neon or Supabase:
1. Paste your cloud database connection string
2. Hasura Cloud can connect directly (no ngrok needed)
3. Connection string format:
   ```
   postgresql://username:password@host:5432/database?sslmode=require
   ```

### 5.4 Set Environment Variables in Hasura Cloud

1. In Hasura Console, go to **Project Settings** → **Env vars**
2. Add these variables:

   | Key | Value |
   |-----|-------|
   | `HASURA_GRAPHQL_ADMIN_SECRET` | Choose a strong password (e.g., `claimsight_prod_secret_change_me`) |
   | `HASURA_GRAPHQL_ENABLE_CONSOLE` | `true` |
   | `HASURA_GRAPHQL_DEV_MODE` | `true` (for development) |

3. Click **"Add"** for each

### 5.5 Get Your Hasura Cloud URLs

After project creation, note your URLs:
- **GraphQL Endpoint**: `https://your-project.hasura.app/v1/graphql`
- **Console**: `https://cloud.hasura.io/project/your-project-id/console`

### 5.6 Update `.env` with Hasura Cloud URLs

```env
HASURA_GRAPHQL_ENDPOINT=https://your-project.hasura.app
HASURA_GRAPHQL_ADMIN_SECRET=claimsight_prod_secret_change_me

VITE_GRAPHQL_HTTP_URL=https://your-project.hasura.app/v1/graphql
VITE_GRAPHQL_WS_URL=wss://your-project.hasura.app/v1/graphql
VITE_HASURA_ADMIN_SECRET=claimsight_prod_secret_change_me
```

---

## Step 6: Apply Hasura Metadata

This configures Hasura with table relationships, permissions, and actions:

### 6.1 Update Hasura Config

Edit `hasura/config.yaml` to point to your Hasura Cloud project:

```yaml
version: 3
endpoint: https://your-project.hasura.app
admin_secret: claimsight_prod_secret_change_me
metadata_directory: metadata
```

### 6.2 Apply Metadata

```powershell
npm run hasura:apply
```

This will:
- Track all database tables in Hasura
- Create relationships (claims → member, claims → provider, etc.)
- Set up permissions for admin/member/provider roles
- Configure custom actions (eligibility check)

**Expected output**:
```
✓ Metadata applied
✓ Tables tracked: members, claims, providers, notes, eligibility_checks
✓ Relationships created
✓ Permissions configured
```

---

## Step 7: Set Up Action Handler

The eligibility check feature requires a custom action handler (Node.js API).

### Option A: Run Locally with ngrok (Development)

1. **Start the action handler**:

   ```powershell
   # In a new PowerShell window
   cd hasura/actions/handlers
   npm run dev
   ```

   Handler runs on `http://localhost:3001`

2. **Expose with ngrok**:

   ```powershell
   # In another PowerShell window
   ngrok http 3001
   ```

   Copy the forwarding URL: `https://abc123.ngrok.io`

3. **Update Hasura action handler URL**:

   In Hasura Console:
   - Go to **Actions** tab
   - Click on `submitEligibilityCheck` action
   - Change handler URL from `http://host.docker.internal:3001/eligibility` to:
     ```
     https://abc123.ngrok.io/eligibility
     ```
   - Click **Save**

### Option B: Deploy to Cloud (Production)

**Railway (Free Tier)**:
1. Sign up at [railway.app](https://railway.app/)
2. Create new project from GitHub repo
3. Set root directory to: `hasura/actions/handlers`
4. Set start command: `npm start`
5. Copy the generated URL (e.g., `https://your-app.railway.app`)
6. Update Hasura action handler to: `https://your-app.railway.app/eligibility`

**Render (Free Tier)**:
1. Sign up at [render.com](https://render.com/)
2. Create new Web Service
3. Connect GitHub repo
4. Root directory: `hasura/actions/handlers`
5. Build command: `npm install`
6. Start command: `npm start`
7. Copy URL and update Hasura

---

## Step 8: Start Frontend

```powershell
# In project root
npm run dev
```

This starts:
- **React frontend** on `http://localhost:5173`
- **Action handler** on `http://localhost:3001` (if not already running)
- **Subgraph** on `http://localhost:3002` (optional Apollo Federation demo)

Open your browser to: **http://localhost:5173**

---

## Verify Everything Works

### Test 1: Frontend Loads

1. Go to `http://localhost:5173`
2. You should see the ClaimSight dashboard
3. Click the role switcher (top-right) and select different users

### Test 2: GraphQL Queries Work

1. Open Hasura Console: `https://cloud.hasura.io/project/your-project-id/console`
2. Go to **API** tab (GraphiQL)
3. Run test query:

   ```graphql
   query TestClaims {
     claims(limit: 5) {
       id
       cpt
       status
       member {
         first_name
         last_name
       }
     }
   }
   ```

4. Should return 5 claims with member data

### Test 3: Role-Based Permissions

1. In Hasura Console, set request headers:
   ```json
   {
     "x-hasura-role": "member",
     "x-hasura-user-id": "0b057d39-0b9d-4265-a92c-d9fd8f22a7a6"
   }
   ```

2. Run query again - should only see claims for that member

### Test 4: Eligibility Check Action

1. In the frontend, switch to a member user
2. Click a claim to view details
3. Click **"Run Check"** button in Eligibility Panel
4. Should see eligibility status change

**If this fails**, check:
- Action handler is running (`http://localhost:3001/eligibility` returns response)
- ngrok is running (if using local handler)
- Hasura action handler URL is correct

---

## Troubleshooting

### PowerShell Execution Policy Error

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### PostgreSQL Connection Refused

**Check if PostgreSQL is running**:
1. Open **Services** (press `Win + R`, type `services.msc`)
2. Find `postgresql-x64-15` (or similar)
3. Ensure status is **"Running"**
4. If not, right-click → **Start**

**Check credentials**:
```powershell
psql -U postgres -h localhost -p 5432
# Enter password when prompted
# If successful, you're connected!
```

### Hasura Can't Connect to Database

**If using local PostgreSQL**:
- Ensure PostgreSQL allows remote connections
- Edit `postgresql.conf`:
  ```
  listen_addresses = '*'
  ```
- Edit `pg_hba.conf` to allow connections from Hasura Cloud IPs
- **OR** use ngrok/cloud database instead (easier)

**If using cloud database**:
- Verify connection string includes `?sslmode=require`
- Test connection from pgAdmin or psql first

### Action Handler Connection Failed

**Check handler is running**:
```powershell
# Test locally
curl http://localhost:3001/health
# Should return 200 OK
```

**Check ngrok is running**:
```powershell
# Visit ngrok dashboard
http://localhost:4040
# Shows all requests
```

**Update Hasura action URL**:
- Hasura Console → Actions → submitEligibilityCheck
- Change to your ngrok URL
- Click Save

### Frontend Shows No Data

1. Check browser console (F12) for errors
2. Verify `.env` has correct Hasura Cloud URLs
3. Test GraphQL endpoint directly:
   ```powershell
   curl https://your-project.hasura.app/v1/graphql `
     -H "x-hasura-admin-secret: your_secret" `
     -H "Content-Type: application/json" `
     -d '{\"query\":\"{ members(limit:1) { id first_name } }\"}'
   ```

### Hasura CLI Not Found

```powershell
# Install globally
npm install -g hasura-cli

# Verify
hasura version
```

### Port Already in Use

Change ports in `.env`:
```env
ACTION_HANDLER_PORT=3005
SUBGRAPH_PORT=3006
```

For frontend port, edit `app/client/vite.config.ts`:
```typescript
export default defineConfig({
  server: {
    port: 5174  // Change from 5173
  }
})
```

### ngrok Session Expired

Free ngrok sessions expire after 2 hours. Restart ngrok and update Hasura action URL.

**Alternative**: Upgrade to ngrok paid plan or deploy action handler to Railway/Render.

---

## Windows Firewall Configuration

If PostgreSQL connections fail, allow PostgreSQL through Windows Firewall:

1. Open **Windows Defender Firewall with Advanced Security**
2. Click **Inbound Rules** → **New Rule**
3. Rule Type: **Port**
4. Protocol: **TCP**, Port: **5432**
5. Action: **Allow the connection**
6. Profile: **All**
7. Name: `PostgreSQL`
8. Click **Finish**

---

## Managing Services

### Start/Stop PostgreSQL

**Using Services GUI**:
1. Press `Win + R`, type `services.msc`
2. Find `postgresql-x64-15`
3. Right-click → Start/Stop/Restart

**Using PowerShell (as Administrator)**:
```powershell
# Start
Start-Service postgresql-x64-15

# Stop
Stop-Service postgresql-x64-15

# Restart
Restart-Service postgresql-x64-15
```

### Start Action Handler in Background

```powershell
# Using Start-Process
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd hasura/actions/handlers; npm run dev"
```

---

## Quick Reference: All Commands

```powershell
# Initial Setup
npm run setup              # Install dependencies
npm run seed              # Create schema and seed data
npm run hasura:apply      # Configure Hasura

# Development
npm run dev               # Start all services
npm run client:dev        # Frontend only
npm run action:dev        # Action handler only
npm run subgraph:dev      # Subgraph only (optional)

# Database Management
psql -U postgres -d claimsight  # Connect to database

# Hasura CLI
hasura console            # Open Hasura Console
hasura metadata apply     # Apply metadata
hasura metadata export    # Export current metadata
```

---

## Cloud Service Alternatives

### PostgreSQL Cloud (Instead of Local)

| Service | Free Tier | Setup Time | Best For |
|---------|-----------|------------|----------|
| **Neon** | 3GB storage | 5 min | Development |
| **Supabase** | 500MB, 2 projects | 5 min | Full stack |
| **ElephantSQL** | 20MB | 5 min | Testing |
| **Railway** | $5 credit/month | 10 min | Dev/staging |

### Action Handler Hosting

| Service | Free Tier | Setup Time | Best For |
|---------|-----------|------------|----------|
| **Railway** | $5 credit/month | 10 min | APIs |
| **Render** | 750 hours/month | 10 min | Web services |
| **Fly.io** | 3 VMs free | 15 min | Low latency |
| **Vercel** | Hobby plan | 5 min | Serverless |

---

## Production Deployment

For production deployment:

1. **Use cloud PostgreSQL** (don't expose local database)
2. **Deploy action handler** to Railway/Render (not ngrok)
3. **Use strong admin secret** (not the example one)
4. **Disable dev mode** in Hasura:
   ```
   HASURA_GRAPHQL_DEV_MODE=false
   HASURA_GRAPHQL_ENABLE_CONSOLE=false
   ```
5. **Enable CORS** only for your frontend domain
6. **Set up monitoring** (Hasura Cloud includes basic monitoring)

---

## Next Steps

Once everything is running:

1. **Read the main README**: [../README.md](../README.md)
2. **Follow Learning Checklist**: [LEARNING_CHECKLIST.md](LEARNING_CHECKLIST.md)
3. **Try Challenges**: [CHALLENGES.md](CHALLENGES.md)
4. **Explore Role Switcher**: [ROLE_SWITCHER.md](ROLE_SWITCHER.md)

---

## Support

**Stuck?**
- Check [../README.md#troubleshooting](../README.md#troubleshooting)
- Review [BEST_PRACTICES.md](BEST_PRACTICES.md)
- Check Hasura Docs: [hasura.io/docs](https://hasura.io/docs/)
- PostgreSQL Docs: [postgresql.org/docs](https://www.postgresql.org/docs/)

**Common Issues**:
- 🔴 Can't connect to PostgreSQL → Check Services, verify password
- 🔴 Hasura can't reach database → Use cloud DB or ngrok
- 🔴 Action handler fails → Verify ngrok URL in Hasura Console
- 🔴 Frontend shows errors → Check browser console, verify .env URLs

---

**You're all set!** 🎉

ClaimSight is now running on Windows without Docker, using Hasura Cloud and native PostgreSQL.
