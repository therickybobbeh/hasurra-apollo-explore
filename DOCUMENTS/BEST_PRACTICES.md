# ClaimSight Best Practices

Best practices for working with GraphQL, Hasura, Apollo Client, and the ClaimSight codebase.

## GraphQL Best Practices

### 1. Use Fragments for Reusability

**Do:**
```graphql
fragment ClaimCoreFields on claims {
  id
  status
  dos
  charge_cents
}

query GetClaims {
  claims {
    ...ClaimCoreFields
  }
}
```

**Don't:**
```graphql
query GetClaims {
  claims {
    id
    status
    dos
    charge_cents
  }
}

query GetClaim($id: uuid!) {
  claims_by_pk(id: $id) {
    id      # Duplicated fields
    status
    dos
    charge_cents
  }
}
```

### 2. Request Only What You Need

**Do:**
```graphql
query GetClaimsList {
  claims {
    id
    status
    dos    # Only fields for list view
  }
}
```

**Don't:**
```graphql
query GetClaimsList {
  claims {
    id
    status
    dos
    member { /* Full member object not needed */ }
    provider { /* Full provider object not needed */ }
  }
}
```

### 3. Use Variables for Dynamic Queries

**Do:**
```graphql
query GetClaims($status: String) {
  claims(where: { status: { _eq: $status } }) {
    id
  }
}
```

**Don't:**
```graphql
query GetPaidClaims {
  claims(where: { status: { _eq: "PAID" } }) {
    id
  }
}
```

## Apollo Client Best Practices

### 1. Optimize Cache with Key Fields

```typescript
const cache = new InMemoryCache({
  typePolicies: {
    claims: {
      keyFields: ['id']  // Unique identifier
    }
  }
});
```

### 2. Use Optimistic Updates for Better UX

```typescript
const [addNote] = useMutation(ADD_NOTE, {
  optimisticResponse: {
    insert_notes_one: {
      __typename: 'notes',
      id: 'temp-id',
      body: noteBody,
      created_at: new Date().toISOString()
    }
  }
});
```

### 3. Handle Loading and Error States

**Do:**
```typescript
const { data, loading, error } = useQuery(GET_CLAIMS);

if (loading) return <Spinner />;
if (error) return <ErrorMessage error={error} />;
return <ClaimsList claims={data.claims} />;
```

**Don't:**
```typescript
const { data } = useQuery(GET_CLAIMS);
return <ClaimsList claims={data.claims} />; // Will crash on loading/error
```

### 4. Use Proper Fetch Policies

```typescript
// For data that changes frequently
useQuery(GET_CLAIMS, {
  fetchPolicy: 'cache-and-network'
});

// For one-time data
useQuery(GET_MEMBER, {
  fetchPolicy: 'cache-first'
});
```

## Hasura Best Practices

### 1. Always Use Row-Level Security

**Do:**
```sql
CREATE POLICY member_own_claims ON claims
  FOR SELECT
  TO hasura_member
  USING (member_id = current_setting('hasura.user.x-hasura-user-id')::uuid);
```

**Don't:**
```sql
-- Relying only on application-level filtering
```

### 2. Use Relationships for Efficient Joins

**Do:**
```yaml
# metadata
array_relationships:
  - name: claims
    using:
      foreign_key_constraint_on:
        column: member_id
        table: claims
```

Then query:
```graphql
query {
  members {
    id
    claims {  # Automatic join
      id
    }
  }
}
```

### 3. Index Foreign Keys and Filter Columns

```sql
CREATE INDEX idx_claims_member_id ON claims(member_id);
CREATE INDEX idx_claims_status ON claims(status);
CREATE INDEX idx_claims_dos ON claims(dos DESC);
```

### 4. Use Actions for Complex Business Logic

**Do:**
- Eligibility checks (external API calls)
- Complex validation
- Multi-step transactions

**Don't use Actions for:**
- Simple CRUD (use standard mutations)
- Data that can be computed in the database

## Error Handling

### 1. Provide Meaningful Error Messages

**Do:**
```typescript
catch (error) {
  if (error.graphQLErrors) {
    return error.graphQLErrors.map(e => e.message).join(', ');
  }
  return 'An unexpected error occurred';
}
```

