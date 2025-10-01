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
3. Write a query to fetch all claims with their provider information
4. Use the "Explorer" panel to build queries visually
5. Add filters to show only denied claims (`status: "denied"`)
6. Limit results to 10 and add pagination with offset

**Success Criteria**:
- Query returns claims with nested provider data
- Filters work correctly
- You understand GraphQL query structure

**Hints**:
- Use the `claims` table as your starting point
- Provider data comes from the `provider` relationship
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
    provider {
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
   - Each claim's provider details
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
      provider {
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

**Goal**: Extend the schema using Apollo Federation.

**Tasks**:
1. Examine the subgraph in `app/server/src/index.ts`
2. Add a new field to the subgraph: `recentReviews: [Review!]!`
3. Create sample review data in `app/server/src/ratings.json`
4. Query the federated schema from the client
5. Understand how `@key` and `@extends` work

**Success Criteria**:
- Subgraph extends the `providers` type
- You can query both Hasura and subgraph fields in one query
- Federation resolves references correctly

**Hints**:
- The subgraph uses `@apollo/subgraph` package
- Reference resolvers use the `__resolveReference` function
- You need to combine Hasura + subgraph endpoints in Apollo Client

**Bonus**: Set up Apollo Gateway to stitch both graphs together.

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
    provider {
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

Once you've completed all 12 core challenges, you'll have mastered:

✅ GraphQL query language and schema design
✅ Hasura permissions and Row-Level Security
✅ Apollo Client state management and caching
✅ Real-time subscriptions
✅ Apollo Federation
✅ Performance optimization
✅ Full-stack GraphQL development

**Next Steps**: Build your own healthcare application or contribute to open-source GraphQL projects!
