# ClaimSight Architecture Overview

## System Architecture

ClaimSight is a cross-platform healthcare claims management system built with GraphQL, Hasura, and Apollo.

### High-Level Architecture

**Federated Architecture (Default):**

```
┌────────────────────────────────────────────────────────┐
│                  Browser (Port 5173)                    │
│              React SPA + Apollo Client                  │
└──────────────────────┬─────────────────────────────────┘
                       │ GraphQL/WebSocket
                       ▼
┌────────────────────────────────────────────────────────┐
│         Apollo Federation Gateway (Port 4000)           │
│              IntrospectAndCompose                       │
│         (Combines multiple GraphQL services)            │
└──────────┬─────────────────────────────┬───────────────┘
           │                             │
           │                             │
    ┌──────▼──────────┐          ┌──────▼──────────┐
    │ Hasura Subgraph │          │ Ratings Subgraph│
    │   (Port 8080)   │          │   (Port 3002)   │
    │                 │          │                 │
    │ • Members       │          │ • Provider      │
    │ • Claims        │          │   ratings       │
    │ • Providers     │◄─────────┤ • Reviews       │
    │ • Notes         │ Entity   │                 │
    │ • Eligibility   │Resolution│                 │
    └────────┬────────┘          └─────────────────┘
             │                            │
             │ SQL + RLS                  │ In-Memory
             ▼                            │ Data
    ┌──────────────────┐                  │
    │   PostgreSQL     │◄─────────────────┘
    │    Database      │  (Resolves provider entities)
    └──────────────────┘
             ▲
             │
    ┌────────┴────────┐
    │ Action Handler  │
    │  (Port 3001)    │
    │                 │
    │ • Eligibility   │
    │   checks        │
    └─────────────────┘
```

**Key Concepts:**
- **Apollo Gateway** acts as single entry point combining multiple GraphQL services
- **Entity Resolution**: Gateway fetches provider IDs from Hasura, then enriches with ratings from subgraph
- **Type Extension**: Provider type defined in Hasura, extended with `rating` and `reviews` in ratings subgraph
- **Development Mode**: Uses IntrospectAndCompose for automatic schema discovery and composition

**Direct Hasura Architecture (Alternative):**

For simpler development without federation, configure client to bypass gateway:

```
┌─────────────┐
│   Browser   │
│  React SPA  │
└──────┬──────┘
       │ GraphQL/WebSocket
       ▼
┌──────────────────┐
│ Hasura GraphQL   │◄──── Action Handler (Node.js)
│     Engine       │
└────────┬─────────┘
         │ SQL + RLS
         ▼
┌──────────────────┐
│   PostgreSQL     │
│    Database      │
└──────────────────┘
```

To switch: Set `VITE_GRAPHQL_HTTP_URL=http://localhost:8080/v1/graphql` in `.env`

## Layers

### 1. Presentation Layer (React + Apollo Client)

**Technology:**
- React 18 with TypeScript
- Apollo Client 3 for GraphQL
- TailwindCSS for styling
- React Router for navigation

**Responsibilities:**
- User interface rendering
- Client-side routing
- GraphQL query/mutation execution
- Real-time subscription handling
- Optimistic UI updates
- Client-side caching

**Key Features:**
- Split HTTP/WebSocket links
- Fragment-based query composition
- Role-based UI adaptation

### 2. API Layer (Hasura GraphQL Engine)

**Technology:**
- Hasura GraphQL Engine
- GraphQL schema auto-generation
- Real-time subscriptions via WebSocket

**Responsibilities:**
- GraphQL API serving
- Query optimization
- Real-time event broadcasting
- Permission enforcement
- Custom action coordination

**Key Features:**
- Auto-generated CRUD operations
- Relationship traversal
- Filtering, sorting, pagination
- Subscription support
- Action handlers for custom logic

### 3. Business Logic Layer

#### Hasura Actions
**Purpose:** External API calls and complex business logic

**Example:** Eligibility Check Action
- Calls external payer API (mocked)
- Validates member eligibility
- Stores result in database

#### Apollo Federation Gateway
**Purpose:** Combine multiple GraphQL services into unified supergraph

**Technology:**
- Apollo Gateway with IntrospectAndCompose
- Apollo Federation v2 spec
- Automatic schema discovery

**Responsibilities:**
- Query planning across subgraphs
- Entity resolution and type merging
- Schema composition
- Request routing

**Key Features:**
- **IntrospectAndCompose**: Auto-discovers subgraph schemas (easy for development)
- **Entity References**: Links types across services using `@key` directive
- **Type Extension**: Subgraphs can add fields to types defined elsewhere
- **Query Planning**: Efficiently fetches data from multiple sources

