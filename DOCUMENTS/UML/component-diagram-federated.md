# Component Diagram - Federated Architecture

This diagram shows all components in the ClaimSight federated architecture, including service boundaries, ports, and communication patterns.

## Full System Components

```mermaid
graph TB
    subgraph "Browser Layer"
        React[React Application<br/>TypeScript + Vite<br/>Port 5173]
        ApolloClient[Apollo Client<br/>GraphQL Client<br/>Cache + State Management]
        Router[React Router<br/>Client-side Navigation]
    end

    subgraph "Gateway Layer - Port 4000"
        Gateway[Apollo Federation Gateway<br/>IntrospectAndCompose<br/>Query Planning & Routing]
    end

    subgraph "Hasura Subgraph - Port 8080"
        HasuraEngine[Hasura GraphQL Engine<br/>Auto-generated API<br/>Permissions & RLS]
        HasuraMetadata[Metadata Engine<br/>Schema Definition<br/>Relationships]
    end

    subgraph "Ratings Subgraph - Port 3002"
        RatingsServer[Apollo Server<br/>buildSubgraphSchema<br/>Federation Directives]
        RatingsResolver[Entity Resolvers<br/>__resolveReference<br/>Provider Extension]
        RatingsData[In-Memory Store<br/>ratings.json]
    end

    subgraph "Action Handler - Port 3001"
        ActionServer[Express Server<br/>REST API]
        EligibilityLogic[Eligibility Check<br/>Business Logic<br/>External API Mock]
    end

    subgraph "Data Layer - Port 5432"
        PostgreSQL[(PostgreSQL Database<br/>RLS Policies<br/>Members, Claims, Providers)]
    end

    React --> ApolloClient
    React --> Router
    ApolloClient -->|GraphQL Queries| Gateway

    Gateway -->|Subgraph Query| HasuraEngine
    Gateway -->|Entity Resolution| RatingsServer

    HasuraEngine --> HasuraMetadata
    HasuraEngine -->|SQL with RLS| PostgreSQL
    HasuraEngine -->|Action Webhook| ActionServer

    RatingsServer --> RatingsResolver
    RatingsResolver --> RatingsData
    RatingsResolver -.->|Entity Lookup| PostgreSQL

    ActionServer --> EligibilityLogic
    EligibilityLogic -->|Store Results| PostgreSQL

    style Gateway fill:#e1bee7,stroke:#8e24aa,stroke-width:3px
    style React fill:#61dafb,stroke:#1976d2,stroke-width:2px
    style HasuraEngine fill:#1eb4d4,stroke:#0f5f7a,stroke-width:2px
    style RatingsServer fill:#f4a261,stroke:#e76f51,stroke-width:2px
    style PostgreSQL fill:#336791,stroke:#1e3a5f,stroke-width:2px
    style ActionServer fill:#68a063,stroke:#2d6930,stroke-width:2px
```

## Communication Protocols

```mermaid
graph LR
    subgraph "Client to Gateway"
        C1[HTTP/HTTPS<br/>GraphQL Queries & Mutations]
        C2[WebSocket<br/>GraphQL Subscriptions]
    end

    subgraph "Gateway to Subgraphs"
        G1[HTTP<br/>Introspection Queries]
        G2[HTTP<br/>Entity Resolution]
        G3[HTTP<br/>Field Queries]
    end

    subgraph "Hasura to Database"
        H1[PostgreSQL Protocol<br/>SQL with RLS]
    end

    subgraph "Hasura to Actions"
        H2[HTTP/REST<br/>Webhook Calls]
    end

    style C1 fill:#bbdefb
    style C2 fill:#c5e1a5
    style G1 fill:#f8bbd0
    style G2 fill:#f8bbd0
    style G3 fill:#f8bbd0
    style H1 fill:#d1c4e9
    style H2 fill:#ffe0b2
```

## Port Mapping

| Service | Port | Protocol | Purpose |
|---------|------|----------|---------|
| **React App** | 5173 | HTTP | Development server (Vite) |
| **Apollo Gateway** | 4000 | HTTP/WS | Federated GraphQL endpoint |
| **Hasura Subgraph** | 8080 | HTTP/WS | Core GraphQL API |
| **Action Handler** | 3001 | HTTP | Custom business logic |
| **Ratings Subgraph** | 3002 | HTTP | Provider ratings API |
| **PostgreSQL** | 5432 | PostgreSQL | Database server |

## Data Flow Patterns

### Pattern 1: Simple Query (Hasura Only)

```mermaid
sequenceDiagram
    participant C as Client
    participant G as Gateway
    participant H as Hasura
    participant DB as PostgreSQL

    C->>G: query { members { name } }
    G->>H: query { members { name } }
    H->>DB: SELECT name FROM members WHERE...
    DB-->>H: [{ name: "John" }]
    H-->>G: [{ name: "John" }]
    G-->>C: [{ name: "John" }]
```

### Pattern 2: Federated Query (Hasura + Ratings)

```mermaid
sequenceDiagram
    participant C as Client
    participant G as Gateway
    participant H as Hasura
    participant R as Ratings
    participant DB as PostgreSQL

    C->>G: query { providers { name, rating } }
    G->>G: Create query plan

    G->>H: query { providers { id, name } }
    H->>DB: SELECT id, name FROM providers
    DB-->>H: [{ id: "123", name: "Dr. Smith" }]
    H-->>G: [{ id: "123", name: "Dr. Smith" }]

    G->>R: __resolveReference({ id: "123" })
    R-->>G: { rating: 4.7, ratingCount: 124 }

    G->>G: Merge results
    G-->>C: [{ id: "123", name: "Dr. Smith", rating: 4.7 }]
```

