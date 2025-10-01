import { describe, it, expect } from 'vitest';
import { gql } from '@apollo/client';
import { executeQuery } from '../helpers/graphql-client.js';
import { TEST_MEMBERS, TEST_PROVIDERS, TEST_ROLES } from '../helpers/test-data.js';

/**
 * Challenge 4: Row-Level Security (RLS) Deep Dive
 *
 * Success Criteria:
 * - Member can see only their own claims
 * - Provider can see only their claims
 * - Admin can see all data
 */

const GET_ALL_CLAIMS = gql`
  query GetAllClaims {
    claims {
      id
      member_id
      provider_id
    }
  }
`;

const GET_MEMBER_CLAIMS = gql`
  query GetMemberClaims($memberId: uuid!) {
    claims(where: { member_id: { _eq: $memberId } }) {
      id
      member_id
    }
  }
`;

describe('Challenge 4: Row-Level Security', () => {
  it('should allow member to see only their own claims', async () => {
    const result = await executeQuery(GET_ALL_CLAIMS, {}, TEST_ROLES.memberMichael);

    expect(result.data.claims).toBeDefined();

    // All claims should belong to Michael
    const allBelongToMichael = result.data.claims.every(
      (claim: any) => claim.member_id === TEST_MEMBERS.MICHAEL_LOPEZ.id
    );

    expect(allBelongToMichael).toBe(true);
  });

  it('should prevent member from seeing another member\'s claims', async () => {
    const result = await executeQuery(
      GET_MEMBER_CLAIMS,
      { memberId: TEST_MEMBERS.LINDA_DAVIS.id },
      TEST_ROLES.memberMichael
    );

    // Should return empty array (RLS prevents access)
    expect(result.data.claims).toBeDefined();
    expect(result.data.claims.length).toBe(0);
  });

  it('should allow admin to see all claims', async () => {
    const result = await executeQuery(GET_ALL_CLAIMS, {}, TEST_ROLES.admin);

    expect(result.data.claims).toBeDefined();
    expect(result.data.claims.length).toBeGreaterThan(0);

    // Should have claims from multiple members
    const uniqueMembers = new Set(result.data.claims.map((c: any) => c.member_id));
    expect(uniqueMembers.size).toBeGreaterThan(1);
  });

  it('should allow provider to see only their claims', async () => {
    const result = await executeQuery(GET_ALL_CLAIMS, {}, TEST_ROLES.providerSmith);

    expect(result.data.claims).toBeDefined();

    // All claims should have this provider
    const allBelongToProvider = result.data.claims.every(
      (claim: any) => claim.provider_id === TEST_PROVIDERS.DR_SMITH.id
    );

    expect(allBelongToProvider).toBe(true);
  });

  it('should understand session variables control access', async () => {
    // Member with user_id session variable
    const memberResult = await executeQuery(GET_ALL_CLAIMS, {}, TEST_ROLES.memberMichael);

    // Provider with provider_id session variable
    const providerResult = await executeQuery(GET_ALL_CLAIMS, {}, TEST_ROLES.providerSmith);

    // Results should be different
    const memberClaimIds = memberResult.data.claims.map((c: any) => c.id);
    const providerClaimIds = providerResult.data.claims.map((c: any) => c.id);

    // Should have some different claims
    expect(memberClaimIds).not.toEqual(providerClaimIds);
  });
});
