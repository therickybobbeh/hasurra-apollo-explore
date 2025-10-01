import { describe, it, expect } from 'vitest';
import { gql } from '@apollo/client';
import { executeQuery } from '../helpers/graphql-client.js';
import { TEST_MEMBERS } from '../helpers/test-data.js';

/**
 * Challenge 2: Understanding Relationships
 *
 * Success Criteria:
 * - Query uses at least 3 levels of nesting
 * - Aggregates work correctly
 * - Understand object vs array relationships
 */

const GET_MEMBER_WITH_CLAIMS = gql`
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
`;

describe('Challenge 2: Understanding Relationships', () => {
  it('should fetch member with nested claims (array relationship)', async () => {
    const result = await executeQuery(GET_MEMBER_WITH_CLAIMS, {
      memberId: TEST_MEMBERS.MICHAEL_LOPEZ.id,
    });

    expect(result.data.members_by_pk).toBeDefined();
    expect(result.data.members_by_pk.claims).toBeDefined();
    expect(Array.isArray(result.data.members_by_pk.claims)).toBe(true);
    expect(result.data.members_by_pk.claims.length).toBeGreaterThan(0);
  });

  it('should have 3 levels of nesting (member → claims → provider)', async () => {
    const result = await executeQuery(GET_MEMBER_WITH_CLAIMS, {
      memberId: TEST_MEMBERS.MICHAEL_LOPEZ.id,
    });

    const member = result.data.members_by_pk;
    expect(member).toBeDefined(); // Level 1: member

    const claim = member.claims[0];
    expect(claim).toBeDefined(); // Level 2: claims

    expect(claim.provider).toBeDefined(); // Level 3: provider
    expect(claim.provider.name).toBeDefined();
    expect(claim.provider.specialty).toBeDefined();
  });

  it('should calculate aggregates correctly', async () => {
    const result = await executeQuery(GET_MEMBER_WITH_CLAIMS, {
      memberId: TEST_MEMBERS.MICHAEL_LOPEZ.id,
    });

    const member = result.data.members_by_pk;
    const aggregate = member.claims_aggregate.aggregate;

    expect(aggregate).toBeDefined();
    expect(aggregate.count).toBeDefined();
    expect(aggregate.count).toBeGreaterThan(0);

    // Count should match array length
    expect(aggregate.count).toBe(member.claims.length);

    // Sums should be defined
    expect(aggregate.sum).toBeDefined();
    expect(aggregate.sum.charge_cents).toBeGreaterThan(0);
  });

  it('should understand object relationship (claim → provider)', async () => {
    const QUERY_CLAIM_PROVIDER = gql`
      query GetClaimWithProvider {
        claims(limit: 1) {
          id
          provider {
            id
            name
          }
        }
      }
    `;

    const result = await executeQuery(QUERY_CLAIM_PROVIDER);

    const claim = result.data.claims[0];
    expect(claim.provider).toBeDefined();
    expect(typeof claim.provider).toBe('object'); // Object relationship returns single object
    expect(claim.provider.id).toBeDefined();
    expect(claim.provider.name).toBeDefined();
  });

  it('should verify Michael Lopez has expected claim count', async () => {
    const result = await executeQuery(GET_MEMBER_WITH_CLAIMS, {
      memberId: TEST_MEMBERS.MICHAEL_LOPEZ.id,
    });

    const aggregate = result.data.members_by_pk.claims_aggregate.aggregate;
    expect(aggregate.count).toBeGreaterThanOrEqual(TEST_MEMBERS.MICHAEL_LOPEZ.claimCount);
  });
});
