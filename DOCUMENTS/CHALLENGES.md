# ClaimSight Learning Challenges

This document contains hands-on exercises to help you master GraphQL, Hasura, and Apollo Client through practical challenges. Each challenge builds on the previous ones.

## 🧪 Automated Testing

**New!** Challenges now include **automated tests** to verify your solutions!

```bash
# Check your progress
npm run test:progress

# Test a specific challenge
npm run test:progress 1

# See detailed test output
npm run test:challenges
```

See **[TESTING_GUIDE.md](TESTING_GUIDE.md)** for complete testing documentation.

---

## 🎯 Challenge Track Overview

| Level | Challenge | Skills Covered | Est. Time |
|-------|-----------|----------------|-----------|
| 🟢 Beginner | 1-3 | GraphQL basics, Hasura Console | 30-60 min |
| 🟡 Intermediate | 4-6 | Permissions, Relationships, Actions | 1-2 hours |
| 🟡 Intermediate | 6A-6D | Note CRUD, Optimistic Updates, Search | 2-3 hours |
| 🔴 Advanced | 7-9 | Federation, Subscriptions, Optimization | 2-3 hours |
| 🟣 Expert | 10-12 | Custom business logic, Performance | 3-4 hours |

---

## 🟢 Beginner Challenges

### Challenge 1: GraphQL Query Explorer

**Goal**: Get comfortable with GraphQL queries in the Hasura Console.

**Tasks**:
1. Open Hasura Console at `http://localhost:8080/console`
2. Navigate to the "API" tab (GraphiQL)
3. Write a query to fetch all claims with their provider_record information
4. Use the "Explorer" panel to build queries visually
5. Add filters to show only denied claims (`status: "denied"`)
6. Limit results to 10 and add pagination with offset

**Success Criteria**:
- Query returns claims with nested provider_record data
- Filters work correctly
- You understand GraphQL query structure

**Hints**:
- Use the `claims` table as your starting point
- Provider data comes from the `provider_record` relationship
- Filter syntax: `where: { status: { _eq: "denied" } }`

<details>
<summary>Solution</summary>

```graphql
query GetDeniedClaims {
  claims(
    where: { status: { _eq: "denied" } }
    limit: 10
    offset: 0
    order_by: { dos: desc }
  ) {
    id
    cpt
    dos
    charge_cents
    denial_reason
    provider_record {
      name
      specialty
      npi
    }
  }
}
```
</details>

---

### Challenge 2: Understanding Relationships

**Goal**: Master object and array relationships in Hasura.

**Tasks**:
1. Explore the data model in Console > Data > Track tables
2. Identify all relationships:
   - Which tables have object relationships? (many-to-one)
   - Which tables have array relationships? (one-to-many)
3. Write a query that fetches a member with:
   - All their claims
   - Each claim's provider_record details
   - Aggregate count of total claims

**Success Criteria**:
- Query uses at least 3 levels of nesting
- Aggregates work correctly
- You understand the difference between object vs array relationships

**Hints**:
- Object relationships return a single record (e.g., claim → member)
- Array relationships return multiple records (e.g., member → claims)
- Use `_aggregate` for counts and sums

<details>
<summary>Solution</summary>

```graphql
query GetMemberWithClaims($memberId: uuid!) {
  members_by_pk(id: $memberId) {
    id
    first_name
    last_name
    plan
    claims {
      id
      dos
      cpt
      charge_cents
      status
      provider_record {
        name
        specialty
      }
    }
    claims_aggregate {
      aggregate {
        count
        sum {
          charge_cents
          allowed_cents
        }
      }
    }
  }
}
```

Variables:
```json
{
  "memberId": "use-a-real-uuid-from-your-database"
}
```
</details>

---

### Challenge 3: Mutations and Inserts

**Goal**: Learn how to modify data with GraphQL mutations.

