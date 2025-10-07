# API Documentation Guide

Complete guide to ClaimSight's API documentation system, following industry best practices from Google Cloud, Stripe, and Twilio.

---

## Overview

ClaimSight provides **auto-generated, interactive API documentation** for its federated GraphQL API.

**Documentation Philosophy**:
- 📖 **Auto-generated** from GraphQL schemas (zero manual maintenance)
- 🎨 **Beautiful UI** inspired by Stripe and Google Cloud APIs
- 🔍 **Searchable** and interactive
- 📝 **Domain-organized** like Google Cloud (Claims, Members, Providers)
- 🚀 **Federation-aware** showing which subgraph owns what

---

## Industry Best Practices

### What We Learned From

#### 1. **Stripe** - The Gold Standard

- ✅ Two-panel layout (description left, code right)
- ✅ Auto-populated code samples with user's API keys
- ✅ Language switchers for multiple programming languages
- ✅ Excellent getting started guides
- ✅ Interactive API explorer

#### 2. **Google Cloud APIs**

- ✅ Resource-oriented documentation
- ✅ Clear API design guidelines
- ✅ Inline CommonMark formatting
- ✅ Domain organization (Compute, Storage, etc.)

#### 3. **Twilio**

- ✅ Beginner-friendly guides ("What's a REST API?")
- ✅ Two-panel style with great typography
- ✅ Comprehensive example library

### What We Implemented

| Feature | Stripe | Google Cloud | Twilio | ClaimSight |
|---------|--------|--------------|--------|------------|
| **Auto-generated docs** | ❌ | ✅ | ❌ | ✅ |
| **Two-panel layout** | ✅ | ❌ | ✅ | ✅ |
| **Domain organization** | ❌ | ✅ | ✅ | ✅ |
| **Interactive examples** | ✅ | ❌ | ✅ | ✅ |
| **Getting started guide** | ✅ | ✅ | ✅ | ✅ |
| **Federation-aware** | N/A | N/A | N/A | ✅ |

---

## Documentation Structure

```
docs/
├── api/                          # Auto-generated API reference (SpectaQL)
│   ├── index.html               # Main API docs page
│   ├── assets/                  # CSS, JS, images
│   └── [generated files]
│
├── guides/                      # Hand-written guides
│   ├── getting-started.md      # First queries, quick start
│   ├── common-patterns.md      # Filtering, pagination, aggregation
│   └── authentication.md       # Role-based access control, RLS
│
└── subgraphs/                  # Domain-specific docs (Google Cloud style)
    ├── hasura/                 # Database operations subgraph
    │   ├── overview.md        # Architecture, entities, features
    │   └── queries.md         # Members, Claims, Providers queries
    │
    └── providers/              # Federated ratings subgraph
        ├── overview.md        # Federation pattern, @key directive
        └── queries.md         # Provider rating queries

DOCUMENTS/
└── API_DOCUMENTATION_GUIDE.md  # This file
```

---

## Documentation Tools

### 1. Magidoc - Auto-Generated API Reference ⭐

**What it does**: Modern, beautiful GraphQL documentation generator built with Svelte/SvelteKit.

**Features**:
- ✅ Modern, sleek UI (much better looking than alternatives)
- ✅ Auto-documents all Types, Queries, Mutations, Subscriptions
- ✅ Fast fuzzy search
- ✅ Custom markdown pages built-in
- ✅ Federation-aware (shows `@key`, `@external` directives)
- ✅ Live hot-reload preview during development
- ✅ Multiple templates (carbon-multi-page, prism, etc.)

**Configuration**: `magidoc.mjs`

**Output**: `docs/api/`

### 2. GraphQL Voyager - Visual Schema Explorer

**What it does**: Interactive graph visualization of your GraphQL schema.

**Features**:
- ✅ Visual relationship mapping
- ✅ Interactive exploration
- ✅ Shows type connections
- ✅ Exportable as JSON/SDL

**Access**: http://localhost:4000/voyager (when running)

### 3. Apollo Studio - Schema Registry (Optional)

