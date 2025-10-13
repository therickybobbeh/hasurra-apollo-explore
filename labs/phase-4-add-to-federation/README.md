# Phase 4: Add Appointments to Federation

## 🎯 Learning Objectives

In this phase, you'll learn:
- How to enable Apollo Federation on an existing Apollo Server
- Writing federation directives (`@key`, `@extends`, `@external`)
- Entity reference resolvers (`__resolveReference`)
- Cross-subgraph relationships
- Querying across multiple services through a unified gateway
- Comparing federated vs standalone service architecture

## 📚 What You'll Build

Transform your standalone Appointments service (Phase 3) into a **federated subgraph** that integrates with:
- **Hasura subgraph**: Members, Claims, Providers
- **Providers subgraph**: Provider ratings and reviews
- **Appointments subgraph**: Appointments and billing (your service!)

After this phase, you'll query appointments alongside members and providers from a **single unified endpoint**.

---

## 🔄 Architecture: Before vs After

### Before (Phase 3):
```
Client → http://localhost:3004/graphql (Appointments only)
Client → http://localhost:8080/v1/graphql (Hasura only)
Client → http://localhost:3002/graphql (Providers only)
```

### After (Phase 4):
```
Client → http://localhost:4000/graphql → Gateway → {
  - Hasura (port 8080)
  - Providers (port 3002)
  - Appointments (port 3004)
}
```

**One endpoint. Three services. Unified schema.**

---

## 📋 Prerequisites

- ✅ Completed Phase 3 (Apollo Server from Scratch)
- ✅ Appointments service running on port 3004
- ✅ Hasura running on port 8080 with federation enabled
- ✅ Providers subgraph running on port 3002

---

## 🚀 Step 1: Install Federation Dependencies

The appointments service already has `@apollo/subgraph` installed. If starting from scratch, you would run:

```bash
cd app/appointments
npm install @apollo/subgraph
```

---

## 🚀 Step 2: Update Schema with Federation Directives

The schema has been updated to support federation. Key changes:

### app/appointments/src/schema/typeDefs.ts

```typescript
export const typeDefs = gql`
  # Scalar types - must match Hasura's types
  scalar uuid

  # Make Appointment an entity that can be referenced
  type Appointment @key(fields: "id") {
    id: ID!
    member_id: ID!
    provider_id: ID!
    appointment_date: String!
    status: AppointmentStatus!
    notes: String
    created_at: String!
    # Federation relationships - use Hasura's type names
    member: members
    provider: provider_records
  }

  # Reference external Member entity from Hasura
  # IMPORTANT: Use Hasura's table name 'members' (lowercase plural)
  # and uuid! type to match Hasura's schema
  type members @key(fields: "id", resolvable: false) @extends {
    id: uuid! @external
  }

  # Reference external Provider entity from Hasura
  # IMPORTANT: Hasura exposes as 'provider_records' (lowercase with _records suffix)
  type provider_records @key(fields: "id", resolvable: false) @extends {
    id: uuid! @external
  }

  # Make BillingRecord an entity
  type BillingRecord @key(fields: "id") {
    id: ID!
    claim_id: ID!
    amount_billed: Int!
    amount_paid: Int!
    payment_date: String
    payment_method: PaymentMethod
    created_at: String!
    # Federation relationship - use Hasura's type name
    claim: claims
  }

  # Reference external Claim entity from Hasura
  # IMPORTANT: Hasura exposes as 'claims' (lowercase plural)
  type claims @key(fields: "id", resolvable: false) @extends {
    id: uuid! @external
  }
`;
```

**Federation Directives Explained:**

- `@key(fields: "id")` - Makes a type an "entity" that can be referenced by other subgraphs
- `@key(fields: "id", resolvable: false)` - References an entity from another subgraph without resolving it here
- `@extends` - Indicates this type is defined in another subgraph (Hasura)
- `@external` - Marks fields that belong to another subgraph
- `scalar uuid` - Defines the uuid type to match Hasura's ID field type
- `member: members` - Adds relationship field using Hasura's exact type name

**Important Type Naming:**
- Hasura exposes tables as lowercase plurals: `members`, `claims`
- Hasura adds `_records` suffix to some tables: `provider_records`
- Federation requires exact type name matches across subgraphs
- Hasura uses `uuid!` for ID fields, not `ID!`

---

## 🚀 Step 3: Add Entity Reference Resolvers

The resolvers have been updated to support federation:

### app/appointments/src/resolvers/index.ts

