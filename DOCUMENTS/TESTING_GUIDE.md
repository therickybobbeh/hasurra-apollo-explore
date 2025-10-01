# Challenge Testing Guide

This guide explains how to use the automated test suite to verify your solutions to the ClaimSight learning challenges.

---

## Overview

The ClaimSight challenge test suite provides **automated verification** of your solutions, helping you:

✅ **Verify your work** - Know immediately if your solution is correct
✅ **Track progress** - See which challenges you've completed
✅ **Learn faster** - Get instant feedback instead of guessing
✅ **Build confidence** - Know you're ready to move to the next challenge

---

## Prerequisites

Before running tests, ensure:

1. **Services are running**:
   ```bash
   # Start all services
   npm run dev
   ```

2. **Database is seeded**:
   ```bash
   npm run seed
   ```

3. **Hasura metadata is applied**:
   ```bash
   npm run hasura:apply
   ```

4. **Environment is configured**:
   - `.env` file exists with Hasura endpoint and admin secret
   - Test users are set up (Michael Lopez, Linda Davis, etc.)

---

## Installation

Install test dependencies:

```bash
# From project root
npm install
```

This installs Vitest, Apollo Client, and other testing dependencies.

---

## Running Tests

### Check Your Progress (Recommended)

Run all tests and see your progress:

```bash
npm run test:progress
```

**Output Example:**
```
╔══════════════════════════════════════════════════════════╗
║          ClaimSight Challenge Test Runner               ║
╚══════════════════════════════════════════════════════════╝

Running all challenge tests...

Testing Challenge 1: GraphQL Query Explorer... ✅ PASS
Testing Challenge 2: Understanding Relationships... ✅ PASS
Testing Challenge 3: Mutations and Inserts... ❌ FAIL
Testing Challenge 4: Row-Level Security... ⏸️  SKIP

═══════════════════════════════════════════
  Challenge Progress
═══════════════════════════════════════════

🟢 BEGINNER
  ✅  Challenge 1: GraphQL Query Explorer
  ✅  Challenge 2: Understanding Relationships
  ❌  Challenge 3: Mutations and Inserts

🟡 INTERMEDIATE
  ⏸️   Challenge 4: Row-Level Security
  ⏸️   Challenge 5: Custom Hasura Actions (optional)

═══════════════════════════════════════════
  Completed: 2/10 (20%)
═══════════════════════════════════════════
```

### Test a Specific Challenge

Run tests for one challenge only:

```bash
npm run test:progress 1    # Challenge 1
npm run test:progress 3    # Challenge 3
npm run test:progress 6A   # Challenge 6A
```

### Run Tests with Detailed Output

See full Vitest test output:

```bash
npm run test:challenges
```

This shows individual test cases and detailed error messages.

---

## Understanding Test Results

### Status Indicators

| Icon | Status | Meaning |
|------|--------|---------|
| ✅ | PASS | Challenge completed successfully |
| ❌ | FAIL | Challenge not completed or incorrect |
| ⏸️  | SKIP | Test file doesn't exist yet |

### Interpreting Failures

When a test fails, check:

1. **Error message** - What assertion failed?
2. **Expected vs Actual** - What did the test expect to see?
3. **Challenge requirements** - Review CHALLENGES.md for success criteria

**Example failure:**
```
❌ Challenge 3: Mutations and Inserts

AssertionError: expected false to be true
  at tests/beginner/challenge-3.test.ts:98

Expected: RLS should prevent unauthorized access
Actual: Mutation succeeded (RLS not working)
```

This tells you that Row-Level Security (RLS) isn't preventing unauthorized mutations as expected.

---

## What Each Challenge Tests

### 🟢 Beginner Challenges

**Challenge 1: GraphQL Query Explorer**
- ✅ Fetches claims with provider information
- ✅ Filters claims by status (DENIED)
- ✅ Respects limit parameter
- ✅ Supports offset (pagination)
- ✅ Includes all required fields

