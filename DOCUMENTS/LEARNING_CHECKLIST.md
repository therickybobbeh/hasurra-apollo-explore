# ClaimSight Learning Checklist

Step-by-step guide to learn GraphQL, Hasura, Apollo Client, and Federation using ClaimSight.

## Prerequisites

- [ ] Node.js 18+ installed
- [ ] PostgreSQL 15+ installed
- [ ] Basic knowledge of JavaScript/TypeScript
- [ ] Basic knowledge of SQL
- [ ] Basic knowledge of React

## Phase 1: Setup & Exploration (30 minutes)

### Environment Setup
- [ ] Clone/create the ClaimSight repository
- [ ] Copy `.env.example` to `.env`
- [ ] Update database credentials in `.env`
- [ ] Run `npm run setup`
- [ ] Create PostgreSQL database: `createdb claimsight`

### Database Setup
- [ ] Run `npm run seed` to create schema and insert data
- [ ] Connect to database with psql or GUI tool
- [ ] Explore tables: `\dt` in psql
- [ ] View sample data: `SELECT * FROM claims LIMIT 5;`
- [ ] Understand relationships between tables

### Hasura Setup
- [ ] Run `npm run hasura:apply`
- [ ] Start Hasura (binary or cloud)
- [ ] Open Hasura Console (http://localhost:8080/console)
- [ ] Explore Data tab
- [ ] View relationships in GraphiQL

## Phase 2: GraphQL Basics (45 minutes)

### Simple Queries
- [ ] Open Hasura GraphiQL
- [ ] Query all claims:
  ```graphql
  query {
    claims {
      id
      status
      dos
    }
  }
  ```
- [ ] Query with filter:
  ```graphql
  query {
    claims(where: { status: { _eq: "DENIED" } }) {
      id
      denial_reason
    }
  }
  ```
- [ ] Query with limit and order:
  ```graphql
  query {
    claims(limit: 10, order_by: { dos: desc }) {
      id
      dos
    }
  }
  ```

### Relationships
- [ ] Query claim with member:
  ```graphql
  query {
    claims {
      id
      member {
        first_name
        last_name
      }
    }
  }
  ```
- [ ] Query member with all claims:
  ```graphql
  query {
    members {
      id
      first_name
      claims {
        id
        status
      }
    }
  }
  ```

### Aggregations
- [ ] Count claims:
  ```graphql
  query {
    claims_aggregate {
      aggregate {
        count
      }
    }
  }
  ```
- [ ] Sum and average:
  ```graphql
  query {
    claims_aggregate {
      aggregate {
        sum {
          charge_cents
        }
        avg {
          allowed_cents
        }
      }
    }
  }
  ```

### Variables
- [ ] Use query variables:
  ```graphql
  query GetClaimsByStatus($status: String!) {
    claims(where: { status: { _eq: $status } }) {
      id
      status
    }
  }
  ```
  Variables: `{ "status": "PAID" }`

## Phase 3: Mutations (30 minutes)

### Insert Data
- [ ] Add a note:
  ```graphql
  mutation {
    insert_notes_one(object: {
      member_id: "uuid-here",
      body: "Test note from GraphiQL"
    }) {
      id
      created_at
    }
  }
  ```

### Update Data
- [ ] Update a note:
  ```graphql
  mutation {
    update_notes_by_pk(
      pk_columns: { id: "uuid-here" },
      _set: { body: "Updated note" }
    ) {
      id
      body
    }
  }
  ```

### Delete Data
- [ ] Delete a note:
  ```graphql
  mutation {
    delete_notes_by_pk(id: "uuid-here") {
      id
    }
  }
  ```

## Phase 4: Hasura Features (45 minutes)

### Permissions (RLS)
- [ ] View permissions in Hasura Console → Data → Table → Permissions
- [ ] Test member role with headers:
  ```json
  {
    "x-hasura-role": "member",
    "x-hasura-user-id": "member-uuid"
  }
  ```
- [ ] Verify you only see that member's data
- [ ] Switch to admin role and see all data

### Actions
- [ ] Start action handler: `npm run action:dev`
- [ ] Run eligibility check mutation:
  ```graphql
  mutation {
    submitEligibilityCheck(memberId: "uuid-here") {
      id
      result
    }
  }
  ```
- [ ] View action handler logs
- [ ] Check inserted eligibility check in database

### Subscriptions
- [ ] In GraphiQL, create subscription:
  ```graphql
  subscription {
    claims(limit: 5, order_by: { updated_at: desc }) {
      id
      status
      updated_at
    }
  }
  ```
- [ ] In another tab, update a claim status
- [ ] Watch subscription receive update in real-time

## Phase 5: Apollo Client (60 minutes)

### Setup & First Query
- [ ] Start frontend: `npm run client:dev`
- [ ] Open http://localhost:5173
- [ ] View claims list
- [ ] Open browser DevTools → Network → WS to see WebSocket
- [ ] Open Apollo DevTools extension

### Inspect Apollo Cache
- [ ] Open Apollo DevTools
- [ ] View cache contents
- [ ] See normalized data structure
- [ ] Observe cache updates on navigation

### Mutations with Optimistic Updates
- [ ] Click on a claim to view details
- [ ] Add a note
- [ ] Watch optimistic update (note appears immediately)
- [ ] Watch confirmation (ID changes from temp to real)
- [ ] Check network tab for mutation request

### Subscriptions
- [ ] Uncomment subscription code in ClaimsList (if commented)
- [ ] Open two browser windows side by side
- [ ] Update claim in Hasura Console
- [ ] Watch both windows update in real-time

### Error Handling
- [ ] Disconnect from network
- [ ] Try to add a note
- [ ] Observe error handling
- [ ] Reconnect and try again

## Phase 6: Advanced Features (45 minutes)

### Fragments
- [ ] Open `app/client/src/graphql/fragments.ts`
- [ ] See how fragments are defined
- [ ] Open `queries.ts` and see fragment usage
- [ ] Modify a fragment and see all queries update

### Federation (Optional Subgraph)
- [ ] Start subgraph: `npm run subgraph:dev`
- [ ] Query provider with rating:
  ```graphql
  query {
    providers_by_pk(id: "uuid") {
      name
      rating        # Extended field from subgraph
      ratingCount
    }
  }
  ```
- [ ] View subgraph code in `app/server/src/index.ts`

### PromptQL Examples
- [ ] Open `promptql/examples/queries.md`
- [ ] Copy SQL query for "Top 5 Denial Reasons"
- [ ] Run in psql or database GUI
- [ ] Analyze results
- [ ] Try other example queries

## Phase 7: Customize & Extend (Open-ended)

### Add New Feature
- [ ] Add a new table (e.g., `appeals`)
- [ ] Write migration
- [ ] Track in Hasura
- [ ] Configure permissions
- [ ] Add GraphQL query to frontend
- [ ] Create React component

### Improve Existing Feature
- [ ] Add claim filtering by date range
- [ ] Add pagination to notes
- [ ] Add search to members list
- [ ] Add claim status update (admin only)

### Explore RLS
- [ ] Review RLS policies in `db/rls.sql`
- [ ] Test different roles
- [ ] Try to bypass RLS (you shouldn't be able to!)
- [ ] Add new policy for a custom requirement

## Completion Goals

By the end, you should be able to:

✅ Write GraphQL queries with filters, relationships, and aggregations
✅ Create mutations for insert, update, and delete
✅ Use subscriptions for real-time updates
✅ Understand Hasura permissions and RLS
✅ Configure Apollo Client with HTTP + WebSocket
✅ Implement optimistic updates in React
✅ Debug GraphQL queries with DevTools
✅ Extend the schema with actions or subgraphs
✅ Write natural language queries with PromptQL concepts
✅ Deploy a cross-platform GraphQL application

## Resources

- [GraphQL Official Docs](https://graphql.org/learn/)
- [Hasura Docs](https://hasura.io/docs/latest/index/)
- [Apollo Client Docs](https://www.apollographql.com/docs/react/)
- [PostgreSQL RLS Guide](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Apollo Federation](https://www.apollographql.com/docs/federation/)

## Next Steps

1. Build your own healthcare feature (e.g., prior authorizations, referrals)
2. Integrate real authentication (Auth0, Firebase, custom JWT)
3. Add real-time notifications
4. Implement complex workflows (appeals process)
5. Scale to production with Hasura Cloud
