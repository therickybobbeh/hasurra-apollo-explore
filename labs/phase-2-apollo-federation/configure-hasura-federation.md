# Configuring Hasura Tables for Apollo Federation

## Overview

Enabling `HASURA_GRAPHQL_ENABLE_APOLLO_FEDERATION=true` in Hasura Cloud activates the federation engine, but **you must also configure each table individually** to expose it as a federated entity.

This guide shows you how to enable federation on the tables that other subgraphs need to reference:
- `members` (Member entity)
- `providers` (Provider entity)
- `claims` (Claim entity)

---

## Why This Is Needed

When other subgraphs (like Appointments or Medications) try to reference Hasura entities:

```graphql
type Appointment {
  member_id: ID!
  member: Member  # References Hasura's Member entity
}
```

The Appointments resolver returns an entity reference:
```typescript
member: (parent) => ({ __typename: 'Member', id: parent.member_id })
```

Apollo Gateway needs Hasura's `Member` type to have a `@key` directive so it knows how to resolve it:
```graphql
type Member @key(fields: "id") {
  id: UUID!
  first_name: String
  last_name: String
}
```

Without enabling federation on the table, Hasura won't add the `@key` directive, and cross-subgraph queries will fail.

---

## Method 1: Hasura Console (Recommended for Learning)

This is the easiest method for following the labs.

### Step 1: Open Your Hasura Console

1. Go to https://cloud.hasura.io/
2. Open your project from Phase 1
3. Click **"Data"** in the top navigation

### Step 2: Enable Federation on Members Table

1. In the left sidebar, find **"public" → "members"**
2. Click on **"members"**
3. Click the **"Modify"** tab
4. Scroll down to **"Enable Apollo Federation"** section
5. **Toggle the switch to ON** ✅
6. Click **"Save"**

**What this does:** Adds `@key(fields: "id")` directive to the `Member` type in Hasura's GraphQL schema.

### Step 3: Enable Federation on Providers Table

1. In the left sidebar, find **"public" → "providers"**
2. Click on **"providers"**
3. Click the **"Modify"** tab
4. Scroll down to **"Enable Apollo Federation"** section
5. **Toggle the switch to ON** ✅
6. Click **"Save"**

### Step 4: Enable Federation on Claims Table

1. In the left sidebar, find **"public" → "claims"**
2. Click on **"claims"**
3. Click the **"Modify"** tab
4. Scroll down to **"Enable Apollo Federation"** section
5. **Toggle the switch to ON** ✅
6. Click **"Save"**

### Step 5: Verify Configuration

1. Go to **"API"** tab in Hasura Console
2. Run this query to verify federation is enabled:

```graphql
{
  _service {
    sdl
  }
}
```

3. In the SDL output, look for `@key` directives:

```graphql
type member_records @key(fields: "id") {
  id: uuid!
  first_name: String
  last_name: String
  # ... other fields
}

type provider_records @key(fields: "id") {
  id: uuid!
  name: String
  specialty: String
  # ... other fields
}

type claim_records @key(fields: "id") {
  id: uuid!
  claim_number: String
  # ... other fields
}
```

If you see `@key(fields: "id")` on these types, federation is configured correctly! ✅

---

## Method 2: Hasura Metadata API (For Automation)

If you want to automate this configuration or include it in a script, use the Hasura Metadata API.

### Create Configuration Script

Create `scripts/configure-hasura-federation.sh`:

```bash
#!/bin/bash

# Load environment variables
source .env

# Hasura Cloud endpoint and admin secret
HASURA_ENDPOINT="${HASURA_GRAPHQL_ENDPOINT}/v1/metadata"
ADMIN_SECRET="${HASURA_GRAPHQL_ADMIN_SECRET}"

echo "Configuring Apollo Federation for Hasura tables..."

# Enable federation on members table
curl -X POST \
  "${HASURA_ENDPOINT}" \
  -H "Content-Type: application/json" \
  -H "x-hasura-admin-secret: ${ADMIN_SECRET}" \
  -d '{
    "type": "pg_set_apollo_federation_config",
    "args": {
      "source": "default",
      "table": {
        "schema": "public",
        "name": "members"
      },
      "apollo_federation_config": {
        "enable": "v1"
      }
    }
  }'

echo "✓ Enabled federation on members table"

# Enable federation on providers table
curl -X POST \
  "${HASURA_ENDPOINT}" \
  -H "Content-Type: application/json" \
  -H "x-hasura-admin-secret: ${ADMIN_SECRET}" \
  -d '{
    "type": "pg_set_apollo_federation_config",
    "args": {
      "source": "default",
      "table": {
        "schema": "public",
        "name": "providers"
      },
      "apollo_federation_config": {
        "enable": "v1"
      }
    }
  }'

echo "✓ Enabled federation on providers table"

# Enable federation on claims table
curl -X POST \
  "${HASURA_ENDPOINT}" \
  -H "Content-Type: application/json" \
  -H "x-hasura-admin-secret: ${ADMIN_SECRET}" \
  -d '{
    "type": "pg_set_apollo_federation_config",
    "args": {
      "source": "default",
      "table": {
        "schema": "public",
        "name": "claims"
      },
      "apollo_federation_config": {
        "enable": "v1"
      }
    }
  }'

echo "✓ Enabled federation on claims table"

echo ""
echo "✅ Apollo Federation configuration complete!"
echo "Run this query in Hasura Console to verify:"
echo '{ _service { sdl } }'
```

