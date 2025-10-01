# ADR 0002: Apollo Client for Frontend Data Management

**Status:** Accepted
**Date:** 2024-03-15
**Deciders:** Frontend Team

## Context

ClaimSight frontend needs to communicate with the Hasura GraphQL API. We need a solution for:
- Fetching data from GraphQL
- Managing client-side cache
- Handling subscriptions for real-time updates
- Optimistic UI updates

## Decision

We will use **Apollo Client** as the GraphQL client library.

## Rationale

### Advantages of Apollo Client

**1. Comprehensive GraphQL Support**
- Queries, mutations, and subscriptions
- Fragment composition
- Variable management
- Error handling

**2. Intelligent Caching**
- Normalized cache by default
- Automatic cache updates on mutations
- Cache persistence options
- Optimistic UI support

**3. Real-Time Features**
- WebSocket subscriptions
- Split HTTP/WS links
- Automatic reconnection
- Subscription lifecycle management

**4. Developer Experience**
- React Hooks integration
- DevTools browser extension
- TypeScript support
- Active community and ecosystem

**5. Production Ready**
- Used by major companies (Airbnb, NY Times, etc.)
- Mature and battle-tested
- Excellent documentation
- Regular updates and maintenance

## Consequences

### Positive
- Best-in-class GraphQL client
- Reduced boilerplate with hooks
- Built-in performance optimizations
- Great debugging experience with DevTools

### Negative
- Bundle size (~30KB gzipped)
- Learning curve for cache management
- Some advanced patterns require deep understanding
- Occasional complexity with cache updates

### Neutral
- Must learn Apollo-specific patterns
- Cache normalization requires key fields
- Need to understand fetchPolicy options

## Implementation

### 1. Client Setup
```typescript
const client = new ApolloClient({
  link: splitLink, // HTTP + WebSocket
  cache: new InMemoryCache({
    typePolicies: { /* normalized cache */ }
  })
});
```

### 2. Query Pattern
```typescript
const { data, loading, error } = useQuery(GET_CLAIMS, {
  variables: { status: 'DENIED' },
  fetchPolicy: 'cache-and-network'
});
```

### 3. Mutation with Optimistic Update
```typescript
const [addNote] = useMutation(ADD_NOTE, {
  optimisticResponse: { /* predicted result */ },
  update: (cache, { data }) => { /* manual cache update */ }
});
```

### 4. Subscription
```typescript
useSubscription(CLAIMS_UPDATED, {
  variables: { memberId },
  onData: ({ data }) => { /* handle update */ }
});
```

## Alternatives Considered

### 1. urql
**Pros:** Lightweight, simpler API, great docs
**Cons:** Smaller ecosystem, less mature, fewer features
**Rejected because:** Apollo more feature-complete for our needs

### 2. React Query + GraphQL Request
**Pros:** Excellent caching, smaller bundle
**Cons:** Not GraphQL-specific, less sophisticated for subscriptions
**Rejected because:** Apollo better for GraphQL-first architecture

### 3. Custom Fetch Wrapper
**Pros:** Full control, minimal dependencies
**Cons:** High development effort, must implement caching, subscriptions, etc.
**Rejected because:** Reinventing the wheel

### 4. SWR + GraphQL Request
**Pros:** Simple hooks API, good for basic use cases
**Cons:** Not built for GraphQL, lacks normalized cache
**Rejected because:** Insufficient for complex requirements

## Key Patterns

### 1. Fragment Collocation
Define fragments near components that use them:
```typescript
const CLAIM_FIELDS = gql`
  fragment ClaimFields on claims {
    id
    status
    dos
  }
`;
```

### 2. Optimistic Updates
Immediately update UI before server response:
```typescript
optimisticResponse: {
  insert_notes_one: {
    __typename: 'notes',
    id: 'temp-id',
    body: noteBody,
    created_at: new Date().toISOString()
  }
}
```

### 3. Error Handling
Handle network and GraphQL errors separately:
```typescript
if (error) {
  if (error.networkError) return <NetworkError />;
  if (error.graphQLErrors) return <GraphQLError errors={error.graphQLErrors} />;
}
```

## Trade-offs Accepted

**Bundle Size:**
- Accept 30KB gzipped for comprehensive features
- Benefits outweigh size cost for our use case

**Complexity:**
- Cache management can be complex
- Document common patterns in BEST_PRACTICES.md
- Provide examples in codebase

**Learning Curve:**
- Invest in team training
- Create internal documentation
- Use consistent patterns across codebase

## Related ADRs
- ADR 0001: Hasura for GraphQL API
- ADR 0003: PromptQL for natural language queries

## References
- [Apollo Client Docs](https://www.apollographql.com/docs/react/)
- [Apollo DevTools](https://www.apollographql.com/docs/react/development-testing/developer-tooling/)
- [GraphQL Caching](https://www.apollographql.com/docs/react/caching/overview/)