**Tasks**:
1. Insert a new note for a member (you'll need their UUID)
2. Update an existing note's body text
3. Delete the note you just created
4. Try to insert a note for a different member (should fail due to RLS)

**Success Criteria**:
- All CRUD operations work
- You understand mutation syntax
- RLS prevents unauthorized access

**Hints**:
- Get a member ID first: `query { members(limit: 1) { id } }`
- Set the role header: `x-hasura-role: member`, `x-hasura-user-id: <member-uuid>`
- Use `insert_notes_one` for single inserts
- Use `update_notes_by_pk` for updates
- Use `delete_notes_by_pk` for deletes

<details>
<summary>Solution</summary>

```graphql
# 1. Insert note
mutation InsertNote($memberId: uuid!, $body: String!) {
  insert_notes_one(object: {
    member_id: $memberId
    body: $body
  }) {
    id
    body
    created_at
  }
}

# 2. Update note
mutation UpdateNote($noteId: uuid!, $newBody: String!) {
  update_notes_by_pk(
    pk_columns: { id: $noteId }
    _set: { body: $newBody }
  ) {
    id
    body
  }
}

# 3. Delete note
mutation DeleteNote($noteId: uuid!) {
  delete_notes_by_pk(id: $noteId) {
    id
  }
}
```

To test RLS, set these headers in Hasura Console:
```json
{
  "x-hasura-role": "member",
  "x-hasura-user-id": "<member-uuid>"
}
```
</details>

---

## 🟡 Intermediate Challenges

### Challenge 4: Row-Level Security (RLS) Deep Dive

**Goal**: Understand how Hasura enforces permissions at the database level.

**Tasks**:
1. Test member role permissions:
   - Can a member see their own claims?
   - Can they see another member's claims?
   - Can they modify provider data?
2. Test provider role permissions:
   - Can a provider see claims where they are the provider?
   - Can they update their own name?
   - Can they see other providers' data?
3. Examine the RLS policies in `db/rls.sql`
4. Try to bypass RLS by changing role headers

**Success Criteria**:
- You understand session variables (`X-Hasura-User-Id`, etc.)
- RLS correctly enforces data isolation
- You can explain why certain queries fail

**Hints**:
- Use the "Request Headers" section in Hasura Console
- RLS is enforced at the PostgreSQL level, not just Hasura
- Check `db/rls.sql` to see the actual policies

**Exercise**:
Write down what happens when:
- Member A tries to query Member B's claims
- Provider X tries to update Provider Y's name
- Admin role queries any table (what's different?)

---

### Challenge 5: Custom Hasura Actions

**Goal**: Extend GraphQL with custom business logic.

**Tasks**:
1. Test the existing `submitEligibilityCheck` action
2. Create a new action called `generateClaimSummary` that:
   - Takes a `memberId` as input
   - Returns a summary object with:
     - Total claims count
     - Total charges
     - Total allowed amounts
     - Denial rate percentage
3. Implement the action handler in a new file
4. Apply the metadata and test it

**Success Criteria**:
- Action appears in GraphQL schema
- Handler endpoint responds correctly
- Return type matches the GraphQL schema

**Hints**:
- Action handlers are Express endpoints that receive `{ input, session_variables }`
- Copy `hasura/actions/handlers/eligibility.mock.ts` as a template
- Define custom types in `hasura/metadata/actions.yaml`
- Use `npm run hasura:apply` to apply metadata

<details>
<summary>Sample Action Definition</summary>

```yaml
# hasura/metadata/actions.yaml
actions:
  - name: generateClaimSummary
    definition:
      kind: synchronous
      handler: http://host.docker.internal:3001/claim-summary  # Use host.docker.internal if Hasura is in Docker
      forward_client_headers: true
    permissions:
      - role: member

custom_types:
  objects:
    - name: ClaimSummaryOutput
      fields:
        - name: total_claims
          type: Int!
        - name: total_charges_cents
          type: Int!
        - name: total_allowed_cents
          type: Int!
        - name: denial_rate
          type: Float!
```

```graphql
# hasura/metadata/actions.graphql
type Mutation {
  generateClaimSummary(memberId: uuid!): ClaimSummaryOutput
}

type ClaimSummaryOutput {
  total_claims: Int!
  total_charges_cents: Int!
  total_allowed_cents: Int!
  denial_rate: Float!
}
```
</details>

---

### Challenge 6: Apollo Client Optimistic Updates

**Goal**: Improve UX with optimistic UI updates.

**Tasks**:
1. Examine `app/client/src/components/ClaimDetail.tsx`
2. Implement optimistic updates for the "Add Note" mutation
3. Handle the case where the mutation fails (rollback)
4. Add a loading state and error handling

**Success Criteria**:
- Note appears instantly in UI before server response
- If mutation fails, the UI reverts
- Loading and error states are clear

**Hints**:
- Use the `optimisticResponse` option in `useMutation`
- Generate a temporary ID with `crypto.randomUUID()` (or similar)
- Use `update` function to modify Apollo cache

<details>
<summary>Sample Code</summary>

```typescript
const [addNote] = useMutation(ADD_NOTE, {
  optimisticResponse: {
    insert_notes_one: {
      __typename: 'notes',
      id: 'temp-' + Date.now(),
      member_id: memberId,
      body: noteText,
      created_at: new Date().toISOString()
    }
  },
  update: (cache, { data }) => {
    const newNote = data?.insert_notes_one;
    if (!newNote) return;

    cache.modify({
      fields: {
        notes(existingNotes = []) {
          const newNoteRef = cache.writeFragment({
            data: newNote,
            fragment: NOTE_FRAGMENT
          });
          return [newNoteRef, ...existingNotes];
        }
      }
    });
  }
});
```
</details>

---

### Challenge 6A: Delete Note Functionality

**Goal**: Implement the ability to delete notes with proper confirmation and error handling.

**Tasks**:
1. Add a DELETE_NOTE mutation to your GraphQL mutations file (already exists in `mutations.ts`)
2. Add a delete button to each note in `ClaimDetail.tsx`
3. Implement a confirmation dialog before deleting
4. Use optimistic updates to remove the note from UI immediately
5. Handle errors gracefully and restore the note if deletion fails
6. Add proper permissions check (only member can delete their own notes)

**Success Criteria**:
- Delete button appears on each note
- Confirmation dialog prevents accidental deletions
- Note disappears instantly from UI (optimistic update)
- If deletion fails, note reappears with error message
- Other users cannot delete notes they don't own

**Hints**:
- Use `window.confirm()` for simple confirmation, or create a custom modal component
- Implement optimistic update by modifying Apollo cache
- The DELETE_NOTE mutation is already defined: `delete_notes_by_pk(id: $id)`
- Consider adding a trash icon button next to each note

<details>
<summary>Sample Implementation</summary>

```typescript
const [deleteNote] = useMutation(DELETE_NOTE, {
  optimisticResponse: (vars) => ({
    delete_notes_by_pk: {
      __typename: 'notes',
      id: vars.id
    }
  }),
  update: (cache, { data }) => {
    const deletedId = data?.delete_notes_by_pk?.id;
    if (!deletedId) return;

    cache.evict({ id: cache.identify({ __typename: 'notes', id: deletedId }) });
    cache.gc();
  },
  onError: (error) => {
    alert(`Failed to delete note: ${error.message}`);
  }
});

const handleDelete = async (noteId: string) => {
  if (!window.confirm('Are you sure you want to delete this note?')) return;

  try {
    await deleteNote({ variables: { id: noteId } });
  } catch (err) {
    // Error already handled in onError
  }
};
```

UI Button:
```tsx
<button
  onClick={() => handleDelete(note.id)}
  className="text-red-600 hover:text-red-800 text-sm"
  title="Delete note"
>
  🗑️ Delete
</button>
```
</details>

---

### Challenge 6B: Update/Edit Note Functionality

**Goal**: Allow users to edit existing notes inline.

**Tasks**:
1. Add an "Edit" button to each note
2. Convert the note text to an editable textarea when edit mode is enabled
3. Add "Save" and "Cancel" buttons during edit
4. Use the UPDATE_NOTE mutation (already exists in `mutations.ts`)
5. Implement optimistic updates for instant feedback
6. Preserve original text if user cancels

**Success Criteria**:
- Click "Edit" to enable edit mode for a specific note
- Textarea appears with current note text
- "Save" commits changes with optimistic update
- "Cancel" reverts to original text without saving
- Only one note can be in edit mode at a time

**Hints**:
- Track which note is being edited with useState: `const [editingNoteId, setEditingNoteId] = useState<string | null>(null)`
- Store edited text in separate state to allow cancellation
- The UPDATE_NOTE mutation: `update_notes_by_pk(pk_columns: { id: $id }, _set: { body: $body })`

<details>
<summary>Sample Implementation</summary>

```typescript
const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
const [editedText, setEditedText] = useState('');

const [updateNote] = useMutation(UPDATE_NOTE, {
  optimisticResponse: (vars) => ({
    update_notes_by_pk: {
      __typename: 'notes',
      id: vars.id,
      body: vars.body,
      created_at: new Date().toISOString()
    }
  })
});

const startEdit = (note: any) => {
  setEditingNoteId(note.id);
  setEditedText(note.body);
};

const saveEdit = async (noteId: string) => {
  await updateNote({ variables: { id: noteId, body: editedText } });
  setEditingNoteId(null);
};

const cancelEdit = () => {
  setEditingNoteId(null);
  setEditedText('');
};
```

UI:
```tsx
{note.id === editingNoteId ? (
  <div>
    <textarea
      value={editedText}
      onChange={(e) => setEditedText(e.target.value)}
      className="w-full border rounded p-2"
    />
    <button onClick={() => saveEdit(note.id)}>Save</button>
    <button onClick={cancelEdit}>Cancel</button>
  </div>
) : (
  <div>
    <p>{note.body}</p>
    <button onClick={() => startEdit(note)}>Edit</button>
  </div>
)}
```
</details>

---

### Challenge 6C: Note Filtering and Search

**Goal**: Add the ability to filter notes by keyword.

**Tasks**:
1. Add a search input above the notes list
2. Filter notes client-side by matching the search term against note body
3. Show count of filtered results
4. Highlight matching text in notes (bonus)
5. Add a "Clear" button to reset the filter

**Success Criteria**:
- Search input filters notes in real-time as user types
- Case-insensitive search
- Shows "X of Y notes" counter
- Empty search shows all notes

**Hints**:
- Use `useState` to track search term
- Filter notes array: `notes.filter(n => n.body.toLowerCase().includes(search.toLowerCase()))`
- Debounce search input for better performance (optional)
- Consider using regex for more advanced matching

<details>
<summary>Sample Implementation</summary>

```typescript
const [searchTerm, setSearchTerm] = useState('');

const filteredNotes = notes.filter(note =>
  note.body.toLowerCase().includes(searchTerm.toLowerCase())
);
```

UI:
```tsx
<div className="mb-4">
  <input
    type="text"
    placeholder="Search notes..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="border rounded px-3 py-2 w-full"
  />
  {searchTerm && (
    <p className="text-sm text-gray-600 mt-1">
      Showing {filteredNotes.length} of {notes.length} notes
      <button
        onClick={() => setSearchTerm('')}
        className="ml-2 text-blue-600"
      >
        Clear
      </button>
    </p>
  )}
</div>

{filteredNotes.map(note => (
  // render note
))}
```
</details>

---

### Challenge 6D: Note Pagination

**Goal**: Implement pagination for notes when there are many notes.

**Tasks**:
1. Modify the GET_NOTES query to support pagination variables (already supports `limit` and `offset`)
2. Add "Load More" button or page number controls
3. Track current page/offset in component state
4. Implement loading state while fetching more notes
5. Optionally implement infinite scroll

**Success Criteria**:
- Notes load in batches (e.g., 10 at a time)
- "Load More" button fetches next batch and appends to list
- Loading indicator appears during fetch
- No duplicate notes in the list

**Hints**:
- Use `fetchMore` from Apollo Client: `const { data, fetchMore } = useQuery(GET_NOTES, ...)`
- Update cache merge function to append new notes
- The GET_NOTES query already accepts `limit` and `offset` parameters
- Consider using `updateQuery` or cache field policies

<details>
<summary>Sample Implementation</summary>

```typescript
const [hasMore, setHasMore] = useState(true);

const { data, loading, fetchMore } = useQuery(GET_NOTES, {
  variables: {
    memberId: claim.member_id,
    limit: 10,
    offset: 0
  }
});

const loadMore = async () => {
  const currentLength = data?.notes?.length || 0;

  const result = await fetchMore({
    variables: {
      offset: currentLength
    },
    updateQuery: (prev, { fetchMoreResult }) => {
      if (!fetchMoreResult || fetchMoreResult.notes.length === 0) {
        setHasMore(false);
        return prev;
      }

      return {
        notes: [...prev.notes, ...fetchMoreResult.notes]
      };
    }
  });
};
```

UI:
```tsx
{hasMore && (
  <button
    onClick={loadMore}
    disabled={loading}
    className="mt-4 px-4 py-2 bg-gray-200 rounded"
  >
    {loading ? 'Loading...' : 'Load More Notes'}
  </button>
)}
```
</details>

---

## 🔴 Advanced Challenges

### Challenge 7: Apollo Federation with Provider Ratings

**Goal**: Understand TRUE Apollo Federation and its limitations with Hasura.

**Important Context**:
⚠️ **Hasura v2/v3 Limitation**: Hasura types **cannot be extended** by Apollo subgraphs. This is why we:
1. Renamed Hasura's `providers` table → `provider_records`
2. Created a standalone federated `Provider` type with `@key(fields: "id")`
3. Set up a gateway to combine both Hasura and the federated subgraph

This demonstrates a **real-world migration pattern** when introducing federation to an existing system!

**Tasks**:
1. Examine the federated `Provider` type in `app/server/src/index.ts`
2. Review the gateway configuration in `app/gateway/src/index.ts`
3. Start the federated system: `npm run federated:dev`
4. Query the unified endpoint at http://localhost:4000/graphql
5. Compare `provider_records` (Hasura) vs `providers` (federated)

**Success Criteria**:
- Understand why `provider_records` was renamed
- Can query both Hasura data AND federated Provider type from one endpoint
- Understand `@key` directive and `__resolveReference` pattern
- Can explain the Hasura/Apollo limitation

**Example Query**:
```graphql
query UnifiedQuery {
  # From Hasura
  members(limit: 2) {
    first_name
  }

  # From federated subgraph
  providers {
    name
    rating
    reviews {
      comment
    }
  }
}
```

**Hints**:
- The gateway at port 4000 combines both subgraphs
- `@key(fields: "id")` marks Provider as a federated entity
- `__resolveReference` enables entity resolution
- See FEDERATION_GUIDE.md for complete explanation

**Bonus**: Add another custom subgraph that extends the Provider type!

---

### Challenge 8: GraphQL Subscriptions

**Goal**: Implement real-time updates with subscriptions.

**Tasks**:
1. Create a subscription for new claims
2. Display a toast notification when a new claim is added
3. Implement a live-updating claims counter
4. Test by inserting claims in Hasura Console while watching the UI

**Success Criteria**:
- Subscription connects via WebSocket
- UI updates in real-time without page refresh
- No memory leaks (subscription cleanup on unmount)

**Hints**:
- Hasura supports subscriptions out of the box
- Use `useSubscription` hook from Apollo Client
- Check `app/client/src/apollo/client.ts` for WebSocket setup

<details>
<summary>Sample Subscription</summary>

```graphql
subscription NewClaims($memberId: uuid!) {
  claims(
    where: { member_id: { _eq: $memberId } }
    order_by: { created_at: desc }
    limit: 1
  ) {
    id
    cpt
    dos
    status
    provider_record {
      name
    }
  }
}
```

```typescript
const { data, loading } = useSubscription(NEW_CLAIMS_SUBSCRIPTION, {
  variables: { memberId }
});

useEffect(() => {
  if (data?.claims?.[0]) {
    showToast(`New claim: ${data.claims[0].cpt}`);
  }
}, [data]);
```
</details>

---

### Challenge 9: Query Performance Optimization

**Goal**: Optimize slow queries and understand database performance.

**Tasks**:
1. Run `EXPLAIN ANALYZE` on a complex query in Hasura Console
2. Identify missing indexes from the query plan
3. Add a new index to `db/indexes.sql` for a common filter
4. Measure performance before/after with `EXPLAIN ANALYZE`
5. Use Apollo Client's cache to avoid redundant queries

**Success Criteria**:
- You understand query execution plans
- Index improves query performance measurably
- Apollo cache reduces network requests

**Hints**:
- Check the "Analyze" button in Hasura Console
- Look for "Seq Scan" in query plans (bad on large tables)
- Indexes help with WHERE clauses and ORDER BY
- Use `fetchPolicy: 'cache-first'` in Apollo Client

**Sample Slow Query**:
```graphql
# This might be slow without proper indexes
query SlowQuery {
  claims(
    where: {
      status: { _eq: "denied" }
      dos: { _gte: "2024-01-01" }
    }
    order_by: { charge_cents: desc }
  ) {
    id
    cpt
    charge_cents
  }
}
```

---

## 🟣 Expert Challenges

### Challenge 10: Multi-Tenant Security

**Goal**: Implement secure multi-tenant access patterns.

**Tasks**:
1. Create a new role: `billing_admin`
2. Allow `billing_admin` to:
   - View all claims across all members
   - View aggregate statistics
   - NOT modify any data
   - NOT see provider information (simulate PHI restrictions)
3. Implement the permissions in Hasura Console
4. Write RLS policies for the new role
5. Test with session variables

**Success Criteria**:
- `billing_admin` can query cross-member data
- PHI (provider info) is properly restricted
- All permission checks use RLS policies

**Hints**:
- Use `x-hasura-role: billing_admin` header
- Create column-level permissions (exclude provider fields)
- RLS policy: `GRANT SELECT ON claims TO hasura_billing_admin`

---

### Challenge 11: Batch Operations and N+1 Problem

**Goal**: Understand and solve the N+1 query problem.

**Tasks**:
1. Create a query that fetches 50 claims with their providers
2. Use browser DevTools to count network requests
3. Notice GraphQL fetches in a single request (no N+1)
4. Implement DataLoader pattern for a custom resolver
5. Compare performance with and without DataLoader

**Success Criteria**:
- You understand why N+1 is a problem in REST APIs
- GraphQL + Hasura solves N+1 automatically
- You can implement DataLoader for custom resolvers

**Hints**:
- Hasura batches queries at the database level
- For custom resolvers, use `dataloader` npm package
- Monitor PostgreSQL logs to see generated SQL

---

### Challenge 12: End-to-End Feature Implementation

**Goal**: Build a complete feature from scratch.

**Feature**: Claim Appeals System

**Requirements**:
1. Database:
   - Create `appeals` table with FK to claims
   - Add RLS policies for member and provider roles
   - Track appeal status (pending, approved, denied)

2. Backend:
   - Create Hasura action: `submitAppeal(claimId, reason)`
   - Action handler validates claim exists and isn't already appealed
   - Send mock notification (console.log for now)

3. Frontend:
   - Add "Appeal" button to claim detail page
   - Show appeal form with text area for reason
   - Display appeal status and history
   - Use optimistic updates

4. Permissions:
   - Members can submit appeals for their own claims
   - Providers can view appeals for their claims
   - Admins can update appeal status

**Success Criteria**:
- Full CRUD operations work
- RLS enforces proper access control
- UI provides excellent UX (loading, errors, optimistic updates)
- Code follows best practices from `DOCUMENTS/BEST_PRACTICES.md`

**Hints**:
- Start with the database schema
- Use existing code as templates
- Test each layer before moving to the next

---

---

### Challenge 13: Cloud Deployment (Windows)

**Difficulty**: 🔥🔥🔥🔥 Expert
**Estimated Time**: 4-6 hours
**Prerequisites**: Complete Challenges 1-7

**Objective**: Deploy the entire ClaimSight stack to cloud services using free tiers. Perfect for Windows users exploring cloud-native GraphQL architectures.

**Reference Guide**: `DOCUMENTS/CLOUD_DEPLOYMENT.md`

**Tasks**:

1. **Database Setup** (`CLOUD_DEPLOYMENT.md` → Step 1):
   - Create Neon PostgreSQL account (free tier)
   - Get connection string
   - Apply migrations using Hasura CLI from Windows

2. **Hasura Cloud** (`CLOUD_DEPLOYMENT.md` → Step 2):
   - Create Hasura Cloud project
   - Connect to Neon database
   - Apply metadata from `hasura/metadata/`
   - Enable Apollo Federation (`HASURA_GRAPHQL_ENABLE_APOLLO_FEDERATION=true`)
   - Configure admin secret and CORS

3. **Deploy Action Handler** (`CLOUD_DEPLOYMENT.md` → Step 3):
   - Deploy `hasura/actions/handlers/` to Render
   - Configure environment variables
   - Update Hasura actions to point to deployed handler
   - **Reference**: `hasura/metadata/actions.yaml`

4. **Deploy Providers Subgraph** (`CLOUD_DEPLOYMENT.md` → Step 4):
   - Deploy `app/server/` to Render
   - Test federation schema with `{ _service { sdl } }`
   - **Reference**: `app/server/src/index.ts` (Provider type with `@key`)

5. **Deploy Federation Gateway** (`CLOUD_DEPLOYMENT.md` → Step 5):
   - Deploy `app/gateway/` to Render
   - Configure subgraph URLs
   - Test federation query combining Hasura + Providers
   - **Reference**: `app/gateway/src/index.ts` (IntrospectAndCompose)

6. **Deploy React Frontend** (`CLOUD_DEPLOYMENT.md` → Step 6):
   - Update `app/client/.env.production` to point to gateway
   - Deploy to Vercel
   - Update Hasura CORS for Vercel domain
   - **Reference**: `app/client/src/apollo/client.ts`

7. **Apollo Studio (Optional)** (`CLOUD_DEPLOYMENT.md` → Step 7):
   - Create Apollo Studio account
   - Publish subgraph schemas using Rover CLI
   - View federated schema in Studio
   - Explore schema analytics

8. **End-to-End Testing**:
   - Run health checks on all services
   - Test provider ratings query (federation)
   - Test eligibility check (action)
   - Test member claims query (Hasura)

**Success Criteria**:
- All services deployed and accessible via HTTPS
- Frontend loads from Vercel domain
- Federation query works from gateway (combining Hasura + Providers subgraph)
- Eligibility check action executes successfully
- Zero monthly cost (using only free tiers)

**Key Files to Reference**:
- `DOCUMENTS/CLOUD_DEPLOYMENT.md` - Complete step-by-step guide
- `.env.example` - Environment variable template
- `app/client/src/apollo/client.ts` - Apollo Client config (update endpoints)
- `app/gateway/src/index.ts` - Gateway subgraph configuration
- `hasura/config.yaml` - Hasura CLI endpoint
- `hasura/metadata/actions.yaml` - Action handler URLs

**Learning Outcomes**:
- Deploy PostgreSQL to cloud (Neon)
- Configure Hasura Cloud with migrations and metadata
- Deploy Node.js services to Render/Railway
- Deploy React app to Vercel
- Manage environment variables across services
- Understand free tier limitations and optimization
- Apollo Studio schema registry
- Windows-specific tooling (npm global packages, PowerShell)

**Troubleshooting**:
See `CLOUD_DEPLOYMENT.md` → "Troubleshooting (Windows-Specific)" for:
- npm permission errors
- hasura CLI PATH issues
- Git authentication
- CORS configuration
- Free tier service sleep/wake behavior

**Architecture Diagram**: See `CLOUD_DEPLOYMENT.md` for complete cloud architecture diagram.

---

### Challenge 14: API Documentation (Modern & Auto-Generated)

**Difficulty**: 🔥🔥🔥🔥 Expert
**Estimated Time**: 3-4 hours
**Prerequisites**: Complete Challenges 1-7, Federation working

**Objective**: Create modern, beautiful, auto-generated API documentation using Magidoc - a professional GraphQL documentation generator.

**Reference Guide**: `DOCUMENTS/API_DOCUMENTATION_GUIDE.md`

**Tasks**:

1. **Setup Documentation Tools** (`API_DOCUMENTATION_GUIDE.md` → Setup Instructions):
   - Install Magidoc (already done via `npm install`)
   - Review `magidoc.mjs` configuration
   - Understand modern Svelte-based UI and templates

2. **Generate Auto-Documentation** (`API_DOCUMENTATION_GUIDE.md` → Quick Start):
   - Start federation gateway: `npm run federated:dev`
   - Generate docs: `npm run docs:generate`
   - Preview with hot-reload: `npm run docs:preview` (opens http://localhost:4001)
   - **Reference**: `magidoc.mjs` - Configuration for template, pages, metadata

3. **Explore Domain-Organized Docs**:
   - Read `docs/guides/getting-started.md` - First queries, authentication
   - Read `docs/guides/common-patterns.md` - Filtering, pagination, aggregation
   - Read `docs/guides/authentication.md` - Role-based access control
   - Read `docs/subgraphs/hasura/overview.md` - Database operations
   - Read `docs/subgraphs/providers/overview.md` - Federated Provider type

4. **Customize Documentation**:
   - Edit `magidoc.mjs` to customize website options
   - Update app title, description, logo
   - Change template if desired (carbon-multi-page, prism-multi-page)
   - **Reference**: `API_DOCUMENTATION_GUIDE.md` → Configuration section

5. **Add Custom Pages**:
   - Add a custom page to `magidoc.mjs` → `website.options.pages`
   - Include markdown content with code examples
   - Regenerate docs: `npm run docs:generate`
   - Preview changes: `npm run docs:preview` (live hot-reload!)

6. **Explore Generated Documentation**:
   - Browse the auto-generated schema reference
   - Use the fuzzy search feature
   - Explore custom pages (Getting Started, Examples, Authentication)
   - Test navigation and responsiveness

7. **Test Interactive Features**:
   - Open live preview: `npm run docs:preview`
   - Search for specific types (Member, Claim, Provider)
   - Test queries in Apollo Studio Sandbox
   - Verify federation fields are documented (Provider with `@key`)
   - Try modifying `magidoc.mjs` and watch hot-reload

8. **Deploy Documentation** (Optional):
   - Choose deployment target (GitHub Pages, Vercel, or alongside app)
   - Follow `API_DOCUMENTATION_GUIDE.md` → Deployment section
   - Make docs publicly accessible

**Success Criteria**:
- Magidoc generates beautiful, modern API documentation
- All GraphQL types, queries, mutations auto-documented
- Custom pages provide clear guides and examples
- Federation architecture clearly explained
- Live hot-reload preview works
- Fast fuzzy search functions properly

**Key Files to Reference**:
- `DOCUMENTS/API_DOCUMENTATION_GUIDE.md` - Complete documentation strategy and setup
- `magidoc.mjs` - Magidoc configuration (template, pages, metadata)
- `docs/guides/getting-started.md` - Getting started template
- `docs/guides/common-patterns.md` - Query patterns template
- `docs/subgraphs/hasura/overview.md` - Subgraph documentation template
- `package.json` - npm scripts: `docs:generate`, `docs:preview`, `docs:serve`, `docs:build`

**Learning Outcomes**:
- Modern GraphQL documentation with Magidoc (Svelte-based)
- Auto-generating docs from GraphQL introspection
- Custom pages and markdown integration
- Live hot-reload development workflow
- GraphQL schema presentation best practices
- Federation-aware documentation

**Advanced Extensions**:
1. **GraphQL Voyager Integration**: Add visual schema explorer
2. **Apollo Studio**: Publish schemas to cloud registry
3. **Custom Theme**: Match your brand colors and fonts
4. **Versioning**: Document multiple API versions side-by-side
5. **Search Optimization**: Add search keywords to improve discoverability

**Comparison with Industry Leaders**:

| Feature | Stripe | Google Cloud | Twilio | Your Docs |
|---------|--------|--------------|--------|-----------|
| Auto-generated | ❌ | ✅ | ❌ | ✅ |
| Two-panel layout | ✅ | ❌ | ✅ | ✅ |
| Domain organization | ❌ | ✅ | ✅ | ✅ |
| Interactive examples | ✅ | ❌ | ✅ | ✅ |
| Federation-aware | N/A | N/A | N/A | ✅ |

**Troubleshooting**:
See `API_DOCUMENTATION_GUIDE.md` → Troubleshooting for:
- Gateway connection errors
- Missing documentation files
- Custom pages not showing
- Magidoc configuration issues

---

## Challenge 15: 🔒 Security Hardening & HIPAA Compliance

**Difficulty**: 🔴 Advanced
**Category**: Security, Compliance, Production Readiness
**Prerequisites**: Challenges 1-14

### Overview

Secure your GraphQL API against common vulnerabilities and ensure HIPAA compliance for healthcare data. This challenge covers defense-in-depth security across all layers: API Gateway → GraphQL (Hasura/Apollo) → Database (PostgreSQL).

**Security Layers:**
- 🔐 **Layer 1: API Gateway** - Rate limiting, CORS, DDoS protection
- 🛡️ **Layer 2: GraphQL** - Query depth limits, authentication, authorization
- 🗄️ **Layer 3: Database** - RLS policies, encryption, audit logging
- 🏥 **Layer 4: HIPAA Compliance** - ePHI protection, zero-trust, audit trails

### Why This Matters

**Real-world Impact:**
- **80% of GraphQL security issues** are preventable with proper access control and input validation (OWASP 2024)
- **HIPAA violations** can cost $100 to $50,000 per record exposed
- **GraphQL-specific attacks**: Query depth DoS, rate limit bypass via aliases/batching, excessive data exposure

**2024 HIPAA Security Rule Updates** (Dec 27, 2024):
- 72-hour data restoration requirement
- Zero-trust continuous authentication
- Annual security audits mandatory

---

### Part 1: GraphQL Query Security

**Goal:** Protect against query-based DoS attacks and rate limit bypass.

#### Task 1.1: Query Depth Limiting

GraphQL's relational nature allows arbitrarily deep nested queries that can crash your API:

```graphql
# 🚨 Attack: Deeply nested query (50 levels deep)
query MaliciousQuery {
  members {
    claims {
      provider_record {
        claims {
          provider_record {
            claims {
              # ... 50 levels deep
            }
          }
        }
      }
    }
  }
}
```

**Configure Hasura query depth limit:**

1. **Set depth limit** in Hasura environment variables:
   ```bash
   # In .env or Hasura Cloud settings
   HASURA_GRAPHQL_QUERY_DEPTH_LIMIT=5
   ```

2. **Test the limit:**
   ```graphql
   # Should be ALLOWED (depth = 3)
   query SafeQuery {
     members {           # depth 1
       claims {          # depth 2
         provider_record # depth 3
       }
     }
   }

   # Should be REJECTED (depth > 5)
   query DeepQuery {
     members {
       claims {
         provider_record {
           claims {
             provider_record {
               claims {
                 # depth 6 - BLOCKED
               }
             }
           }
         }
       }
     }
   }
   ```

**For Apollo Gateway**, install GraphQL Armor:

```bash
cd app/gateway
npm install @escape.tech/graphql-armor
```

Add to gateway configuration:
```typescript
// app/gateway/src/index.ts
import { ApolloServerPluginInlineTrace } from '@apollo/server/plugin/inlineTrace';
import { createComplexityPlugin } from '@escape.tech/graphql-armor';

const server = new ApolloServer({
  gateway,
  plugins: [
    ApolloServerPluginInlineTrace(),
    createComplexityPlugin({
      maxDepth: 5,
      maxComplexity: 1000,
    }),
  ],
});
```

**Success Criteria:**
- Queries with depth ≤ 5 succeed
- Queries with depth > 5 return error with message about depth limit
- Gateway enforces complexity limits

---

#### Task 1.2: Rate Limiting & Bypass Prevention

**Problem:** Attackers can bypass HTTP-based rate limiters using GraphQL aliases/batching:

```graphql
# 🚨 Attack: 1000 queries in a single HTTP request
query RateLimitBypass {
  q1: members_by_pk(id: "uuid1") { id }
  q2: members_by_pk(id: "uuid2") { id }
  q3: members_by_pk(id: "uuid3") { id }
  # ... repeated 1000 times
}
```

**Implement query-based rate limiting:**

1. **Hasura Cloud**: Use built-in rate limiting (Pro tier)
   - Navigate to Hasura Cloud Console → Project Settings → Rate Limits
   - Set: 100 requests per minute per IP
   - Set: 1000 total depth per minute per IP

2. **Self-hosted Hasura**: Use Redis + middleware

   Create `hasura-rate-limiter.ts`:
   ```typescript
   import rateLimit from 'express-rate-limit';
   import RedisStore from 'rate-limit-redis';
   import Redis from 'ioredis';

   const redis = new Redis(process.env.REDIS_URL);

   export const rateLimiter = rateLimit({
     store: new RedisStore({
       client: redis,
       prefix: 'rl:',
     }),
     windowMs: 60 * 1000, // 1 minute
     max: 100, // 100 requests per minute
     standardHeaders: true,
     legacyHeaders: false,
     message: 'Too many requests, please try again later.',
   });
   ```

3. **Test rate limiting:**
   ```bash
   # Send 101 requests in 1 minute
   for i in {1..101}; do
     curl -X POST http://localhost:8080/v1/graphql \
       -H "Content-Type: application/json" \
       -d '{"query": "{ members { id } }"}' \
       & done

   # Request #101 should return 429 Too Many Requests
   ```

**Success Criteria:**
- 101st request in 60 seconds returns 429 error
- Rate limit resets after 60 seconds
- Alias-based attacks are blocked

---

### Part 2: Authentication & Authorization

**Goal:** Implement JWT authentication and role-based access control.

#### Task 2.1: JWT Authentication Setup

1. **Generate JWT secret:**
   ```bash
   # Generate a secure 256-bit secret
   openssl rand -base64 32
   ```

2. **Configure Hasura JWT mode:**

   Update `.env`:
   ```bash
   HASURA_GRAPHQL_JWT_SECRET='{
     "type": "HS256",
     "key": "your-256-bit-secret-from-step-1"
   }'
   ```

3. **Create test JWT token:**

   Use https://jwt.io/ to create a token with payload:
   ```json
   {
     "sub": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
     "https://hasura.io/jwt/claims": {
       "x-hasura-allowed-roles": ["member", "provider", "admin"],
       "x-hasura-default-role": "member",
       "x-hasura-user-id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
     },
     "iat": 1516239022,
     "exp": 9999999999
   }
   ```

4. **Test JWT authentication:**
   ```bash
   # Without JWT - should fail
   curl -X POST http://localhost:8080/v1/graphql \
     -H "Content-Type: application/json" \
     -d '{"query": "{ members { id } }"}'

   # With JWT - should succeed
   curl -X POST http://localhost:8080/v1/graphql \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{"query": "{ members { id } }"}'
   ```

**Important Security Notes:**
- ✅ Set JWT expiry to 15 minutes (common practice)
- ✅ Always set `audience` field for multi-tenant JWK providers
- ✅ Use HTTPS in production to prevent JWT theft
- ✅ Never expose JWT secrets in client code

#### Task 2.2: Apollo Router Authentication

**For GraphOS Router (Enterprise only):**

Add `@authenticated` directive to schema:

```graphql
# app/server/src/schema.ts
extend type Provider @key(fields: "id") {
  id: ID! @external
  rating: Float @authenticated
  ratingCount: Int @authenticated
  reviews: [Review!]! @authenticated
}
```

Configure router with JWT validation:
```yaml
# router.yaml
authentication:
  jwt:
    jwks:
      - url: "https://your-auth-provider.com/.well-known/jwks.json"
    header_name: "Authorization"
    header_value_prefix: "Bearer "
```

**Success Criteria:**
- Unauthenticated requests return 401 Unauthorized
- Valid JWT tokens allow access
- Expired tokens are rejected

---

### Part 3: Row-Level Security (RLS)

**Goal:** Ensure users can only access their own data at the database level.

#### Task 3.1: Enable PostgreSQL RLS

1. **Enable RLS on tables:**
   ```sql
   -- Enable RLS on all tables containing PHI/PII
   ALTER TABLE members ENABLE ROW LEVEL SECURITY;
   ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
   ALTER TABLE eligibility_checks ENABLE ROW LEVEL SECURITY;
   ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
   ```

2. **Create RLS policies:**

   Create `db/rls-policies.sql`:
   ```sql
   -- Members can only see their own records
   CREATE POLICY member_isolation_policy ON members
     FOR ALL
     TO hasura_user
     USING (id = current_setting('hasura.user_id', true)::uuid);

   -- Members can only see their own claims
   CREATE POLICY member_claims_policy ON claims
     FOR ALL
     TO hasura_user
     USING (member_id = current_setting('hasura.user_id', true)::uuid);

   -- Providers can only see claims assigned to them
   CREATE POLICY provider_claims_policy ON claims
     FOR ALL
     TO hasura_user
     USING (
       provider_id = current_setting('hasura.user_id', true)::uuid
       OR current_setting('hasura.role', true) = 'admin'
     );

   -- Admins bypass RLS
   CREATE POLICY admin_all_access ON members
     FOR ALL
     TO hasura_user
     USING (current_setting('hasura.role', true) = 'admin');

   CREATE POLICY admin_all_access_claims ON claims
     FOR ALL
     TO hasura_user
     USING (current_setting('hasura.role', true) = 'admin');
   ```

3. **Apply policies:**
   ```bash
   psql $DATABASE_URL -f db/rls-policies.sql
   ```

4. **Test RLS policies:**
   ```graphql
   # As member (user_id = uuid1)
   query MyData {
     members {
       id
       first_name
       # Should only return THIS member's data
     }
   }

   # As admin
   query AllData {
     members {
       id
       first_name
       # Should return ALL members
     }
   }
   ```

**Success Criteria:**
- Members only see their own records
- Providers only see assigned claims
- Admins see all data
- Direct SQL queries also respect RLS

---

### Part 4: Data Encryption

**Goal:** Encrypt sensitive data at rest and in transit.

#### Task 4.1: Transport Encryption (SSL/TLS)

1. **Enable SSL for Hasura:**
   ```bash
   # .env
   HASURA_GRAPHQL_DATABASE_URL=postgres://user:pass@host:5432/db?sslmode=require
   ```

2. **Force HTTPS in production:**
   ```typescript
   // app/gateway/src/index.ts
   if (process.env.NODE_ENV === 'production') {
     app.use((req, res, next) => {
       if (req.header('x-forwarded-proto') !== 'https') {
         res.redirect(`https://${req.header('host')}${req.url}`);
       } else {
         next();
       }
     });
   }
   ```

#### Task 4.2: Column-Level Encryption with pgcrypto

For highly sensitive fields (SSN, credit card numbers):

1. **Enable pgcrypto extension:**
   ```sql
   CREATE EXTENSION IF NOT EXISTS pgcrypto;
   ```

2. **Encrypt sensitive columns:**
   ```sql
   -- Add encrypted SSN column
   ALTER TABLE members ADD COLUMN ssn_encrypted bytea;

   -- Encrypt existing data
   UPDATE members
   SET ssn_encrypted = pgp_sym_encrypt(
     ssn::text,
     current_setting('app.encryption_key')
   );

   -- Drop plaintext column (after verification!)
   ALTER TABLE members DROP COLUMN ssn;
   ```

3. **Query encrypted data:**
   ```sql
   -- Decrypt in application layer, never expose key
   SELECT
     id,
     first_name,
     pgp_sym_decrypt(ssn_encrypted, 'encryption_key')::text as ssn
   FROM members
   WHERE id = 'uuid';
   ```

**Success Criteria:**
- All connections use SSL/TLS
- HTTPS enforced in production
- Sensitive fields encrypted with pgcrypto
- Encryption keys stored in environment variables (never in code)

---

### Part 5: Audit Logging

**Goal:** Track all access to ePHI for HIPAA compliance.

#### Task 5.1: Enable Hasura Query Logging

1. **Configure structured logging:**
   ```bash
   # .env
   HASURA_GRAPHQL_ENABLED_LOG_TYPES=startup,http-log,webhook-log,websocket-log
   HASURA_GRAPHQL_LOG_LEVEL=info
   ```

2. **Create audit log table:**
   ```sql
   CREATE TABLE audit_logs (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     timestamp timestamptz NOT NULL DEFAULT now(),
     user_id uuid,
     user_role text,
     operation text,
     query text,
     variables jsonb,
     ip_address inet,
     user_agent text,
     response_time_ms integer
   );

   -- Index for queries
   CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
   CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
   ```

3. **Log GraphQL operations** (middleware):
   ```typescript
   // app/gateway/src/audit-logger.ts
   import { ApolloServerPlugin } from '@apollo/server';

   export const auditLoggerPlugin: ApolloServerPlugin = {
     async requestDidStart() {
       const startTime = Date.now();

       return {
         async didResolveOperation(requestContext) {
           const { request, contextValue } = requestContext;

           // Log to database
           await logToDatabase({
             user_id: contextValue.userId,
             user_role: contextValue.role,
             operation: request.operationName,
             query: request.query,
             variables: request.variables,
             ip_address: contextValue.ip,
             user_agent: contextValue.userAgent,
             response_time_ms: Date.now() - startTime,
           });
         },
       };
     },
   };
   ```

**Success Criteria:**
- All GraphQL operations logged to audit_logs table
- Logs include user ID, role, query, timestamp, IP address
- Logs retained for 6 years (HIPAA requirement)
- Logs are tamper-proof (append-only table)

---

### Part 6: HIPAA Compliance Checklist

**Goal:** Verify compliance with HIPAA Security Rule (2024 updates).

#### Task 6.1: Zero-Trust Implementation

**Requirements:**
- ✅ Continuous authentication (JWT with 15-min expiry)
- ✅ No unlimited access (RLS policies enforce restrictions)
- ✅ All requests validated (authentication + authorization)

**Verify:**
```bash
# Test token expiry
# Create JWT with short expiry (1 minute)
# Wait 2 minutes
# Request should fail with "JWT expired"
```

#### Task 6.2: Data Backup & 72-Hour Restoration

**Requirements (2024 HIPAA Rule):**
- ✅ Automated daily backups
- ✅ Ability to restore within 72 hours
- ✅ Backup encryption

**Implement:**
```bash
# PostgreSQL automated backups (cron job)
#!/bin/bash
# backup.sh
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_$TIMESTAMP.sql.gpg"