```typescript
export const resolvers = {
  // Entity reference resolvers for Federation
  Appointment: {
    // Resolve appointment entity by ID
    __resolveReference: async (reference: { id: string }) => {
      const result = await query(
        'SELECT * FROM appointments.appointments WHERE id = $1',
        [reference.id]
      );
      return result.rows[0] || null;
    },
    // Return reference to Member entity (resolved by Hasura)
    // IMPORTANT: Use Hasura's type name 'members' (lowercase plural)
    member: (parent: any) => ({ __typename: 'members', id: parent.member_id }),
    // Return reference to Provider entity (resolved by Hasura/Providers)
    // IMPORTANT: Use Hasura's type name 'provider_records'
    provider: (parent: any) => ({ __typename: 'provider_records', id: parent.provider_id }),
  },

  BillingRecord: {
    __resolveReference: async (reference: { id: string }) => {
      const result = await query(
        'SELECT * FROM appointments.billing_records WHERE id = $1',
        [reference.id]
      );
      return result.rows[0] || null;
    },
    // Return reference to Claim entity (resolved by Hasura)
    // IMPORTANT: Use Hasura's type name 'claims' (lowercase plural)
    claim: (parent: any) => ({ __typename: 'claims', id: parent.claim_id }),
  },

  // ... rest of Query and Mutation resolvers
};
```

**Key Concepts:**

- `__resolveReference` - Called when another subgraph needs to resolve this entity
- Return `{ __typename, id }` - Creates a reference for the gateway to resolve
- Gateway automatically fetches related data from appropriate subgraphs

---

## 🚀 Step 4: Update Server to Use buildSubgraphSchema

The server has been updated to use federation:

### app/appointments/src/index.ts

```typescript
import { buildSubgraphSchema } from '@apollo/subgraph';

// Create Apollo Server with Federation support
const server = new ApolloServer({
  schema: buildSubgraphSchema({ typeDefs, resolvers }),
});
```

**What changed:**
- `buildSubgraphSchema()` - Wraps schema with federation metadata
- Enables `_service { sdl }` query for gateway introspection
- Adds `_entities` resolver for cross-subgraph queries

---

## 🚀 Step 5: Configure Gateway

The gateway has been updated to include the appointments subgraph:

### app/gateway/src/index.ts

```typescript
const APPOINTMENTS_URL = process.env.APPOINTMENTS_URL || 'http://localhost:3004/graphql';

const gateway = new ApolloGateway({
  supergraphSdl: new IntrospectAndCompose({
    subgraphs: [
      { name: 'hasura', url: `${HASURA_URL}/v1/graphql` },
      { name: 'providers', url: SUBGRAPH_URL },
      { name: 'appointments', url: APPOINTMENTS_URL },  // NEW!
    ],
    introspectionHeaders: {
      'x-hasura-admin-secret': HASURA_SECRET,
    },
  }),
  // ... rest of configuration
});
```

---

## 🚀 Step 6: Enable Claims Table Federation in Hasura

The appointments service references the `Claim` entity from Hasura for billing records. You need to enable federation on the claims table.

**Option 1: Hasura Console**

1. Open Hasura Console → **Data** → **public** → **claims**
2. Click **"Modify"** tab
3. Scroll to **"Enable Apollo Federation"**
4. Toggle switch to ON ✅
5. Click **"Save"**

**Option 2: Use Script**

```bash
# From project root
./scripts/configure-hasura-federation.sh
```

This script enables federation on members, providers, and claims tables.

**Verify:**

In Hasura Console → API tab:
```graphql
{
  _service {
    sdl
  }
}
```

Look for `@key(fields: "id")` on `claim_records` type. ✅

> **Note:** If you already ran the script in Phase 2, claims table is already configured!

**📖 See:** [Configure Hasura Federation Guide](../phase-2-apollo-federation/configure-hasura-federation.md)

---

## 🚀 Step 7: Add Environment Variables

Add the appointments URL to your `.env` file:

```bash
# Already exists from Phase 3
APPOINTMENTS_DATABASE_URL="postgresql://..."
APPOINTMENTS_PORT=3004

# NEW - for gateway to find appointments service
APPOINTMENTS_URL="http://localhost:3004/graphql"
```

---

## 🚀 Step 8: Install Dependencies

Install @apollo/subgraph if not already installed:

```bash
cd app/appointments
npm install
```

---

## 🚀 Step 9: Start All Services

You need to start THREE services for federation:

### Terminal 1: Hasura (from Phase 1)
```bash
# Already running from Phase 1
# Check: http://localhost:8080/console
```

