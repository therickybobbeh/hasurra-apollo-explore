/**
 * Apollo GraphQL Subgraph - Provider Ratings
 * Standalone service with provider ratings data
 * Demonstrates Apollo Federation concepts
 */

import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { buildSubgraphSchema } from '@apollo/subgraph';
import express from 'express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import gql from 'graphql-tag';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '..', '..', '.env') });

// Load ratings data
const ratingsData = JSON.parse(
  readFileSync(join(__dirname, 'ratings.json'), 'utf-8')
);

// GraphQL schema - Provider Service with Ratings
// Demonstrates Apollo Federation by extending provider_records type from Hasura
const typeDefs = gql`
  extend schema
    @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key", "@external"])

  scalar uuid

  type provider_records @key(fields: "id") {
    id: uuid! @external
    rating: Float
    reviewCount: Int
    reviews: [Review!]!
  }

  type Review {
    id: ID!
    providerId: ID!
    rating: Int!
    comment: String
    date: String!
  }

  type Query {
    _empty: String
  }
`;

// NOTE: In federation, we don't need mock provider data
// Hasura provides the base provider data, we just add ratings

// Resolvers
const resolvers = {
  Query: {
    _empty: () => null
  },
  provider_records: {
    // This is the key resolver for Apollo Federation
    // Hasura sends us provider entities, we add rating fields
    __resolveReference(reference: { id: string }) {
      // Get rating info for this provider ID
      const ratingInfo = ratingsData.ratings[reference.id];

      // Always return an object with rating fields
      // Even if we don't have ratings, return safe defaults
      return {
        id: reference.id,
        rating: ratingInfo?.rating || null,
        reviewCount: ratingInfo?.ratingCount || 0,
        reviews: ratingInfo?.reviews || []
      };
    }
  }
};

// Build federation-compatible subgraph schema
const schema = buildSubgraphSchema([{ typeDefs, resolvers }]);

// Create Apollo Server
const server = new ApolloServer({
  schema
});

const app = express();
const PORT = process.env.SUBGRAPH_PORT || 3002;

// Start server
async function startServer() {
  await server.start();

  app.use(
    '/graphql',
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => ({ token: req.headers.authorization })
    })
  );

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'provider-ratings-subgraph' });
  });

  app.listen(PORT, () => {
    console.log(`\n✓ Provider ratings subgraph running on port ${PORT}`);
    console.log(`  GraphQL endpoint: http://localhost:${PORT}/graphql`);
    console.log(`  Health check: http://localhost:${PORT}/health\n`);
  });
}

startServer().catch((error) => {
  console.error('Error starting subgraph:', error);
  process.exit(1);
});
