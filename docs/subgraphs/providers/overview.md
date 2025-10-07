# Providers Subgraph Overview

The Providers subgraph demonstrates **TRUE Apollo Federation** with the `@key` directive.

---

## What is the Providers Subgraph?

A custom Apollo Server that defines a federated `Provider` type with ratings and reviews.

**Key Features**:
- ✅ Apollo Federation v2 with `@key` directive
- ✅ Entity resolution via `__resolveReference`
- ✅ Provider ratings and reviews
- ✅ Extensible pattern for other subgraphs

---

## Architecture

```
┌─────────────────────────────────────────────┐
│  Federation Gateway (Port 4000)             │
│  - IntrospectAndCompose                     │
│  - Entity Resolution                        │
└────────────┬───────────────┬────────────────┘
             │               │
             ▼               ▼
┌────────────────┐   ┌───────────────────────┐
│ Hasura (8080)  │   │ Providers Subgraph    │
│                │   │ (Port 3002)           │
│ provider_      │   │                       │
│ records        │   │ Provider (@key: "id") │
│ (database)     │   │ • rating              │
└────────────────┘   │ • ratingCount         │
                     │ • reviews             │
                     │                       │
                     │ Entity resolution via │
                     │ __resolveReference    │
                     └───────────────────────┘
```

---

## Why a Separate Subgraph?

### Hasura Limitation

**Hasura v2/v3 types cannot be extended by Apollo subgraphs.** This means:

❌ **Cannot do**:
```graphql
# This DOESN'T work with Hasura
extend type providers @key(fields: "id") {
  id: ID! @external
  rating: Float  # Cannot add this to Hasura type
}
```

✅ **Solution**: Create standalone federated type
```graphql
# Providers subgraph defines its own Provider type
type Provider @key(fields: "id") {
  id: ID!
  name: String!
  specialty: String!
  npi: String!
  rating: Float
  ratingCount: Int
  reviews: [Review!]!
}
```

### Migration Pattern

This demonstrates a **real-world migration scenario**:

1. **Hasura** owns `provider_records` table (database operations)
2. **Providers subgraph** provides federated `Provider` type with enriched data
3. **Gateway** combines both into one unified API
4. **Frontend** queries through gateway (port 4000) for complete Provider data

Future: Other services can extend `Provider` type with additional fields (availability, credentials, etc.).

---

## Types

### Provider

**Federated entity** with `@key(fields: "id")`

**Fields**:
- `id` (ID!) - Provider unique identifier
- `name` (String!) - Provider full name
- `specialty` (String!) - Medical specialty
- `npi` (String!) - National Provider Identifier
- `rating` (Float) - Average rating (1-5 stars)
- `ratingCount` (Int) - Number of reviews
- `reviews` ([Review!]!) - All reviews for this provider

**Resolution**:
- Gateway calls `__resolveReference({ id })` to fetch provider data
- Subgraph returns provider with ratings information
- Gateway merges with data from other subgraphs (if any)

---

### Review

**Fields**:
- `id` (ID!) - Review unique identifier
- `providerId` (ID!) - Associated provider ID
- `rating` (Int!) - Star rating (1-5)
- `comment` (String) - Review text
- `date` (String!) - ISO 8601 date

---

## How Federation Works

### 1. Gateway Receives Query

```graphql
query GetProviders {
  providers {
    id
    name
    rating
  }
}
```

### 2. Gateway Queries Providers Subgraph

The gateway calls the `providers` query to get base provider data:

```graphql
{
  providers {
    id
    name
    specialty
    npi
    rating
    ratingCount
    reviews {
      rating
      comment
    }
  }
}
```

### 3. Subgraph Resolves

**Provider Query Resolver** (`app/server/src/index.ts:resolvers.Query.providers`):
```typescript
providers() {
  return providers.map(provider => {
    const ratingInfo = ratingsData.ratings[provider.id];
    return {
      ...provider,
      ...ratingInfo,
    };
  });
}
```

### 4. Entity Resolution (For Extensions)

If another subgraph needed to extend `Provider`, the gateway would call:

