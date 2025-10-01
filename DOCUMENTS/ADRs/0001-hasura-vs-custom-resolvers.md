# ADR 0001: Hasura vs Custom GraphQL Resolvers

**Status:** Accepted
**Date:** 2024-03-15
**Deciders:** Architecture Team

## Context

ClaimSight needs a GraphQL API for the frontend to query healthcare data. We evaluated two approaches:
1. Hasura GraphQL Engine (auto-generated API)
2. Custom Apollo Server with hand-written resolvers

## Decision

We will use **Hasura GraphQL Engine** as the primary GraphQL API layer.

## Rationale

### Advantages of Hasura

**1. Auto-Generated API**
- Instant CRUD operations for all tables
- No boilerplate resolver code
- Automatic relationship traversal
- Built-in filtering, sorting, pagination

**2. Row-Level Security**
- Database-level security enforcement
- Permissions defined declaratively
- Session variables for user context
- Cannot be bypassed at application layer

**3. Real-Time Subscriptions**
- WebSocket support out of the box
- Live queries on any table
- No additional infrastructure

**4. Performance**
- Query plan caching
- Prepared statements
- Connection pooling
- Optimized SQL generation

**5. Development Speed**
- Reduce API development time by 80%
- Focus on business logic, not CRUD
- Instant API updates when schema changes

### Trade-offs

**Custom Resolvers Advantages (Not Chosen):**
- More control over query execution
- Easier to add complex business logic
- No dependency on Hasura service
- More familiar to some developers

**Why we accept Hasura's trade-offs:**
- Business logic can be added via Actions
- RLS provides better security than app-level checks
- Hasura is production-proven (used by 1000s of companies)
- Time-to-market is critical for learning project

## Consequences

### Positive
- Rapid development of GraphQL API
- Strong security guarantees via RLS
- Built-in real-time features
- Reduced maintenance burden

### Negative
- Dependency on Hasura (mitigated by open-source nature)
- Learning curve for Hasura-specific concepts
- Complex business logic requires Actions
- Must understand SQL and PostgreSQL RLS

### Neutral
- Need to document Hasura patterns
- Team must learn Hasura Console
- Metadata files must be version controlled

## Implementation

1. Use Hasura for all CRUD operations
2. Use Hasura Actions for custom business logic (e.g., eligibility checks)
3. Implement RLS policies for all sensitive tables
4. Track metadata in version control
5. Document permission patterns

## Alternatives Considered

### 1. Apollo Server with Custom Resolvers
**Pros:** Full control, familiar patterns
**Cons:** High development effort, must implement RLS manually
**Rejected because:** Time-to-market and security concerns

### 2. REST API
**Pros:** Simple, widely understood
**Cons:** Over-fetching, under-fetching, no real-time
**Rejected because:** GraphQL better fits our use case

### 3. Prisma with GraphQL Yoga
**Pros:** Type-safe, modern DX
**Cons:** Still requires writing resolvers, less feature-complete than Hasura
**Rejected because:** Hasura provides more out-of-the-box features

## Related ADRs
- ADR 0002: Apollo Client for frontend
- ADR 0003: PromptQL for natural language queries

## References
- [Hasura Docs](https://hasura.io/docs/)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [GraphQL Best Practices](https://graphql.org/learn/best-practices/)
