/**
 * Apollo Client Configuration
 * Sets up HTTP and WebSocket links for queries/mutations and subscriptions
 */

import { ApolloClient, InMemoryCache, HttpLink, split, from } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { setContext } from '@apollo/client/link/context';
import { createClient } from 'graphql-ws';

// Get configuration from environment variables
const HTTP_URL = import.meta.env.VITE_GRAPHQL_HTTP_URL || 'http://localhost:8080/v1/graphql';
const WS_URL = import.meta.env.VITE_GRAPHQL_WS_URL || 'ws://localhost:8080/v1/graphql';

// Development role headers (for testing without auth)
const DEV_ROLE = import.meta.env.VITE_DEV_ROLE || 'admin';
const DEV_MEMBER_ID = import.meta.env.VITE_DEV_MEMBER_ID;
const DEV_PROVIDER_ID = import.meta.env.VITE_DEV_PROVIDER_ID;

// HTTP link for queries and mutations
const httpLink = new HttpLink({
  uri: HTTP_URL
});

// Auth link to inject headers
const authLink = setContext((_, { headers }) => {
  // In production, you would get these from your auth system
  const authHeaders: Record<string, string> = {
    'x-hasura-role': DEV_ROLE
  };

  // Add user ID if member role
  if (DEV_ROLE === 'member' && DEV_MEMBER_ID) {
    authHeaders['x-hasura-user-id'] = DEV_MEMBER_ID;
  }

  // Add provider ID if provider role
  if (DEV_ROLE === 'provider' && DEV_PROVIDER_ID) {
    authHeaders['x-hasura-provider-id'] = DEV_PROVIDER_ID;
  }

  // Admin secret for development (in production, use JWT tokens)
  if (DEV_ROLE === 'admin') {
    authHeaders['x-hasura-admin-secret'] = import.meta.env.VITE_HASURA_ADMIN_SECRET || 'claimsight_admin_secret_change_me';
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
      const params: Record<string, string> = {
        headers: {
          'x-hasura-role': DEV_ROLE
        }
      };

      if (DEV_ROLE === 'member' && DEV_MEMBER_ID) {
        params.headers['x-hasura-user-id'] = DEV_MEMBER_ID;
      }

      if (DEV_ROLE === 'provider' && DEV_PROVIDER_ID) {
        params.headers['x-hasura-provider-id'] = DEV_PROVIDER_ID;
      }

      if (DEV_ROLE === 'admin') {
        params.headers['x-hasura-admin-secret'] = import.meta.env.VITE_HASURA_ADMIN_SECRET || 'claimsight_admin_secret_change_me';
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

// Export helper function to get current role
export const getCurrentRole = () => DEV_ROLE;
export const getCurrentUserId = () => DEV_MEMBER_ID;
export const getCurrentProviderId = () => DEV_PROVIDER_ID;
