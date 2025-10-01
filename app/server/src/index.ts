/**
 * Apollo Federation Subgraph - Provider Ratings
 * Extends the Provider type with rating information
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

// GraphQL schema with federation directives
const typeDefs = gql`
  extend schema
    @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key", "@external"])

  type Provider @key(fields: "id") {
    id: ID! @external
    rating: Float
    ratingCount: Int
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

// Resolvers
const resolvers = {
  Provider: {
    __resolveReference(reference: { id: string }) {
      const rating = ratingsData.ratings[reference.id];
      return rating ? { id: reference.id, ...rating } : null;
    },
    rating(parent: any) {
      return parent.rating || null;
    },
    ratingCount(parent: any) {
      return parent.ratingCount || 0;
    },
    reviews(parent: any) {
      return parent.reviews || [];
    }
  }
};

// Build subgraph schema
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
