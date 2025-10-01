# Hasura GraphQL Engine Configuration

This directory contains Hasura metadata, migrations, and action handlers for ClaimSight.

## Structure

```
hasura/
  config.yaml.example    # Hasura CLI configuration template
  metadata/              # GraphQL metadata (tables, relationships, permissions)
  migrations/            # Database migrations (versioned schema changes)
  actions/               # Custom action handlers
    handlers/            # Node.js/Express handlers
    actions.yaml         # Action definitions
```

## Setup

### 1. Install Hasura CLI

**npm (recommended - cross-platform):**
```bash
npm install -g hasura-cli
```

**macOS:**
```bash
brew install hasura-cli
```

**Windows:**
Download from: https://hasura.io/docs/latest/hasura-cli/install-hasura-cli/

**Linux:**
```bash
curl -L https://github.com/hasura/graphql-engine/raw/stable/cli/get.sh | bash
```

### 2. Create config.yaml

```bash
cp config.yaml.example config.yaml
# Edit config.yaml with your endpoint and admin secret
```

### 3. Start Hasura GraphQL Engine

#### Option A: Hasura Cloud (Recommended)
1. Sign up at https://cloud.hasura.io/
2. Create a new project
3. Connect your PostgreSQL database
4. Update `config.yaml` with your cloud endpoint
5. Run `npm run hasura:apply`

#### Option B: Local Binary
Download Hasura GraphQL Engine binary:

**Windows:**
```powershell
# Download from https://github.com/hasura/graphql-engine/releases
# Extract and run:
.\graphql-engine.exe serve
```

**macOS/Linux:**
```bash
# Download binary
curl -L https://github.com/hasura/graphql-engine/releases/latest/download/cli-hasura-linux-amd64 -o hasura-engine

# Make executable
chmod +x hasura-engine

# Run
HASURA_GRAPHQL_DATABASE_URL=postgresql://user:password@localhost:5432/claimsight \
HASURA_GRAPHQL_ENABLE_CONSOLE=true \
HASURA_GRAPHQL_ADMIN_SECRET=your_secret \
./hasura-engine serve
```

## Applying Metadata and Migrations

Use the cross-platform npm script:

```bash
npm run hasura:apply
```

Or manually:

```bash
cd hasura
hasura migrate apply --database-name default
hasura metadata apply
hasura metadata reload
```

## GraphQL Schema

### Tables

- **members** - Health plan members
- **providers** - Healthcare providers
- **claims** - Medical claims
- **eligibility_checks** - Eligibility verification results
- **notes** - Case management notes

### Relationships

- `members` ↔ `claims` (one-to-many)
- `providers` ↔ `claims` (one-to-many)
- `members` ↔ `notes` (one-to-many)
- `members` ↔ `eligibility_checks` (one-to-many)

### Permissions (RLS)

#### Roles

1. **admin** - Full access to all tables
2. **member** - Scoped to own data via `x-hasura-user-id`
3. **provider** - Scoped to own claims via `x-hasura-provider-id`

#### Testing Roles

In Hasura Console, set request headers:

**Admin:**
```json
{
  "x-hasura-admin-secret": "your_secret"
}
```

**Member:**
```json
{
  "x-hasura-role": "member",
  "x-hasura-user-id": "member-uuid-here"
}
```

**Provider:**
```json
{
  "x-hasura-role": "provider",
  "x-hasura-provider-id": "provider-uuid-here"
}
```

### Actions

#### submitEligibilityCheck

Custom action that calls an external REST API (mock) to verify member eligibility.

**Definition:**
```graphql
type Mutation {
  submitEligibilityCheck(memberId: uuid!): EligibilityCheck!
}
```

**Handler:** `hasura/actions/handlers/eligibility.mock.ts`

**Usage:**
```graphql
mutation {
  submitEligibilityCheck(memberId: "uuid-here") {
    id
    member_id
    checked_at
    result
  }
}
```

### Subscriptions

Subscriptions are enabled on the `claims` table for real-time updates.

**Example:**
```graphql
subscription WatchClaims($memberId: uuid!) {
  claims(
    where: { member_id: { _eq: $memberId } }
    order_by: { dos: desc }
  ) {
    id
    status
    dos
    cpt
    charge_cents
    allowed_cents
  }
}
```

## Development Workflow

### 1. Make Schema Changes

Edit SQL files in `db/` directory, then create a migration:

```bash
cd hasura
hasura migrate create "add_new_table" --database-name default --sql-from-file ../db/my-change.sql
```

### 2. Update Metadata

After changing relationships or permissions in the Hasura Console:

```bash
cd hasura
hasura metadata export
```

This updates the `metadata/` directory. Commit these changes to version control.

### 3. Track Tables

```bash
hasura metadata apply
```

## Hasura Console

Access the Hasura Console at:
```
http://localhost:8080/console
```

Use your admin secret to authenticate.

### Console Features

- **GraphiQL**: Test queries, mutations, and subscriptions
- **Data**: Browse and edit table data
- **Actions**: Manage custom actions
- **Remote Schemas**: Add external GraphQL APIs
- **Events**: Configure event triggers
- **API Explorer**: View generated API documentation

## Troubleshooting

### Connection Refused

Ensure PostgreSQL is running and `HASURA_GRAPHQL_DATABASE_URL` is correct.

### Metadata Apply Failed

Check that database schema exists:
```bash
npm run seed  # This creates schema + data
```

### Permission Denied

Ensure database user has appropriate permissions:
```sql
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO claimsight;
```

### Action Handler Unreachable

Start the action handler:
```bash
npm run action:dev
```

Ensure `ACTION_HANDLER_URL` in `.env` matches the handler's address.

### RLS Blocks All Queries

Make sure you're using the correct role and session variables. The database expects specific headers.

For development, use `admin` role or set appropriate `x-hasura-user-id` / `x-hasura-provider-id`.

## Production Deployment

For production:

1. **Use Hasura Cloud** (easiest) or self-host with proper security
2. **Set strong admin secret**: Generate with `openssl rand -hex 32`
3. **Enable HTTPS**: Never use HTTP in production
4. **Configure CORS**: Restrict allowed origins
5. **Use connection pooling**: Configure in Hasura Cloud or use PgBouncer
6. **Enable rate limiting**: Protect against abuse
7. **Set up monitoring**: Use Hasura Cloud metrics or Prometheus
8. **Backup metadata**: Regularly export with `hasura metadata export`

## Resources

- [Hasura Docs](https://hasura.io/docs/latest/index/)
- [Hasura CLI Reference](https://hasura.io/docs/latest/hasura-cli/overview/)
- [GraphQL Best Practices](https://graphql.org/learn/best-practices/)
