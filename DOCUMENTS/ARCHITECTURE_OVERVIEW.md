# ClaimSight Architecture Overview

## System Architecture

ClaimSight is a cross-platform healthcare claims management system built with GraphQL, Hasura, and Apollo.

### High-Level Architecture

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

#### Apollo Subgraph (Optional)
**Purpose:** Extend GraphQL schema via federation

**Example:** Provider Ratings
- Adds `rating` field to Provider type
- Demonstrates federated architecture
- Independent deployment

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

```
Single machine:
- PostgreSQL (port 5432)
- Hasura (port 8080)
- Action Handler (port 3001)
- Subgraph (port 3002)
- Vite dev server (port 5173)
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
