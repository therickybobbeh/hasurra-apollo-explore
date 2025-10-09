# Apollo Federation Concepts Guide

**A beginner-friendly guide to understanding GraphQL Federation**

This guide explains the core concepts of Apollo Federation used in [Phase 2](./README.md) of the ClaimSight deployment.

---

## Table of Contents

1. [What is GraphQL Federation?](#what-is-graphql-federation)
2. [Federation Architecture](#federation-architecture)
3. [Federation Directives](#federation-directives)
4. [Entity Resolution](#entity-resolution)
5. [Schema Composition](#schema-composition)
6. [Real-World Use Cases](#real-world-use-cases)
7. [When to Use Federation](#when-to-use-federation)
8. [Common Patterns](#common-patterns)
9. [Troubleshooting](#troubleshooting)

---

## What is GraphQL Federation?

### The Problem

Imagine you have a monolithic GraphQL API that manages everything:

```graphql
# One big schema for everything
type Member {
  id: ID!
  name: String
  claims: [Claim!]!
  notifications: [Notification!]!
  preferences: UserPreferences
  activityLog: [Activity!]!
}
```

**Problems with this approach:**
- 🐌 **Slow to develop**: Every team must coordinate schema changes
- 🔒 **Tightly coupled**: One database, one deployment, one point of failure
- 📈 **Hard to scale**: Can't scale different parts independently
- 👥 **Team bottlenecks**: Multiple teams blocking each other

### The Solution: Federation

**Federation lets you split one large GraphQL API into multiple smaller services:**

```
Before (Monolith):
┌────────────────────────────┐
│   One Giant GraphQL API    │
│  (Members, Claims, Notifs, │
│   Preferences, Logs, etc)  │
└────────────────────────────┘

After (Federation):
                ┌─────────────────┐
                │  Apollo Gateway │  ← Clients query ONE endpoint
                └────────┬────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   ┌────▼────┐     ┌────▼────┐     ┌────▼─────┐
   │ Members │     │ Claims  │     │  Notifs  │
   │ Service │     │ Service │     │  Service │
   └─────────┘     └─────────┘     └──────────┘
```

**Benefits:**
- ✅ **Teams work independently** - Each service has its own schema
- ✅ **Different tech stacks** - Members in Python, Claims in Node.js, Notifications in Go
- ✅ **Scale independently** - Scale notifications service without affecting others
- ✅ **Gradual migration** - Move from monolith to microservices one piece at a time

---

## Federation Architecture

### Components

#### 1. **Subgraphs** (Individual GraphQL Services)

Each subgraph is a standalone GraphQL API:

```graphql
# Members Subgraph (manages member data)
type Member @key(fields: "id") {
  id: ID!
  firstName: String!
  lastName: String!
  email: String!
}
```

```graphql
# Claims Subgraph (manages claims data)
type Claim @key(fields: "id") {
  id: ID!
  memberId: ID!
  amount: Int!
  status: ClaimStatus!
}

extend type Member @key(fields: "id") {
  id: ID! @external
  claims: [Claim!]!
}
```

**Key points:**
- Each subgraph can use different databases
- Deployed independently
- Owned by different teams
- Has its own schema, resolvers, data sources

#### 2. **Apollo Gateway** (The Orchestrator)

The gateway:
- Receives client queries
- Breaks queries into subgraph requests
- Calls the appropriate subgraphs
- Merges results into one response
- Returns to client

**Client doesn't know about subgraphs!** They just see one API.

#### 3. **Apollo GraphOS** (Optional - Schema Registry)

Cloud service that:
- Stores schema history
- Validates schema changes
- Monitors performance
- Provides observability

---

## Federation Directives

Federation uses special directives to describe how schemas relate.

### @key - Define Entities

**Purpose:** Marks a type as an "entity" that can be referenced across subgraphs.

```graphql
type Member @key(fields: "id") {
  id: ID!
  name: String
}
```

**What this means:**
- "You can identify a Member by its `id` field"
- Other subgraphs can reference this Member using just the `id`
- Gateway can fetch Member data from this subgraph given an `id`

**Real example from ClaimSight:**
```graphql
# Hasura Subgraph
type ProviderRecord @key(fields: "id") {
  id: ID!
  name: String
  specialty: String
  npi: String
}
```

Now other subgraphs can add fields to `ProviderRecord`!

---

### @extends - Extend External Types

**Purpose:** Add fields to a type defined in another subgraph.

```graphql
# Ratings Subgraph extends ProviderRecord from Hasura
extend type ProviderRecord @key(fields: "id") {
  id: ID! @external
  rating: Float
  reviewCount: Int
  reviews: [Review!]!
}
```

**What this does:**
1. "I'm adding fields to `ProviderRecord` (defined elsewhere)"
2. "I can identify ProviderRecords by their `id`"
3. "The `id` field is not stored here (`@external`)"
4. "I'm adding `rating`, `reviewCount`, `reviews` fields"

**Result:** Clients can query all fields in one request:
```graphql
{
  providerRecords {
    name       # From Hasura subgraph
    specialty  # From Hasura subgraph
    rating     # From Ratings subgraph! 🎉
    reviews {  # From Ratings subgraph! 🎉
      comment
    }
  }
}
```

---

### @external - Reference Field from Another Subgraph

**Purpose:** Indicates a field is defined in another subgraph, not this one.

```graphql
extend type ProviderRecord @key(fields: "id") {
  id: ID! @external    # This comes from Hasura, not here
  rating: Float        # This I define here
}
```

**Why needed?** So the subgraph knows "I need `id` to resolve my fields, but I don't own it."

---

### @requires - Depends on External Field

**Purpose:** This field needs data from another subgraph to resolve.

```graphql
extend type Member @key(fields: "id") {
  id: ID! @external
  email: String @external

  # Calculate discount based on email domain
  discount: Float @requires(fields: "email")
}
```

**What happens:**
1. Gateway fetches `Member.email` from Members subgraph
2. Passes `email` to Discounts subgraph
3. Discounts subgraph calculates discount based on email
4. Gateway returns both to client

---

### @provides - Optimize Fetching

**Purpose:** Tell the gateway "I can provide this external field, no need to fetch it separately."

```graphql
type Order @key(fields: "id") {
  id: ID!
  product: Product @provides(fields: "name price")
}

extend type Product @key(fields: "id") {
  id: ID! @external
  name: String @external
  price: Float @external
}
```

**Optimization:** When fetching `Order.product`, the Orders subgraph can include `name` and `price` without a second call to Products subgraph.

---

## Entity Resolution

**The magic of federation!** How does the gateway combine data from multiple subgraphs?

### Example Scenario

**Query:**
```graphql
{
  providerRecords(limit: 2) {
    id
    name      # From Hasura
    rating    # From Ratings subgraph
  }
}
```

### Step-by-Step Execution

**Step 1: Gateway receives query**
```
Gateway: "Client wants providerRecords with id, name, rating"
Gateway: "Let me check my composed schema..."
Gateway: "- providerRecords query → Hasura subgraph
          - id, name → Hasura subgraph
          - rating → Ratings subgraph"
```

**Step 2: Fetch from Hasura**
```
Gateway → Hasura: { providerRecords(limit: 2) { id name } }

Hasura → Gateway: {
  "data": {
    "providerRecords": [
      { "id": "123", "name": "Dr. Smith Cardiology Clinic" },
      { "id": "456", "name": "Dr. Jones Pediatrics" }
    ]
  }
}
```

**Step 3: Fetch ratings for each provider**

Gateway makes an **_entities** query to Ratings subgraph:

```
Gateway → Ratings: {
  _entities(representations: [
    { __typename: "ProviderRecord", id: "123" },
    { __typename: "ProviderRecord", id: "456" }
  ]) {
    ... on ProviderRecord {
      rating
    }
  }
}

Ratings → Gateway: {
  "data": {
    "_entities": [
      { "rating": 4.8 },
      { "rating": 4.2 }
    ]
  }
}
```

**Step 4: Gateway merges results**
```json
{
  "data": {
    "providerRecords": [
      { "id": "123", "name": "Dr. Smith Cardiology Clinic", "rating": 4.8 },
      { "id": "456", "name": "Dr. Jones Pediatrics", "rating": 4.2 }
    ]
  }
}
```

**Step 5: Return to client**

Client receives ONE response with data from TWO subgraphs!

### The _entities Query

Every federated subgraph must implement `_entities`:

```graphql
# Special query for federation
query {
  _entities(representations: [EntityRepresentation!]!) {
    ... on ProviderRecord { rating }
    ... on Member { preferences }
  }
}
```

**Purpose:** Given entity identifiers (like `{ id: "123" }`), return the requested fields.

**Implementation (simplified):**
```javascript
// Ratings subgraph
const resolvers = {
  Query: {
    _entities(parent, { representations }) {
      return representations.map((ref) => {
        if (ref.__typename === 'ProviderRecord') {
          return {
            __typename: 'ProviderRecord',
            ...ref,
            rating: getRating(ref.id),
            reviewCount: getReviewCount(ref.id)
          };
        }
      });
    }
  }
};
```

---

## Schema Composition

**How are subgraph schemas combined?**

### Example Subgraphs

**Hasura Subgraph:**
```graphql
type ProviderRecord @key(fields: "id") {
  id: ID!
  name: String!
  specialty: String!
  npi: String!
}

type Query {
  provider_records: [ProviderRecord!]!
}
```

**Ratings Subgraph:**
```graphql
extend type ProviderRecord @key(fields: "id") {
  id: ID! @external
  rating: Float
  reviewCount: Int
  reviews: [Review!]!
}

type Review {
  id: ID!
  rating: Int!
  comment: String
  createdAt: String
}
```

### Composed Supergraph

Apollo combines these into one schema:

```graphql
type ProviderRecord @key(fields: "id") {
  id: ID!
  name: String!        # From Hasura
  specialty: String!   # From Hasura
  npi: String!         # From Hasura
  rating: Float        # From Ratings
  reviewCount: Int     # From Ratings
  reviews: [Review!]!  # From Ratings
}

type Review {
  id: ID!
  rating: Int!
  comment: String
  createdAt: String
}

type Query {
  provider_records: [ProviderRecord!]!
}
```

**Clients see one unified schema!**

### Composition Rules

✅ **Allowed:**
- Different subgraphs can define different types
- Multiple subgraphs can contribute fields to the same type (with `@key`)
- Types can reference types from other subgraphs

❌ **Not Allowed:**
- Two subgraphs defining the same field (conflicts)
- Circular `@requires` dependencies
- `@key` fields must be non-nullable

---

## Real-World Use Cases

### Use Case 1: Microservices Migration

**Scenario:** Monolith → Microservices, but keep ONE GraphQL API

```
Step 1: Start with monolith
┌────────────────────┐
│  Monolith GraphQL  │
└────────────────────┘

Step 2: Add federation gateway
┌──────────┐
│  Gateway │
└────┬─────┘
     │
┌────▼────────────┐
│  Monolith (all) │
└─────────────────┘

Step 3: Extract one service
┌──────────┐
│  Gateway │
└────┬─────┘
     ├─────────────┐
┌────▼───────┐  ┌──▼───────┐
│  Monolith  │  │  Orders  │
│ (Members,  │  │  Service │
│  Claims)   │  │          │
└────────────┘  └──────────┘

Step 4: Continue extracting
┌──────────┐
│  Gateway │
└────┬─────┘
     ├──────┬───────┬──────┐
┌────▼──┐ ┌─▼────┐ ┌▼────┐ ┌▼─────┐
│Members│ │Claims│ │Order│ │Notify│
└───────┘ └──────┘ └─────┘ └──────┘
```

**Benefit:** Clients never change - they still query ONE endpoint!

---

### Use Case 2: Team Autonomy

**Scenario:** Multiple teams, each owning a domain

```
Frontend Team → Gateway
                   ├→ User Service (Team A)
                   ├→ Product Service (Team B)
                   ├→ Inventory Service (Team C)
                   └→ Analytics Service (Team D)
```

**Benefits:**
- Team A can deploy User Service independently
- Team B can change Product schema without asking Team A
- Each team uses their preferred database/tech stack

---

### Use Case 3: Third-Party Data Integration

**Scenario:** Combine internal + external APIs

```
Gateway
  ├→ Internal Members API (PostgreSQL)
  ├→ Internal Claims API (PostgreSQL)
  ├→ Stripe API (Payment data)
  └→ Twilio API (SMS notifications)
```

**Result:** One GraphQL query fetches data from internal DB + Stripe + Twilio!

---

## When to Use Federation

### ✅ Use Federation When:

1. **Multiple teams** - Different teams own different parts of the schema
2. **Different data sources** - Combining PostgreSQL + MongoDB + REST APIs
3. **Independent deployment** - Teams need to deploy without coordinating
4. **Scale independently** - Some services need more resources than others
5. **Gradual migration** - Moving from monolith to microservices

### ❌ Don't Use Federation When:

1. **Small project** - One team, one database, simple schema
2. **Tight coupling** - All data comes from one database
3. **No autonomy needed** - One team manages everything
4. **Latency critical** - Extra gateway hop adds ~10-50ms

### Alternative: Schema Stitching

**Federation vs. Schema Stitching:**

| Feature | Federation | Schema Stitching |
|---------|-----------|------------------|
| **Type merging** | Automatic with `@key` | Manual configuration |
| **Performance** | Optimized queries | Can over-fetch |
| **DX** | Declarative directives | Imperative code |
| **Apollo support** | First-class | Legacy |
| **Best for** | Microservices | Combining REST APIs |

**Recommendation:** Use Federation for new projects.

---

## Common Patterns

### Pattern 1: Base + Extensions

**Base Service** defines the entity:
```graphql
# Users Service
type User @key(fields: "id") {
  id: ID!
  email: String!
  name: String!
}
```

**Extension Services** add features:
```graphql
# Preferences Service
extend type User @key(fields: "id") {
  id: ID! @external
  theme: String
  language: String
}

# Activity Service
extend type User @key(fields: "id") {
  id: ID! @external
  lastActive: DateTime
  activityLog: [Activity!]!
}
```

---

### Pattern 2: Entity References

**Cross-service relationships:**

```graphql
# Orders Service
type Order @key(fields: "id") {
  id: ID!
  userId: ID!
  user: User  # References User from Users Service
}

extend type User @key(fields: "id") {
  id: ID! @external
  orders: [Order!]!
}
```

**Gateway automatically resolves `Order.user` by calling Users Service!**

---

### Pattern 3: Computed Fields with @requires

```graphql
# Pricing Service
extend type Product @key(fields: "id") {
  id: ID! @external
  price: Float @external
  taxRate: Float @external

  # Computed field needing external data
  totalPrice: Float @requires(fields: "price taxRate")
}
```

**Resolver:**
```javascript
{
  Product: {
    totalPrice(product) {
      return product.price * (1 + product.taxRate);
    }
  }
}
```

---

## Troubleshooting

### Error: "Cannot query field X on type Y"

**Cause:** Field not defined in schema or subgraph not registered.

**Solution:**
1. Check field exists in subgraph schema
2. Verify subgraph published to Apollo GraphOS
3. Check supergraph composition succeeded

---

### Error: "Composition failed"

**Cause:** Conflicting fields or missing `@key` directives.

**Solution:**
```bash
# View composition errors
rover subgraph check $APOLLO_GRAPH_REF \
  --name your-subgraph \
  --schema ./schema.graphql
```

Common issues:
- Two subgraphs define same field differently
- Entity missing `@key` directive
- `@external` field not marked correctly

---

### Error: "Entity missing __typename"

**Cause:** Subgraph not returning `__typename` in `_entities` response.

**Solution:**
```javascript
// Always include __typename in entity resolvers
{
  _entities(representations) {
    return representations.map(ref => ({
      __typename: ref.__typename,  // ← Must include!
      ...ref,
      // ... other fields
    }));
  }
}
```

---

### Performance: Too many subgraph calls

**Problem:** N+1 query problem across subgraphs.

**Solution:** Use DataLoader in subgraph resolvers:
```javascript
const DataLoader = require('dataloader');

const ratingsLoader = new DataLoader(async (providerIds) => {
  // Batch fetch ratings for all IDs
  const ratings = await getRatings(providerIds);
  return providerIds.map(id => ratings[id]);
});
```

---

## Next Steps

**Continue learning:**
1. Complete [Phase 2: Apollo GraphOS Setup](./README.md)
2. Explore [Apollo Federation Docs](https://www.apollographql.com/docs/federation/)
3. Try [Challenge 7: Federation](../../DOCUMENTS/CHALLENGES.md#challenge-7-apollo-federation)

**Ready to implement?**
- [Return to Phase 2 Guide](./README.md)
- [Deploy to production (Phase 3)](../render/README.md)

---

**Questions?** See the [main Federation Guide](../../DOCUMENTS/FEDERATION_GUIDE.md) for implementation details.