```graphql
query($_representations: [_Any!]!) {
  _entities(representations: $_representations) {
    ... on Provider {
      id
      rating
      reviews {
        rating
      }
    }
  }
}
```

With representations:
```json
{
  "_representations": [
    { "__typename": "Provider", "id": "provider-uuid-1" },
    { "__typename": "Provider", "id": "provider-uuid-2" }
  ]
}
```

**Entity Reference Resolver** (`app/server/src/index.ts:resolvers.Provider.__resolveReference`):
```typescript
__resolveReference(reference: { id: string }) {
  const provider = providers.find(p => p.id === reference.id);
  const ratingInfo = ratingsData.ratings[reference.id];

  if (!provider) {
    return { id: reference.id, rating: null, ratingCount: 0, reviews: [] };
  }

  return {
    ...provider,
    ...ratingInfo,
  };
}
```

---

## Data Source

Currently using **mock data** in `app/server/src/data/`:

- `providers.ts` - Base provider information
- `ratings.ts` - Provider ratings and reviews

**Future Enhancement**: Replace with real database or API calls.

---

## Schema Definition

From `app/server/src/schema.graphql`:

```graphql
extend schema
  @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key", "@external"])

type Provider @key(fields: "id") {
  id: ID! @external
  rating: Float
  ratingCount: Int
  reviews: [Review!]!
}

type Review {
  id: ID!
  providerId: ID!
  rating: Int!
  comment: String
  date: String!
}

type Query {
  _empty: String
}
```

**Key Directives**:
- `@key(fields: "id")` - Makes `Provider` a federated entity resolvable by `id`
- `@external` - Marks `id` as defined in another subgraph (or base data)

---

## Deployment

### Development

```bash
# Start providers subgraph
npm run subgraph:dev

# Runs on http://localhost:3002/graphql
```

### Production

Deploy to Render/Railway:

1. Deploy `app/server/` as web service
2. Set environment: `PORT=10000`, `NODE_ENV=production`
3. Update gateway `SUBGRAPH_URL` to deployed endpoint

See [Cloud Deployment Guide](../../../DOCUMENTS/CLOUD_DEPLOYMENT.md).

---

## Extending the Pattern

### Adding More Fields to Provider

Edit `app/server/src/index.ts`:

```typescript
type Provider @key(fields: "id") {
  id: ID!
  name: String!
  specialty: String!
  npi: String!
  rating: Float
  ratingCount: Int
  reviews: [Review!]!

  # NEW FIELDS
  availability: [TimeSlot!]!  # Appointment slots
  credentials: [Credential!]! # Board certifications
}
```

### Creating Additional Subgraphs

**Example: Scheduling Subgraph**

```graphql
# Scheduling subgraph extends Provider
extend type Provider @key(fields: "id") {
  id: ID! @external
  availability: [TimeSlot!]!
}

type TimeSlot {
  date: String!
  time: String!
  available: Boolean!
}
```

Gateway automatically composes both subgraphs!

---

## File References

| File | Description |
|------|-------------|
| `app/server/src/index.ts` | Subgraph server, resolvers |
| `app/server/src/schema.graphql` | Federation schema definition |
| `app/server/src/data/providers.ts` | Provider mock data |
| `app/server/src/data/ratings.ts` | Ratings mock data |
| `app/server/package.json` | Dependencies |

---

## Testing the Subgraph

### Direct Subgraph Query

```bash
curl http://localhost:3002/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ providers { id name rating } }"}'
```

### Federation Schema Introspection

```bash
curl http://localhost:3002/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ _service { sdl } }"}'
```

Should return the federated schema with `@key` directive.

### Entity Resolution Test

```bash
curl http://localhost:3002/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query($reps: [_Any!]!) { _entities(representations: $reps) { ... on Provider { id rating } } }",
    "variables": {
      "reps": [
        { "__typename": "Provider", "id": "provider-uuid-here" }
      ]
    }
  }'
```

---

## Next Steps

- **[Query Examples](./queries.md)** - Provider rating queries
- **[Federation Guide](../../../DOCUMENTS/FEDERATION_GUIDE.md)** - Deep dive into federation
- **[Hasura Subgraph](../hasura/overview.md)** - Database operations

