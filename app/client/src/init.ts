/**
 * Initialize app state before anything else runs
 * This ensures localStorage has the current user BEFORE Apollo Client is created
 */

interface TestUser {
  role: 'admin' | 'member' | 'provider';
  label: string;
  memberId?: string;
  providerId?: string;
}

// Get test users - hardcoded with members that have claims
function parseTestUsers(): TestUser[] {
  // Hardcoded test users (can be overridden by VITE_TEST_USERS env var)
  const defaultUsers: TestUser[] = [
    { role: 'admin', label: 'Admin User' },
    { role: 'member', label: 'Member - Michael Lopez', memberId: '0b057d39-0b9d-4265-a92c-d9fd8f22a7a6' },
    { role: 'member', label: 'Member - Linda Davis', memberId: 'bf6a2a56-c1a0-42cd-85df-5c6254fc98b2' },
    { role: 'provider', label: 'Provider - Dr. Smith', providerId: '734f62da-879d-45bb-b07b-8163182ef917' }
  ];

  // Try to load from env var, but use hardcoded as fallback
  try {
    const envUsers = import.meta.env.VITE_TEST_USERS;
    if (envUsers) {
      const parsed = JSON.parse(envUsers);
      console.log('[Init] Loaded test users from VITE_TEST_USERS');
      return parsed;
    }
  } catch (error) {
    console.warn('[Init] Failed to parse VITE_TEST_USERS, using defaults:', error);
  }

  console.log('[Init] Using hardcoded test users');
  return defaultUsers;
}

// Initialize current user in localStorage if not set
export function initializeAuth() {
  const stored = localStorage.getItem('claimsight_current_user');
  const testUsers = parseTestUsers();

  console.log('[Init] Available test users:', testUsers);

  if (!stored) {
    const defaultUser = testUsers[0];
    localStorage.setItem('claimsight_current_user', JSON.stringify(defaultUser));
    console.log('[Init] Set default user:', defaultUser);
  } else {
    try {
      const parsed = JSON.parse(stored);
      console.log('[Init] User already set:', parsed);

      // Validate that the stored user has all required fields
      if (parsed.role === 'member' && !parsed.memberId) {
        console.warn('[Init] Member user missing memberId, resetting to default');
        const defaultUser = testUsers[0];
        localStorage.setItem('claimsight_current_user', JSON.stringify(defaultUser));
      }
      if (parsed.role === 'provider' && !parsed.providerId) {
        console.warn('[Init] Provider user missing providerId, resetting to default');
        const defaultUser = testUsers[0];
        localStorage.setItem('claimsight_current_user', JSON.stringify(defaultUser));
      }
    } catch (error) {
      console.error('[Init] Failed to parse stored user, resetting:', error);
      const defaultUser = testUsers[0];
      localStorage.setItem('claimsight_current_user', JSON.stringify(defaultUser));
    }
  }
}

// Run immediately when this module is imported
initializeAuth();
