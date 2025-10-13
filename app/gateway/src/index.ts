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
const APPOINTMENTS_URL = process.env.APPOINTMENTS_URL || 'http://localhost:3004/graphql';
const GATEWAY_PORT = process.env.GATEWAY_PORT || 4000;

// Debug logging
console.log('🔧 Gateway Configuration:');
console.log(`   HASURA_URL: ${HASURA_URL}`);
console.log(`   HASURA_SECRET: ${HASURA_SECRET ? '***' + HASURA_SECRET.slice(-4) : 'NOT SET'}`);
console.log(`   SUBGRAPH_URL: ${SUBGRAPH_URL}`);
console.log(`   APPOINTMENTS_URL: ${APPOINTMENTS_URL}`);
console.log(`   GATEWAY_PORT: ${GATEWAY_PORT}\n`);

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

      // Debug: Show what we got back
      if (i === 0) {
        console.log('🔍 Hasura response:', JSON.stringify(data).substring(0, 200) + '...');
      }

      if (data.data?._service?.sdl) {
        console.log('✓ Hasura is ready with Apollo Federation enabled');
        return true;
      }
    } catch (error) {
      console.log(`❌ Error on attempt ${i + 1}:`, error instanceof Error ? error.message : error);
    }

    if (i < maxRetries - 1) {
      console.log(`Waiting for Hasura to be ready... (attempt ${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }

  throw new Error('Hasura did not become ready in time. Make sure HASURA_GRAPHQL_ENABLE_APOLLO_FEDERATION=true is set.');
}

// Check if a subgraph service is available
async function checkSubgraph(name: string, url: string): Promise<boolean> {
  const maxRetries = 3;
  const retryDelay = 1000; // 1 second

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '{ _service { sdl } }' }),
        signal: AbortSignal.timeout(2000), // 2 second timeout
      });

      const data = await response.json();

      if (data.data?._service?.sdl) {
        console.log(`✓ ${name} service found at ${url}`);
        return true;
      }
    } catch (error) {
      // Service not available, continue
    }

    if (i < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }

  console.log(`⊗ ${name} service not available (this is OK if you haven't reached that phase yet)`);
  return false;
}

// Start server
async function startServer() {
  // Wait for Hasura to be ready (required)
  await waitForHasura();

  console.log('\n🔍 Detecting available subgraph services...\n');

  // Build subgraphs array dynamically
  const subgraphs: Array<{ name: string; url: string }> = [
    {
      name: 'hasura',
      url: `${HASURA_URL}/v1/graphql`,
    },
  ];

  // Check for providers subgraph (Phase 2+)
  const providersAvailable = await checkSubgraph('Providers', SUBGRAPH_URL);
  if (providersAvailable) {
    subgraphs.push({
      name: 'providers',
      url: SUBGRAPH_URL,
    });
  }

  // Check for appointments subgraph (Phase 4+)
  const appointmentsAvailable = await checkSubgraph('Appointments', APPOINTMENTS_URL);
  if (appointmentsAvailable) {
    subgraphs.push({
      name: 'appointments',
      url: APPOINTMENTS_URL,
    });
  }

  // Check for medications subgraph (Phase 6+)
  if (process.env.MEDICATIONS_URL) {
    const MEDICATIONS_URL = process.env.MEDICATIONS_URL;
    const medicationsAvailable = await checkSubgraph('Medications', MEDICATIONS_URL);
    if (medicationsAvailable) {
      subgraphs.push({
        name: 'medications',
        url: MEDICATIONS_URL,
      });
    }
  }

  console.log(`\n🎯 Configuring gateway with ${subgraphs.length} subgraph(s): ${subgraphs.map(s => s.name).join(', ')}\n`);

  // Create gateway with dynamically detected subgraphs
  // Note: Hasura types can't be EXTENDED by Apollo subgraphs,
  // but Hasura CAN be included in the gateway as a subgraph!
  // This gives you one endpoint for all queries.
  const gateway = new ApolloGateway({
    supergraphSdl: new IntrospectAndCompose({
      subgraphs,
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
      subgraphs: subgraphs.map(s => s.name),
    });
  });

  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      message: 'ClaimSight Apollo Federation Gateway',
      description: 'Dynamic Apollo Federation - Auto-detects available services',
      graphql: `http://localhost:${GATEWAY_PORT}/graphql`,
      health: `http://localhost:${GATEWAY_PORT}/health`,
      subgraphs: subgraphs.map(s => ({ name: s.name, url: s.url })),
      federation: 'Hasura v2.10.0+ with ENABLE_APOLLO_FEDERATION=true',
    });
  });

  app.listen(GATEWAY_PORT, () => {
    console.log('\n🚀 Apollo Federation Gateway ready!');
    console.log(`   GraphQL endpoint: http://localhost:${GATEWAY_PORT}/graphql`);
    console.log(`   Health check: http://localhost:${GATEWAY_PORT}/health`);
    console.log('\n   📊 Active subgraphs:');
    subgraphs.forEach(subgraph => {
      const description =
        subgraph.name === 'hasura' ? '(members, claims, providers, eligibility)' :
        subgraph.name === 'providers' ? '(provider ratings & reviews)' :
        subgraph.name === 'appointments' ? '(appointments & billing - Node.js)' :
        subgraph.name === 'medications' ? '(prescriptions - Spring Boot Java)' : '';
      console.log(`   - ${subgraph.name}: ${subgraph.url} ${description}`);
    });
    console.log('\n   🎯 Query everything from ONE endpoint (port 4000)!');
    console.log(`   💡 Currently in Phase ${subgraphs.length === 2 ? '2' : subgraphs.length === 3 ? '4' : subgraphs.length === 4 ? '6' : '?'}`);
    console.log('');
  });
}

startServer().catch((error) => {
  console.error('Error starting gateway:', error);
  process.exit(1);
});