### 2. Handle Network Errors Separately

```typescript
const { data, error, networkStatus } = useQuery(GET_CLAIMS, {
  notifyOnNetworkStatusChange: true
});

if (networkStatus === NetworkStatus.error) {
  return <NetworkError />;
}
```

## Performance Optimization

### 1. Pagination for Large Lists

**Do:**
```graphql
query GetClaims($limit: Int!, $offset: Int!) {
  claims(limit: $limit, offset: $offset) {
    id
  }
  claims_aggregate {
    aggregate {
      count
    }
  }
}
```

### 2. Use Subscriptions Sparingly

**Do use subscriptions for:**
- Real-time updates (claim status changes)
- Live data feeds

**Don't use subscriptions for:**
- Initial data loading
- Data that rarely changes

### 3. Batch Multiple Queries

**Do:**
```typescript
const { data } = useQuery(gql`
  query GetClaimDetail($id: uuid!) {
    claim: claims_by_pk(id: $id) { ... }
    notes(where: { member_id: { _eq: $memberId } }) { ... }
    member: members_by_pk(id: $memberId) { ... }
  }
`);
```

**Don't:**
```typescript
// Three separate queries
const { data: claim } = useQuery(GET_CLAIM);
const { data: notes } = useQuery(GET_NOTES);
const { data: member } = useQuery(GET_MEMBER);
```

## Security Best Practices

### 1. Never Expose Admin Secrets in Frontend

**Do:**
```typescript
// Use role-based headers in development
headers: {
  'x-hasura-role': 'member',
  'x-hasura-user-id': userId
}
```

**Don't:**
```typescript
// Exposing admin secret
headers: {
  'x-hasura-admin-secret': 'secret123'
}
```

### 2. Validate Input on Both Client and Server

**Client:**
```typescript
if (!noteBody.trim()) {
  setError('Note cannot be empty');
  return;
}
```

**Database:**
```sql
ALTER TABLE notes ADD CONSTRAINT note_body_not_empty
  CHECK (length(trim(body)) > 0);
```

### 3. Use Environment Variables for Secrets

```typescript
// .env (not committed)
VITE_GRAPHQL_HTTP_URL=http://localhost:8080/v1/graphql

// Code
const url = import.meta.env.VITE_GRAPHQL_HTTP_URL;
```

## Testing Strategy

### 1. Component Testing

```typescript
test('ClaimsList filters by status', async () => {
  render(<ClaimsList />);
  fireEvent.change(screen.getByLabelText('Status'), {
    target: { value: 'DENIED' }
  });
  expect(mockQuery).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { status: { _eq: 'DENIED' } }
    })
  );
});
```

### 2. Integration Testing with Mock GraphQL

```typescript
const mocks = [
  {
    request: {
      query: GET_CLAIMS,
      variables: { status: 'PAID' }
    },
    result: {
      data: { claims: mockClaims }
    }
  }
];

<MockedProvider mocks={mocks}>
  <ClaimsList />
</MockedProvider>
```

### 3. E2E Testing Critical Paths

- User can log in and view claims
- User can add a note
- Eligibility check completes successfully

## Code Organization

### 1. Colocate Related Code

```
components/
  ClaimsList/
    ClaimsList.tsx
    ClaimsList.test.tsx
    ClaimsList.styles.ts
    ClaimsListFilter.tsx
```

### 2. Separate GraphQL Operations

```
graphql/
  fragments.ts    # Reusable fragments
  queries.ts      # All queries
  mutations.ts    # All mutations
  subscriptions.ts # All subscriptions
```

### 3. Use TypeScript for Type Safety

```typescript
interface Claim {
  id: string;
  status: ClaimStatus;
  // ...
}

function formatClaim(claim: Claim): string {
  return `${claim.id} - ${claim.status}`;
}
```

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Hasura metadata applied
- [ ] CORS configured for production domain
- [ ] Rate limiting enabled
- [ ] Monitoring and logging set up
- [ ] Backup strategy in place
- [ ] SSL/TLS certificates configured
- [ ] Performance testing completed
- [ ] Security audit performed
