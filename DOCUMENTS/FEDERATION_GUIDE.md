# Apollo Federation Guide

Complete guide to understanding and using Apollo Federation in ClaimSight. Learn TRUE federation with type extension across services.

---

## What is Apollo Federation?

**Apollo Federation** allows you to split a GraphQL type across multiple services and combine them through a gateway using entity resolution.

### In ClaimSight (Federation + Hasura):

```
┌─────────────────────────────────────────────────────┐
│         Apollo Federation Gateway (Port 4000)       │
│         - IntrospectAndCompose                      │
│         - Entity Resolution                         │
│         - Query Planning                            │
│         - ONE unified endpoint for everything       │
└──────────────┬─────────────────────┬────────────────┘
               │                     │
       ┌───────▼────────┐   ┌───────▼────────────┐
       │  Hasura (8080) │   │ Providers (3002)   │
       │                │   │                    │
       │ • Members      │   │ Provider (@key id) │
       │ • Claims       │   │ • id               │
       │ • Eligibility  │   │ • name             │
       │ • Notes        │   │ • specialty        │
       │ • provider_    │   │ • npi              │
       │   records*     │   │ • rating           │
       │                │   │ • reviews          │
       └────────────────┘   └────────────────────┘
```

**Key Concepts**:
- **Providers subgraph** defines `Provider` type with `@key(fields: "id")` - TRUE federation!
- **Hasura** provides database operations (members, claims, eligibility, provider_records)
- **Gateway** combines both into one unified endpoint
- **provider_records*** was renamed to avoid conflict (see limitation below)

**⚠️ Important Limitation**: Hasura v2/v3 types **cannot be extended** by Apollo subgraphs. This is why we:
1. Renamed Hasura's `providers` → `provider_records`
2. Created a standalone federated `Provider` type in a custom subgraph
3. This demonstrates a real-world migration pattern!

---

## Quick Start

### 1. Install Dependencies

```bash
# Install gateway dependencies
cd app/gateway
npm install
cd ../..

# Install subgraph dependencies (if not done)
cd app/server
npm install
cd ../..
```

### 2. Start Federated Services

```bash
# Start everything: action handler, subgraph, gateway, and client
npm run federated:dev
```

This starts:
- **Action Handler** (port 3001) - Eligibility checks
- **Subgraph** (port 3002) - Provider ratings
- **Gateway** (port 4000) - **Federated endpoint** ⭐
- **Client** (port 5173) - React app

### 3. Enable Hasura Federation

Add to your `.env` file:
```env
HASURA_GRAPHQL_ENABLE_APOLLO_FEDERATION=true
```

Then restart Hasura. It will now expose `_service` field and support federation!

### 4. Query the Federated Graph

Open http://localhost:4000/graphql and try this query:

```graphql
query ProviderWithRatings {
  providers(limit: 10) {
    id            # From Hasura
    name          # From Hasura
    specialty     # From Hasura
    npi           # From Hasura
    rating        # From ratings subgraph (via entity resolution!)
    ratingCount   # From ratings subgraph
    reviews {     # From ratings subgraph
      rating
      comment
      date
    }
  }
}
```

**The magic**: One query, two services! Gateway fetches base Provider from Hasura, then enriches each with ratings from the subgraph.

---

## How It Works (Entity Resolution)

### Provider Type Split Across Services

**Hasura defines base Provider:**
```graphql
type Provider {
  id: ID!
  name: String!
  specialty: String
  npi: String
  # ... from database
}
```

**Ratings subgraph extends Provider:**
```graphql
extend schema
  @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key", "@external"])

type Provider @key(fields: "id") {
  id: ID! @external    # References Hasura's Provider.id
  rating: Float        # NEW field
  ratingCount: Int     # NEW field
  reviews: [Review!]!  # NEW field
}
```

**Gateway merges them** into one unified Provider type!

### Entity Resolution Flow

When you query `providers { name, rating }`:

1. **Gateway** receives query and analyzes which fields come from which subgraph
2. Gateway queries **Hasura** for providers: `{ id, name, specialty, npi }`
3. **Hasura** returns: `[{ id: "734f...", name: "Dr. Smith", ... }]`
4. Gateway sees you also want `rating` (from ratings subgraph)
5. Gateway calls **ratings subgraph** with: `_entities([{ __typename: "Provider", id: "734f..." }])`
6. **Ratings subgraph** runs `__resolveReference({ id: "734f..." })` to look up rating data
7. Ratings subgraph returns: `{ id: "734f...", rating: 4.7, ratingCount: 124, reviews: [...] }`
8. **Gateway** merges results: `{ id: "734f...", name: "Dr. Smith", rating: 4.7, ... }`
9. Returns unified Provider to client!

---

## Architecture Deep Dive

### Subgraph (app/server/)

```typescript
import { buildSubgraphSchema } from '@apollo/subgraph';

const typeDefs = gql`
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
    rating: Int!
    comment: String
    date: String!
  }

  type Query {
    _empty: String
  }
