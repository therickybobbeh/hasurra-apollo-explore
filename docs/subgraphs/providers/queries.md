# Providers Subgraph Query Examples

Query examples for the federated Provider type with ratings and reviews.

---

## Provider Queries

### Get All Providers with Ratings

```graphql
query GetAllProvidersWithRatings {
  providers {
    id
    name
    specialty
    npi
    rating
    ratingCount
    reviews {
      id
      rating
      comment
      date
    }
  }
}
```

**Response**:
```json
{
  "data": {
    "providers": [
      {
        "id": "734f3a5e-9c71-4e3f-a2e3-7b8d1e9c6f1a",
        "name": "Dr. Sarah Johnson",
        "specialty": "Cardiology",
        "npi": "1234567890",
        "rating": 4.7,
        "ratingCount": 124,
        "reviews": [
          {
            "id": "rev-001",
            "rating": 5,
            "comment": "Excellent care and bedside manner",
            "date": "2024-01-15"
          }
        ]
      }
    ]
  }
}
```

---

### Get Single Provider by ID

```graphql
query GetProviderById($id: ID!) {
  provider(id: $id) {
    id
    name
    specialty
    npi
    rating
    ratingCount
    reviews(limit: 5) {
      rating
      comment
      date
    }
  }
}
```

Variables:
```json
{
  "id": "734f3a5e-9c71-4e3f-a2e3-7b8d1e9c6f1a"
}
```

**Note**: The `provider(id:)` query is defined in the subgraph resolver.

---

### Get Providers with High Ratings

```graphql
query GetTopRatedProviders {
  providers {
    name
    specialty
    rating
    ratingCount
  }
}
```

**Note**: Filtering by rating would require adding a `where` argument to the `providers` resolver. Currently returns all providers sorted by data source order.

---

### Get Provider Reviews Only

```graphql
query GetProviderReviews($providerId: ID!) {
  provider(id: $providerId) {
    id
    name
    reviews {
      id
      rating
      comment
      date
    }
  }
}
```

---

## Federation Queries (Through Gateway)

These queries demonstrate how the gateway combines Hasura and Providers subgraphs.

### Provider with Database Record

Query both `provider_records` (Hasura) and `providers` (federated):

```graphql
query CompareProviderSources($id: uuid!) {
  # From Hasura (database)
  hasura_provider: provider_records_by_pk(id: $id) {
    id
    name
    specialty
    npi
    phone
    email
  }

  # From Providers subgraph (federated)
  federated_provider: provider(id: $id) {
    id
    name
    specialty
    npi
    rating
    ratingCount
    reviews {
      rating
      comment
    }
  }
}
```

**Use case**: Comparing database record with enriched federated data.

---

### Claims with Provider Ratings

Combine claims (Hasura) with provider ratings (Providers subgraph):

```graphql
query ClaimsWithProviderRatings {
  claims(limit: 10, order_by: { service_date: desc }) {
    id
    status
    cpt
    billed_amount

    member {
      first_name
      last_name
    }

    # Provider from database (Hasura)
    provider_record {
      id
      name
      specialty
    }
  }

  # Then separately get ratings for those providers
  providers {
    id
    name
    rating
    ratingCount
  }
}
```

**Future Enhancement**: If `provider_record` type could be extended, we could add `rating` directly to it. But due to Hasura limitation, we query separately and join client-side.

---

## Example: Client-Side Data Merging

Since Hasura types can't be extended, merge data client-side:

```typescript
// Fetch claims with provider records
const { data: claimsData } = useQuery(GET_CLAIMS);

// Fetch provider ratings
const { data: providersData } = useQuery(GET_PROVIDERS_WITH_RATINGS);

// Merge on client
const claimsWithRatings = claimsData.claims.map(claim => {
  const providerRating = providersData.providers.find(
    p => p.id === claim.provider_record.id
  );

  return {
    ...claim,
    provider_record: {
      ...claim.provider_record,
      rating: providerRating?.rating,
      ratingCount: providerRating?.ratingCount,
    },
  };
});
```

---

## Provider Ratings Analytics

### Average Rating Across All Providers

```graphql
query GetAverageProviderRating {
  providers {
    rating
    ratingCount
  }
}
```

