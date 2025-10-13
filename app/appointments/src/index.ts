/**
 * Appointments Service - Apollo Server
 *
 * A manually-built GraphQL API to contrast with Hasura's auto-generation.
 * This service manages appointments and billing records.
 */

import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { buildSubgraphSchema } from '@apollo/subgraph';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { typeDefs } from './schema/typeDefs.js';
import { resolvers } from './resolvers/index.js';
import { testConnection } from './db/connection.js';

// Load environment variables from project root
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '../../../.env');

console.log('Loading .env from:', envPath);
dotenv.config({ path: envPath });

const PORT = process.env.APPOINTMENTS_PORT || 3004;

// Debug: Log the database URL to verify it's loaded
console.log('DEBUG - Database URL:', process.env.APPOINTMENTS_DATABASE_URL ? 'SET' : 'NOT SET');
if (!process.env.APPOINTMENTS_DATABASE_URL) {
  console.log('DEBUG - All env vars:', Object.keys(process.env).filter(k => k.includes('APPOINTMENT')));
}

// Create Apollo Server with Federation support
const server = new ApolloServer({
  schema: buildSubgraphSchema({ typeDefs, resolvers }),
});

// Create Express app
const app = express();

async function startServer() {
  // Test database connection
  console.log('\n🏥 Appointments Service');
  console.log('Testing database connection...');

  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.error('❌ Failed to connect to database');
    console.log('\n💡 Make sure you:');
    console.log('   1. Created the appointments database in Neon');
    console.log('   2. Ran the SQL setup script');
    console.log('   3. Set APPOINTMENTS_DATABASE_URL in .env');
    process.exit(1);
  }

  // Start Apollo Server
  await server.start();

  // Apply middleware
  app.use(
    '/graphql',
    cors(),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => ({ token: req.headers.authorization }),
    })
  );

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'appointments',
      timestamp: new Date().toISOString(),
    });
  });

  // Start listening
  app.listen(PORT, () => {
    console.log(`\n✓ Appointments service running on port ${PORT}`);
    console.log(`  GraphQL endpoint: http://localhost:${PORT}/graphql`);
    console.log(`  Health check: http://localhost:${PORT}/health\n`);
  });
}

startServer().catch((error) => {
  console.error('Error starting appointments service:', error);
  process.exit(1);
});
