# ClaimSight Client

React + TypeScript + Vite + Apollo Client frontend for ClaimSight.

## Features

- **Apollo Client** with HTTP and WebSocket links
- **GraphQL** queries, mutations, and subscriptions
- **React Router** for navigation
- **TailwindCSS** for styling
- **TypeScript** for type safety
- **Vite** for fast development

## Development

```bash
npm install
npm run dev
```

The app will run on http://localhost:5173

## Environment Variables

Create a `.env` file in the project root (not in `app/client`):

```
VITE_GRAPHQL_HTTP_URL=http://localhost:8080/v1/graphql
VITE_GRAPHQL_WS_URL=ws://localhost:8080/v1/graphql
VITE_DEV_ROLE=admin
VITE_DEV_MEMBER_ID=
VITE_DEV_PROVIDER_ID=
```

## Project Structure

```
src/
  apollo/
    client.ts          # Apollo Client setup
  components/
    ClaimsList.tsx     # Claims list with filters
    ClaimDetail.tsx    # Claim details with notes
    EligibilityPanel.tsx # Eligibility check UI
  graphql/
    fragments.ts       # Reusable GraphQL fragments
    queries.ts         # GraphQL queries
    mutations.ts       # GraphQL mutations
    subscriptions.ts   # GraphQL subscriptions
  types/
    index.ts          # TypeScript types
  utils/
    format.ts         # Formatting utilities
  App.tsx             # Main app component
  main.tsx            # Entry point
  index.css           # Global styles (Tailwind)
```

## Apollo Client Features

### HTTP + WebSocket Links

The client automatically routes:
- Queries and mutations → HTTP
- Subscriptions → WebSocket

### Role-Based Headers

Development headers are injected based on `.env`:
- `x-hasura-role`
- `x-hasura-user-id` (for member role)
- `x-hasura-provider-id` (for provider role)

### Optimistic Updates

The `ADD_NOTE` mutation uses optimistic responses for instant UI updates.

### Cache Policies

- `cache-and-network` for watch queries
- `network-only` for one-time queries
- Proper cache normalization with `keyFields`

## Components

### ClaimsList

- Filter by status, date range
- Pagination
- Links to claim details

### ClaimDetail

- Full claim information
- Member and provider details
- Add notes with optimistic updates
- Real-time note updates (when subscription enabled)

### EligibilityPanel

- Run eligibility checks (calls Hasura action)
- View latest result (pretty-printed JSON)
- Check history

## GraphQL Operations

### Queries

- `GET_CLAIMS` - List claims with filters
- `GET_CLAIM` - Single claim with relationships
- `GET_MEMBER` - Member details
- `GET_NOTES` - Notes for a member
- `GET_ELIGIBILITY_CHECKS` - Eligibility check history

### Mutations

- `ADD_NOTE` - Add a case note
- `UPDATE_NOTE` - Update a note
- `DELETE_NOTE` - Delete a note
- `SUBMIT_ELIGIBILITY_CHECK` - Run eligibility check (action)
- `UPDATE_CLAIM_STATUS` - Update claim status (admin only)

### Subscriptions

- `CLAIMS_UPDATED` - Real-time claim updates
- `NOTES_UPDATED` - Real-time note updates

## Testing Different Roles

### Admin Role

```
VITE_DEV_ROLE=admin
```

Can see all data, no RLS restrictions.

### Member Role

```
VITE_DEV_ROLE=member
VITE_DEV_MEMBER_ID=<uuid-from-database>
```

Can only see own claims, notes, and eligibility checks.

### Provider Role

```
VITE_DEV_ROLE=provider
VITE_DEV_PROVIDER_ID=<uuid-from-database>
```

Can only see claims for patients they've treated.

To get UUIDs, query the database:
```sql
SELECT id, first_name, last_name FROM members LIMIT 5;
SELECT id, name FROM providers LIMIT 5;
```

## Building for Production

```bash
npm run build
```

Output will be in `dist/` directory.

## Learn More

- [Apollo Client Docs](https://www.apollographql.com/docs/react/)
- [GraphQL Docs](https://graphql.org/learn/)
- [React Router Docs](https://reactrouter.com/)
- [Vite Docs](https://vitejs.dev/)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
