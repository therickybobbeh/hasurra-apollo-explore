# ClaimSight Subgraph - Provider Ratings

Apollo Federation subgraph that extends the `Provider` type with rating information.

## Purpose

This subgraph demonstrates Apollo Federation by adding `rating`, `ratingCount`, and `reviews` fields to the `Provider` entity that comes from Hasura.

## Running

```bash
npm install
npm run dev
```

The subgraph will run on http://localhost:3002/graphql

## Federation Setup

This is a **subgraph** meant to be composed with a **gateway**. In a complete setup:

1. Hasura serves the base `Provider` type
2. This subgraph extends it with ratings
3. An Apollo Gateway composes them into a unified graph

## Schema

```graphql
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
```

## Example Query (via Gateway)

```graphql
query GetProviderWithRating {
  providers_by_pk(id: "provider-1") {
    id
    name
    specialty
    rating          # From subgraph
    ratingCount     # From subgraph
    reviews {       # From subgraph
      rating
      comment
      date
    }
  }
}
```

## Data Source

Ratings are currently loaded from `src/ratings.json`. In production, this would query a real database or API.

## Setting Up a Gateway (Optional)

To set up an Apollo Gateway to compose this subgraph with Hasura:

1. Install gateway:
```bash
npm install @apollo/gateway
```

2. Create gateway server:
```typescript
import { ApolloGateway } from '@apollo/gateway';
import { ApolloServer } from '@apollo/server';

const gateway = new ApolloGateway({
  supergraphSdl: new IntrospectAndCompose({
    subgraphs: [
      { name: 'hasura', url: 'http://localhost:8080/v1/graphql' },
      { name: 'ratings', url: 'http://localhost:3002/graphql' }
    ]
  })
});

const server = new ApolloServer({ gateway });
```

3. Query the composed graph at the gateway URL

## Learn More

- [Apollo Federation Docs](https://www.apollographql.com/docs/federation/)
- [Subgraph Specification](https://www.apollographql.com/docs/federation/subgraph-spec/)
- [Hasura Federation](https://hasura.io/docs/latest/data-federation/apollo-federation/)
