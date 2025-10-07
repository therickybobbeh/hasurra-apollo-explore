# Authentication & Authorization

ClaimSight uses **Row-Level Security (RLS)** and **Hasura roles** for fine-grained access control.

---

## Role-Based Access Control

### Available Roles

| Role | Description | Access Level |
|------|-------------|--------------|
| **admin** | System administrator | Full access to all data |
| **member** | Healthcare member/patient | Own data only |
| **provider** | Healthcare provider | Claims assigned to them |

### Setting Your Role

Include the `x-hasura-role` header in your requests:

```bash
curl http://localhost:4000/graphql \
  -H "x-hasura-admin-secret: myadminsecretkey" \
  -H "x-hasura-role: member" \
  -H "x-hasura-user-id: user-uuid-here"
```

---

## Admin Role

**Full access** to all data and operations.

### Headers

```
x-hasura-admin-secret: your-admin-secret
x-hasura-role: admin
```

### What Admin Can Do

- Query all members, claims, providers
- Create, update, delete any record
- Access all notes and eligibility checks
- View system-wide aggregations

### Example Query

```graphql
query AdminViewAllClaims {
  claims {
    id
    status
    billed_amount
    member {
      first_name
      last_name
    }
    provider_record {
      name
    }
  }
}
```

---

## Member Role

**Limited to own data** only. Members can only see/modify their own information.

### Headers

```
x-hasura-admin-secret: your-admin-secret
x-hasura-role: member
x-hasura-user-id: <member-id>
```

### What Member Can Do

- ✅ View own profile
- ✅ View own claims
- ✅ View own eligibility checks
- ✅ View own notes
- ❌ Cannot view other members' data
- ❌ Cannot modify claims (read-only)

### Example Query

```graphql
query MemberViewOwnClaims {
  # Returns only claims for the authenticated member
  claims {
    id
    status
    cpt
    billed_amount
    service_date
    provider_record {
      name
      specialty
    }
  }
}
```

**Behind the scenes**: RLS policy filters by `member_id = current_user_id()`

### Row-Level Security (RLS) Policy

From `db/rls.sql`:

```sql
-- Members can only see their own claims
CREATE POLICY member_view_own_claims ON claims
  FOR SELECT
  USING (member_id = current_user_id());
```

---

## Provider Role

**Access to claims assigned to them**. Providers can view and update claims for their patients.

### Headers

```
x-hasura-admin-secret: your-admin-secret
x-hasura-role: provider
x-hasura-user-id: <provider-id>
```

### What Provider Can Do

- ✅ View claims assigned to them
- ✅ Update claim status
- ✅ Add notes to claims
- ✅ View member information (limited to their patients)
- ❌ Cannot view other providers' claims

### Example Query

```graphql
query ProviderViewClaims {
  # Returns only claims assigned to this provider
  claims {
    id
    status
    cpt
    billed_amount
    member {
      first_name
      last_name
      dob
    }
  }
}
```

### RLS Policy

```sql
-- Providers can only see claims assigned to them
CREATE POLICY provider_view_assigned_claims ON claims
  FOR SELECT
  USING (provider_id = current_user_id());
```

---

## Apollo Client Configuration

### With Static Role

```typescript
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const httpLink = createHttpLink({
  uri: 'http://localhost:4000/graphql',
});

const authLink = setContext((_, { headers }) => {
  return {
    headers: {
      ...headers,
      'x-hasura-admin-secret': 'myadminsecretkey',
      'x-hasura-role': 'admin',
    },
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
```

### With Dynamic Role (User Context)

```typescript
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const httpLink = createHttpLink({
  uri: 'http://localhost:4000/graphql',
});

const authLink = setContext((_, { headers }) => {
  // Get current user from state/context
  const user = getCurrentUser(); // Your auth logic

  return {
    headers: {
      ...headers,
      'x-hasura-admin-secret': process.env.VITE_HASURA_ADMIN_SECRET,
      'x-hasura-role': user?.role || 'member',
      'x-hasura-user-id': user?.id || '',
    },
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
```

---

## Testing Different Roles

### Using Apollo Studio Sandbox

1. Open http://localhost:4000/graphql
2. Click **Headers** tab
3. Add headers:
   ```json
   {
     "x-hasura-admin-secret": "myadminsecretkey",
     "x-hasura-role": "member",
     "x-hasura-user-id": "member-uuid-here"
   }
   ```

### Using Hasura Console

1. Open http://localhost:8080/console
2. Go to **API** → **GraphiQL**
3. Set **Request Headers**:
   ```json
   {
     "x-hasura-role": "member",
     "x-hasura-user-id": "member-uuid-here"
   }
   ```

### Using curl

```bash
# As admin
curl http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "x-hasura-admin-secret: myadminsecretkey" \
  -H "x-hasura-role: admin" \
  -d '{"query": "{ claims { id } }"}'

# As member
curl http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "x-hasura-admin-secret: myadminsecretkey" \
  -H "x-hasura-role: member" \
  -H "x-hasura-user-id: a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11" \
  -d '{"query": "{ claims { id } }"}'
```

---

## Permission Examples

### Admin Can See All Members

```graphql
query AdminViewMembers {
  members {
    id
    first_name
    last_name
    claims_aggregate {
      aggregate {
        count
      }
    }
  }
}
```

**Result**: All members returned

### Member Can Only See Themselves

```graphql
query MemberViewProfile {
  members {
    id
    first_name
    last_name
  }
}
```

**Result**: Only the authenticated member returned (filtered by RLS)

### Provider Can Update Claim Status

```graphql
mutation ProviderUpdateClaim($id: uuid!, $status: String!) {
  update_claims_by_pk(
    pk_columns: { id: $id }
    _set: { status: $status }
  ) {
    id
    status
  }
}
```

**Result**: Success if claim belongs to provider, error otherwise

---

## Security Best Practices

### 1. Never Expose Admin Secret to Frontend

❌ **Bad**: Hardcoded secret in client
```typescript
const secret = 'myadminsecretkey'; // NEVER DO THIS
```

✅ **Good**: Use environment variables and backend auth
```typescript
const secret = import.meta.env.VITE_HASURA_ADMIN_SECRET; // Still risky for prod
// Better: Use JWT auth with Hasura
```

### 2. Use JWT Authentication in Production

For production, replace admin secret with JWT tokens:

```typescript
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('auth_token');

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});
```

Configure Hasura to decode JWT and set roles automatically.

### 3. Test Permissions Thoroughly

Always test that:
- Members cannot see other members' data
- Providers cannot see other providers' claims
- Unauthorized users get proper error messages

---

## Row-Level Security Details

### How RLS Works

1. **Query is sent** with role and user ID headers
2. **Hasura applies RLS policies** at the database level
3. **PostgreSQL filters rows** based on current user
4. **Only authorized rows** are returned

### Current RLS Policies

From `db/rls.sql`:

```sql
-- Members can view their own data
CREATE POLICY member_view_own_claims ON claims
  FOR SELECT USING (member_id = current_user_id());

-- Providers can view their assigned claims
CREATE POLICY provider_view_assigned_claims ON claims
  FOR SELECT USING (provider_id = current_user_id());

-- Admins have full access (no policy needed)
```

### Viewing RLS Policies

```sql
-- In PostgreSQL
\d+ claims
-- Shows all policies on claims table
```

---

## Next Steps

- **[Common Patterns](./common-patterns.md)** - Query examples
- **[Getting Started](./getting-started.md)** - First queries
- **[ROLE_SWITCHER.md](../../DOCUMENTS/ROLE_SWITCHER.md)** - Frontend role switching component