`;

const resolvers = {
  Query: {
    _empty: () => 'This subgraph extends Provider from Hasura'
  },
  Provider: {
    __resolveReference(reference: { id: string }) {
      // Gateway passes provider ID from Hasura
      // We look up rating data for that provider
      const ratingInfo = ratingsData.ratings[reference.id];
      if (!ratingInfo) {
        return { id: reference.id, rating: null, ratingCount: 0, reviews: [] };
      }
      return {
        id: reference.id,
        ...ratingInfo
      };
    }
  }
};

const schema = buildSubgraphSchema([{ typeDefs, resolvers }]);
const server = new ApolloServer({ schema });
```

**Key concepts:**
- `@key(fields: "id")` - Makes Provider an entity that can be resolved by ID
- `@external` - Marks `id` field as defined in another subgraph (Hasura)
- `__resolveReference` - Special resolver that gateway calls to enrich Provider
- No Query.providers - This subgraph doesn't query providers, it extends them!

### Gateway (app/gateway/)

```typescript
import { ApolloGateway, IntrospectAndCompose } from '@apollo/gateway';

const gateway = new ApolloGateway({
  supergraphSdl: new IntrospectAndCompose({
    subgraphs: [
      {
        name: 'hasura',
        url: 'http://localhost:8080/v1/graphql',
        headers: {
          'x-hasura-admin-secret': process.env.HASURA_GRAPHQL_ADMIN_SECRET,
        },
      },
      {
        name: 'ratings',
        url: 'http://localhost:3002/graphql',
      },
    ],
  }),
  debug: true
});

const server = new ApolloServer({ gateway });
```

**IntrospectAndCompose** = Easy development mode
- Auto-discovers both Hasura's and ratings subgraph schemas on startup
- Composes supergraph automatically, merging Provider type
- Handles entity resolution transparently
- Perfect for learning federation concepts

**Key:** Hasura needs `HASURA_GRAPHQL_ENABLE_APOLLO_FEDERATION=true` to expose `_service` field!

---

## Apollo Studio Integration 🎨

### Setup (Free Tier)

1. **Sign up**: https://studio.apollographql.com/
2. **Create a graph**:
   ```bash
   # Install Rover CLI
   npm install -g @apollo/rover
   
   # Login to Apollo Studio
   rover config auth
   ```

3. **Publish subgraph schemas**:
   ```bash
   # Set your graph ref (from Apollo Studio)
   export APOLLO_GRAPH_REF=your-graph@current
   
   # Publish Hasura schema
   rover subgraph publish $APOLLO_GRAPH_REF \
     --name hasura \
     --schema hasura-schema.graphql \
     --routing-url http://localhost:8080/v1/graphql
   
   # Publish ratings schema
   rover subgraph publish $APOLLO_GRAPH_REF \
     --name ratings \
     --schema app/server/schema.graphql \
     --routing-url http://localhost:3002/graphql
   ```

4. **View in Studio**:
   - Open your graph in Apollo Studio
   - Navigate to **Schema** → **Reference**
   - See your federated schema!

### What You'll See

**Schema View:**
```
Provider
├── id: ID!
├── name: String! ────────── Hasura
├── specialty: String ───────┘
├── rating: Float ────────── Ratings subgraph
├── ratingCount: Int ────────┤
└── reviews: [Review!]! ─────┘
```

**Explorer Tab:**
- Interactive query builder
- Auto-complete with federated fields
- Query tracing and performance

**Metrics Tab:**
- Query execution time
- Field usage statistics
- Error rates

---

## Development Workflow

### Option 1: Direct Hasura (Simple)

```bash
npm run dev
```

Client connects directly to Hasura. No federation.

### Option 2: Federated (Full Features)

```bash
npm run federated:dev
```

Client uses gateway. All subgraphs available.

### Switching Client to Use Gateway

Edit `.env`:
```env
# Use gateway instead of Hasura direct
VITE_GRAPHQL_HTTP_URL=http://localhost:4000/graphql
VITE_GRAPHQL_WS_URL=ws://localhost:4000/graphql
```

Now the React app queries through the federation gateway!

---

## Example Queries

### Query Provider Ratings

```graphql
query GetProviderRatings($providerId: uuid!) {
  providers_by_pk(id: $providerId) {
    id
    name
    specialty
    npi
    # Federation fields:
    rating
    ratingCount
    reviews {
      id
      rating
      comment
      date
    }
  }
}
```

### Query Claims with Provider Ratings

```graphql
query ClaimsWithProviderRatings {
  claims(limit: 10) {
    id
    cpt
    status
    provider {
      name
      specialty
      # Federation fields:
      rating
      reviews(limit: 3) {
        rating
        comment
      }
    }
  }
}
```

### Aggregate Ratings

```graphql
query TopRatedProviders {
  providers(order_by: { rating: desc_nulls_last }, limit: 5) {
    name
    rating
    ratingCount
  }
}
```

---

## Adding Your Own Subgraph

Want to add another service? Here's how:

### 1. Create Subgraph

```bash
mkdir app/my-subgraph
cd app/my-subgraph
npm init -y
npm install @apollo/server @apollo/subgraph express graphql
```

### 2. Define Schema

