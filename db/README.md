# Database Layer

This directory contains the PostgreSQL database schema, seed data, and Node.js seeder for ClaimSight.

## Files

- **`schema.sql`** - Core database schema with 5 tables (members, providers, claims, eligibility_checks, notes)
- **`indexes.sql`** - Performance indexes for common query patterns
- **`rls.sql`** - Row-Level Security policies for role-based access (admin, member, provider)
- **`seed-data.json`** - Generated seed data (100-200 realistic records)
- **`seed.js`** - Node.js seeder using `pg` library (no psql dependency)
- **`knexfile.cjs`** - Optional Knex configuration for migrations (not required)

## Schema Overview

### Tables

1. **members** - Health plan members/patients
   - UUID primary key
   - Demographics: first_name, last_name, dob
   - Plan type: PPO, HMO, EPO, POS, HDHP

2. **providers** - Healthcare providers
   - UUID primary key
   - NPI (unique identifier)
   - Name and specialty

3. **claims** - Medical claims
   - UUID primary key
   - Foreign keys: member_id, provider_id
   - Service details: dos (date of service), cpt code
   - Financial: charge_cents, allowed_cents
   - Status: PAID, DENIED, PENDING
   - denial_reason (required when DENIED)

4. **eligibility_checks** - Member eligibility verification
   - UUID primary key
   - Foreign key: member_id
   - JSONB result field for flexible data structure

5. **notes** - Case management notes
   - UUID primary key
   - Foreign key: member_id
   - Full-text search enabled on body

## Running the Seeder

The seeder is a cross-platform Node.js script that works on Windows, macOS, and Linux without requiring `psql`.

### Prerequisites

1. PostgreSQL 15+ installed and running
2. Database created (e.g., `createdb claimsight`)
3. `.env` file configured with connection details

### Commands

```bash
# Using npm script (cross-platform)
npm run seed

# Or directly with Node
node db/seed.js
```

### What the Seeder Does

1. Loads environment variables from `.env`
2. Connects to PostgreSQL using `pg` library
3. Runs `schema.sql` to create tables
4. Runs `indexes.sql` to add performance indexes
5. Runs `rls.sql` to enable row-level security
6. Inserts realistic seed data:
   - 50 members
   - 20 providers
   - 150 claims (with realistic denial reasons)
   - 30 eligibility checks
   - 25 notes (containing PA, appeal, step therapy keywords)

## Manual Setup (Alternative)

If you prefer to use `psql` directly:

```bash
# Create database
createdb claimsight

# Run SQL files
psql -d claimsight -f db/schema.sql
psql -d claimsight -f db/indexes.sql
psql -d claimsight -f db/rls.sql

# Then run seeder for data
node db/seed.js
```

## Row-Level Security (RLS)

The database uses PostgreSQL RLS to enforce permissions at the database level. Hasura passes role information via session variables:

### Roles

1. **admin** - Full access to all tables
2. **member** - Can only see their own data (filtered by `x-hasura-user-id`)
3. **provider** - Can only see claims they submitted (filtered by `x-hasura-provider-id`)

### Testing RLS

To test policies manually in psql:

```sql
-- Set session variable to simulate member role
SET hasura.user."x-hasura-user-id" = 'some-member-uuid';
SET ROLE hasura_member;

-- This will only return claims for that member
SELECT * FROM claims;
```

## Seed Data Characteristics

The seed data includes realistic healthcare scenarios:

- **CPT codes**: 99213 (office visit), 99214 (extended visit), 99285 (ER visit), etc.
- **Denial reasons**: "Prior authorization required", "Step therapy not followed", "Not medically necessary", "Out of network"
- **Specialties**: Primary Care, Cardiology, Orthopedics, Emergency Medicine, etc.
- **Plans**: PPO, HMO, EPO, POS, HDHP
- **Notes**: Contains keywords like "PA", "prior auth", "appeal", "step therapy" for PromptQL demos

## Connection String Format

The seeder expects these environment variables:

```
PGHOST=localhost
PGPORT=5432
PGUSER=claimsight
PGPASSWORD=claimsight_dev
PGDATABASE=claimsight
```

Or a single connection string:

```
DATABASE_URL=postgresql://claimsight:claimsight_dev@localhost:5432/claimsight
```

## Troubleshooting

### Windows: psql not found
The Node seeder doesn't require psql. Just ensure PostgreSQL service is running.

### Connection refused
Ensure PostgreSQL is running:
- Windows: Check Services for "postgresql-x64-15"
- macOS: `brew services list` or check Postgres.app
- Linux: `sudo systemctl status postgresql`

### Permission denied
Grant your user permissions:
```sql
GRANT ALL PRIVILEGES ON DATABASE claimsight TO claimsight;
```

### RLS blocking queries
Ensure Hasura is configured with proper role mapping and session variables. The database expects roles: `hasura_admin`, `hasura_member`, `hasura_provider`.