**What it does**: Cloud-based schema registry and monitoring for Apollo Federation.

**Features**:
- ✅ Schema versioning
- ✅ Query analytics
- ✅ Field usage tracking
- ✅ Performance monitoring

See [Federation Guide](./FEDERATION_GUIDE.md) for setup.

---

## Quick Start

### 1. Generate Documentation

```bash
# Make sure gateway is running (port 4000)
npm run gateway:dev

# In another terminal, generate docs
npm run docs:generate

# Preview with live hot-reload (recommended)
npm run docs:preview
# Opens browser to http://localhost:4001

# OR view static files
npm run docs:serve
# Opens browser to http://localhost:8081
```

### 2. View Documentation

**Option A**: Live preview (hot-reload)
```bash
npm run docs:preview
```

**Option B**: Static files
```bash
npm run docs:serve
# Then open http://localhost:8081/api
```

### 3. Explore Schema Visually

While gateway is running, visit:
```
http://localhost:4000/graphql
```

Use Apollo Studio Sandbox or GraphiQL to explore interactively.

---

## Setup Instructions

### Prerequisites

- Node.js 18+
- Federation gateway running (port 4000)
- Hasura running (port 8080)
- Providers subgraph running (port 3002)

### Install Dependencies

Already installed if you've run `npm install` in the root directory:

```bash
npm install --save-dev @magidoc/cli graphql-voyager
```

### Generate Documentation

```bash
# Start all federated services
npm run federated:dev

# In another terminal, generate API docs
npm run docs:generate
```

This runs:
```bash
magidoc generate
```

### Preview Documentation (Live Hot-Reload)

```bash
npm run docs:preview
```

Starts Magidoc's dev server at http://localhost:4001 with live hot-reload.

### Serve Documentation (Static)

```bash
npm run docs:serve
```

Opens a local web server at http://localhost:8081 serving the `docs/` directory.

---

## Configuration

### Magidoc Configuration

Edit `magidoc.mjs` to customize:

#### Introspection Endpoint

```javascript
export default {
  introspection: {
    type: 'url',
    url: 'http://localhost:4000/graphql',  // Federation gateway
    headers: {
      'x-hasura-admin-secret': 'claimsight_admin_secret_change_me',
      'x-hasura-role': 'admin',
    },
  },
  // ...
}
```

**Important**: Point to the **gateway** (port 4000), not Hasura directly, to get the complete federated schema.

#### Website Options

```javascript
website: {
  template: 'carbon-multi-page',  // Modern, clean template
  output: './docs/api',

  options: {
    appTitle: 'ClaimSight GraphQL API',
    appLogo: 'https://your-logo-url.com/logo.png',

    siteMeta: {
      description: 'Federated GraphQL API for healthcare claims management',
      keywords: 'graphql, hasura, apollo federation, healthcare',
    },
  },
}
```

#### Custom Pages

Add custom markdown pages directly in the config:

```javascript
website: {
  options: {
    pages: [
      {
        title: 'Getting Started',
        content: `
# Getting Started

Your markdown content here...

