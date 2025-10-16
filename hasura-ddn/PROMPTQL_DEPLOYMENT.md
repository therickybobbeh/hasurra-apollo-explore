# PromptQL Cloud Deployment - Quick Start

## The Issue We Discovered

**PromptQL requires cloud deployment** - it cannot work with a local DDN engine.

Your local engine at `localhost:3280` is perfect for GraphQL development, but PromptQL needs:
1. A cloud-deployed DDN project
2. An internet-accessible database

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    LOCAL DEVELOPMENT                     │
│  localhost:3280  →  console.hasura.io/local/graphql     │
│  ✅ GraphQL queries work                                 │
│  ❌ PromptQL does NOT work (no AI features)             │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   CLOUD DEPLOYMENT                       │
│  Cloud DDN API  →  console.hasura.io/project/...        │
│  ✅ GraphQL queries work                                 │
│  ✅ PromptQL works (AI-powered queries!)                │
└─────────────────────────────────────────────────────────┘
```

## What You Need to Do

### Step 1: Set Up Neon Database (15 minutes)

Follow the instructions in `NEON_SETUP.md`:

1. Create a free Neon account at https://neon.tech
2. Create a new project called "claimsight"
3. Run `setup-neon-db.sql` in Neon's SQL Editor (creates tables)
4. Run `seed-neon-data.sql` in Neon's SQL Editor (adds sample data)
5. Copy your Neon connection string
6. Update `.env.cloud` with your connection string

### Step 2: Deploy to Hasura DDN Cloud (5 minutes)

Once Neon is ready, deploy your supergraph:

```bash
# Make sure you're authenticated
ddn auth login

# Build and deploy to cloud
ddn supergraph build create \
  --supergraph supergraph.yaml \
  --project claimsight-local \
  --env-file .env.cloud \
  --apply

# This will:
# 1. Build your connectors in the cloud
# 2. Build your supergraph
# 3. Deploy everything to Hasura DDN
# 4. Make it live (--apply flag)
```

### Step 3: Access PromptQL

Once deployment is complete:

1. Go to: `https://console.hasura.io/project/claimsight-local`
2. Look for the "Chat" or "PromptQL" tab
3. Start asking questions in natural language!

Example questions to try:
- "Show me all denied claims"
- "What are the top 5 providers by claim volume?"
- "Find all members with pending claims over $500"
- "Which providers have the highest denial rates?"

## Files Created

1. **`.env.cloud`** - Cloud environment configuration (needs your Neon connection string)
2. **`setup-neon-db.sql`** - Database schema for Neon
3. **`seed-neon-data.sql`** - Sample data (50 members, 20 providers, 150 claims)
4. **`NEON_SETUP.md`** - Detailed Neon setup instructions
5. **`PROMPTQL_DEPLOYMENT.md`** - This file!

## Current Status

✅ Cloud DDN project "claimsight-local" exists
✅ PromptQL is enabled for the project
✅ Environment files are ready
✅ Database schema and seed files are ready
⏳ **Waiting for you**: Set up Neon database
⏳ **Waiting for you**: Deploy to cloud

## Why Can't We Use the Local Database?

Your local PostgreSQL runs in Docker at `localhost:5432` - this is only accessible from your computer. The Hasura DDN cloud connectors run in AWS/GCP and cannot reach your local machine.

Options:
1. **Neon** (recommended) - Free, fast, perfect for demos
2. **ngrok** - Tunnel to local database (testing only, not production)
3. **Other cloud databases** - AWS RDS, Azure Database, Google Cloud SQL, Supabase

## Cost

Everything in this setup is **FREE**:
- Hasura DDN free tier
- Neon free tier (3GB storage, unlimited compute)
- PromptQL (in alpha, free to use)

## Questions?

- **"Do I need to keep my local engine running?"** - No! Once deployed to cloud, it's fully hosted.
- **"Can I still develop locally?"** - Yes! Use `ddn run docker-start` for local GraphQL development.
- **"Will this affect my local setup?"** - No, cloud and local are completely separate.
- **"How do I update the cloud after code changes?"** - Run the `ddn supergraph build create` command again.

## Next Steps

1. Follow `NEON_SETUP.md` to set up your cloud database
2. Deploy with the command above
3. Test PromptQL with natural language queries
4. Update Lab 7.5 README with your findings!
