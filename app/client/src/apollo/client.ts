/**
 * Apollo Client Configuration
 * Sets up HTTP and WebSocket links for queries/mutations and subscriptions
 */

// IMPORTANT: Import init first to ensure localStorage is set before we create the client
import '../init';

import { ApolloClient, InMemoryCache, HttpLink, split, from } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { setContext } from '@apollo/client/link/context';
import { createClient } from 'graphql-ws';

// Get configuration from environment variables
const HTTP_URL = import.meta.env.VITE_GRAPHQL_HTTP_URL || 'http://localhost:8080/v1/graphql';
const WS_URL = import.meta.env.VITE_GRAPHQL_WS_URL || 'ws://localhost:8080/v1/graphql';

// Helper to get current user from localStorage
const getCurrentUser = () => {
  try {
    const stored = localStorage.getItem('claimsight_current_user');
    console.log('[getCurrentUser] Raw localStorage value:', stored);
    if (stored) {
      const parsed = JSON.parse(stored);
      console.log('[getCurrentUser] Parsed user:', parsed);
      return parsed;
    }
  } catch (error) {
    console.error('Failed to parse current user:', error);
  }

  // Fallback to env vars
  const fallback = {
    role: import.meta.env.VITE_DEV_ROLE || 'admin',
    memberId: import.meta.env.VITE_DEV_MEMBER_ID,
    providerId: import.meta.env.VITE_DEV_PROVIDER_ID
  };
  console.log('[getCurrentUser] Using fallback:', fallback);
  return fallback;
};

// HTTP link for queries and mutations
const httpLink = new HttpLink({
  uri: HTTP_URL
});

// Auth link to inject headers
const authLink = setContext((_, { headers }) => {
  const user = getCurrentUser();
  const authHeaders: Record<string, string> = {
    'x-hasura-role': user.role,
    // IMPORTANT: In dev mode, always send admin secret to allow role switching
    // In production, use JWT authentication instead
    'x-hasura-admin-secret': import.meta.env.VITE_HASURA_ADMIN_SECRET || 'claimsight_admin_secret_change_me'
  };

  // Add user ID if member role
  if (user.role === 'member' && user.memberId) {
    authHeaders['x-hasura-user-id'] = user.memberId;
  }

  // Add provider ID if provider role
  if (user.role === 'provider' && user.providerId) {
    authHeaders['x-hasura-provider-id'] = user.providerId;
  }

  // Debug logging
  if (import.meta.env.DEV) {
    console.log('[Apollo Client] Auth headers:', authHeaders);
  }

  return {
    headers: {
      ...headers,
      ...authHeaders
    }
  };
});

// WebSocket link for subscriptions
const wsLink = new GraphQLWsLink(
  createClient({
    url: WS_URL,
    connectionParams: () => {
      const user = getCurrentUser();
      const params: Record<string, string> = {
        headers: {
          'x-hasura-role': user.role,
          // Always send admin secret in dev mode
          'x-hasura-admin-secret': import.meta.env.VITE_HASURA_ADMIN_SECRET || 'claimsight_admin_secret_change_me'
        }
      };

      if (user.role === 'member' && user.memberId) {
        params.headers['x-hasura-user-id'] = user.memberId;
      }

      if (user.role === 'provider' && user.providerId) {
        params.headers['x-hasura-provider-id'] = user.providerId;
      }

      return params;
    }
  })
);

// Split link: use WebSocket for subscriptions, HTTP for queries/mutations
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  from([authLink, httpLink])
);

// Cache configuration with type policies
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        claims: {
          // Merge incoming claims with existing ones
          keyArgs: ['where', 'order_by'],
          merge(existing = [], incoming) {
            return incoming;
          }
        }
      }
    },
    claims: {
      keyFields: ['id']
    },
    members: {
      keyFields: ['id']
    },
    providers: {
      keyFields: ['id']
    },
    notes: {
      keyFields: ['id']
    },
    eligibility_checks: {
      keyFields: ['id']
    }
  }
});

// Create Apollo Client
export const apolloClient = new ApolloClient({
  link: splitLink,
  cache,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all'
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all'
    },
    mutate: {
      errorPolicy: 'all'
    }
  },
  connectToDevTools: import.meta.env.DEV
});

// Export helper functions to get current user info
export const getCurrentRole = () => getCurrentUser().role;
export const getCurrentUserId = () => getCurrentUser().memberId;
export const getCurrentProviderId = () => getCurrentUser().providerId;
