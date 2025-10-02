/**
 * Apollo Federation Gateway
 * Combines Hasura (base Provider type) + Ratings subgraph (Provider extension)
 *
 * Hasura v2.10.0+ supports Apollo Federation with
 * HASURA_GRAPHQL_ENABLE_APOLLO_FEDERATION=true
 */

import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloGateway, IntrospectAndCompose, RemoteGraphQLDataSource } from '@apollo/gateway';
import express from 'express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '..', '..', '.env') });

const HASURA_URL = process.env.HASURA_GRAPHQL_ENDPOINT || 'http://localhost:8080';
const HASURA_SECRET = process.env.HASURA_GRAPHQL_ADMIN_SECRET || '';
const SUBGRAPH_URL = process.env.SUBGRAPH_URL || 'http://localhost:3002/graphql';
const GATEWAY_PORT = process.env.GATEWAY_PORT || 4000;

const app = express();

// Wait for Hasura to be ready with federation enabled
async function waitForHasura() {
  const maxRetries = 10;
  const retryDelay = 1000; // 1 second

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(`${HASURA_URL}/v1/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hasura-admin-secret': HASURA_SECRET,
        },
        body: JSON.stringify({ query: '{ _service { sdl } }' }),
      });

      const data = await response.json();
      if (data.data?._service?.sdl) {
        console.log('✓ Hasura is ready with Apollo Federation enabled');
        return true;
      }
    } catch (error) {
      // Ignore errors and retry
    }

    if (i < maxRetries - 1) {
      console.log(`Waiting for Hasura to be ready... (attempt ${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }

  throw new Error('Hasura did not become ready in time. Make sure HASURA_GRAPHQL_ENABLE_APOLLO_FEDERATION=true is set.');
}

// Start server
async function startServer() {
  // Wait for Hasura to be ready first
  await waitForHasura();

  // Create gateway with Hasura + Providers subgraph
  // Note: Hasura types can't be EXTENDED by Apollo subgraphs,
  // but Hasura CAN be included in the gateway as a subgraph!
  // This gives you one endpoint for all queries.
  const gateway = new ApolloGateway({
    supergraphSdl: new IntrospectAndCompose({
      subgraphs: [
        {
          name: 'hasura',
          url: `${HASURA_URL}/v1/graphql`,
        },
        {
          name: 'providers',
          url: SUBGRAPH_URL,
        },
      ],
      introspectionHeaders: {
        'x-hasura-admin-secret': HASURA_SECRET,
      },
    }),
    // Custom data source to pass headers to Hasura during query execution
    buildService({ name, url }) {
      return new RemoteGraphQLDataSource({
        url,
        willSendRequest({ request, context }: any) {
          // Pass admin secret to Hasura for all queries
          if (name === 'hasura') {
            request.http.headers.set('x-hasura-admin-secret', HASURA_SECRET);
            request.http.headers.set('x-hasura-role', context.headers?.['x-hasura-role'] || 'admin');
          }
        },
      });
    },
    // Enable debug logging in development
    debug: true,
  });

  // Create Apollo Server with gateway
  const server = new ApolloServer({
    gateway,
    // Disable introspection/playground in production
    introspection: process.env.NODE_ENV !== 'production',
  });

  await server.start();

  // Apply middleware
  app.use(
    '/graphql',
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        // Forward authentication headers from client to subgraphs
        return {
          headers: {
            authorization: req.headers.authorization || '',
            'x-hasura-role': req.headers['x-hasura-role'] || 'admin',
            'x-hasura-user-id': req.headers['x-hasura-user-id'] || '',
            'x-hasura-admin-secret': HASURA_SECRET,
          },
        };
      },
    })
  );

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'apollo-federation-gateway',
      subgraphs: ['hasura', 'ratings'],
    });
  });

  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      message: 'ClaimSight Apollo Federation Gateway',
      description: 'TRUE Apollo Federation - Hasura (base Provider) + Ratings (extension)',
      graphql: `http://localhost:${GATEWAY_PORT}/graphql`,
      health: `http://localhost:${GATEWAY_PORT}/health`,
      federation: 'Hasura v2.10.0+ with ENABLE_APOLLO_FEDERATION=true',
    });
  });

  app.listen(GATEWAY_PORT, () => {
    console.log('\n🚀 Apollo Federation Gateway ready!');
    console.log(`   GraphQL endpoint: http://localhost:${GATEWAY_PORT}/graphql`);
    console.log(`   Health check: http://localhost:${GATEWAY_PORT}/health`);
    console.log('\n   📊 Unified subgraphs:');
    console.log(`   - Hasura: ${HASURA_URL}/v1/graphql (members, claims, eligibility, notes)`);
    console.log(`   - Providers: ${SUBGRAPH_URL} (providers with ratings - uses @key)`);
    console.log('\n   🎯 Query everything from ONE endpoint (port 4000)!');
    console.log('   💡 Note: Hasura types cannot be extended by Apollo (v2/v3 limitation)');
    console.log('');
  });
}

startServer().catch((error) => {
  console.error('Error starting gateway:', error);
  process.exit(1);
});
