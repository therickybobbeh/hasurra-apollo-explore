import { ApolloClient, InMemoryCache, HttpLink, ApolloQueryResult, FetchResult } from '@apollo/client';
import { DocumentNode } from 'graphql';
import fetch from 'cross-fetch';

export interface TestRole {
  role: 'admin' | 'member' | 'provider';
  memberId?: string;
  providerId?: string;
}

/**
 * Creates a GraphQL client for testing with specific role/permissions
 */
export function createTestClient(testRole: TestRole) {
  const endpoint = process.env.HASURA_GRAPHQL_ENDPOINT || 'http://localhost:8080';
  const adminSecret = process.env.HASURA_GRAPHQL_ADMIN_SECRET || '';

  const headers: Record<string, string> = {
    'x-hasura-role': testRole.role,
    'x-hasura-admin-secret': adminSecret,
  };

  // Add session variables based on role
  if (testRole.role === 'member' && testRole.memberId) {
    headers['x-hasura-user-id'] = testRole.memberId;
  } else if (testRole.role === 'provider' && testRole.providerId) {
    headers['x-hasura-provider-id'] = testRole.providerId;
  }

  const client = new ApolloClient({
    link: new HttpLink({
      uri: `${endpoint}/v1/graphql`,
      headers,
      fetch,
    }),
    cache: new InMemoryCache(),
    defaultOptions: {
      query: {
        fetchPolicy: 'no-cache',
      },
      mutate: {
        fetchPolicy: 'no-cache',
      },
    },
  });

  return client;
}

/**
 * Execute a GraphQL query with specific role
 */
export async function executeQuery<T = any>(
  query: DocumentNode,
  variables: Record<string, any> = {},
  role: TestRole = { role: 'admin' }
): Promise<ApolloQueryResult<T>> {
  const client = createTestClient(role);
  return client.query<T>({
    query,
    variables,
  });
}

/**
 * Execute a GraphQL mutation with specific role
 */
export async function executeMutation<T = any>(
  mutation: DocumentNode,
  variables: Record<string, any> = {},
  role: TestRole = { role: 'admin' }
): Promise<FetchResult<T>> {
  const client = createTestClient(role);
  return client.mutate<T>({
    mutation,
    variables,
  });
}

/**
 * Test if a query fails (for permission testing)
 */
export async function expectQueryToFail(
  query: DocumentNode,
  variables: Record<string, any> = {},
  role: TestRole
): Promise<boolean> {
  try {
    await executeQuery(query, variables, role);
    return false; // Query succeeded, expected it to fail
  } catch (error) {
    return true; // Query failed as expected
  }
}

/**
 * Extract error message from GraphQL response
 */
export function getErrorMessage(error: any): string {
  if (error?.graphQLErrors?.[0]?.message) {
    return error.graphQLErrors[0].message;
  }
  if (error?.message) {
    return error.message;
  }
  return 'Unknown error';
}