**Challenge 2: Understanding Relationships**
- ✅ Fetches member with nested claims (array relationship)
- ✅ Has 3 levels of nesting (member → claims → provider)
- ✅ Calculates aggregates correctly
- ✅ Understands object relationships (claim → provider)

**Challenge 3: Mutations and Inserts**
- ✅ Inserts a new note
- ✅ Updates an existing note
- ✅ Deletes a note
- ✅ RLS prevents unauthorized access
- ✅ Uses correct mutation syntax

### 🟡 Intermediate Challenges

**Challenge 4: Row-Level Security**
- ✅ Member sees only their own claims
- ✅ Member cannot see another member's claims
- ✅ Admin sees all claims
- ✅ Provider sees only their claims
- ✅ Session variables control access

**Challenge 5: Custom Hasura Actions** *(optional)*
- Verifies custom action exists
- Tests action handler responds correctly
- Checks return type matches schema

**Challenge 6: Apollo Client Optimistic Updates** *(optional)*
- Detects optimistic response in mutation
- Verifies cache update function
- Checks error handling

**Challenges 6A-6D: Note CRUD** *(optional)*
- Delete button exists
- Edit functionality works
- Search filters notes
- Pagination loads more notes

---

## Troubleshooting

### "Missing required environment variable"

**Problem**: Tests can't find Hasura endpoint or admin secret.

**Solution**:
```bash
# Check .env exists
ls -la .env

# Verify it has required variables
cat .env | grep HASURA_GRAPHQL_ENDPOINT
cat .env | grep HASURA_GRAPHQL_ADMIN_SECRET
```

### "Connection refused" or "Network error"

**Problem**: Tests can't reach Hasura.

**Solution**:
1. Verify Hasura is running:
   ```bash
   curl http://localhost:8080/healthz
   # Should return: OK
   ```

2. Check Hasura endpoint in `.env`:
   ```env
   HASURA_GRAPHQL_ENDPOINT=http://localhost:8080
   ```

3. If using Hasura Cloud, update to cloud URL:
   ```env
   HASURA_GRAPHQL_ENDPOINT=https://your-project.hasura.app
   ```

### "Test file not found"

**Problem**: ⏸️  SKIP status means test file doesn't exist yet.

**Solution**:
- Tests for optional challenges may not be implemented yet
- You can still complete the challenge manually
- Check `tests/` directory to see which tests exist

### "RLS tests failing"

**Problem**: Tests expect Row-Level Security to work but it doesn't.

**Solution**:
1. Verify RLS policies are applied:
   ```bash
   npm run seed
   ```

2. Check Hasura permissions in Console:
   - Data → members → Permissions
   - Should have member, provider, admin roles

3. Test manually in Hasura Console:
   - Set headers: `x-hasura-role: member`, `x-hasura-user-id: <uuid>`
   - Query should return only that member's data

### "Mutation tests failing"

**Problem**: Insert/Update/Delete mutations not working.

**Solution**:
1. Check permissions in Hasura Console
2. Verify you're using correct mutation names:
   - `insert_notes_one` (not `insertNote`)
   - `update_notes_by_pk` (not `updateNote`)
   - `delete_notes_by_pk` (not `deleteNote`)

3. Check required fields:
   - Notes require: `member_id`, `body`

### Tests pass but you're not confident

**Tip**: Tests verify technical correctness, but you should also:
- Read the challenge solution in CHALLENGES.md
- Understand **why** the solution works
- Try variations and edge cases
- Explain the solution to someone (or yourself!)

---

## Test Development

Want to add tests for challenges that don't have them yet?

### Test File Structure

```typescript
import { describe, it, expect } from 'vitest';
import { gql } from '@apollo/client';
import { executeQuery } from '../helpers/graphql-client.js';

const MY_QUERY = gql`
  query MyQuery {
    # your GraphQL query
  }
`;

describe('Challenge X: Name', () => {
  it('should do something', async () => {
    const result = await executeQuery(MY_QUERY);

    expect(result.data).toBeDefined();
    // Add assertions
  });
});
```

