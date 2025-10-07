# Common GraphQL Query Patterns

Learn common patterns for filtering, pagination, aggregation, and more.

---

## Filtering

Hasura provides powerful `where` clause filtering.

### Basic Equality

```graphql
query FilterByStatus {
  claims(where: { status: { _eq: "approved" } }) {
    id
    status
    billed_amount
  }
}
```

### Multiple Conditions (AND)

```graphql
query FilterMultiple {
  claims(
    where: {
      _and: [
        { status: { _eq: "pending" } }
        { billed_amount: { _gte: 1000 } }
      ]
    }
  ) {
    id
    status
    billed_amount
  }
}
```

### OR Conditions

```graphql
query FilterOr {
  claims(
    where: {
      _or: [
        { status: { _eq: "approved" } }
        { status: { _eq: "pending" } }
      ]
    }
  ) {
    id
    status
  }
}
```

### Text Search (Case-Insensitive)

```graphql
query SearchProviders {
  provider_records(
    where: { name: { _ilike: "%cardiology%" } }
  ) {
    id
    name
    specialty
  }
}
```

### Date Filtering

```graphql
query ClaimsInDateRange {
  claims(
    where: {
      service_date: {
        _gte: "2024-01-01"
        _lte: "2024-12-31"
      }
    }
  ) {
    id
    service_date
    billed_amount
  }
}
```

### Nested Relationship Filtering

```graphql
query MembersWithPendingClaims {
  members(
    where: {
      claims: { status: { _eq: "pending" } }
    }
  ) {
    id
    first_name
    last_name
    claims(where: { status: { _eq: "pending" } }) {
      id
      status
      billed_amount
    }
  }
}
```

---

## Sorting

Use `order_by` to sort results.

### Single Field

```graphql
query SortedClaims {
  claims(order_by: { service_date: desc }) {
    id
    service_date
    billed_amount
  }
}
```

### Multiple Fields

```graphql
query SortMultiple {
  claims(
    order_by: [
      { status: asc }
      { service_date: desc }
    ]
  ) {
    id
    status
    service_date
  }
}
```

### Sort by Relationship Field

```graphql
query SortByMemberName {
  claims(
    order_by: { member: { last_name: asc } }
  ) {
    id
    member {
      first_name
      last_name
    }
  }
}
```

---

## Pagination

### Offset-Based Pagination

```graphql
query PaginatedClaims($limit: Int = 20, $offset: Int = 0) {
  claims(
    limit: $limit
    offset: $offset
    order_by: { created_at: desc }
  ) {
    id
    status
    billed_amount
  }

  # Get total count
  claims_aggregate {
    aggregate {
      count
    }
  }
}
```

Variables:
```json
{
  "limit": 20,
  "offset": 40
}
```

### Cursor-Based Pagination (More Efficient)

```graphql
query CursorPagination($cursor: uuid!) {
  claims(
    where: { id: { _gt: $cursor } }
    limit: 20
    order_by: { id: asc }
  ) {
    id
    status
    billed_amount
  }
}
```

---

## Aggregations

### Count

```graphql
query CountClaims {
  claims_aggregate {
    aggregate {
      count
    }
  }
}
```

### Sum, Average, Min, Max

```graphql
query ClaimStatistics {
  claims_aggregate(where: { status: { _eq: "approved" } }) {
    aggregate {
      count
      sum {
        billed_amount
      }
      avg {
        billed_amount
      }
      min {
        billed_amount
      }
      max {
        billed_amount
      }
    }
  }
}
```

### Group By (Using Distinct)

```graphql
query ClaimsByStatus {
  approved: claims_aggregate(where: { status: { _eq: "approved" } }) {
    aggregate {
      count
      sum {
        billed_amount
      }
    }
  }
  pending: claims_aggregate(where: { status: { _eq: "pending" } }) {
    aggregate {
      count
      sum {
        billed_amount
      }
    }
  }
  denied: claims_aggregate(where: { status: { _eq: "denied" } }) {
    aggregate {
      count
      sum {
        billed_amount
      }
    }
  }
}
```

---

## Mutations

### Insert Single Row

```graphql
mutation CreateNote($object: notes_insert_input!) {
  insert_notes_one(object: $object) {
    id
    note
    created_at
  }
}
```

