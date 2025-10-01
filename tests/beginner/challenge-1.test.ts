import { describe, it, expect } from 'vitest';
import { gql } from '@apollo/client';
import { executeQuery } from '../helpers/graphql-client.js';
import { CLAIM_STATUSES } from '../helpers/test-data.js';

/**
 * Challenge 1: GraphQL Query Explorer
 *
 * Success Criteria:
 * - Query returns claims with nested provider data
 * - Filters work correctly
 * - Pagination works
 */

const GET_DENIED_CLAIMS = gql`
  query GetDeniedClaims {
    claims(
      where: { status: { _eq: "DENIED" } }
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
`;

const GET_CLAIMS_WITH_PROVIDER = gql`
  query GetClaimsWithProvider($limit: Int, $offset: Int) {
    claims(limit: $limit, offset: $offset) {
      id
      cpt
      status
      provider {
        id
        name
        specialty
      }
    }
  }
`;

describe('Challenge 1: GraphQL Query Explorer', () => {
  it('should fetch claims with provider information', async () => {
    const result = await executeQuery(GET_CLAIMS_WITH_PROVIDER, { limit: 5, offset: 0 });

    expect(result.data).toBeDefined();
    expect(result.data.claims).toBeDefined();
    expect(Array.isArray(result.data.claims)).toBe(true);
    expect(result.data.claims.length).toBeGreaterThan(0);
    expect(result.data.claims.length).toBeLessThanOrEqual(5);

    // Check nested provider data
    const firstClaim = result.data.claims[0];
    expect(firstClaim.provider).toBeDefined();
    expect(firstClaim.provider.name).toBeDefined();
    expect(firstClaim.provider.specialty).toBeDefined();
  });

  it('should filter claims by status (DENIED)', async () => {
    const result = await executeQuery(GET_DENIED_CLAIMS);

    expect(result.data).toBeDefined();
    expect(result.data.claims).toBeDefined();

    // All claims should have DENIED status
    const allDenied = result.data.claims.every(
      (claim: any) => claim.status === CLAIM_STATUSES.DENIED
    );
    expect(allDenied).toBe(true);

    // Should have denial_reason for denied claims
    result.data.claims.forEach((claim: any) => {
      expect(claim.denial_reason).toBeDefined();
      expect(claim.denial_reason).not.toBe('');
    });
  });

  it('should respect limit parameter (pagination)', async () => {
    const result = await executeQuery(GET_CLAIMS_WITH_PROVIDER, { limit: 3, offset: 0 });

    expect(result.data.claims).toBeDefined();
    expect(result.data.claims.length).toBeLessThanOrEqual(3);
  });

  it('should support offset parameter (pagination)', async () => {
    const page1 = await executeQuery(GET_CLAIMS_WITH_PROVIDER, { limit: 5, offset: 0 });
    const page2 = await executeQuery(GET_CLAIMS_WITH_PROVIDER, { limit: 5, offset: 5 });

    expect(page1.data.claims).toBeDefined();
    expect(page2.data.claims).toBeDefined();

    // IDs should be different between pages
    const page1Ids = page1.data.claims.map((c: any) => c.id);
    const page2Ids = page2.data.claims.map((c: any) => c.id);

    const overlap = page1Ids.filter((id: string) => page2Ids.includes(id));
    expect(overlap.length).toBe(0); // No overlap between pages
  });

  it('should include all required fields in claims query', async () => {
    const result = await executeQuery(GET_DENIED_CLAIMS);

    expect(result.data.claims.length).toBeGreaterThan(0);

    const claim = result.data.claims[0];

    // Check claim fields
    expect(claim.id).toBeDefined();
    expect(claim.cpt).toBeDefined();
    expect(claim.dos).toBeDefined();
    expect(claim.charge_cents).toBeDefined();

    // Check provider fields
    expect(claim.provider).toBeDefined();
    expect(claim.provider.name).toBeDefined();
    expect(claim.provider.specialty).toBeDefined();
    expect(claim.provider.npi).toBeDefined();
  });
});
