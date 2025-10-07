# Hasura Subgraph Overview

The Hasura subgraph provides **database operations** for core healthcare entities.

---

## What is Hasura?

Hasura automatically generates a GraphQL API from your PostgreSQL database schema. No resolvers needed!

**Key Features**:
- ✅ Auto-generated CRUD operations
- ✅ Relationship traversal
- ✅ Real-time subscriptions
- ✅ Row-level security (RLS)
- ✅ Aggregations and filtering
- ✅ Apollo Federation support (v2.10.0+)

---

## Architecture

```
┌─────────────────────────────────────────────┐
│  Federation Gateway (Port 4000)             │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│  Hasura Subgraph (Port 8080)                │
│  - Auto-generated from PostgreSQL           │
│  - Database operations (CRUD)               │
│  - Relationships, subscriptions, RLS        │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│  PostgreSQL Database                        │
│  - members, claims, eligibility_checks      │
│  - notes, provider_records                  │
│  - Row-level security policies              │
└─────────────────────────────────────────────┘
```

---

## Entities (Tables)

### Members

**Table**: `members`
**Description**: Healthcare plan members/patients

**Fields**:
- `id` (UUID, PK)
- `member_id` (String, unique identifier)
- `first_name`, `last_name`
- `dob` (Date of birth)
- `created_at`, `updated_at`

**Relationships**:
- `claims` → All claims for this member
- `eligibility_checks` → Eligibility verification history

**Use Cases**:
- Member profile management
- Member search
- Claims history for a member

---

### Claims

**Table**: `claims`
**Description**: Healthcare claims submitted for services

**Fields**:
- `id` (UUID, PK)
- `member_id` (UUID, FK → members)
- `provider_id` (UUID, FK → provider_records)
- `cpt` (Procedure code)
- `status` (pending, approved, denied)
- `billed_amount` (Decimal)
- `service_date` (Date)
- `created_at`, `updated_at`

**Relationships**:
- `member` → The member who received service
- `provider_record` → The provider who rendered service
- `notes` → Notes added to this claim

**Use Cases**:
- Claims processing
- Status tracking
- Financial reporting

---

### Eligibility Checks

**Table**: `eligibility_checks`
**Description**: Member eligibility verification records

**Fields**:
- `id` (UUID, PK)
- `member_id` (UUID, FK → members)
- `service_date` (Date)
- `cpt` (Procedure code)
- `eligible` (Boolean)
- `reason` (String)
- `checked_at` (Timestamp)

**Relationships**:
- `member` → The member whose eligibility was checked

**Use Cases**:
- Pre-authorization
- Eligibility history
- Coverage verification

---

### Notes

**Table**: `notes`
**Description**: Comments/notes attached to claims

**Fields**:
- `id` (UUID, PK)
- `claim_id` (UUID, FK → claims)
- `note` (Text)
- `created_by` (String)
- `created_at` (Timestamp)

**Relationships**:
- `claim` → The claim this note belongs to

**Use Cases**:
- Claim annotations
- Audit trail
- Communication log

---

### Provider Records

**Table**: `provider_records`
**Description**: Healthcare provider database records

**Fields**:
- `id` (UUID, PK)
- `name` (String)
- `specialty` (String)
- `npi` (String, National Provider Identifier)
- `phone`, `email`, `address`
- `created_at`, `updated_at`

**Relationships**:
- `claims` → All claims for this provider

**Use Cases**:
- Provider directory
- Claims assignment
- Provider search

**Note**: This table was renamed from `providers` to avoid conflict with the federated `Provider` type. See [Federation Guide](../../../DOCUMENTS/FEDERATION_GUIDE.md).

---

## Generated Operations

Hasura auto-generates the following for each table:

### Queries

| Operation | Description | Example |
|-----------|-------------|---------|
| `<table>` | Get all rows | `claims { id }` |
| `<table>_by_pk` | Get by primary key | `members_by_pk(id: "uuid")` |
| `<table>_aggregate` | Aggregations | `claims_aggregate { aggregate { count } }` |

### Mutations

| Operation | Description | Example |
|-----------|-------------|---------|
| `insert_<table>` | Insert multiple rows | `insert_claims(objects: [...])` |
| `insert_<table>_one` | Insert single row | `insert_notes_one(object: {...})` |
| `update_<table>` | Update with where clause | `update_claims(where: {...}, _set: {...})` |
| `update_<table>_by_pk` | Update by primary key | `update_claims_by_pk(pk_columns: {...}, _set: {...})` |
| `delete_<table>` | Delete with where clause | `delete_notes(where: {...})` |
| `delete_<table>_by_pk` | Delete by primary key | `delete_notes_by_pk(id: "uuid")` |

### Subscriptions

| Operation | Description |
|-----------|-------------|
| `<table>` | Subscribe to table changes | `subscription { claims { id } }` |

---

## Custom Actions

Hasura actions call external REST APIs for custom business logic:

### checkEligibility

**Type**: Mutation
**Description**: Verify member eligibility for a service
**Handler**: `hasura/actions/handlers/eligibility.mock.ts`

```graphql
mutation CheckEligibility($input: CheckEligibilityInput!) {
  checkEligibility(input: $input) {
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

See [`hasura/metadata/actions.yaml`](../../../hasura/metadata/actions.yaml) for configuration.

---

## Permissions & RLS

Access control is enforced at the **database level** using PostgreSQL Row-Level Security.

### Admin Role

**Access**: Full (no restrictions)

### Member Role

**Access**: Own data only
- Can view own profile and claims
- Cannot modify claims

### Provider Role

**Access**: Assigned claims only
- Can view claims assigned to them
- Can update claim status

See [Authentication Guide](../../guides/authentication.md) for details.

---

## Federation Support

Hasura v2.10.0+ supports Apollo Federation with the `HASURA_GRAPHQL_ENABLE_APOLLO_FEDERATION=true` environment variable.

**What This Enables**:
- `_service { sdl }` field for schema introspection
- Can be included as a subgraph in federation gateway
- Works alongside federated Apollo subgraphs

**Limitation**: Hasura types **cannot be extended** by Apollo subgraphs. This is why:
- `providers` table was renamed to `provider_records`
- Federated `Provider` type is defined in a separate Apollo subgraph

See [Federation Guide](../../../DOCUMENTS/FEDERATION_GUIDE.md).

---

## Example Queries

See [queries.md](./queries.md) for comprehensive examples.

---

## Accessing Hasura Console

**Development**:
```
http://localhost:8080/console
```

**Features**:
- GraphiQL API explorer
- Database schema editor
- Permissions editor
- Event triggers
- Remote schemas

---

## Schema Files

| File | Description |
|------|-------------|
| `hasura/migrations/` | Database schema migrations |
| `hasura/metadata/` | Hasura configuration (tables, relationships, permissions) |
| `hasura/seeds/` | Sample data |
| `db/rls.sql` | Row-level security policies |

---

## Next Steps

- **[Query Examples](./queries.md)** - Domain-specific queries
- **[Common Patterns](../../guides/common-patterns.md)** - Filtering, pagination, aggregation
- **[Authentication](../../guides/authentication.md)** - Role-based access control

