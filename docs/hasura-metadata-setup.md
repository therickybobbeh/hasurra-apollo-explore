# Applying Hasura Metadata to Hasura Cloud

## Overview

This project includes pre-configured Hasura metadata in the `hasura/metadata/` directory. This metadata defines:
- Table tracking and relationships
- Permissions (roles: member, provider, admin)
- Apollo Federation configuration
- Custom actions (eligibility checks)

You need to apply this metadata to your Hasura Cloud instance to get the full schema setup.

---

## Prerequisites

- ✅ Hasura Cloud project created (Phase 1)
- ✅ Database connected to Hasura Cloud
- ✅ Tables created in your database (Phase 1 SQL scripts)

---

## Method 1: Using Hasura Console (Recommended for Beginners)

### Step 1: Export Your Current Metadata (Backup)

Before applying new metadata, back up your existing configuration:

1. Open Hasura Console: https://cloud.hasura.io/
2. Go to your project
3. Click **"Settings"** (gear icon)
4. Click **"Metadata Actions"**
5. Click **"Export Metadata"**
6. Save the downloaded file as backup

### Step 2: Apply Metadata from Repo

**Option A: Import Entire Metadata (Easiest)**

1. In Hasura Console, click **"Settings"** → **"Metadata Actions"**
2. Click **"Import Metadata"**
3. Upload the metadata folder or use the CLI method below

**Option B: Manual Configuration via Console UI**

Since Hasura Cloud doesn't have a direct "import folder" option, you'll need to use the CLI (see Method 2) or manually configure through the UI:

1. **Track Tables**: Data → public → Track all tables
2. **Configure Relationships**: Already defined in foreign keys
3. **Set Permissions**: Follow Phase 1 README instructions
4. **Enable Federation**: See Phase 2 README, Step 6.3

---

## Method 2: Using Hasura CLI (Recommended for This Project)

The Hasura CLI is the best way to apply all metadata at once.

### Step 1: Install Hasura CLI

```bash
npm install --global hasura-cli

# Verify installation
hasura version
```

### Step 2: Configure Hasura CLI

Create a config file in the hasura directory:

```bash
cd hasura

# Create config.yaml if it doesn't exist
cat > config.yaml <<EOF
version: 3
endpoint: https://your-project.hasura.app
admin_secret: your-admin-secret-from-phase-1
metadata_directory: ./metadata
EOF
```

**Replace:**
- `https://your-project.hasura.app` with your Hasura Cloud endpoint
- `your-admin-secret-from-phase-1` with your actual admin secret

### Step 3: Apply Metadata

```bash
# From the hasura directory
hasura metadata apply

# Expected output:
# Metadata applied successfully
```

### Step 4: Verify

```bash
# Check metadata status
hasura metadata diff

# Should show no differences if apply was successful
```

---

## Method 3: Using Hasura Metadata API

You can apply metadata programmatically using the API.

### Apply Metadata via curl

```bash
# Set your variables
HASURA_ENDPOINT="https://your-project.hasura.app"
ADMIN_SECRET="your-admin-secret"

# Apply metadata
curl -X POST \
  "${HASURA_ENDPOINT}/v1/metadata" \
  -H "Content-Type: application/json" \
  -H "x-hasura-admin-secret: ${ADMIN_SECRET}" \
  -d @hasura/metadata/metadata.json
```

---

## What This Metadata Configures

### 1. **Table Tracking**
All tables in the public schema are tracked:
- `members`
- `claims`
- `provider_records`
- `eligibility_checks`
- `notes`

### 2. **Relationships**
- `members.claims` (array relationship)
- `members.eligibility_checks` (array relationship)
- `claims.member` (object relationship)
- `claims.provider_record` (object relationship)
- `provider_records.claims` (array relationship)

### 3. **Apollo Federation** (for Phase 2+)
Federation enabled on:
- `members` table → `@key(fields: "id")`
- `provider_records` table → `@key(fields: "id")`
- `claims` table → `@key(fields: "id")`

This allows other subgraphs to reference these entities.

### 4. **Permissions**

**Member Role:**
- Can read their own member record
- Can read their own claims
- Can update their own profile (limited fields)