Variables:
```json
{
  "object": {
    "claim_id": "uuid-here",
    "note": "Note text",
    "created_by": "admin"
  }
}
```

### Insert Multiple Rows

```graphql
mutation CreateMultipleNotes($objects: [notes_insert_input!]!) {
  insert_notes(objects: $objects) {
    affected_rows
    returning {
      id
      note
    }
  }
}
```

### Update by Primary Key

```graphql
mutation UpdateClaim($id: uuid!, $status: String!) {
  update_claims_by_pk(
    pk_columns: { id: $id }
    _set: { status: $status }
  ) {
    id
    status
    updated_at
  }
}
```

### Update with Where Clause

```graphql
mutation ApproveAllPendingClaims {
  update_claims(
    where: { status: { _eq: "pending" } }
    _set: { status: "approved" }
  ) {
    affected_rows
    returning {
      id
      status
    }
  }
}
```

### Delete

```graphql
mutation DeleteNote($id: uuid!) {
  delete_notes_by_pk(id: $id) {
    id
    note
  }
}
```

---

## Subscriptions

### Subscribe to All Rows

```graphql
subscription WatchClaims {
  claims(order_by: { created_at: desc }, limit: 10) {
    id
    status
    billed_amount
  }
}
```

### Subscribe with Filtering

```graphql
subscription WatchPendingClaims {
  claims(
    where: { status: { _eq: "pending" } }
    order_by: { created_at: desc }
  ) {
    id
    status
    billed_amount
    member {
      first_name
      last_name
    }
  }
}
```

**Note**: Subscriptions send new data whenever the query results change (insert, update, delete).

---

## Optimistic Updates (Apollo Client)

When creating/updating data, show changes immediately before server confirmation:

```typescript
const [createNote] = useMutation(CREATE_NOTE_MUTATION, {
  optimisticResponse: {
    insert_notes_one: {
      __typename: 'notes',
      id: 'temp-id',
      note: noteText,
      created_at: new Date().toISOString(),
      created_by: 'admin',
    },
  },
  update: (cache, { data }) => {
    // Update cache with real data when mutation completes
  },
});
```

---

## Error Handling

### Check for Errors

```typescript
const { data, loading, error } = useQuery(GET_MEMBERS_QUERY);

if (error) {
  console.error('GraphQL Error:', error.message);
  // Handle error (show toast, retry, etc.)
}
```

### Partial Errors

GraphQL can return both data AND errors:

```json
{
  "data": {
    "members": [...]
  },
  "errors": [
    {
      "message": "Field 'invalidField' doesn't exist",
      "extensions": {
        "path": "$.members[0].invalidField",
        "code": "validation-failed"
      }
    }
  ]
}
```

---

## Best Practices

### 1. Request Only What You Need

❌ **Bad**: Fetching unnecessary fields
```graphql
query {
  members {
    id
    first_name
    last_name
    dob
    member_id
    created_at
    updated_at
    # ... many more fields
  }
}
```

✅ **Good**: Request only required fields
```graphql
query {
  members {
    id
    first_name
    last_name
  }
}
```

### 2. Use Fragments for Reusable Fields

```graphql
fragment MemberBasicInfo on members {
  id
  first_name
  last_name
  dob
}

query GetMembers {
  members {
    ...MemberBasicInfo
  }
}

query GetMemberById($id: uuid!) {
  members_by_pk(id: $id) {
    ...MemberBasicInfo
    claims {
      id
      status
    }
  }
}
```

### 3. Use Variables for Dynamic Values

❌ **Bad**: String interpolation (security risk)
```graphql
query {
  members(where: { id: { _eq: "${userId}" } }) {
    id
  }
}
```

✅ **Good**: Use variables
```graphql
query GetMember($userId: uuid!) {
  members_by_pk(id: $userId) {
    id
  }
}
```

### 4. Limit Results

Always use `limit` to prevent fetching millions of rows:

```graphql
query GetClaims {
  claims(limit: 100, order_by: { created_at: desc }) {
    id
    status
  }
}
```

---

## Next Steps

- **[Authentication Guide](./authentication.md)** - Role-based access control
- **[API Reference](../api/index.html)** - Complete schema reference
- **[Hasura Queries](../subgraphs/hasura/queries.md)** - Domain-specific examples