\`\`\`graphql
query Example {
  members { id }
}
\`\`\`
        `,
      },
    ],
  },
}
```

---

## Writing Documentation

### Philosophy

**Auto-generate where possible, hand-write where needed.**

- ✅ **Auto-generate**: Type definitions, field descriptions, schema structure
- ✍️ **Hand-write**: Getting started guides, tutorials, best practices

### Hand-Written Guides

#### docs/guides/getting-started.md

Target audience: **New developers**

Contents:
- Prerequisites
- First query walkthrough
- Authentication setup
- Basic CRUD operations

#### docs/guides/common-patterns.md

Target audience: **Intermediate developers**

Contents:
- Filtering techniques
- Pagination strategies
- Aggregation queries
- Mutation patterns
- Subscription examples

#### docs/guides/authentication.md

Target audience: **All developers**

Contents:
- Role-based access control
- Row-level security (RLS)
- Testing different roles
- Apollo Client configuration

### Domain-Specific Docs

#### docs/subgraphs/hasura/

**Purpose**: Document Hasura-specific entities and queries

Files:
- `overview.md` - Architecture, entities, generated operations
- `queries.md` - Domain queries (Members, Claims, Providers)

**Style**: Similar to Google Cloud API docs (organized by domain)

#### docs/subgraphs/providers/

**Purpose**: Document federated Provider type and federation pattern

Files:
- `overview.md` - Federation architecture, `@key` directive, entity resolution
- `queries.md` - Provider rating queries, federation examples

---

## Updating Documentation

### When Schema Changes

**Auto-regenerate**:
```bash
npm run docs:generate
```

Magidoc introspects the gateway and regenerates all API reference docs automatically.

**Live preview during development**:
```bash
npm run docs:preview
```

Magidoc watches for changes and auto-rebuilds with hot-reload!

### When Adding New Features

1. **Update schema** (typeDefs in subgraph or Hasura metadata)
2. **Regenerate docs**: `npm run docs:generate` (or use live preview)
3. **Update guides** (if new patterns introduced)
4. **Add custom pages** to `magidoc.mjs` → `website.options.pages`

### When Adding New Subgraphs

1. **Create subgraph directory**:
   ```
   docs/subgraphs/new-subgraph/
   ├── overview.md
   └── queries.md
   ```

2. **Document**:
   - Architecture and purpose
   - Types and fields
   - Example queries
   - Federation details (if using `@key`)

3. **Update** `spectaql-config.yml` to include new examples

4. **Regenerate**: `npm run docs:generate`

---

## Best Practices

### 1. Keep Examples Up-to-Date

❌ **Bad**: Hardcoded UUIDs that don't exist
```graphql
query {
  members_by_pk(id: "00000000-0000-0000-0000-000000000000") {
    id
  }
}
```

✅ **Good**: Use realistic UUIDs from seed data
```graphql
query {
  # UUID from hasura/seeds/default/members.sql
  members_by_pk(id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11") {
    id
  }
}
```

### 2. Document Federation Clearly

Always explain which subgraph owns which fields:

```markdown
## Provider Type (Federated)

**Fields**:
- `id`, `name`, `specialty`, `npi` - From database (via Hasura)
- `rating`, `ratingCount`, `reviews` - From Providers subgraph (federated via `@key`)
```

### 3. Provide Working Code Examples

All examples should be copy-pasteable and runnable:

```graphql
# ✅ Complete query with variables
query GetMemberWithClaims($memberId: uuid!) {
  members_by_pk(id: $memberId) {
    first_name
    last_name
  }
}

# Variables:
{
  "memberId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
}
```

### 4. Explain Business Logic

Don't just show queries, explain **why** and **when** to use them:

```markdown
### Check Eligibility (Action)

**Use case**: Before submitting a claim, verify the member is eligible for the service.

**When to call**: During pre-authorization or claim submission workflow.
```

### 5. Show Error Handling

```markdown
### Error Handling

```typescript
const { data, loading, error } = useQuery(GET_MEMBERS);

if (error) {
  console.error('GraphQL Error:', error.message);
  // Handle error appropriately
}
```
```

---

## Deployment

### Development

Documentation is generated locally and served via:
```bash
npm run docs:serve
```

### Production (Optional)

#### Option 1: GitHub Pages

```bash
# Build docs
npm run docs:generate

# Push docs/ directory to GitHub
git add docs/
git commit -m "Update API documentation"
git push

# Configure GitHub Pages to serve from /docs folder
```

#### Option 2: Vercel/Netlify

Deploy `docs/` directory as a static site:

**Vercel**:
```bash
vercel --prod docs/
```

**Netlify**:
```bash
netlify deploy --prod --dir=docs
```

#### Option 3: Alongside Frontend

Add docs to your React app:

```bash
# Copy docs to public folder
cp -r docs/ app/client/public/docs