# Dump and encrypt
pg_dump $DATABASE_URL | gpg --encrypt --recipient admin@claimsight.com > $BACKUP_FILE

# Upload to secure storage (S3, Azure Blob)
aws s3 cp $BACKUP_FILE s3://claimsight-backups/

# Retain for 7 years (HIPAA requirement)
```

**Test restoration:**
```bash
# Simulate disaster recovery
# 1. Download latest backup
# 2. Decrypt
# 3. Restore to test database
# 4. Verify data integrity
# 5. Time the process (must be < 72 hours)
```

#### Task 6.3: Annual Security Audit

Create `security-audit-checklist.md`:

```markdown
# ClaimSight Security Audit Checklist (Annual)

Date: __________
Auditor: __________

## Authentication & Authorization
- [ ] JWT secrets rotated in last 90 days
- [ ] All API endpoints require authentication
- [ ] RLS policies tested and enforced
- [ ] Role permissions reviewed (principle of least privilege)

## Encryption
- [ ] SSL/TLS enabled for all connections
- [ ] Database encryption at rest enabled
- [ ] Sensitive fields encrypted with pgcrypto
- [ ] Encryption keys stored securely (Key Vault/Secrets Manager)

## Access Controls
- [ ] Query depth limits enforced (max 5)
- [ ] Rate limiting active (100 req/min)
- [ ] CORS configured correctly
- [ ] Admin access restricted to authorized personnel

