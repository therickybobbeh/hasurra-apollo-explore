# ClaimSight API Documentation

Welcome to the ClaimSight GraphQL API documentation!

---

## Quick Links

- **[Getting Started](./guides/getting-started.md)** - Your first queries and authentication setup
- **[Common Patterns](./guides/common-patterns.md)** - Filtering, pagination, aggregation
- **[Authentication](./guides/authentication.md)** - Role-based access control and RLS
- **[API Reference](./api/index.html)** - Complete auto-generated API documentation (Stripe-style)

---

## Documentation Structure

### 📖 Guides (Hand-Written)

| Guide | Description |
|-------|-------------|
| **[getting-started.md](./guides/getting-started.md)** | First queries, endpoints, basic operations |
| **[common-patterns.md](./guides/common-patterns.md)** | Filtering, sorting, pagination, aggregations |
| **[authentication.md](./guides/authentication.md)** | Roles (admin, member, provider), RLS policies |

### 🏢 Subgraphs (Domain-Organized, Google Cloud Style)

#### Hasura Subgraph - Database Operations

| Document | Description |
|----------|-------------|
| **[hasura/overview.md](./subgraphs/hasura/overview.md)** | Architecture, entities (Members, Claims, etc.) |
| **[hasura/queries.md](./subgraphs/hasura/queries.md)** | Domain-specific query examples |

**Entities**: Members, Claims, Eligibility Checks, Notes, Provider Records

#### Providers Subgraph - Federated Ratings

| Document | Description |
|----------|-------------|
| **[providers/overview.md](./subgraphs/providers/overview.md)** | Federation architecture, `@key` directive |
| **[providers/queries.md](./subgraphs/providers/queries.md)** | Provider rating query examples |

**Features**: Provider ratings, reviews, entity resolution

### 🎨 API Reference (Auto-Generated)

**Location**: `./api/index.html`

Auto-generated from GraphQL schema using SpectaQL. Features:
- ✅ Stripe-style two-panel layout
- ✅ Searchable schema
- ✅ Interactive examples
- ✅ Federation-aware (shows `@key`, `@external` directives)

**How to generate**:
```bash
# Start gateway first
npm run federated:dev

# In another terminal
npm run docs:generate

# View docs
npm run docs:serve
```

---

## Quick Start

### 1. View Documentation Locally

```bash
# Serve docs on http://localhost:8081
npm run docs:serve
```

### 2. Regenerate API Reference

```bash
# Make sure gateway is running (port 4000)
npm run federated:dev

# Generate docs
npm run docs:generate
```

### 3. Explore Interactively

Open Apollo Studio Sandbox:
```
http://localhost:4000/graphql
```

---

## Industry Best Practices

This documentation follows patterns from:

- ✅ **Stripe** - Two-panel layout, auto-populated examples
- ✅ **Google Cloud** - Domain organization, clear guides
- ✅ **Twilio** - Beginner-friendly, excellent examples

See [API_DOCUMENTATION_GUIDE.md](../DOCUMENTS/API_DOCUMENTATION_GUIDE.md) for complete details.

---

## Navigation Tips

### For New Developers

1. Start with **[Getting Started](./guides/getting-started.md)**
2. Read **[Common Patterns](./guides/common-patterns.md)**
3. Explore **[Hasura Queries](./subgraphs/hasura/queries.md)** for examples
4. Check **[API Reference](./api/index.html)** for complete schema

### For API Integration

1. Review **[Authentication](./guides/authentication.md)** for access control
2. Browse **[API Reference](./api/index.html)** for complete type definitions
3. Copy examples from **[Hasura Queries](./subgraphs/hasura/queries.md)**
4. Test queries in Apollo Studio Sandbox

### For Federation Understanding

1. Read **[Providers Overview](./subgraphs/providers/overview.md)** for federation architecture
2. Study **[Providers Queries](./subgraphs/providers/queries.md)** for entity resolution examples
3. See **[Federation Guide](../DOCUMENTS/FEDERATION_GUIDE.md)** for deep dive

---

## Contributing

Found an issue or want to improve the docs?

### Update Hand-Written Guides

Edit markdown files in `docs/guides/` or `docs/subgraphs/` directly.

### Update API Reference

1. Change your GraphQL schema (typeDefs in subgraphs or Hasura metadata)
2. Regenerate: `npm run docs:generate`
3. Review changes in `docs/api/index.html`

### Add Examples

Edit `spectaql-config.yml` → `examples` section, then regenerate.

---

## Deployment

### GitHub Pages

```bash
# Enable GitHub Pages in repo settings
# Point to /docs folder
```

### Vercel/Netlify

```bash
# Deploy docs/ directory
vercel --prod docs/
```

### Alongside Frontend

```bash
# Copy to React public folder
cp -r docs/ app/client/public/docs/
# Access at: /docs/
```

---

## Resources

- **[API_DOCUMENTATION_GUIDE.md](../DOCUMENTS/API_DOCUMENTATION_GUIDE.md)** - Complete documentation strategy
- **[FEDERATION_GUIDE.md](../DOCUMENTS/FEDERATION_GUIDE.md)** - Apollo Federation deep dive
- **[SpectaQL GitHub](https://github.com/anvilco/spectaql)** - Documentation tool
- **[GraphQL Voyager](https://github.com/graphql-kit/graphql-voyager)** - Visual schema explorer

---

**Happy exploring!** 🚀📚
