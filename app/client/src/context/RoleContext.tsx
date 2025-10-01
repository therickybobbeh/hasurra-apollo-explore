/**
 * Role Context for runtime role switching
 * Allows users to switch between different roles (admin, member, provider) in dev mode
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface TestUser {
  role: 'admin' | 'member' | 'provider';
  label: string;
  memberId?: string;
  providerId?: string;
}

interface RoleContextType {
  currentUser: TestUser;
  setCurrentUser: (user: TestUser) => void;
  testUsers: TestUser[];
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

// Get test users - hardcoded with members that have claims
const parseTestUsers = (): TestUser[] => {
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
      return JSON.parse(envUsers);
    }
  } catch (error) {
    console.error('Failed to parse VITE_TEST_USERS:', error);
  }

  return defaultUsers;
};

export function RoleProvider({ children }: { children: ReactNode }) {
  const testUsers = parseTestUsers();

  // Load initial user from localStorage or use first test user
  const [currentUser, setCurrentUser] = useState<TestUser>(() => {
    const stored = localStorage.getItem('claimsight_current_user');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // Invalid stored data, use first test user and persist it
        const defaultUser = testUsers[0];
        localStorage.setItem('claimsight_current_user', JSON.stringify(defaultUser));
        return defaultUser;
      }
    }
    // No stored user, use first test user and persist it immediately
    const defaultUser = testUsers[0];
    localStorage.setItem('claimsight_current_user', JSON.stringify(defaultUser));
    return defaultUser;
  });

  // Persist to localStorage when user changes
  useEffect(() => {
    localStorage.setItem('claimsight_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  return (
    <RoleContext.Provider value={{ currentUser, setCurrentUser, testUsers }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within RoleProvider');
  }
  return context;
}