### Terminal 2: Providers Subgraph (from Phase 2)
```bash
npm run server:dev
```

### Terminal 3: Appointments Subgraph (Phase 3)
```bash
npm run appointments:dev
```

### Terminal 4: Federation Gateway (Phase 2)
```bash
npm run gateway:dev
```

**Or use the combined command (recommended):**
```bash
npm run phase4:dev

# Alternative (same result)
npm run federated:dev
```

**This starts:**
- ✅ Action Handler (port 3001)
- ✅ Providers Subgraph (port 3002)
- ✅ Gateway (port 4000) - now connects to Hasura + Providers + Appointments
- ✅ Appointments Service (port 3004) - federated!
- ✅ Client (port 5173)

---

## 🧪 Step 10: Test Federated Queries

Navigate to: http://localhost:4000/graphql

### Test 1: Query Appointments with Member Details

```graphql
query AppointmentsWithMembers {
  appointments {
    id
    appointment_date
    status
    notes
    # Cross-subgraph query!
    member {
      first_name
      last_name
      dob  # Note: Hasura uses 'dob' not 'date_of_birth'
    }
  }
}
```

**What's happening:**
1. Gateway queries appointments subgraph for appointments
2. Gateway sees `member` field needs member data (Hasura's `members` type)
3. Gateway queries Hasura for member details
4. Gateway combines results into unified response

**Important:** Use `dob` not `date_of_birth` - this is Hasura's actual field name.

### Test 2: Query Member with Their Appointments

```graphql
query MemberWithAppointments {
  member_records(where: {id: {_eq: "550e8400-e29b-41d4-a716-446655440000"}}) {
    first_name
    last_name
    # This would require adding appointments field to Member in Hasura
  }
}
```

### Test 3: Query Appointments with Provider Ratings

```graphql
query AppointmentsWithProviderDetails {
  appointments {
    id
    appointment_date
    status
    # Cross-subgraph to Hasura
    provider {
      name
      specialty
      # Cross-subgraph to Providers subgraph
      rating
      reviewCount
      reviews {
        rating
        comment
        date
      }
    }
  }
}
```

**This query spans THREE subgraphs:**
- Appointments subgraph → appointment data
- Hasura subgraph → provider name/specialty
- Providers subgraph → ratings and reviews

### Test 4: Query Billing with Claim Details

```graphql
query BillingWithClaims {
  billingRecords {
    id
    amount_billed
    amount_paid
    payment_method
    # Cross-subgraph query!
    claim {
      claim_number
      service_date
      status
      diagnosis_code
    }
  }
}
```

---

## 🔍 Understanding Federation

### How Entity Resolution Works

1. **Query starts at gateway:**
   ```
   Client → Gateway (port 4000)
   ```

2. **Gateway determines execution plan:**
   ```
   appointments subgraph: Get appointments
   Hasura subgraph: Get member details for member_ids
   ```

3. **Gateway makes parallel requests:**
   ```
   GET /graphql (Appointments) → appointment data
   GET /v1/graphql (Hasura) → member data
   ```

4. **Gateway stitches results:**
   ```json
   {
     "appointments": [
       {
         "id": "...",
         "member": { "first_name": "John", "last_name": "Doe" }
       }
     ]
   }
   ```

### Federation Resolver Flow

```
1. appointments.member resolver returns:
   { __typename: 'Member', id: '550e8400-...' }

2. Gateway sees Member entity reference

3. Gateway calls Hasura's _entities resolver:
   _entities(representations: [
     { __typename: "Member", id: "550e8400-..." }
   ])

4. Hasura's Member.__resolveReference returns:
   { id: '550e8400-...', first_name: 'John', last_name: 'Doe', ... }

5. Gateway merges data into final response
```

---

## 🎓 Key Takeaways

### What You Learned:

1. ✅ **Federation Directives**
   - `@key` - Defines entity identity
   - `resolvable: false` - References external entities

2. ✅ **Reference Resolvers**
   - `__resolveReference` - Resolves entity by ID
   - Returns `{ __typename, id }` for cross-subgraph references

3. ✅ **Schema Composition**
   - `buildSubgraphSchema` - Wraps schema for federation
   - Gateway automatically composes multiple schemas

4. ✅ **Cross-Subgraph Queries**
   - Single query spans multiple services
   - Gateway handles orchestration automatically
   - No N+1 problem (gateway batches requests)

### Benefits of Federation:

- **Separation of Concerns**: Each service owns its domain
- **Independent Deployment**: Deploy appointments without touching Hasura
- **Team Autonomy**: Different teams can own different subgraphs
- **Single GraphQL Endpoint**: Clients don't know about multiple services
- **Type Safety**: Gateway validates cross-subgraph references

### Challenges:

- **Complexity**: More moving parts to manage
- **Debugging**: Errors can span multiple services
- **Performance**: Network overhead between services
- **Schema Coordination**: Breaking changes require coordination

---

## 🐛 Troubleshooting

### "Unable to resolve appointments subgraph"
- ✅ Ensure appointments service is running: `npm run appointments:dev`
- ✅ Check `APPOINTMENTS_URL` in `.env`
- ✅ Verify port 3004 is not in use

### "Cannot query field 'member' on type 'Appointment'"
- ✅ Ensure `buildSubgraphSchema` is used in appointments service
- ✅ Restart gateway after schema changes
- ✅ Check that Member entity exists in Hasura with `@key`

### "Field 'member' returned null"
- ✅ Check member_id exists in Hasura database
- ✅ Verify Hasura federation is enabled
- ✅ Check Hasura admin secret is set

### Gateway shows "composition errors"
- ✅ Ensure all services are running
- ✅ Check for conflicting field definitions
- ✅ Verify `@key` directives are consistent

### "Type of field 'members.id' is incompatible across subgraphs"

**Error message:**
```
Type of field "members.id" is incompatible across subgraphs:
it has type "ID!" in subgraph "appointments" but type "uuid!" in subgraph "hasura"
```

**Cause:** Appointments schema uses `ID!` but Hasura uses `uuid!` for ID fields.

**Solution:**
1. Add `scalar uuid` to your schema
2. Change entity reference types from `id: ID!` to `id: uuid!`:
   ```typescript
   type members @key(fields: "id", resolvable: false) @extends {
     id: uuid! @external  // Not ID!
   }
   ```
3. Do the same for `provider_records` and `claims` types
4. Restart appointments service and gateway

### "Cannot query field 'first_name' on type 'Member'"

**Cause:** Using wrong type name. Hasura exposes `members` (lowercase plural), not `Member` (singular capitalized).

**Solution:**
1. Update schema to use Hasura's exact type names:
   - `type members` not `type Member`
   - `type provider_records` not `type Provider`
   - `type claims` not `type Claim`
2. Update resolvers to return correct `__typename`:
   ```typescript
   member: (parent) => ({ __typename: 'members', id: parent.member_id })
   ```
3. Update Appointment type fields:
   ```typescript
   member: members  // not Member
   ```
4. Restart services

---

## 📊 Federation Query Patterns

### Pattern 1: Start from List, Expand Details
```graphql
# Start with appointments, expand to related entities
query {
  appointments {
    id
    member { first_name last_name }
    provider { name specialty }
  }
}
```

### Pattern 2: Start from Entity, Get Related
```graphql
# Start with member, get their appointments
query {
  member_records(where: {id: {_eq: "..."}}) {
    first_name
    # Would require adding appointments field to Hasura Member type
  }
}
```

### Pattern 3: Deep Cross-Subgraph
```graphql
# Span all three subgraphs in one query
query {
  appointments {
    member {
      first_name
      claims {
        claim_number
        billing_records {  # From appointments subgraph!
          amount_billed
          amount_paid
        }
      }
    }
  }
}
```

---

## ✅ Success Criteria

You've successfully completed Phase 4 when:

- [ ] Appointments service runs with federation enabled
- [ ] Gateway includes appointments subgraph
- [ ] Can query appointments from gateway (port 4000)
- [ ] Can query appointments with member details (cross-subgraph)
- [ ] Can query appointments with provider details (cross-subgraph)
- [ ] Can query billing records with claim details (cross-subgraph)
- [ ] Understand how `__resolveReference` works
- [ ] Understand federation query execution flow

---

## 🎉 Next Steps

**Continue to Phase 5**: [Hasura DDN](../phase-5-hasura-ddn/README.md)

In Phase 5, you'll:
- Explore Hasura Data Delivery Network (DDN)
- Compare DDN to Hasura Cloud
- Learn about modern data delivery patterns

---

## 📚 Additional Resources

- [Apollo Federation Documentation](https://www.apollographql.com/docs/federation/)
- [Entity Reference Resolvers](https://www.apollographql.com/docs/federation/entities/)
- [Schema Composition](https://www.apollographql.com/docs/federation/federated-types/composition/)
- [Federation Best Practices](https://www.apollographql.com/docs/federation/best-practices/)