# Access at: http://your-app.com/docs/api/
```

---

## GraphQL Documentation Tools Comparison

| Tool | Auto-Generate | Visual Explorer | UI Quality | Federation Support | Cost |
|------|---------------|----------------|-----------|-------------------|------|
| **Magidoc** ⭐ | ✅ | ✅ | ⭐⭐⭐⭐⭐ Modern | ✅ | Free |
| **Docusaurus + GraphQL** | ✅ | ❌ | ⭐⭐⭐⭐ Professional | ✅ | Free |
| **SpectaQL** | ✅ | ❌ | ⭐⭐⭐ Basic | ✅ | Free |
| **GraphQL Voyager** | N/A | ✅ | ⭐⭐⭐⭐ Visual | ✅ | Free |
| **ReadMe.io** | ✅ | ✅ | ⭐⭐⭐⭐⭐ Stripe-like | ✅ | $99/mo (free tier) |
| **Apollo Studio** | ✅ | ✅ | ⭐⭐⭐⭐ Cloud | ✅ | Free tier |

**Our Choice**: Magidoc + GraphQL Voyager
- ⭐ **Modern, beautiful UI** (Magidoc - Svelte-based)
- ⭐ **100% auto-generated** from schema
- ⭐ **Custom pages built-in**
- ⭐ **Live hot-reload preview**
- Visual schema exploration (Voyager)
- Both free and open-source

---

## FAQ

### Q: Do I need to regenerate docs after every schema change?

**A**: Yes, run `npm run docs:generate` after schema changes to update the API reference.

### Q: Can I customize the Magidoc theme?

**A**: Yes, Magidoc offers multiple templates (carbon-multi-page, prism-multi-page, etc.). Edit `magidoc.mjs` → `website.template`. See [Magidoc docs](https://magidoc.js.org/).

### Q: How do I add authentication to the generated docs?

**A**: Magidoc generates static HTML. For authentication, host docs behind a reverse proxy or use a docs platform like ReadMe or GitBook.

### Q: Why point to the gateway (port 4000) instead of Hasura (port 8080)?

**A**: The gateway has the **complete federated schema** (Hasura + Providers subgraph). Hasura alone only has database operations.

### Q: Can I use this with GraphQL Code Generator?

**A**: Yes! Add `@graphql-codegen/cli` to generate TypeScript types from the same schema:

```bash
npm install --save-dev @graphql-codegen/cli
```

---

## Troubleshooting

### "Gateway not responding"

**Problem**: `npm run docs:generate` fails with connection error

**Solution**:
1. Make sure gateway is running: `npm run gateway:dev`
2. Check `magidoc.mjs` → `introspection.url` points to `http://localhost:4000/graphql`
3. Verify admin secret in config matches `.env`

### "No documentation generated"

**Problem**: `docs/api/` folder is empty

**Solution**:
```bash
# Verify Magidoc is installed
npm list @magidoc/cli

# Re-install if needed
npm install --save-dev @magidoc/cli

# Run generation
npm run docs:generate
```

### "Missing custom pages"

**Problem**: Custom pages don't show up in documentation

**Solution**: Edit `magidoc.mjs` → `website.options.pages` and add your custom page:

```javascript
website: {
  options: {
    pages: [
      {
        title: 'My Custom Page',
        content: `
# My Custom Content

Your markdown here...
        `,
      },
    ],
  },
}
```

---

## Next Steps

1. **Generate docs**: `npm run docs:generate`
2. **Explore API reference**: Open `docs/api/index.html`
3. **Read guides**: Start with `docs/guides/getting-started.md`
4. **Add custom examples**: Edit `spectaql-config.yml`
5. **Deploy docs** (optional): GitHub Pages, Vercel, or alongside your app

---

## Resources

- 📖 [Magidoc Documentation](https://magidoc.js.org/)
- 📖 [Magidoc GitHub](https://github.com/magidoc-org/magidoc)
- 📖 [GraphQL Voyager](https://github.com/graphql-kit/graphql-voyager)
- 📖 [Apollo Studio](https://studio.apollographql.com/)
- 📖 [Google API Design Guide](https://cloud.google.com/apis/design)
- 📖 [Stripe API Docs](https://docs.stripe.com/api) (for inspiration)

---

**Happy documenting!** 📚🚀