**Example Query Flow:**
```graphql
query {
  providers(limit: 1) {
    id           # From Hasura
    name         # From Hasura
    rating       # From ratings subgraph!
    reviews {    # From ratings subgraph!
      comment
    }
  }
}
```

**Execution:**
1. Gateway receives query
2. Fetches `id` and `name` from Hasura subgraph
3. Passes `id` to ratings subgraph via entity reference
4. Ratings subgraph's `__resolveReference` resolves the Provider entity
5. Gateway merges results into single response

#### Apollo Subgraphs

**Hasura Subgraph (Port 8080):**
- Core domain data (members, claims, providers, notes)
- PostgreSQL backing with RLS
- Auto-generated CRUD operations
- Real-time subscriptions

**Ratings Subgraph (Port 3002):**
- Extends Provider type with ratings data
- In-memory data source (ratings.json)
- Demonstrates federation capabilities
- Independent deployment and scaling

**Subgraph Schema Example:**
```graphql
extend schema
  @link(url: "https://specs.apollo.dev/federation/v2.0",
        import: ["@key", "@external"])

type Provider @key(fields: "id") {
  id: ID! @external           # References Hasura's Provider.id
  rating: Float               # New field added by this subgraph
  ratingCount: Int            # New field
  reviews: [Review!]!         # New relationship
}

type Review {
  id: ID!
  rating: Int!
  comment: String!
  date: String!
}
```

**Entity Resolution:**
```typescript
const resolvers = {
  Provider: {
    __resolveReference(reference: { id: string }) {
      // Lookup rating data for this provider ID
      return ratingsData[reference.id];
    }
  }
};
```

### 4. Data Layer (PostgreSQL)

**Technology:**
- PostgreSQL 15+
- Row-Level Security (RLS)
- Full-text search
- JSONB for flexible data

**Schema:**
```
members (id, first_name, last_name, dob, plan)
providers (id, npi, name, specialty)
claims (id, member_id, provider_id, dos, cpt, charge_cents, allowed_cents, status, denial_reason)
notes (id, member_id, created_at, body)
eligibility_checks (id, member_id, checked_at, result)
```

**Relationships:**
- members ↔ claims (1:N)
- providers ↔ claims (1:N)
- members ↔ notes (1:N)
- members ↔ eligibility_checks (1:N)

## Data Flow

### Query Flow (Read)

```
User → React Component
  → Apollo Client (check cache)
  → GraphQL Query
  → Hasura (parse, validate)
  → PostgreSQL (RLS filters applied)
  → Hasura (format response)
  → Apollo Client (update cache)
  → React Component (re-render)
```

### Mutation Flow (Write)

```
User → React Component
  → Apollo Client (optimistic update)
  → GraphQL Mutation
  → Hasura (validate permissions)
  → PostgreSQL (RLS check + write)
  → Hasura (return result)
  → Apollo Client (confirm/rollback)
  → React Component (update UI)
```

### Subscription Flow (Real-time)

```
Component mounts
  → Apollo Client subscribes via WebSocket
  → Hasura opens connection
  → Database change occurs
  → Hasura pushes update
  → Apollo Client receives event
  → Component re-renders with new data
```

### Federated Query Flow

**Example: Query Provider with Ratings**

```
User requests provider with rating
  → React Component
  → Apollo Client
  → GraphQL Query sent to Gateway (port 4000)
  → Gateway analyzes query and creates execution plan

  → Gateway queries Hasura subgraph (port 8080)
    → Fetches: { id, name, specialty, npi }
    → Returns provider data with ID

  → Gateway calls ratings subgraph (port 3002)
    → Passes provider ID as entity reference
    → __resolveReference({ id }) looks up ratings
    → Returns: { rating, ratingCount, reviews }

  → Gateway merges responses
    → Combines Hasura fields + ratings fields
    → Returns unified Provider object

  → Apollo Client (cache update)
  → React Component (re-render with complete data)
```

**Key Insight:** The Provider type is split across two services but appears as one unified type to the client!

## Security Architecture

### Trust Boundaries

```
┌───────────────────────────────────────┐
│          Untrusted Zone               │
│  (Browser, User Input)                │
└──────────────┬────────────────────────┘
               │ HTTPS
               ▼
┌───────────────────────────────────────┐
│      Application Trust Boundary       │
│  Hasura (validates roles, enforces    │
│  permissions)                          │
└──────────────┬────────────────────────┘
               │ Authenticated queries
               ▼
┌───────────────────────────────────────┐
│       Data Trust Boundary             │
│  PostgreSQL (RLS enforces data access)│
└───────────────────────────────────────┘
```

### Role-Based Access Control (RBAC)

