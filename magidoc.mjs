/**
 * Magidoc Configuration for ClaimSight API Documentation
 * Modern, beautiful GraphQL documentation generator
 * Docs: https://magidoc.js.org/
 */

export default {
  // GraphQL introspection configuration
  introspection: {
    type: 'url',
    url: 'http://localhost:4000/graphql',

    // Headers for authentication (Hasura admin secret)
    // NOTE: Update this to match your HASURA_GRAPHQL_ADMIN_SECRET from .env
    headers: {
      'x-hasura-admin-secret': 'claimsight_admin_secret_change_me',
      'x-hasura-role': 'admin',
    },
  },

  // Website generation configuration
  website: {
    // Template: carbon-multi-page is modern and clean
    // Other options: prism-multi-page, prism-single-page
    template: 'carbon-multi-page',

    // Output directory for generated documentation
    output: './docs/api',

    // Site options
    options: {
      appTitle: 'ClaimSight GraphQL API',
      appLogo: 'https://via.placeholder.com/150x50/6366f1/ffffff?text=ClaimSight',
      appFavicon: 'https://via.placeholder.com/32x32/6366f1/ffffff',

      // Site metadata
      siteMeta: {
        description: 'Federated GraphQL API for healthcare claims management',
        keywords: 'graphql, hasura, apollo federation, healthcare, claims',
      },

      // Pages configuration
      pages: [
        {
          title: 'Getting Started',
          content: `
# Getting Started with ClaimSight API

ClaimSight provides a **federated GraphQL API** for comprehensive healthcare claims management.

## Quick Start

### 1. Authentication

Include your admin secret in request headers:

\`\`\`http
x-hasura-admin-secret: your-secret-here
x-hasura-role: admin
\`\`\`

### 2. Choose an Endpoint

- **Development**: http://localhost:4000/graphql
- **Production**: https://claimsight-gateway.onrender.com/graphql

### 3. Make Your First Query

\`\`\`graphql
query GetMembers {
  members(limit: 10) {
    id
    first_name
    last_name
    dob
  }
}
\`\`\`

## Federation Architecture

This API uses **Apollo Federation** to combine multiple data sources:

- **Hasura** (Port 8080): Database operations (members, claims, eligibility)
- **Providers Subgraph** (Port 3002): Provider ratings using \`@key\` directive
- **Gateway** (Port 4000): Unified endpoint with entity resolution

## Next Steps

- Browse the **Schema** to see all available types and operations
- Check **Examples** for common query patterns
- Explore the **Queries** and **Mutations** tabs for complete API reference
          `,
        },
        {
          title: 'Examples',
          content: `
# Query Examples

## Get Member with Claims

\`\`\`graphql
query GetMemberWithClaims($memberId: uuid!) {
  members_by_pk(id: $memberId) {
    id
    first_name
    last_name
    dob
    claims {
      id
      status
      cpt
      billed_amount
      service_date
      provider_record {
        name
        specialty
        npi
      }
    }
  }
}
\`\`\`

Variables:
\`\`\`json
{
  "memberId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
}
\`\`\`

---

## Get Provider Ratings (Federation)

Query the federated Provider type that combines data from multiple services:

\`\`\`graphql
query GetProviderRatings {
  providers {
    id
    name
    specialty
    npi
    # Federation fields from ratings subgraph:
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
\`\`\`

**How it works**: Gateway fetches base Provider data, then enriches with ratings via entity resolution.

---

## Check Eligibility (Action)

Call a Hasura action to verify member eligibility:

\`\`\`graphql
mutation CheckEligibility($input: CheckEligibilityInput!) {
  checkEligibility(input: $input) {
    eligible
    reason
    coverageDetails {
      planName
      copay
      deductibleRemaining
    }
  }
}
\`\`\`

Variables:
\`\`\`json
{
  "input": {
    "memberId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "serviceDate": "2024-01-15",
    "cpt": "99213"
  }
}
\`\`\`

---

## Search Claims by Status

\`\`\`graphql
query SearchClaims($status: String!, $limit: Int = 20) {
  claims(
    where: { status: { _eq: $status } }
    limit: $limit
    order_by: { service_date: desc }
  ) {
    id
    cpt
    status
    billed_amount
    service_date
    member {
      first_name
      last_name
    }
  }

  claims_aggregate(where: { status: { _eq: $status } }) {
    aggregate {
      count
    }
  }
}
\`\`\`

Variables:
\`\`\`json
{
  "status": "pending",
  "limit": 20
}
\`\`\`
          `,
        },
        {
          title: 'Authentication',
          content: `
# Authentication & Authorization

ClaimSight uses **Row-Level Security (RLS)** and **Hasura roles** for access control.

## Available Roles

| Role | Access Level | Description |
|------|--------------|-------------|
| **admin** | Full access | System administrator |
| **member** | Own data only | Healthcare member/patient |
| **provider** | Assigned claims | Healthcare provider |

## Setting Your Role

Include headers in your GraphQL requests:

\`\`\`http
x-hasura-admin-secret: your-secret-here
x-hasura-role: member
x-hasura-user-id: user-uuid-here
\`\`\`

## Apollo Client Configuration

\`\`\`typescript
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const httpLink = createHttpLink({
  uri: 'http://localhost:4000/graphql',
});

const authLink = setContext((_, { headers }) => {
  return {
    headers: {
      ...headers,
      'x-hasura-admin-secret': process.env.VITE_HASURA_ADMIN_SECRET,
      'x-hasura-role': 'admin',
    },
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
\`\`\`

## Row-Level Security

Access is enforced at the **database level**:

- **Members** can only view their own claims
- **Providers** can only view claims assigned to them
- **Admins** have full access

All permissions are defined in PostgreSQL Row-Level Security (RLS) policies.
          `,
        },
      ],

      // Query generation options
      queryGenerationFactories: {
        // Provide example values for custom scalars (like uuid)
        'uuid': 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        'timestamptz': '2024-01-15T10:30:00Z',
        'date': '2024-01-15',
      },
    },
  },
}