## Logging & Monitoring
- [ ] Audit logs capturing all ePHI access
- [ ] Logs retained for 6 years
- [ ] Anomaly detection configured
- [ ] Security alerts configured (failed logins, rate limit violations)

## Backup & Recovery
- [ ] Daily automated backups running
- [ ] Restoration tested successfully
- [ ] Backup encryption verified
- [ ] Recovery time < 72 hours

## Vulnerability Management
- [ ] Dependencies updated (npm audit fix)
- [ ] GraphQL Armor or similar security tool active
- [ ] Penetration testing completed
- [ ] Security patches applied

## Training & Policies
- [ ] Team trained on HIPAA requirements
- [ ] Incident response plan documented
- [ ] Data breach notification process defined
- [ ] Business Associate Agreements (BAAs) signed
```

---

### Part 7: Security Testing

**Goal:** Validate security implementation with penetration testing.

#### Task 7.1: GraphQL Vulnerability Scanner

Use **GraphQL Cop** (open-source security auditor):

```bash
# Install
npm install -g graphql-cop

# Scan your API
graphql-cop --url http://localhost:4000/graphql \
  --header "Authorization: Bearer YOUR_TOKEN"

# Expected findings (should pass):
# ✅ Introspection disabled in production
# ✅ Query depth limit enforced
# ✅ Field suggestions disabled
# ✅ Batching limit enforced
```

#### Task 7.2: Penetration Testing Scenarios

Test these attack vectors:

1. **Deep Query Attack:**
   ```graphql
   query DeepAttack {
     members { claims { provider_record { claims { provider_record { claims {
       # ... 100 levels deep
     }}}}}}
   }
   # Expected: Blocked by depth limit
   ```

2. **Alias-Based Rate Limit Bypass:**
   ```graphql
   query AliasAttack {
     q1: members { id }
     q2: members { id }
     # ... 1000 queries
   }
   # Expected: Blocked by complexity limit
   ```

3. **Authorization Bypass Attempt:**
   ```graphql
   # As member (non-admin)
   mutation EscalatePrivileges {
     update_members(
       where: {id: {_eq: "other-user-uuid"}},
       _set: {role: "admin"}
     ) {
       affected_rows
     }
   }
   # Expected: Blocked by RLS policy
   ```

4. **SQL Injection Attempt:**
   ```graphql
   query SQLInjection {
     members(where: {first_name: {_eq: "'; DROP TABLE members; --"}}) {
       id
     }
   }
   # Expected: Parameterized queries prevent injection
   ```

**Success Criteria:**
- All 4 attacks blocked
- Security scanner passes with no critical vulnerabilities
- Audit logs capture all attack attempts

---

### Part 8: Production Hardening

**Goal:** Apply final security configurations for production deployment.

#### Task 8.1: Disable Introspection in Production

**Hasura:**
```bash
# .env
HASURA_GRAPHQL_ENABLE_CONSOLE=false
HASURA_GRAPHQL_DEV_MODE=false
HASURA_GRAPHQL_ENABLED_APIS=graphql,metadata
```

**Apollo Gateway:**
```typescript
// app/gateway/src/index.ts
const server = new ApolloServer({
  gateway,
  introspection: process.env.NODE_ENV !== 'production',
  playground: process.env.NODE_ENV !== 'production',
});
```

#### Task 8.2: Environment Variable Security

**Never commit secrets to Git:**

Create `.env.example` (no actual secrets):
```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Hasura
HASURA_GRAPHQL_ADMIN_SECRET=change_me_in_production
HASURA_GRAPHQL_JWT_SECRET={"type":"HS256","key":"change_me"}

