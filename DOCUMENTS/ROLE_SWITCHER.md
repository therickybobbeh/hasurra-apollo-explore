# Role Switcher Feature

The ClaimSight frontend includes a runtime role switcher that allows you to test different user permissions without restarting the application or manually editing environment variables.

## How It Works

### UI Component

A dropdown in the top-right corner of the navigation bar displays the current user/role. Clicking it reveals a list of pre-configured test users.

**Visual Indicators:**
- 🟣 **Admin** - Purple badge
- 🔵 **Member** - Blue badge
- 🟢 **Provider** - Green badge

### Configuration

Test users can be defined in `.env` as a JSON array, but the application also includes hardcoded fallback users:

**Current Pre-configured Users:**
```bash
VITE_TEST_USERS=[
  {"role":"admin","label":"Admin User"},
  {"role":"member","label":"Member - Michael Lopez","memberId":"0b057d39-0b9d-4265-a92c-d9fd8f22a7a6"},
  {"role":"member","label":"Member - Linda Davis","memberId":"bf6a2a56-c1a0-42cd-85df-5c6254fc98b2"},
  {"role":"provider","label":"Provider - Dr. Smith","providerId":"734f62da-879d-45bb-b07b-8163182ef917"}
]
```

**Note**: These same users are hardcoded in `app/client/src/init.ts` and `app/client/src/context/RoleContext.tsx` as a fallback. If `VITE_TEST_USERS` fails to parse or is missing, the hardcoded values are used. Michael Lopez has 8 claims and Linda Davis has 6 claims in the seeded database.

**User Object Structure:**
```typescript
{
  role: 'admin' | 'member' | 'provider';
  label: string;                    // Display name in dropdown
  memberId?: string;                // UUID (required for member role)
  providerId?: string;              // UUID (required for provider role)
}
```

### Adding Custom Test Users

**Recommended Approach (Permanent Changes):**

Update the hardcoded users in both files:

1. **Get IDs from database:**
   ```bash
   # For members with claims
   docker exec claimsight-postgres psql -U claimsight -c \
     "SELECT m.id, m.first_name, m.last_name, COUNT(c.id) as claim_count
      FROM members m
      LEFT JOIN claims c ON c.member_id = m.id
      GROUP BY m.id
      ORDER BY claim_count DESC
      LIMIT 5;"

   # For providers
   docker exec claimsight-postgres psql -U claimsight -c \
     "SELECT id, name FROM providers LIMIT 5;"
   ```

2. **Update hardcoded arrays in:**
   - `app/client/src/init.ts` (parseTestUsers function)
   - `app/client/src/context/RoleContext.tsx` (defaultUsers constant)

   ```typescript
   const defaultUsers: TestUser[] = [
     { role: 'admin', label: 'Admin User' },
     { role: 'member', label: 'Member - Jane Doe', memberId: 'YOUR-UUID-HERE' },
     { role: 'provider', label: 'Provider - Dr. Jones', providerId: 'YOUR-UUID-HERE' }
   ];
   ```

3. **Restart the dev server:**
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

**Alternative Approach (Temporary Testing):**

Update `VITE_TEST_USERS` in `.env` and restart. This will be used if the env var loads successfully, otherwise it falls back to the hardcoded users.

```bash
VITE_TEST_USERS=[
  {"role":"admin","label":"Admin User"},
  {"role":"member","label":"Member: Jane Doe","memberId":"YOUR-UUID-HERE"}
]
```

## Technical Details

### State Management

- **RoleContext** (`src/context/RoleContext.tsx`): React Context that manages current user state
- **localStorage**: Persists selected user across page reloads
- **Apollo Client**: Reads from localStorage on initialization to set auth headers

### Authentication Flow

1. User selects a role from the dropdown
2. `RoleContext` updates state and saves to `localStorage`
3. Page reloads to reinitialize Apollo Client with new auth headers
4. All GraphQL requests use the new role's permissions

### Headers Sent to Hasura

**Admin:**
```http
x-hasura-role: admin
x-hasura-admin-secret: claimsight_admin_secret_change_me
```

**Member:**
```http
x-hasura-role: member
x-hasura-user-id: 02b2b8af-f92f-4227-8683-9bd21a5feb74
```

**Provider:**
```http
x-hasura-role: provider
x-hasura-provider-id: 734f62da-879d-45bb-b07b-8163182ef917
```

## Testing Permissions