### Make Script Executable and Run

```bash
chmod +x scripts/configure-hasura-federation.sh
./scripts/configure-hasura-federation.sh
```

---

## Method 3: Hasura Metadata Export/Import (For Version Control)

You can export metadata, add federation configuration, and import it back.

### Export Current Metadata

```bash
# Install Hasura CLI if not already installed
npm install --global hasura-cli

# Initialize Hasura project (if not already done)
hasura init hasura-metadata --endpoint $HASURA_GRAPHQL_ENDPOINT --admin-secret $HASURA_GRAPHQL_ADMIN_SECRET

# Export metadata
cd hasura-metadata
hasura metadata export
```

### Edit Metadata Files

Edit these files to add federation configuration:

**metadata/databases/default/tables/public_members.yaml:**
```yaml
table:
  name: members
  schema: public
apollo_federation_config:
  enable: v1
# ... rest of existing configuration
```

**metadata/databases/default/tables/public_providers.yaml:**
```yaml
table:
  name: providers
  schema: public
apollo_federation_config:
  enable: v1
# ... rest of existing configuration
```

**metadata/databases/default/tables/public_claims.yaml:**
```yaml
table:
  name: claims
  schema: public
apollo_federation_config:
  enable: v1
# ... rest of existing configuration
```

### Apply Metadata

```bash
hasura metadata apply
```

---

## Troubleshooting

### "Enable Apollo Federation" Toggle Not Visible

**Problem:** Can't find the federation toggle in Hasura Console.

**Solution:**
1. Verify `HASURA_GRAPHQL_ENABLE_APOLLO_FEDERATION=true` is set in environment variables
2. Wait 10-15 seconds for Hasura to restart after adding the env var
3. Hard refresh the browser (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
4. If still not visible, check Hasura version - requires v2.10.0+

### Cross-Subgraph Queries Return Null

**Problem:** Queries like `appointments { member { first_name } }` return null for member fields.

**Solution:**
1. Verify federation is enabled on the member table (check for `@key` directive in SDL)
2. Restart the gateway service after enabling federation
3. Check gateway logs for composition errors

### API Method Returns Error

**Problem:** Metadata API returns error when configuring federation.

**Solution:**
1. Verify the table name and schema are correct (case-sensitive)
2. Check that the source name is "default" (or your actual source name)
3. Ensure admin secret is correct
4. Check Hasura Cloud version supports federation (v2.10.0+)

---

## What This Configuration Does

When you enable Apollo Federation on a Hasura table:

1. **Adds `@key` directive** to the GraphQL type
   ```graphql
   type member_records @key(fields: "id") {
     id: uuid!
     # ...
   }
   ```

2. **Enables entity resolution** - Gateway can fetch member data by ID
   ```graphql
   query {
     _entities(representations: [{__typename: "member_records", id: "550e8400-..."}]) {
       ... on member_records {
         first_name
         last_name
       }
     }
   }
   ```

3. **Allows other subgraphs to reference** - Appointments and Medications can now resolve Member entities

---

## Testing Federation Configuration

### Test 1: Verify SDL Contains @key Directives

In Hasura Console → API tab:

```graphql
{
  _service {
    sdl
  }
}
```

Look for:
```graphql
type member_records @key(fields: "id")
type provider_records @key(fields: "id")
type claim_records @key(fields: "id")
```

### Test 2: Test Entity Resolution

In Hasura Console → API tab:

```graphql
{
  _entities(representations: [
    {
      __typename: "member_records"
      id: "550e8400-e29b-41d4-a716-446655440000"
    }
  ]) {
    ... on member_records {
      id
      first_name
      last_name
    }
  }
}
```

Should return member data. ✅

### Test 3: Test Cross-Subgraph Query

Start gateway (from project root):
```bash
npm run phase4:dev
```

Open http://localhost:4000/graphql and run:

```graphql
query TestFederation {
  appointments {
    id
    appointment_date
    status
    member {
      first_name
      last_name
      date_of_birth
    }
  }
}
```

If member fields populate with data, federation is working! ✅

---

## When to Configure Federation

**Phase 1:** Not needed - Hasura runs standalone

**Phase 2:** Configure members and providers tables
- Providers subgraph extends Provider with ratings
- Need @key directive for entity resolution

**Phase 3:** Still using Phase 2 configuration
- Appointments service built but not federated yet

**Phase 4:** Add claims table federation configuration
- Appointments subgraph references Member, Provider, and Claim entities
- Need @key directives for all three

**Phase 5:** No additional configuration needed
- Medications service runs standalone

**Phase 6:** Medications service joins federation
- Uses existing Member and Provider federation configuration from Phase 2/4

---

## Summary

**Three steps to configure Hasura federation:**

1. ✅ Set `HASURA_GRAPHQL_ENABLE_APOLLO_FEDERATION=true` (enables the engine)
2. ✅ Enable federation on each table (adds @key directives)
3. ✅ Restart gateway to pick up new schema

**Tables that need federation enabled:**
- `members` - Referenced by Appointments and Medications subgraphs
- `providers` - Extended by Providers subgraph, referenced by Appointments and Medications
- `claims` - Referenced by Appointments subgraph (for billing)

Once configured, your federated architecture works seamlessly across all subgraphs! 🎉
