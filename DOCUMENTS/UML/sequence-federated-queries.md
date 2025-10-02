# Sequence Diagrams - Federated Queries

This document shows detailed sequence diagrams for various query patterns in the ClaimSight federated architecture.

## 1. Simple Query (Hasura Only)

When querying data that exists entirely in Hasura, the gateway acts as a pass-through.

```mermaid
sequenceDiagram
    participant User
    participant React
    participant Apollo as Apollo Client
    participant Gateway as Apollo Gateway<br/>(Port 4000)
    participant Hasura as Hasura Subgraph<br/>(Port 8080)
    participant DB as PostgreSQL

    User->>React: View claims list
    React->>Apollo: useQuery(GET_CLAIMS)

    Apollo->>Apollo: Check cache
    Note over Apollo: Cache miss

    Apollo->>Gateway: POST /graphql<br/>query { claims { id, status, cpt } }

    Gateway->>Gateway: Parse & plan query
    Note over Gateway: All fields from Hasura

    Gateway->>Hasura: query { claims { id, status, cpt } }

    Hasura->>Hasura: Validate permissions
    Note over Hasura: Check x-hasura-role header

    Hasura->>DB: SELECT id, status, cpt<br/>FROM claims<br/>WHERE (RLS policy)

    DB-->>Hasura: [{ id: "...", status: "approved", cpt: "99213" }]

    Hasura-->>Gateway: GraphQL response

    Gateway-->>Apollo: GraphQL response

    Apollo->>Apollo: Update cache
    Apollo-->>React: Claims data

    React->>User: Render claims list
```

## 2. Federated Query (Hasura + Ratings)

When querying the Provider type with rating fields, the gateway orchestrates calls to both subgraphs.

```mermaid
sequenceDiagram
    participant User
    participant React
    participant Apollo as Apollo Client
    participant Gateway as Apollo Gateway
    participant Hasura as Hasura Subgraph
    participant Ratings as Ratings Subgraph<br/>(Port 3002)
    participant DB as PostgreSQL
    participant RatingsData as ratings.json

    User->>React: Navigate to Ratings page
    React->>Apollo: useQuery(GET_PROVIDERS_WITH_RATINGS)

    Apollo->>Gateway: query {<br/>  providers {<br/>    id, name, specialty<br/>    rating, reviews { comment }<br/>  }<br/>}

    Gateway->>Gateway: Analyze query
    Note over Gateway: Identifies fields from:<br/>- Hasura: id, name, specialty<br/>- Ratings: rating, reviews

    Gateway->>Gateway: Create execution plan
    Note over Gateway: 1. Fetch from Hasura<br/>2. Resolve entities from Ratings

    Gateway->>Hasura: query {<br/>  providers {<br/>    id<br/>    name<br/>    specialty<br/>  }<br/>}

    Hasura->>DB: SELECT id, name, specialty<br/>FROM providers

    DB-->>Hasura: [{ id: "734f...", name: "Dr. Smith", ... }]

    Hasura-->>Gateway: Provider base data

    Note over Gateway: Gateway has provider IDs,<br/>now resolves ratings

    Gateway->>Ratings: _entities([<br/>  { __typename: "Provider", id: "734f..." }<br/>])

    Ratings->>Ratings: __resolveReference({ id: "734f..." })

    Ratings->>RatingsData: Lookup rating for ID

    RatingsData-->>Ratings: {<br/>  rating: 4.7,<br/>  ratingCount: 124,<br/>  reviews: [...]<br/>}

    Ratings-->>Gateway: Provider extension data

    Gateway->>Gateway: Merge results
    Note over Gateway: Combine:<br/>{ id, name, specialty } +<br/>{ rating, reviews }

    Gateway-->>Apollo: Unified Provider response

    Apollo->>Apollo: Normalize & cache
    Apollo-->>React: Provider data with ratings

    React->>User: Display provider cards with stars
```

## 3. Custom Action (Eligibility Check)

When executing a mutation that triggers a Hasura action, the flow involves the action handler.

