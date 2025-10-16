# Neon Database Setup for PromptQL Cloud Deployment

This guide will help you set up a cloud-hosted PostgreSQL database on Neon for deploying the ClaimSight API with PromptQL.

## Why Neon?

PromptQL requires your DDN project to be deployed to the cloud, and the cloud deployment needs to access your database over the internet. Neon provides:
- Free tier with generous limits
- Instant provisioning
- Serverless PostgreSQL
- Perfect for demos and testing

## Step 1: Create a Neon Account

1. Go to [https://neon.tech](https://neon.tech)
2. Click "Sign Up" and create an account (GitHub sign-in recommended)
3. Once logged in, you'll be at the Neon Dashboard

## Step 2: Create a New Project

1. Click "Create Project" or "New Project"
2. Configure your project:
   - **Project Name**: `claimsight` (or any name you prefer)
   - **Region**: Choose the closest region to you (e.g., US East, Europe)
   - **PostgreSQL Version**: 15 or 16 (recommended)
3. Click "Create Project"

## Step 3: Get Your Connection String

After project creation, you'll see a connection string. It looks like:
```
postgresql://[user]:[password]@[host]/[database]?sslmode=require
```

**IMPORTANT**: Copy this connection string! You'll need it shortly.

Example:
```
postgresql://claimsight_owner:AbCdEf123456@ep-cool-cloud-123456.us-east-2.aws.neon.tech/claimsight?sslmode=require
```

## Step 4: Set Up the Database Schema

1. In the Neon Dashboard, navigate to your project
2. Click on the "SQL Editor" tab
3. Copy the entire contents of `setup-neon-db.sql` from this directory
4. Paste it into the SQL Editor
5. Click "Run" to execute the schema setup

This will create:
- Three tables: `members`, `provider_records`, `claims`
- All necessary indexes, constraints, and triggers
- Required PostgreSQL extensions

## Step 5: Seed the Database with Sample Data

1. Still in the SQL Editor, click "New Query" or clear the previous query
2. Copy the entire contents of `seed-neon-data.sql` from this directory
3. Paste it into the SQL Editor
4. Click "Run" to execute the data insertion

This will populate your database with:
- 50 members (patients)
- 20 healthcare providers
- 150 medical claims

## Step 6: Verify the Data

Run this query in the SQL Editor to verify:

```sql
SELECT
  (SELECT COUNT(*) FROM members) as member_count,
  (SELECT COUNT(*) FROM provider_records) as provider_count,
  (SELECT COUNT(*) FROM claims) as claim_count;
```

You should see:
- member_count: 50
- provider_count: 20
- claim_count: 150

## Step 7: Update .env.cloud

1. Open `.env.cloud` in this directory
2. Find the line with `CLAIMSIGHT_POSTGRES_CONNECTION_URI`
3. Replace the value with your Neon connection string:

```bash
CLAIMSIGHT_POSTGRES_CONNECTION_URI="postgresql://[your-user]:[your-password]@[your-host]/claimsight?sslmode=require"
```

**Example:**
```bash
CLAIMSIGHT_POSTGRES_CONNECTION_URI="postgresql://claimsight_owner:AbCdEf123456@ep-cool-cloud-123456.us-east-2.aws.neon.tech/claimsight?sslmode=require"
```

## Neon Free Tier Limits

The Neon free tier includes:
- 1 project
- 10 branches
- 3 GB storage
- Unlimited compute hours (with 300ms cold starts)
- Perfect for development and demos!

## Security Note

**⚠️ IMPORTANT**: The `.env.cloud` file contains your database credentials.
- Add `.env.cloud` to `.gitignore` (already configured)
- Never commit this file to version control
- For production, use Hasura DDN's secret management

## Troubleshooting

### Connection Refused
- Ensure you copied the entire connection string including `?sslmode=require`
- Check that your Neon project is not suspended (free tier suspends after 7 days of inactivity)

### Table Creation Errors
- Neon's free tier includes all required PostgreSQL extensions
- If you see extension errors, they're likely warnings and can be ignored

### Data Import Errors
- Ensure you ran `setup-neon-db.sql` BEFORE `seed-neon-data.sql`
- The tables must exist before inserting data

## Next Steps

Once your Neon database is set up and `.env.cloud` is updated, you can:
1. Build your supergraph for cloud deployment: `ddn supergraph build create --supergraph supergraph.yaml --project claimsight-local --env-file .env.cloud --apply`
2. Access PromptQL at `https://console.hasura.io/project/claimsight-local`

For detailed deployment instructions, see `labs/phase-7.5-promptql/README.md`
