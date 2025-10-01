/**
 * Test data fixtures for challenge tests
 * These IDs match the seeded database
 */

export const TEST_MEMBERS = {
  MICHAEL_LOPEZ: {
    id: '0b057d39-0b9d-4265-a92c-d9fd8f22a7a6',
    firstName: 'Michael',
    lastName: 'Lopez',
    claimCount: 8,
  },
  LINDA_DAVIS: {
    id: 'bf6a2a56-c1a0-42cd-85df-5c6254fc98b2',
    firstName: 'Linda',
    lastName: 'Davis',
    claimCount: 6,
  },
};

export const TEST_PROVIDERS = {
  DR_SMITH: {
    id: '734f62da-879d-45bb-b07b-8163182ef917',
    name: 'Dr. Sarah Smith',
  },
};

/**
 * Test roles for permission testing
 */
export const TEST_ROLES = {
  admin: { role: 'admin' as const },
  memberMichael: {
    role: 'member' as const,
    memberId: TEST_MEMBERS.MICHAEL_LOPEZ.id,
  },
  memberLinda: {
    role: 'member' as const,
    memberId: TEST_MEMBERS.LINDA_DAVIS.id,
  },
  providerSmith: {
    role: 'provider' as const,
    providerId: TEST_PROVIDERS.DR_SMITH.id,
  },
};

/**
 * Common claim statuses
 */
export const CLAIM_STATUSES = {
  SUBMITTED: 'SUBMITTED',
  PROCESSING: 'PROCESSING',
  APPROVED: 'APPROVED',
  DENIED: 'DENIED',
  APPEALED: 'APPEALED',
};

/**
 * Helper to generate unique test data
 */
export function generateTestNote(memberId: string) {
  return {
    member_id: memberId,
    body: `Test note created at ${new Date().toISOString()}`,
  };
}

/**
 * Wait helper for async operations
 */
export const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