```mermaid
sequenceDiagram
    participant User
    participant React
    participant Apollo as Apollo Client
    participant Gateway as Apollo Gateway
    participant Hasura as Hasura Subgraph
    participant Actions as Action Handler<br/>(Port 3001)
    participant DB as PostgreSQL

    User->>React: Click "Check Eligibility"
    React->>Apollo: useMutation(CHECK_ELIGIBILITY)

    Apollo->>Gateway: mutation {<br/>  checkEligibility(<br/>    memberId: "..."<br/>  ) {<br/>    success<br/>    result<br/>  }<br/>}

    Gateway->>Hasura: Forward mutation

    Hasura->>Hasura: Validate action permissions
    Note over Hasura: Check if role can execute action

    Hasura->>Actions: POST /checkEligibility<br/>{<br/>  input: { memberId: "..." },<br/>  session_variables: {<br/>    x-hasura-role: "member"<br/>  }<br/>}

    Actions->>Actions: Execute business logic
    Note over Actions: Call external payer API<br/>(mocked in this demo)

    Actions->>Actions: Mock API response
    Note over Actions: Returns "eligible" or "not_eligible"

    Actions->>DB: INSERT INTO eligibility_checks<br/>(member_id, result, checked_at)

    DB-->>Actions: Insert successful

    Actions-->>Hasura: {<br/>  success: true,<br/>  result: "eligible"<br/>}

    Hasura-->>Gateway: Action result

    Gateway-->>Apollo: Mutation response

    Apollo->>Apollo: Update cache
    Note over Apollo: Refetch queries if needed

    Apollo-->>React: Eligibility result

    React->>User: Show "✓ Member is eligible"
```

## 4. Real-time Subscription (Claims Updates)

Subscriptions flow through the gateway to Hasura's WebSocket connection.

```mermaid
sequenceDiagram
    participant User
    participant React
    participant Apollo as Apollo Client
    participant Gateway as Apollo Gateway
    participant Hasura as Hasura Subgraph
    participant DB as PostgreSQL

    User->>React: Navigate to Claims page
    React->>Apollo: useSubscription(CLAIMS_SUBSCRIPTION)

    Apollo->>Gateway: WS: subscription {<br/>  claims(where: {...}) {<br/>    id, status, updated_at<br/>  }<br/>}

    Gateway->>Hasura: WS: Forward subscription

    Hasura->>Hasura: Setup live query
    Note over Hasura: Watches for DB changes

    Hasura->>DB: LISTEN for changes

    Note over DB: Some time passes...

    DB->>DB: Claim status updated

    DB-->>Hasura: NOTIFY: claims table changed

    Hasura->>DB: Re-run query with RLS

    DB-->>Hasura: Updated claim data

    Hasura-->>Gateway: WS: Subscription event

    Gateway-->>Apollo: WS: Updated data

    Apollo->>Apollo: Update cache

    Apollo-->>React: Trigger re-render

    React->>User: Live update (claim status changed)
```

## 5. Optimistic UI Update (Add Note)

Shows Apollo Client's optimistic update with federation.

```mermaid
sequenceDiagram
    participant User
    participant React
    participant Apollo as Apollo Client
    participant Gateway as Apollo Gateway
    participant Hasura as Hasura Subgraph
    participant DB as PostgreSQL

    User->>React: Type note & click "Add"

    React->>Apollo: useMutation(ADD_NOTE, {<br/>  optimisticResponse: {...}<br/>})

    Apollo->>Apollo: Optimistic update
    Note over Apollo: Immediately update cache<br/>with predicted result

    Apollo-->>React: Optimistic data
    React->>User: Note appears instantly! ⚡

    Note over Apollo,DB: Meanwhile, real mutation...

    Apollo->>Gateway: mutation {<br/>  insert_notes_one(object: {...}) {<br/>    id, body, created_at<br/>  }<br/>}

    Gateway->>Hasura: Forward mutation

    Hasura->>Hasura: Check permissions
    Note over Hasura: member role can insert<br/>own notes (RLS)

    Hasura->>DB: INSERT INTO notes<br/>(member_id, body)<br/>RETURNING *

    DB-->>Hasura: { id: "real-uuid", ... }

    Hasura-->>Gateway: Real note data

    Gateway-->>Apollo: Mutation result

    Apollo->>Apollo: Replace optimistic data
    Note over Apollo: Update with real UUID

    Apollo-->>React: Confirmed data

    React->>User: Note confirmed ✓
```

## 6. Error Handling (Permission Denied)

Shows what happens when RLS blocks unauthorized access.

