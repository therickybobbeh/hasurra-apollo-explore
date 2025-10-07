# Getting Started with ClaimSight GraphQL API

Welcome to the ClaimSight API! This guide will help you make your first queries.

---

## Prerequisites

- Basic understanding of GraphQL
- GraphQL client (Apollo Client, graphql-request, or curl)
- Admin secret key (from `.env` file)

---

## 1. Connect to the API

ClaimSight uses **Apollo Federation** to combine multiple GraphQL services into one unified endpoint.

### Endpoints

| Environment | URL | Description |
|-------------|-----|-------------|
| **Local Development** | `http://localhost:4000/graphql` | Federation gateway (recommended) |
| **Hasura Direct** | `http://localhost:8080/v1/graphql` | Direct Hasura connection (database only) |
| **Production** | `https://claimsight-gateway.onrender.com/graphql` | Deployed gateway |

**Recommendation**: Always use the **federation gateway** (port 4000) to access all features.

---

## 2. Authentication

Include your admin secret in request headers:

### HTTP Headers

```
x-hasura-admin-secret: your-admin-secret-here
x-hasura-role: admin
```

### Example with curl

```bash
curl http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "x-hasura-admin-secret: myadminsecretkey" \
  -H "x-hasura-role: admin" \
  -d '{"query": "{ members { id first_name last_name } }"}'
```

### Example with Apollo Client

```typescript
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

const client = new ApolloClient({
  link: new HttpLink({
    uri: 'http://localhost:4000/graphql',
    headers: {
      'x-hasura-admin-secret': 'myadminsecretkey',
      'x-hasura-role': 'admin',
    },
  }),
  cache: new InMemoryCache(),
});
```

---

## 3. Your First Query

Let's fetch all members from the database.

### Query

```graphql
query GetMembers {
  members(limit: 10) {
    id
    first_name
    last_name
    dob
    member_id
  }
}
```

### Response

```json
{
  "data": {
    "members": [
      {
        "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        "first_name": "John",
        "last_name": "Doe",
        "dob": "1985-03-15",
        "member_id": "MEM001"
      }
    ]
  }
}
```

---

## 4. Query with Relationships

Get a member with all their claims:

```graphql
query GetMemberWithClaims($memberId: uuid!) {
  members_by_pk(id: $memberId) {
    id
    first_name
    last_name
    dob

    # Related claims
    claims {
      id
      status
      cpt
      billed_amount
      service_date

      # Claim's provider
      provider_record {
        name
        specialty
        npi
      }
    }
  }
}
```

### Variables

```json
{
  "memberId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
}
```

---

## 5. Federated Query (Provider Ratings)

This demonstrates **TRUE Apollo Federation**! The `Provider` type combines data from multiple services:

```graphql
query GetProvidersWithRatings {
  providers {
    # Base fields
    id
    name
    specialty
    npi

    # Federated fields from ratings subgraph
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

**How it works**:
1. Gateway fetches base Provider data
2. Gateway calls ratings subgraph with Provider IDs
3. Ratings subgraph returns rating information via `__resolveReference`
4. Gateway merges results into single response

See [Federation Guide](../../DOCUMENTS/FEDERATION_GUIDE.md) for details.

---

## 6. Mutations

Create a new note for a claim:

```graphql
mutation CreateNote($object: notes_insert_input!) {
  insert_notes_one(object: $object) {
    id
    claim_id
    note
    created_at
    created_by
  }
}
```

### Variables

```json
{
  "object": {
    "claim_id": "claim-uuid-here",
    "note": "Reviewed documentation - approved",
    "created_by": "admin"
  }
}
```

---

## 7. Actions (Custom Business Logic)

Check member eligibility:

```graphql
mutation CheckEligibility($input: CheckEligibilityInput!) {
  checkEligibility(input: $input) {
    eligible
    reason
    coverageDetails {
      planName
      copay
      deductibleRemaining
    }
  }
}
```

### Variables

```json
{
  "input": {
    "memberId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "serviceDate": "2024-01-15",
    "cpt": "99213"
  }
}
```

**How actions work**: Hasura calls a REST API endpoint (action handler) which performs custom validation/processing.

---

## 8. Subscriptions (Real-Time)

Subscribe to new claims:

```graphql
subscription WatchNewClaims {
  claims(
    order_by: { created_at: desc }
    limit: 10
  ) {
    id
    status
    cpt
    billed_amount
    member {
      first_name
      last_name
    }
  }
}
```

**Note**: Subscriptions require WebSocket connection. Use Apollo Client's WebSocket link or Hasura console.

---

## Next Steps

- **[Common Patterns](./common-patterns.md)** - Filtering, pagination, aggregation
- **[Authentication](./authentication.md)** - Role-based access control
- **[API Reference](../api/index.html)** - Complete schema documentation
- **[Hasura Subgraph](../subgraphs/hasura/overview.md)** - Database operations
- **[Providers Subgraph](../subgraphs/providers/overview.md)** - Federated ratings

---

## GraphQL Resources

- **GraphQL Playground**: http://localhost:4000/graphql (in browser)
- **Apollo Studio Sandbox**: https://studio.apollographql.com/sandbox
- **Hasura Console**: http://localhost:8080/console

Happy querying! 🚀