### Helper Functions

**executeQuery** - Run GraphQL query with role:
```typescript
const result = await executeQuery(query, variables, TEST_ROLES.memberMichael);
```

**executeMutation** - Run GraphQL mutation:
```typescript
const result = await executeMutation(mutation, variables, TEST_ROLES.admin);
```

**expectQueryToFail** - Verify permission denied:
```typescript
const failed = await expectQueryToFail(query, {}, TEST_ROLES.memberLinda);
expect(failed).toBe(true);
```

### Test Data

Use predefined test data from `helpers/test-data.ts`:

```typescript
import { TEST_MEMBERS, TEST_PROVIDERS, TEST_ROLES } from '../helpers/test-data.js';

// Michael Lopez - has 8 claims
TEST_MEMBERS.MICHAEL_LOPEZ.id

// Linda Davis - has 6 claims
TEST_MEMBERS.LINDA_DAVIS.id

// Dr. Smith
TEST_PROVIDERS.DR_SMITH.id

// Roles for permission testing
TEST_ROLES.admin
TEST_ROLES.memberMichael
TEST_ROLES.providerSmith
```

---

## Integration with Learning

### Workflow

1. **Read challenge** in CHALLENGES.md
2. **Attempt solution** (write query/mutation/code)
3. **Run test** for that challenge
4. **Fix issues** based on test output
5. **Repeat** until test passes
6. **Verify understanding** by reading solution

### When to Run Tests

✅ **After completing a challenge** - Verify your solution
✅ **When stuck** - See what the test expects
✅ **Before moving on** - Ensure you've mastered the concept
❌ **Before attempting** - Don't let tests replace learning!

### Tests Are Not Cheating

Tests show you **what** is expected, not **how** to do it. They're like answer keys - use them to:
- Verify your understanding
- Debug issues
- Build confidence

But try the challenge first before looking at test code!

---

## Advanced Usage

### Watch Mode

Run tests continuously as you code:

```bash
npx vitest watch --config tests/vitest.config.ts
```

Tests re-run automatically when you save files.

### Filter by Name

Run tests matching a pattern:

```bash
npx vitest run --grep "RLS" --config tests/vitest.config.ts
```

### Debug Mode

See full test output with stack traces:

```bash
npx vitest run --reporter=verbose --config tests/vitest.config.ts
```

---

## Tips for Success

1. **Complete challenges in order** - Each builds on previous ones
2. **Read error messages carefully** - They tell you exactly what's wrong
3. **Use Hasura Console** - Test queries there first before running tests
4. **Check permissions** - Many failures are due to missing permissions
5. **Verify test data** - Make sure seeded data matches expectations
6. **Don't skip beginner challenges** - They're foundational!

---

## FAQ

**Q: Do I need to pass all tests to continue?**
A: No! Tests help verify your work, but learning is the goal. If you understand the concept, move on even if tests fail.

**Q: Can I modify the tests?**
A: Yes! Feel free to add more assertions or create new tests.

**Q: What if a test is wrong?**
A: Tests are based on challenge requirements. If you believe a test is incorrect, review CHALLENGES.md first. If still unclear, open an issue.

**Q: Are optional challenges tested?**
A: Some are, some aren't. Optional challenges are marked in the test runner.

**Q: Can I use tests for my own challenges?**
A: Absolutely! Copy the test structure and create your own learning exercises.

---

## Next Steps

1. Run `npm run test:progress` to see your current status
2. Start with Challenge 1 if you haven't yet
3. Work through challenges systematically
4. Use tests to verify and learn
5. Complete all beginner challenges before intermediate

**Happy testing and learning!** 🚀

---

## See Also

- [CHALLENGES.md](CHALLENGES.md) - Full challenge descriptions and solutions
- [LEARNING_CHECKLIST.md](LEARNING_CHECKLIST.md) - Step-by-step tutorial
- [BEST_PRACTICES.md](BEST_PRACTICES.md) - Development guidelines
- [README.md](../README.md) - Project setup and documentation