```graphql
extend schema
  @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key", "@external"])

type Provider @key(fields: "id") {
  id: ID! @external
  availability: [TimeSlot!]!
}

type TimeSlot {
  date: String!
  time: String!
  available: Boolean!
}
```

### 3. Implement Resolvers

```typescript
const resolvers = {
  Provider: {
    __resolveReference(ref: { id: string }) {
      return { id: ref.id, availability: getAvailability(ref.id) };
    }
  }
};
```

### 4. Update Gateway

Edit `app/gateway/src/index.ts`:
```typescript
subgraphs: [
  { name: 'hasura', url: 'http://localhost:8080/v1/graphql' },
  { name: 'ratings', url: 'http://localhost:3002/graphql' },
  { name: 'availability', url: 'http://localhost:3003/graphql' } // NEW!
]
```

---

## Supergraph Composition (Advanced)

For production, use **Rover CLI** to compose supergraph schema ahead of time.

### 1. Install Rover

```bash
npm install -g @apollo/rover
```

### 2. Compose Supergraph

```bash
# Compose from rover/supergraph.yaml
rover supergraph compose --config rover/supergraph.yaml > rover/supergraph-schema.graphql
```

### 3. Use Static Composition

Update gateway to use pre-composed schema:
```typescript
import { readFileSync } from 'fs';

const supergraphSdl = readFileSync('./rover/supergraph-schema.graphql', 'utf-8');

const gateway = new ApolloGateway({
  supergraphSdl  // Use static schema instead of IntrospectAndCompose
});
```

**Benefits:**
- Faster startup (no introspection)
- Schema validation before deployment
- Works with Apollo Studio managed federation

---

## Troubleshooting

### Ratings subgraph not found

**Problem**: Gateway shows "ratings" subgraph unreachable

**Solution**: Start subgraph first
```bash
npm run subgraph:dev
```

### Provider has no rating field

**Problem**: Query doesn't show `rating` field on Provider

**Solution**: 
1. Check subgraph is running (http://localhost:3002/health)
2. Verify gateway composition worked (check gateway startup logs)
3. Try restarting gateway

### Apollo Studio not showing schema

**Problem**: Studio shows no schema or "waiting for schema"

**Solution**:
1. Publish subgraph schemas with `rover subgraph publish`
2. Wait 30-60 seconds for composition
3. Check for composition errors in Studio

---

## Best Practices

### ✅ DO

- Keep subgraphs focused on specific domains (ratings, availability, etc.)
- Use IntrospectAndCompose for development
- Each subgraph should own its data
- Use Apollo Studio to visualize your graph (optional)
- Version your schemas
- Document which service owns which data

### ❌ DON'T

- Don't share databases between subgraphs
- Don't use federation if a single service would suffice
- Don't skip schema validation
- Don't force federation on services that don't support it (like Hasura)

---

## Hasura + Apollo Federation: Understanding the Limitation

### The Challenge

**Hasura v2/v3 cannot have its types extended by Apollo subgraphs.** This is a fundamental limitation.

### What This Means

❌ **Cannot do**: Extend Hasura's `providers` type with Apollo subgraph fields
✅ **Can do**: Include Hasura as a subgraph alongside federated Apollo services
✅ **Can do**: Query both from one unified gateway endpoint

### The Solution (Migration Pattern)

This project demonstrates a real-world migration approach:

1. **Rename conflicting tables**: `providers` → `provider_records` in Hasura
2. **Create federated type**: New `Provider` type in custom Apollo subgraph with `@key`
3. **Unified gateway**: Combines both Hasura and federated subgraphs
4. **One endpoint**: Everything queryable from port 4000

### Query Example

```graphql
query UnifiedQuery {
  # From Hasura subgraph
  members(limit: 5) {
    id
    first_name
    last_name
  }

  claims(limit: 10) {
    id
    status
  }

  # From Providers subgraph (federated)
  providers {
    id
    name
    rating
    reviews {
      comment
    }
  }
}
```

**Result**: Learn both Hasura's database power AND Apollo Federation patterns!

---

## Federation vs. Schema Stitching

| Feature | Federation | Schema Stitching |
|---------|-----------|------------------|
| Standard | Apollo spec | Ad-hoc |
| Type ownership | Clear | Ambiguous |
| Tooling | Apollo Studio | Limited |
| Performance | Optimized | Variable |
| Learning curve | Moderate | High |

**Use Federation when**: You have multiple teams/services and need clear boundaries

**Use direct Hasura when**: Small project, single team, no need for service splitting

---

## Resources

- 📖 [Apollo Federation Docs](https://www.apollographql.com/docs/federation/)
- 🎓 [Federation Course](https://www.apollographql.com/tutorials/voyage-part1)
- 🔧 [Rover CLI Docs](https://www.apollographql.com/docs/rover/)
- 🎨 [Apollo Studio](https://studio.apollographql.com/)

---

## Next Steps

1. ✅ Run `npm run federated:dev` to start all services
2. ✅ Query http://localhost:4000/graphql to test federation
3. ✅ Try the example queries above
4. ✅ Sign up for Apollo Studio (free)
5. ✅ Explore Challenge 7 in CHALLENGES.md
6. ✅ Build your own subgraph!

**Happy federating!** 🚀