**Roles:**
1. **admin** - Full access to all data
2. **member** - Access to own claims, notes, eligibility
3. **provider** - Access to claims for their patients

**Enforcement:**
- Application layer: Hasura permissions
- Database layer: PostgreSQL RLS policies

**Headers:**
```
x-hasura-role: member
x-hasura-user-id: <member-uuid>
```

### Row-Level Security (RLS)

**Example: Members Table**
```sql
CREATE POLICY member_own_record ON members
  FOR SELECT TO hasura_member
  USING (id = current_setting('hasura.user.x-hasura-user-id')::uuid);
```

RLS ensures users can only access their own data, even if Hasura permissions are misconfigured.

## Cross-Platform Design

### No Docker Requirement

- PostgreSQL: Native install or cloud
- Hasura: Binary download or Hasura Cloud
- Node.js: Direct runtime
- Frontend: Vite dev server

### OS-Agnostic Scripts

**Both PowerShell (.ps1) and Bash (.sh) for:**
- setup
- seed
- apply-hasura
- start-all

**Node.js router:**
- `scripts/run-plat.js` detects OS
- Invokes appropriate script
- `npm run` commands work everywhere

## Scalability Considerations

### Horizontal Scaling

**Stateless Services:**
- Hasura can run multiple instances
- Apollo Client handles load balancing
- Action handlers can scale independently

**Database:**
- PostgreSQL read replicas
- Connection pooling (PgBouncer)
- Partition large tables by date

### Caching Strategy

**Client-side (Apollo Client):**
- In-memory cache
- Normalized cache structure
- Optimistic updates

**Server-side (Hasura):**
- Query plan caching
- Prepared statements
- Connection pooling

### Performance Optimization

**Database:**
- Indexes on foreign keys
- Composite indexes for common queries
- Full-text search indexes

**API:**
- Query batching
- DataLoader pattern (automatic in Hasura)
- Subscription throttling

## Monitoring & Observability

### Logs

**Hasura:**
- Query logs
- Error logs
- Webhook logs
- WebSocket logs

**Application:**
- Apollo Client DevTools
- Browser console
- Custom error tracking

### Metrics

**Key Performance Indicators:**
- Query response time (p95, p99)
- Subscription connection count
- Database connection pool usage
- Error rate by operation

**Tools:**
- Hasura Cloud metrics
- PostgreSQL slow query log
- Custom Prometheus exporters

## Deployment Topology

### Development

**Federated Mode (Full Features):**
```
Single machine:
- PostgreSQL (port 5432)
- Hasura (port 8080)
- Action Handler (port 3001)
- Ratings Subgraph (port 3002)
- Apollo Gateway (port 4000)    ← Client connects here
- Vite dev server (port 5173)

Start with: npm run federated:dev
```

**Direct Mode (Simpler):**
```
Single machine:
- PostgreSQL (port 5432)
- Hasura (port 8080)            ← Client connects here
- Action Handler (port 3001)
- Vite dev server (port 5173)

Start with: npm run dev
```

### Production

```
┌──────────────┐
│ CDN / Static │
│   Hosting    │
└──────┬───────┘
       │
┌──────▼────────┐
│ Load Balancer │
└──────┬────────┘
       │
   ┌───┴────┐
   ▼        ▼
┌─────┐  ┌─────┐
│ Hasura│  │ Hasura│
│ (HA) │  │ (HA) │
└───┬──┘  └───┬──┘
    └─────┬────┘
          │
    ┌─────▼─────┐
    │ PostgreSQL│
    │ (Primary +│
    │ Replicas) │
    └───────────┘
```

## Technology Decisions Summary

| Concern | Technology | Rationale |
|---------|-----------|-----------|
| API | Hasura GraphQL | Auto-generated API, RLS, subscriptions |
| Frontend | React + Apollo | Rich ecosystem, real-time support |
| Database | PostgreSQL | RLS, JSONB, full-text search |
| Language | TypeScript | Type safety, developer experience |
| Styling | TailwindCSS | Utility-first, responsive |
| Federation | Apollo Subgraph | Extensibility demonstration |

## Extension Points

### Adding New Features

1. **New Entity**
   - Add table to database
   - Run migrations
   - Track in Hasura
   - Configure permissions
   - Generate TypeScript types

2. **New Business Logic**
   - Create Hasura action
   - Implement handler
   - Add to frontend

3. **New Data Source**
   - Create Apollo subgraph
   - Implement resolvers
   - Compose with gateway

## Further Reading

See also:
- `BEST_PRACTICES.md` - Development guidelines
- `LEARNING_CHECKLIST.md` - Step-by-step tutorial
- `ADRs/` - Architecture decision records
- UML diagrams for visual architecture