### Pattern 3: Custom Action

```mermaid
sequenceDiagram
    participant C as Client
    participant G as Gateway
    participant H as Hasura
    participant A as Action Handler
    participant DB as PostgreSQL

    C->>G: mutation { checkEligibility(memberId: "...") }
    G->>H: mutation { checkEligibility(...) }
    H->>A: POST /checkEligibility
    A->>A: Call external API
    A->>DB: INSERT INTO eligibility_checks
    DB-->>A: Success
    A-->>H: { success: true, result: "eligible" }
    H-->>G: { success: true, result: "eligible" }
    G-->>C: { success: true, result: "eligible" }
```

## Component Responsibilities

### React Application
- **UI Rendering**: Claims list, detail views, forms
- **State Management**: Apollo Client cache
- **Routing**: Client-side navigation
- **Role Switching**: Dev mode role simulation

### Apollo Gateway
- **Schema Composition**: Combines Hasura + ratings schemas
- **Query Planning**: Determines optimal execution strategy
- **Entity Resolution**: Links types across subgraphs
- **Response Merging**: Unifies data from multiple sources

### Hasura Subgraph
- **GraphQL API**: Auto-generated from database
- **Permissions**: Role-based access control
- **Real-time**: WebSocket subscriptions
- **Actions**: Delegates to custom handlers

### Ratings Subgraph
- **Type Extension**: Extends Provider with ratings
- **Entity Resolution**: Resolves Provider references
- **Data Management**: In-memory ratings store
- **Federation Compliance**: Apollo Federation v2 spec

### Action Handler
- **Business Logic**: Eligibility checks
- **External APIs**: Payer API integration (mocked)
- **Data Persistence**: Stores action results

### PostgreSQL
- **Data Storage**: Members, claims, providers, notes
- **Row-Level Security**: Database-level permissions
- **JSONB**: Flexible data structures
- **Relationships**: Foreign keys and indexes

## Deployment Modes

### Development (Federated)

**Start Command:** `npm run federated:dev`

```mermaid
graph TD
    Dev[Developer Machine<br/>Single Host]

    Dev --> R[React :5173]
    Dev --> GW[Gateway :4000]
    Dev --> H[Hasura :8080]
    Dev --> A[Actions :3001]
    Dev --> RS[Ratings :3002]
    Dev --> DB[(PostgreSQL :5432)]

    R -->|Queries| GW
    GW --> H
    GW --> RS
    H --> DB
    A --> DB

    style Dev fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
```

### Development (Direct)

**Start Command:** `npm run dev`

```mermaid
graph TD
    Dev[Developer Machine<br/>Single Host]

    Dev --> R[React :5173]
    Dev --> H[Hasura :8080]
    Dev --> A[Actions :3001]
    Dev --> DB[(PostgreSQL :5432)]

    R -->|Queries| H
    H --> DB
    A --> DB

    style Dev fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
```

### Production (Suggested)

```mermaid
graph TB
    subgraph "CDN"
        Static[Static Assets<br/>React Build]
    end

    subgraph "Application Tier"
        LB[Load Balancer]
        GW1[Gateway Instance 1]
        GW2[Gateway Instance 2]
    end

    subgraph "Service Tier"
        H1[Hasura Instance 1]
        H2[Hasura Instance 2]
        RS[Ratings Service]
        A[Action Handler]
    end

    subgraph "Data Tier"
        Primary[(PostgreSQL<br/>Primary)]
        Replica1[(PostgreSQL<br/>Replica)]
        Replica2[(PostgreSQL<br/>Replica)]
    end

    Static --> LB
    LB --> GW1
    LB --> GW2
    GW1 --> H1
    GW1 --> H2
    GW1 --> RS
    GW2 --> H1
    GW2 --> H2
    GW2 --> RS
    H1 --> Primary
    H2 --> Primary
    H1 --> Replica1
    H2 --> Replica2
    A --> Primary
    RS --> Replica1

    style LB fill:#ffecb3,stroke:#f57c00,stroke-width:2px
```

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + TypeScript | UI components |
| | Apollo Client 3 | GraphQL client |
| | TailwindCSS | Styling |
| | Vite | Build tool |
| **Gateway** | Apollo Gateway | Schema composition |
| | @apollo/gateway | Federation runtime |
| | Express | HTTP server |
| **Subgraphs** | Hasura GraphQL Engine | Primary API |
| | Apollo Server | Ratings API |
| | @apollo/subgraph | Federation support |
| **Actions** | Node.js + Express | Custom logic |
| **Database** | PostgreSQL 15+ | Data persistence |
| | Row-Level Security | Authorization |

## Extension Points

### Adding a New Subgraph

1. Create new Apollo Server with `buildSubgraphSchema`
2. Define schema with federation directives (`@key`, `@external`)
3. Implement `__resolveReference` for entities
4. Add to gateway's subgraph list
5. Gateway auto-composes schema

### Adding a New Action

1. Define action in Hasura metadata
2. Implement handler in action server
3. Configure webhook URL
4. Hasura calls handler on mutation

### Adding a New Table

1. Create table in PostgreSQL
2. Track in Hasura
3. Configure permissions
4. RLS policies applied automatically
5. GraphQL API auto-generated