### Example: Member Role

1. Switch to "Member - Michael Lopez" in the dropdown
2. Navigate to Claims page
3. You'll only see claims for Michael Lopez (RLS enforced) - should show 8 claims
4. Try to query another member's data - request will fail

### Example: Provider Role

1. Switch to "Provider: Dr. Smith"
2. Navigate to Claims page
3. You'll only see claims where Dr. Smith is the provider
4. Try to update another provider's name - request will fail

### Example: Admin Role

1. Switch to "Admin User"
2. Navigate to Claims page
3. You'll see ALL claims across all members and providers
4. Full access to all data (no RLS restrictions)

## Files Involved

```
app/client/src/
├── context/
│   └── RoleContext.tsx          # Role state management
├── components/
│   └── RoleSwitcher.tsx         # Dropdown UI component
├── apollo/
│   └── client.ts                # Reads role from localStorage
└── App.tsx                      # Wraps app in RoleProvider

.env                             # Test users configuration
.env.example                     # Template for new setups
```

## Development vs Production

**Development (Current Setup):**
- Role switcher visible in UI
- Test users defined in `.env`
- Uses admin secret and session variables
- No real authentication

**Production (Recommended):**
- Remove role switcher component
- Implement JWT authentication
- Hasura validates JWT tokens
- User identity comes from auth provider (Auth0, Firebase, etc.)

### Converting to Production Auth

Replace the auth link in `apollo/client.ts`:

```typescript
// Development
const authHeaders = {
  'x-hasura-role': user.role,
  'x-hasura-user-id': user.memberId
};

// Production
const authHeaders = {
  'Authorization': `Bearer ${getJwtToken()}`  // JWT contains role + user ID
};
```

Hasura will decode the JWT and extract:
- `x-hasura-role`
- `x-hasura-user-id`
- `x-hasura-provider-id`
- Any custom claims

## Troubleshooting

### Role switcher doesn't appear

1. Check RoleProvider wraps the app in `App.tsx`
2. Verify `VITE_TEST_USERS` is set in `.env`
3. Restart dev server after changing `.env`

### Permission errors after switching roles

1. Check browser console for GraphQL errors
2. Verify the member/provider ID exists in the database
3. Check Hasura Console > API > Request Headers to see what's being sent

### Data doesn't change after switching roles

1. Apollo cache may be stale - hard refresh the browser (Cmd+Shift+R / Ctrl+Shift+R)
2. Check Network tab to verify new headers are being sent
3. Role switch triggers a page reload - if it doesn't, check browser console for errors

### "Failed to parse VITE_TEST_USERS" error

1. Ensure JSON is valid (use a JSON validator)
2. Check for unescaped quotes
3. Verify the env var is on a single line

**Note:** If this error persists or the env var isn't loading, the app will fall back to hardcoded users in `init.ts` and `RoleContext.tsx`. This is the expected behavior - the hardcoded users serve as a reliable fallback.

### Users showing empty claims array

If you switch to a member and see no claims:

1. The member may not have any claims in the database
2. Query the database to verify: `SELECT COUNT(*) FROM claims WHERE member_id = 'uuid'`
3. Either use a different member with claims, or add test claims in Hasura Console
4. See "Adding Custom Test Users" section to find members with actual claims

## Advanced: Dynamic User Loading

For a more advanced setup, you could load test users from the database:

```typescript
// src/context/RoleContext.tsx
const [testUsers, setTestUsers] = useState<TestUser[]>([]);

useEffect(() => {
  async function loadUsers() {
    const { data } = await apolloClient.query({
      query: gql`
        query GetTestUsers {
          members(limit: 3) { id first_name last_name }
          providers(limit: 2) { id name }
        }
      `
    });

    const users: TestUser[] = [
      { role: 'admin', label: 'Admin User' },
      ...data.members.map(m => ({
        role: 'member',
        label: `Member: ${m.first_name} ${m.last_name}`,
        memberId: m.id
      })),
      ...data.providers.map(p => ({
        role: 'provider',
        label: `Provider: ${p.name}`,
        providerId: p.id
      }))
    ];

    setTestUsers(users);
  }
  loadUsers();
}, []);
```

This would eliminate the need for hardcoded UUIDs in `.env`, but requires an initial query with admin privileges.

---

**Summary:** The role switcher makes it easy to test Hasura's Row-Level Security and permission system without manual configuration changes. Perfect for development and demos!