# Encryption
ENCRYPTION_KEY=change_me_32_character_key_here
```

**Use secret management:**
- **Azure**: Azure Key Vault
- **AWS**: AWS Secrets Manager
- **GCP**: Secret Manager
- **Hasura Cloud**: Environment variables (encrypted at rest)

#### Task 8.3: CORS Configuration

Restrict origins in production:

```typescript
// app/gateway/src/index.ts
import cors from 'cors';

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'https://claimsight.com',
  'https://app.claimsight.com',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
```

---

### Success Criteria

**Complete when you have:**

- ✅ Query depth limit enforced (max 5 levels)
- ✅ Rate limiting active (100 req/min per IP)
- ✅ JWT authentication configured
- ✅ RLS policies applied to all tables
- ✅ SSL/TLS encryption enabled
- ✅ Column-level encryption for sensitive fields
- ✅ Audit logging capturing all ePHI access
- ✅ Backup/restore tested (<72 hours)
- ✅ Security audit checklist completed
- ✅ Penetration testing passed (all attacks blocked)
- ✅ Introspection disabled in production
- ✅ CORS configured correctly
- ✅ Secrets managed via Key Vault (not in code)

---

### Resources

**Official Documentation:**
- [Hasura Security Best Practices](https://hasura.io/docs/2.0/security/security-best-practices/)
- [Apollo Router Authorization](https://www.apollographql.com/docs/router/configuration/authorization/)
- [PostgreSQL Row Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [OWASP GraphQL Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/GraphQL_Cheat_Sheet.html)

**Security Tools:**
- [GraphQL Armor](https://escape.tech/graphql-armor/) - Security middleware
- [GraphQL Cop](https://github.com/dolevf/graphql-cop) - Vulnerability scanner
- [Escape.tech](https://escape.tech/) - GraphQL security platform (2024 State of GraphQL Security Report)

**HIPAA Resources:**
- [HHS.gov HIPAA Security Rule (2024 NPRM)](https://www.hhs.gov/hipaa/for-professionals/security/hipaa-security-rule-nprm/factsheet/index.html)
- [GraphQL + HIPAA Compliance Guide](https://escape.tech/blog/graphql-vulnerabilities-burdening-hipaa/)
- [Building HIPAA Compliant APIs](https://www.moesif.com/blog/business/compliance/Building-HIPAA-Compliant-APIs/)

---

**Next Steps:**
- Complete this challenge before deploying to production
- Review [Deployment Guides](../deployment/README.md) for managed cloud deployments
- Set up monitoring and alerting (see Bonus Challenge 2: Performance Monitoring)

---

## 🎓 Bonus Challenges

### Bonus 1: PromptQL Exploration

Implement a natural language interface using the concepts in `promptql/`:
- User types: "Show me my denied claims from last month"
- System converts to GraphQL query
- Display results

### Bonus 2: Performance Monitoring

Set up Apollo Studio to monitor:
- Query performance
- Error rates
- Most expensive queries

### Bonus 3: CI/CD Pipeline

Create GitHub Actions workflow to:
- Run database migrations in test environment
- Apply Hasura metadata
- Run integration tests
- Deploy to staging

---

## 📊 Progress Tracker

Mark off challenges as you complete them:

**🟢 Beginner:**
- [ ] Challenge 1: GraphQL Query Explorer
- [ ] Challenge 2: Understanding Relationships
- [ ] Challenge 3: Mutations and Inserts

**🟡 Intermediate:**
- [ ] Challenge 4: Row-Level Security
- [ ] Challenge 5: Custom Hasura Actions
- [ ] Challenge 6: Apollo Client Optimistic Updates
- [ ] Challenge 6A: Delete Note Functionality
- [ ] Challenge 6B: Update/Edit Note Functionality
- [ ] Challenge 6C: Note Filtering and Search
- [ ] Challenge 6D: Note Pagination

**🔴 Advanced:**
- [ ] Challenge 7: Apollo Federation
- [ ] Challenge 8: GraphQL Subscriptions
- [ ] Challenge 9: Query Performance Optimization

**🟣 Expert:**
- [ ] Challenge 10: Multi-Tenant Security
- [ ] Challenge 11: Batch Operations and N+1 Problem
- [ ] Challenge 12: End-to-End Feature Implementation
- [ ] Challenge 13: Cloud Deployment (Windows)
- [ ] Challenge 14: API Documentation (Google Cloud/Stripe Style)
- [ ] Challenge 15: Security Hardening & HIPAA Compliance

**🎁 Bonus:**
- [ ] Bonus 1: PromptQL
- [ ] Bonus 2: Performance Monitoring
- [ ] Bonus 3: CI/CD Pipeline

---

## 🆘 Getting Help

**Stuck?**
1. Check `DOCUMENTS/BEST_PRACTICES.md`
2. Review `DOCUMENTS/LEARNING_CHECKLIST.md`
3. Examine the existing code for patterns
4. Read the official docs:
   - [Hasura Docs](https://hasura.io/docs/latest/graphql/core/index.html)
   - [Apollo Client Docs](https://www.apollographql.com/docs/react/)
   - [GraphQL Docs](https://graphql.org/learn/)

**Tips for Success**:
- Start with the beginner challenges even if you're experienced
- Take notes as you learn
- Commit your code after each challenge
- Share your solutions with others
- Build on the challenges to create your own features

---

## 🎉 Completion Certificate

Once you've completed all 14 core challenges, you'll have mastered:

✅ GraphQL query language and schema design
✅ Hasura permissions and Row-Level Security
✅ Apollo Client state management and caching
✅ Real-time subscriptions
✅ Apollo Federation
✅ Performance optimization
✅ Cloud deployment strategies
✅ API documentation best practices (Google Cloud/Stripe style)
✅ Full-stack GraphQL development

**Next Steps**: Build your own healthcare application or contribute to open-source GraphQL projects!