**Provider Role:**
- Can read members associated with their claims
- Can read their own provider record
- Can read claims they're associated with

### 5. **Custom Actions**
- `checkEligibility` action → calls eligibility service

---

## Verifying Metadata Applied Successfully

### Check 1: Tables Are Tracked

In Hasura Console → **Data** tab:
- You should see all tables listed in the sidebar
- Click on any table, you should see data

### Check 2: Relationships Exist

Click **"members"** table → **"Relationships"** tab:
- Should see `claims` relationship
- Should see `eligibility_checks` relationship

### Check 3: Federation Is Enabled

In Hasura Console → **API** tab:
```graphql
{
  _service {
    sdl
  }
}
```

Look for:
```graphql
type member_records @key(fields: "id") {
  id: uuid!
  # ...
}
```

### Check 4: Permissions Are Set

Click **"members"** table → **"Permissions"** tab:
- Should see `member` role with select/update permissions
- Should see `provider` role with select permissions

---

## Troubleshooting

### "Inconsistent metadata" error

**Cause:** Metadata references tables or objects that don't exist in your database.

**Solution:**
1. Ensure all tables are created (run Phase 1 SQL scripts)
2. Check table names match (case-sensitive)
3. Run `hasura metadata ic list` to see specific issues
4. Run `hasura metadata ic drop` to remove inconsistencies (careful!)

### "Permission denied" or "403 Forbidden"

**Cause:** Admin secret is incorrect.

**Solution:**
1. Verify admin secret in Hasura Cloud → Settings → Env vars
2. Update `config.yaml` or environment variable
3. Try again

### Metadata apply shows "No changes"

**Cause:** Metadata is already applied or matches current state.

**Solution:**
- This is actually good! Means metadata is already correct
- Run a test query to verify everything works

### Apollo Federation not working after metadata apply

**Cause:** Environment variable `HASURA_GRAPHQL_ENABLE_APOLLO_FEDERATION` not set.

**Solution:**
1. In Hasura Cloud → Settings → Env vars
2. Add `HASURA_GRAPHQL_ENABLE_APOLLO_FEDERATION=true`
3. Wait for Hasura to restart (10-15 seconds)
4. Verify with `{ _service { sdl } }` query

---

## When to Apply Metadata

**Phase 1 (Hasura Setup):**
- Apply metadata after creating tables
- This gives you relationships and permissions

**Phase 2 (Apollo Federation):**
- Metadata already includes federation config
- Just ensure `HASURA_GRAPHQL_ENABLE_APOLLO_FEDERATION=true` is set
- Federation should work automatically

**Phase 4 (Add Appointments to Federation):**
- No additional metadata needed
- Claims table already has federation enabled

**After Schema Changes:**
- If you modify tables, update metadata
- Export metadata: `hasura metadata export`
- Commit changes to git

---

## Alternative: Fresh Start Without Metadata Import

If you prefer to configure everything manually through the Hasura Console:

1. **Skip metadata import**
2. **Follow Phase 1 README** - Track tables, set relationships, configure permissions
3. **Follow Phase 2 README, Step 6.3** - Enable federation on tables
4. **Follow Phase 2 README, Step X** - Create eligibility action

This is more educational but takes longer.

---

## Best Practice: Version Control Your Metadata

After making changes in Hasura Console:

```bash
# Export current metadata
cd hasura
hasura metadata export

# Commit to git
git add metadata/
git commit -m "Update Hasura metadata: added new permission"
git push
```

This keeps your metadata in sync with your codebase!

---

## Summary

**Recommended approach for this project:**

```bash
# 1. Install Hasura CLI
npm install -g hasura-cli

# 2. Configure
cd hasura
# Edit config.yaml with your endpoint and secret

# 3. Apply metadata
hasura metadata apply

# 4. Verify
hasura metadata diff  # Should show no differences
```

**Benefits:**
- ✅ Federation pre-configured
- ✅ Relationships set up
- ✅ Permissions configured
- ✅ Actions created
- ✅ Consistent across environments
- ✅ Ready for Phase 2+ immediately

The metadata files in this repo are kept up-to-date with all phases, so you can apply them once and be ready for the entire tutorial!
