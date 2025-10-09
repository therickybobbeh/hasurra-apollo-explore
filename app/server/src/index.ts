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

// Mock provider data (in real app, this would come from Hasura or a database)
const providers = [
  {
    id: '734f62da-879d-45bb-b07b-8163182ef917',
    name: 'Dr. Sarah Smith',
    specialty: 'Cardiology',
    npi: '1234567890'
  },
  {
    id: 'provider-2',
    name: 'Dr. John Doe',
    specialty: 'Pediatrics',
    npi: '0987654321'
  }
];

// Resolvers
const resolvers = {
  Query: {
    provider(_: any, { id }: { id: string }) {
      const provider = providers.find(p => p.id === id);
      if (!provider) return null;

      const ratingInfo = ratingsData.ratings[id];
      return {
        ...provider,
        rating: ratingInfo?.rating || null,
        reviewCount: ratingInfo?.ratingCount || 0,
        reviews: ratingInfo?.reviews || []
      };
    },
    providers() {
      return providers.map(provider => {
        const ratingInfo = ratingsData.ratings[provider.id];
        return {
          ...provider,
          rating: ratingInfo?.rating || null,
          reviewCount: ratingInfo?.ratingCount || 0,
          reviews: ratingInfo?.reviews || []
        };
      });
    }
  },
  provider_records: {
    __resolveReference(reference: { id: string }) {
      const provider = providers.find(p => p.id === reference.id);
      if (!provider) return null;

      const ratingInfo = ratingsData.ratings[reference.id];
      return {
        ...provider,
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
