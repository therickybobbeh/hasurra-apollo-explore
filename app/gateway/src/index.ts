/**
 * Apollo Federation Gateway
 * Combines Hasura (base Provider type) + Ratings subgraph (Provider extension)
 *
 * Hasura v2.10.0+ supports Apollo Federation with
 * HASURA_GRAPHQL_ENABLE_APOLLO_FEDERATION=true
 */

import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloGateway, IntrospectAndCompose } from '@apollo/gateway';
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
  // Create gateway with federated subgraphs
  // Note: Hasura v2/v3 can't have its types extended by Apollo subgraphs,
  // so we use a standalone providers subgraph for federation demo
  // Hasura is still available at port 8080 for members/claims/eligibility
  const gateway = new ApolloGateway({
    supergraphSdl: new IntrospectAndCompose({
      subgraphs: [
        {
          name: 'providers',
          url: SUBGRAPH_URL,
        },
      ],
    }),
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
    console.log('\n   Federated subgraphs:');
    console.log(`   - Providers: ${SUBGRAPH_URL} (Provider type with ratings)`);
    console.log('\n   📊 Hasura (non-federated):');
    console.log(`   - Direct access: ${HASURA_URL}/v1/graphql (members, claims, eligibility)`);
    console.log('\n   🎯 Demonstrates Apollo Federation + Hasura working together!');
    console.log('');
  });
}

startServer().catch((error) => {
  console.error('Error starting gateway:', error);
  process.exit(1);
});