**Client-side calculation**:
```typescript
const { data } = useQuery(GET_PROVIDERS);
const totalRating = data.providers.reduce((sum, p) => sum + (p.rating || 0), 0);
const avgRating = totalRating / data.providers.length;
```

---

### Providers by Specialty with Ratings

```graphql
query GetProvidersBySpecialty {
  providers {
    name
    specialty
    rating
    ratingCount
  }
}
```

**Client-side grouping**:
```typescript
const providersBySpecialty = _.groupBy(data.providers, 'specialty');
```

---

## Federation Entity Resolution Example

### How Gateway Resolves Provider Entities

When another subgraph references `Provider`, the gateway calls:

```graphql
query($_representations: [_Any!]!) {
  _entities(representations: $_representations) {
    ... on Provider {
      id
      name
      specialty
      npi
      rating
      ratingCount
      reviews {
        id
        rating
        comment
        date
      }
    }
  }
}
```

**Variables**:
```json
{
  "_representations": [
    {
      "__typename": "Provider",
      "id": "734f3a5e-9c71-4e3f-a2e3-7b8d1e9c6f1a"
    },
    {
      "__typename": "Provider",
      "id": "2b5c8d9e-4a3f-11ef-9c1b-0242ac120002"
    }
  ]
}
```

**Resolver** (`app/server/src/index.ts`):
```typescript
Provider: {
  __resolveReference(reference: { id: string }) {
    const provider = providers.find(p => p.id === reference.id);
    const ratingInfo = ratingsData.ratings[reference.id];

    if (!provider) {
      return {
        id: reference.id,
        rating: null,
        ratingCount: 0,
        reviews: [],
      };
    }

    return {
      ...provider,
      ...ratingInfo,
    };
  }
}
```

---

## Future Enhancements

### Add Filtering

Update resolver to support filtering:

```typescript
Query: {
  providers(_, args) {
    let filtered = providers;

    if (args.where?.specialty) {
      filtered = filtered.filter(p =>
        p.specialty.toLowerCase().includes(args.where.specialty.toLowerCase())
      );
    }

    if (args.where?.minRating) {
      filtered = filtered.filter(p => {
        const rating = ratingsData.ratings[p.id]?.rating || 0;
        return rating >= args.where.minRating;
      });
    }

    return filtered;
  }
}
```

Schema:
```graphql
type Query {
  providers(where: ProviderWhereInput): [Provider!]!
}

input ProviderWhereInput {
  specialty: String
  minRating: Float
}
```

---

### Add Mutations

Add ability to submit reviews:

```graphql
type Mutation {
  addProviderReview(input: AddReviewInput!): Provider!
}

input AddReviewInput {
  providerId: ID!
  rating: Int!
  comment: String
}
```

Resolver:
```typescript
Mutation: {
  addProviderReview(_, { input }) {
    const newReview = {
      id: `rev-${Date.now()}`,
      providerId: input.providerId,
      rating: input.rating,
      comment: input.comment,
      date: new Date().toISOString().split('T')[0],
    };

    ratingsData.ratings[input.providerId].reviews.push(newReview);

    // Recalculate average rating
    const reviews = ratingsData.ratings[input.providerId].reviews;
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    ratingsData.ratings[input.providerId].rating = avgRating;
    ratingsData.ratings[input.providerId].ratingCount = reviews.length;

    return {
      id: input.providerId,
      ...providers.find(p => p.id === input.providerId),
      ...ratingsData.ratings[input.providerId],
    };
  }
}
```

---

### Connect to Real Database

Replace mock data with PostgreSQL/MongoDB:

```typescript
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const resolvers = {
  Query: {
    async providers() {
      const result = await pool.query(`
        SELECT
          p.id,
          p.name,
          p.specialty,
          p.npi,
          AVG(r.rating) as rating,
          COUNT(r.id) as rating_count
        FROM providers p
        LEFT JOIN reviews r ON r.provider_id = p.id
        GROUP BY p.id
      `);
      return result.rows;
    }
  }
};
```

---

## Next Steps

- **[Providers Overview](./overview.md)** - Architecture and federation details
- **[Hasura Queries](../hasura/queries.md)** - Database operations
- **[Federation Guide](../../../DOCUMENTS/FEDERATION_GUIDE.md)** - Deep dive into Apollo Federation

