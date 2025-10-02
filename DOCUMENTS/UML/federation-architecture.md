# Apollo Federation Architecture

This diagram shows the complete federated architecture of ClaimSight, including the Apollo Gateway that combines multiple GraphQL services.

## Architecture Diagram

```mermaid
graph TD
    subgraph "Client Layer"
        Browser[Browser<br/>React + Apollo Client<br/>Port 5173]
    end

    subgraph "Gateway Layer"
        Gateway[Apollo Gateway<br/>IntrospectAndCompose<br/>Port 4000]
    end

    subgraph "Subgraph Layer"
        Hasura[Hasura Subgraph<br/>Core Domain Data<br/>Port 8080]
        Ratings[Ratings Subgraph<br/>Provider Ratings<br/>Port 3002]
        Actions[Action Handler<br/>Business Logic<br/>Port 3001]
    end

    subgraph "Data Layer"
        DB[(PostgreSQL<br/>Database<br/>Port 5432)]
        RatingsData[In-Memory Data<br/>ratings.json]
    end

    Browser -->|GraphQL Queries| Gateway
    Gateway -->|Query Planning| Hasura
    Gateway -->|Entity Resolution| Ratings
    Hasura -->|SQL + RLS| DB
    Hasura -->|Custom Actions| Actions
    Actions -->|Store Results| DB
    Ratings -->|Read| RatingsData
    Ratings -.->|Entity Lookup| DB

    style Gateway fill:#e1bee7,stroke:#8e24aa,stroke-width:3px
    style Browser fill:#bbdefb,stroke:#1976d2,stroke-width:2px
    style Hasura fill:#c8e6c9,stroke:#388e3c,stroke-width:2px
    style Ratings fill:#fff9c4,stroke:#f57c00,stroke-width:2px
    style DB fill:#ffccbc,stroke:#d84315,stroke-width:2px
```

## Entity Extension Flow

How the Provider type is extended across subgraphs:

```mermaid
graph LR
    subgraph "Hasura Subgraph"
        H[Provider Type<br/>• id: ID!<br/>• name: String<br/>• specialty: String<br/>• npi: String]
    end

    subgraph "Gateway"
        G[Merged Provider<br/>• id: ID!<br/>• name: String<br/>• specialty: String<br/>• npi: String<br/>• rating: Float<br/>• ratingCount: Int<br/>• reviews: Reviews]
    end

    subgraph "Ratings Subgraph"
        R[Provider Extension<br/>@key fields: 'id'<br/>• id: ID! @external<br/>• rating: Float<br/>• ratingCount: Int<br/>• reviews: Reviews]
    end

    H -->|Base Type| G
    R -->|Extension| G

    style H fill:#c8e6c9,stroke:#388e3c,stroke-width:2px
    style R fill:#fff9c4,stroke:#f57c00,stroke-width:2px
    style G fill:#e1bee7,stroke:#8e24aa,stroke-width:3px
```

## Query Execution Flow

Step-by-step execution of a federated query:

```mermaid
sequenceDiagram
    participant C as Client
    participant G as Gateway
    participant H as Hasura
    participant R as Ratings

    C->>G: Query providers { id, name, rating, reviews }

    G->>G: Analyze query & create execution plan

    G->>H: Query: { id, name, specialty, npi }
    H->>H: Execute SQL with RLS
    H-->>G: Return: [{ id: "123", name: "Dr. Smith", ... }]

    G->>R: __resolveReference({ id: "123" })
    R->>R: Lookup ratings for ID "123"
    R-->>G: Return: { rating: 4.7, ratingCount: 124, reviews: [...] }

    G->>G: Merge responses
    G-->>C: Unified Provider: { id, name, rating, reviews }

    Note over C,R: Provider type appears unified to client!
```

## Development Modes

### Federated Mode (Default)

**Command:** `npm run federated:dev`

```mermaid
graph TD
    C[Client :5173] -->|GraphQL| GW[Gateway :4000]
    GW --> H[Hasura :8080]
    GW --> R[Ratings :3002]
    H --> DB[(PostgreSQL :5432)]
    H --> A[Actions :3001]
    A --> DB

    style GW fill:#e1bee7,stroke:#8e24aa,stroke-width:3px
```

**Features:**
- Full federation capabilities
- Provider ratings and reviews
- Multiple data sources
- Entity resolution

### Direct Mode (Simple)

**Command:** `npm run dev`

```mermaid
graph TD
    C[Client :5173] -->|GraphQL| H[Hasura :8080]
    H --> DB[(PostgreSQL :5432)]
    H --> A[Actions :3001]
    A --> DB

    style H fill:#c8e6c9,stroke:#388e3c,stroke-width:2px
```

**Features:**
- Simpler setup
- No gateway overhead
- Core functionality only
- Faster startup

## Key Federation Concepts

### 1. Entity References (@key directive)
```graphql
type Provider @key(fields: "id") {
  id: ID! @external
  # ... extended fields
}
```
- Defines how to identify an entity across subgraphs
- Gateway uses this to resolve entity references

### 2. IntrospectAndCompose
- Development-friendly composition mode
- Auto-discovers subgraph schemas on startup
- No manual schema composition needed
- Gateway introspects each subgraph's schema

### 3. Entity Resolution (__resolveReference)
```typescript
Provider: {
  __resolveReference(ref: { id: string }) {
    return ratingsData[ref.id];
  }
}
```
- Special resolver that fetches entity by key
- Gateway calls this when extending types

### 4. Query Planning
- Gateway analyzes query requirements
- Determines which subgraphs to query
- Optimizes execution order
- Merges results efficiently

## Benefits of Federation

✅ **Service Separation** - Teams can own independent GraphQL services
✅ **Type Extension** - Add fields to existing types without modifying original service
✅ **Unified Schema** - Single GraphQL endpoint for clients
✅ **Independent Deployment** - Subgraphs can deploy separately
✅ **Data Source Flexibility** - Each subgraph can use different databases

## Apollo Studio Visualization

For production environments, Apollo Studio provides:

- **Schema Registry** - Track schema changes over time
- **Query Performance** - Monitor field-level performance
- **Field Usage** - See which fields are actually used
- **Supergraph Composition** - Validate schema composition before deployment
- **Operation Metrics** - Track query execution across subgraphs

**Setup:** See `FEDERATION_GUIDE.md` for Apollo Studio integration steps.