```mermaid
sequenceDiagram
    participant User
    participant React
    participant Apollo as Apollo Client
    participant Gateway as Apollo Gateway
    participant Hasura as Hasura Subgraph
    participant DB as PostgreSQL

    User->>React: Try to view another member's claims
    React->>Apollo: useQuery(GET_CLAIMS, {<br/>  variables: { memberId: "other-member" }<br/>})

    Apollo->>Gateway: query {<br/>  claims(<br/>    where: { member_id: { _eq: "other" } }<br/>  ) { id, status }<br/>}

    Gateway->>Hasura: Forward query with headers:<br/>x-hasura-role: member<br/>x-hasura-user-id: "my-id"

    Hasura->>Hasura: Build SQL with RLS
    Note over Hasura: RLS adds:<br/>AND member_id = 'my-id'

    Hasura->>DB: SELECT id, status<br/>FROM claims<br/>WHERE member_id = 'other'<br/>AND member_id = 'my-id'

    Note over DB: Condition impossible!<br/>'other' ≠ 'my-id'

    DB-->>Hasura: [] (empty result)

    Hasura-->>Gateway: { claims: [] }

    Gateway-->>Apollo: Empty array

    Apollo-->>React: No claims

    React->>User: "No claims found"<br/>(Not "Permission denied")

    Note over User,DB: RLS silently filters data<br/>instead of throwing errors
```

## 7. Multi-Level Nested Query

Shows how the gateway handles complex nested queries across relationships.

```mermaid
sequenceDiagram
    participant Apollo as Apollo Client
    participant Gateway as Apollo Gateway
    participant Hasura as Hasura Subgraph
    participant Ratings as Ratings Subgraph
    participant DB as PostgreSQL

    Apollo->>Gateway: query {<br/>  members {<br/>    name<br/>    claims {<br/>      cpt<br/>      provider {<br/>        name<br/>        rating<br/>      }<br/>    }<br/>  }<br/>}

    Gateway->>Gateway: Plan complex query
    Note over Gateway: Phase 1: Hasura (members, claims, provider)<br/>Phase 2: Ratings (provider ratings)

    Gateway->>Hasura: query {<br/>  members {<br/>    name<br/>    claims {<br/>      cpt<br/>      provider { id, name }<br/>    }<br/>  }<br/>}

    Hasura->>DB: SELECT m.name,<br/>  c.cpt,<br/>  p.id, p.name<br/>FROM members m<br/>JOIN claims c ON ...<br/>JOIN providers p ON ...

    DB-->>Hasura: Nested data structure

    Hasura-->>Gateway: Members with claims & providers

    Note over Gateway: Extract provider IDs:<br/>["734f...", "8a2b...", ...]

    Gateway->>Ratings: _entities([<br/>  { __typename: "Provider", id: "734f..." },<br/>  { __typename: "Provider", id: "8a2b..." }<br/>])

    Ratings->>Ratings: Batch resolve all providers

    Ratings-->>Gateway: [{ rating: 4.7 }, { rating: 4.2 }, ...]

    Gateway->>Gateway: Merge nested structure
    Note over Gateway: Insert ratings into<br/>each provider object

    Gateway-->>Apollo: Complete nested response:<br/>members → claims → providers (with ratings)
```

## Key Patterns Summary

### Pattern 1: Pass-Through
- Query only Hasura fields
- Gateway forwards request
- Single database query
- Fastest performance

### Pattern 2: Entity Resolution
- Query federated fields
- Gateway calls multiple subgraphs
- Uses `__resolveReference`
- Automatic merging

### Pattern 3: Custom Actions
- Mutation triggers webhook
- Business logic in Node.js
- Database writes via action
- Return to gateway

### Pattern 4: Real-Time
- WebSocket subscription
- Database LISTEN/NOTIFY
- Live updates via gateway
- Cache invalidation

### Pattern 5: Optimistic UI
- Immediate cache update
- Background mutation
- Rollback on error
- Better UX

### Pattern 6: Security
- RLS at database level
- Silent filtering
- No explicit errors
- Defense in depth

## Performance Characteristics

| Pattern | Latency | Complexity | Use Case |
|---------|---------|------------|----------|
| Pass-Through | ~10ms | Low | Basic CRUD |
| Entity Resolution | ~25ms | Medium | Federated data |
| Custom Actions | ~100ms | High | External APIs |
| Subscriptions | ~5ms | Medium | Real-time updates |
| Optimistic | ~0ms (perceived) | Medium | Better UX |

## Debugging Tips

### Enable Gateway Logging
```typescript
const gateway = new ApolloGateway({
  debug: true  // Shows query plans
});
```

### Check Query Plan
```graphql
query @explain {
  providers { name, rating }
}
```

### Monitor Performance
- Gateway logs show which subgraph handled each field
- Apollo Studio shows field-level performance
- Browser DevTools Network tab shows GraphQL requests
