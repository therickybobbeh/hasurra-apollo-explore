# ClaimSight GraphQL Labs

**Learn GraphQL, Federation, and AI Integration** through hands-on cloud deployment labs.

This learning path takes you from GraphQL basics to advanced federation and AI-powered queries in 8 progressive labs. Each lab builds real cloud infrastructure demonstrating polyglot microservices.

📊 **[Database Schema Evolution](../DOCUMENTS/DATABASE_SCHEMA_EVOLUTION.md)** - Visual ER diagram showing how the schema evolves across all 8 phases

---

## 🎯 Learning Path Overview

```
Phase 1 (30 min)          Phase 2 (45 min)          Phase 3 (1 hr)            Phase 4 (45 min)
┌────────────────┐       ┌────────────────┐       ┌────────────────┐       ┌────────────────┐
│  Hasura Cloud  │  -->  │     Apollo     │  -->  │  Apollo Server │  -->  │   Add Apollo   │
│   + Neon DB    │       │   Federation   │       │  from Scratch  │       │      to        │
│                │       │                │       │                │       │   Federation   │
│   GraphQL      │       │   Supergraph   │       │ Manual Schema  │       │  3-Subgraph    │
│   Basics       │       │   Stitching    │       │   Node.js      │       │  Integration   │
└────────────────┘       └────────────────┘       └────────────────┘       └────────────────┘
      REQUIRED                REQUIRED                 REQUIRED                 REQUIRED

Phase 5 (1 hr)            Phase 6 (45 min)          Phase 7 (2-3 hrs)         Phase 8 (1-2 hrs)
┌────────────────┐       ┌────────────────┐       ┌────────────────┐       ┌────────────────┐
│  Spring Boot   │  -->  │ Add Spring Boot│       │  Hasura DDN    │       │   PromptQL +   │
│    GraphQL     │       │      to        │       │   Migration    │       │   AI Queries   │
│                │       │   Federation   │       │                │       │                │
│ Manual Schema  │       │  4-Subgraph    │       │  Connectors    │       │   OpenAI/      │
│     Java       │       │  Polyglot      │       │  Metadata v3   │       │   Anthropic    │
└────────────────┘       └────────────────┘       └────────────────┘       └────────────────┘
      REQUIRED                REQUIRED                 OPTIONAL                 OPTIONAL
```

**Core Path:** Phase 1-6 (Required - full polyglot federation: Go + Node.js + Java)
**Advanced Options:** Phase 7 (DDN) OR Phase 8 (AI) or both!
**Integration Challenge:** Complete all 8 phases for production-ready architecture

---

## 📍 Phase 1: Hasura Cloud Basics

**🎓 What You'll Learn:**
- Auto-generating GraphQL from PostgreSQL tables
- GraphQL queries, mutations, and subscriptions
- Row-level security and permissions
- Cloud database management with Neon

**🏗️ What You'll Build:**
- Hasura Cloud project with free PostgreSQL database
- GraphQL API for healthcare data (members, claims, providers)
- Sample data seeded and ready to query

**⏱️ Time:** 30 minutes
**💰 Cost:** FREE (Hasura Cloud + Neon free tiers)
**🔧 Difficulty:** 🟢 Beginner

**📖 Lab Guide:** [phase-1-hasura-cloud/README.md](./phase-1-hasura-cloud/README.md)

### Testing Your Work:
```graphql
query GetMembers {
  members {
    id
    first_name
    last_name
    claims {
      cpt
      status
      charge_cents
    }
  }
}
```

**✅ Checkpoint:** You have a working GraphQL API in the cloud!

---

## 📍 Phase 2: Apollo GraphOS Federation

**🎓 What You'll Learn:**
- Why GraphQL federation matters (multiple teams, multiple services)
- Apollo Federation directives (`@key`, `@external`, `@extends`)
- Entity resolution across subgraphs
- Supergraph composition and deployment

**🏗️ What You'll Build:**
- Apollo GraphOS account with managed supergraph
- Hasura Cloud as a federated subgraph
- Custom Node.js Providers subgraph (with ratings data)
- Unified API combining both subgraphs

**⏱️ Time:** 45 minutes
**💰 Cost:** FREE (Apollo GraphOS free tier)
**🔧 Difficulty:** 🟡 Intermediate

**📖 Lab Guide:** [phase-2-apollo-federation/README.md](./phase-2-apollo-federation/README.md)

**Prerequisites:** Complete Phase 1

### Testing Your Work:
```graphql
query FederatedProviders {
  provider_records(limit: 5) {
    id
    name              # From Hasura subgraph
    specialty         # From Hasura subgraph
    rating            # From Providers subgraph 🎉
    reviewCount       # From Providers subgraph 🎉
    reviews {
      rating
      comment
    }
  }
}
```

**✅ Checkpoint:** You understand GraphQL federation and can combine multiple data sources!

---

## 📍 Phase 3: Apollo Server from Scratch

**🎓 What You'll Learn:**
- Building GraphQL APIs manually (code-first approach)
- Writing GraphQL schemas and resolvers from scratch
- Direct database access with node-postgres
- Key differences between Hasura (database-first) and Apollo (code-first)
- Manual query optimization and SQL control

**🏗️ What You'll Build:**
- Standalone Appointments Service with Apollo Server
- Custom GraphQL schema for appointments and billing
- Manual resolvers with raw SQL queries
- PostgreSQL connection with connection pooling
- New database in Neon for appointments data

**⏱️ Time:** 1 hour
**💰 Cost:** FREE (uses existing Neon account)
**🔧 Difficulty:** 🟡 Intermediate

**📖 Lab Guide:** [phase-3-apollo-server/README.md](./phase-3-apollo-server/README.md)

**Prerequisites:** Complete Phase 1 + Phase 2

### Testing Your Work:
```graphql
query GetAppointments {
  appointments {
    id
    appointment_date
    status
    notes
  }
}

mutation CreateAppointment {
  createAppointment(input: {
    member_id: "550e8400-e29b-41d4-a716-446655440000"
    provider_id: "bc6630ae-d320-4693-906a-9ab0c7f7eb51"
    appointment_date: "2025-11-15T10:00:00Z"
    notes: "Annual checkup"
  }) {
    id
    status
  }
}
```

**✅ Checkpoint:** You can build GraphQL APIs manually and understand the tradeoffs vs Hasura!

---

## 📍 Phase 4: Add Appointments to Federation

**🎓 What You'll Learn:**
- Enabling Apollo Federation on existing Apollo Server
- Federation directives (`@key`, `@extends`, `@external`)
- Entity reference resolvers (`__resolveReference`)
- Cross-subgraph relationships
- Querying across 3 services through unified gateway

**🏗️ What You'll Build:**
- Enable federation on Appointments service
- Add entity relationships (Appointment → Member, Provider)
- Update gateway to include appointments subgraph
- Cross-subgraph queries spanning all 3 services
- Unified query experience

**⏱️ Time:** 45 minutes
**💰 Cost:** FREE
**🔧 Difficulty:** 🟡 Intermediate

**📖 Lab Guide:** [phase-4-add-to-federation/README.md](./phase-4-add-to-federation/README.md)

**Prerequisites:** Complete Phase 1 + Phase 2 + Phase 3

### Testing Your Work:
```graphql
query AppointmentsWithDetails {
  appointments {
    id
    appointment_date
    status
    # Cross-subgraph to Hasura
    member {
      first_name
      last_name
    }
    # Cross-subgraph to Hasura + Providers
    provider {
      name
      specialty
      rating
      reviewCount
    }
  }
}
```

**✅ Checkpoint:** You can build and federate custom GraphQL services!

---

## 📍 Phase 5: Spring Boot GraphQL

**🎓 What You'll Learn:**
- Building GraphQL APIs with Spring Boot and Java
- Schema-first vs code-first GraphQL development
- JPA/Hibernate for database access
- Spring Boot GraphQL auto-configuration
- Comparing Spring Boot vs Apollo Server approaches

**🏗️ What You'll Build:**
- Medications Service with Spring Boot GraphQL
- Manual GraphQL schema design (schema-first)
- JPA entities and repositories
- GraphQL resolvers with Spring annotations
- PostgreSQL integration with Spring Data JPA

**⏱️ Time:** 1 hour
**💰 Cost:** FREE (uses existing Neon account)
**🔧 Difficulty:** 🟡 Intermediate

**📖 Lab Guide:** [phase-5-spring-boot-graphql/README.md](./phase-5-spring-boot-graphql/README.md)

**Prerequisites:** Complete Phase 1 + Phase 2 + Phase 3 + Phase 4

### Why Spring Boot?
- **Enterprise-ready:** Industry standard for Java microservices
- **Type-safe:** Compile-time validation with Java
- **Ecosystem:** Leverage Spring's vast ecosystem
- **Polyglot federation:** Demonstrate cross-language GraphQL

**✅ Checkpoint:** You can build GraphQL APIs with Java and Spring Boot!

---

## 📍 Phase 6: Add Spring Boot to Federation

**🎓 What You'll Learn:**
- Enabling Apollo Federation on Spring Boot GraphQL
- Apollo Federation Java library integration
- Entity reference resolvers in Spring Boot
- Cross-subgraph queries (Go + Node.js + Java)
- Polyglot microservices architecture

**🏗️ What You'll Build:**
- Enable federation on Medications service
- Add `@key`, `@extends`, `@external` directives
- Implement entity resolvers for Member and Provider
- Update gateway to include 4th subgraph
- Query medications with cross-subgraph member/provider data

**⏱️ Time:** 45 minutes
**💰 Cost:** FREE
**🔧 Difficulty:** 🟡 Intermediate

**📖 Lab Guide:** [phase-6-add-spring-boot-to-federation/README.md](./phase-6-add-spring-boot-to-federation/README.md)

**Prerequisites:** Complete Phase 1 + Phase 2 + Phase 3 + Phase 4 + Phase 5

### Testing Your Work:
```graphql
query PrescriptionsWithMembers {
  prescriptions {
    id
    medicationName
    dosage
    # Cross-subgraph to Hasura
    member {
      first_name
      last_name
      dob
    }
  }
}
```

**✅ Checkpoint:** You have a 4-subgraph polyglot federation (Go + Node.js + Node.js + Java)!

---

## 📍 Phase 7: Hasura DDN Migration (Advanced)

**🎓 What You'll Learn:**
- Hasura DDN (Data Delivery Network) architecture
- Connector-based data access vs direct database
- Metadata-driven development (v3 vs v2)
- CLI-first workflow for modern CI/CD
- Rebuilding Apollo Federation with DDN subgraph

**🏗️ What You'll Build:**
- Hasura DDN project with PostgreSQL connector
- Migrate metadata from Hasura Cloud v2 to DDN v3
- Deploy to Hasura DDN cloud
- Integrate DDN as Apollo Federation subgraph

**⏱️ Time:** 2-3 hours
**💰 Cost:** FREE (Hasura DDN free tier)
**🔧 Difficulty:** 🔴 Advanced

**📖 Lab Guide:** [phase-7-hasura-ddn/README.md](./phase-7-hasura-ddn/README.md)

**Prerequisites:** Complete Phase 1 + Phase 2 + Phase 3 + Phase 4

### Why DDN?
- **Modern architecture:** Connector-based, not limited to PostgreSQL
- **Multi-team CI/CD:** Modular metadata for team collaboration
- **Global performance:** Deploy to multiple regions automatically
- **Future-proof:** Hasura's next-generation platform

**✅ Checkpoint:** You've migrated to Hasura's next-gen platform!

---

## 📍 Phase 8: PromptQL + AI Integration (Advanced)

**🎓 What You'll Learn:**
- Natural language to SQL with LLMs (OpenAI/Anthropic)
- Query validation and SQL injection prevention
- Schema context building for accurate AI queries
- AI-powered data exploration UI patterns
- Cost management for LLM API calls

**🏗️ What You'll Build:**
- PromptQL Node.js service with OpenAI/Anthropic integration
- Query validation layer (SELECT only, no DROP/DELETE)
- Chat-style UI for natural language queries
- Deploy PromptQL service to Render.com
- Integration with existing Hasura Cloud setup

**⏱️ Time:** 1-2 hours
**💰 Cost:** ~$1-5 for API calls (OpenAI/Anthropic)
**🔧 Difficulty:** 🔴 Advanced

**📖 Lab Guide:** [phase-8-promptql/README.md](./phase-8-promptql/README.md)

**Prerequisites:** Complete Phase 1 + Phase 2 (Phases 3-6 optional)

### Example Prompts:
```
"Show me the top 5 denial reasons from last month"
"Find members with claims over $10,000"
"List providers with average rating above 4.5"
"Show me all pending claims for members on PPO plans"
```

**✅ Checkpoint:** You've built an AI-powered data query interface!

---

## 🎯 Recommended Learning Paths

### Path A: Core Federation Path (Recommended)
1. ✅ Phase 1: Hasura Cloud Basics (30 min)
2. ✅ Phase 2: Apollo Federation (45 min)
3. ✅ Phase 3: Apollo Server from Scratch (1 hr)
4. ✅ Phase 4: Add to Federation (45 min)
5. ✅ Phase 5: Spring Boot GraphQL (1 hr)
6. ✅ Phase 6: Add Spring Boot to Federation (45 min)

**Best for:** Understanding polyglot GraphQL federation end-to-end (Go + Node.js + Java)

---

### Path B: DDN Migration Focus
1. ✅ Phase 1: Hasura Cloud Basics (30 min)
2. ✅ Phase 2: Apollo Federation (45 min)
3. ✅ Phase 3: Apollo Server from Scratch (1 hr)
4. ✅ Phase 4: Add to Federation (45 min)
5. ✅ Phase 7: Hasura DDN Migration (2-3 hrs)

**Best for:** Learning modern GraphQL architecture with Hasura DDN

---

### Path C: AI Integration Focus
1. ✅ Phase 1: Hasura Cloud Basics (30 min)
2. ✅ Phase 2: Apollo Federation (45 min)
3. ✅ Phase 8: PromptQL + AI (1-2 hrs)

**Best for:** Learning AI-powered data access patterns

---

### Path D: Complete Mastery (Challenge Mode)
1. ✅ Phase 1: Hasura Cloud Basics (30 min)
2. ✅ Phase 2: Apollo Federation (45 min)
3. ✅ Phase 3: Apollo Server from Scratch (1 hr)
4. ✅ Phase 4: Add to Federation (45 min)
5. ✅ Phase 5: Spring Boot GraphQL (1 hr)
6. ✅ Phase 6: Add Spring Boot to Federation (45 min)
7. ✅ Phase 7: Hasura DDN Migration (2-3 hrs)
8. ✅ Phase 8: PromptQL + AI (1-2 hrs)
9. 🏆 **Integration Challenge:** Integrate all services (bonus)

**Best for:** Building complete production-ready architecture

---

## 🆚 Lab Comparison

| Feature | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Phase 5 | Phase 6 |
|---------|---------|---------|---------|---------|---------|---------|
| **Time** | 30 min | 45 min | 1 hr | 45 min | 2-3 hrs | 1-2 hrs |
| **Cost** | FREE | FREE | FREE | FREE | FREE | $1-5 |
| **Difficulty** | 🟢 Beginner | 🟡 Intermediate | 🟡 Intermediate | 🟡 Intermediate | 🔴 Advanced | 🔴 Advanced |
| **GraphQL Basics** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Manual Schema** | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| **Federation** | ❌ | ✅ | ❌ | ✅ | ✅ | ❌ |
| **Cloud Deploy** | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| **AI Integration** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Modern Architecture** | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Production Ready** | ⚠️ | ✅ | ⚠️ | ✅ | ✅ | ⚠️ |

---

## 📋 Prerequisites

### All Labs Require:
- **GitHub account** (free)
- **Node.js 18+** installed locally
- **npm or yarn** package manager
- **Basic terminal/command line** knowledge

### Phase-Specific:
- **Phase 1:** Hasura Cloud account (free)
- **Phase 2:** Apollo GraphOS account (free)
- **Phase 3:** Neon PostgreSQL account (free - reuse from Phase 1)
- **Phase 4:** All services from Phases 1-3 running
- **Phase 5:** Hasura DDN CLI installed
- **Phase 6:** OpenAI or Anthropic API key (~$5 credit to start)

---

## 🚀 Getting Started

**New to GraphQL?** Start here:

1. Read the main [README.md](../README.md) for project overview
2. Complete [Phase 1: Hasura Cloud](./phase-1-hasura-cloud/README.md)
3. Move to [Phase 2: Apollo Federation](./phase-2-apollo-federation/README.md)
4. Continue to [Phase 3: Apollo Server from Scratch](./phase-3-apollo-server/README.md)
5. Then [Phase 4: Add to Federation](./phase-4-add-to-federation/README.md)
6. Choose advanced path: Phase 5 (DDN) or Phase 6 (AI) or both!

---

## 📚 Resources

### Documentation
- [Hasura Cloud Docs](https://hasura.io/docs/latest/graphql/cloud/index.html)
- [Apollo Federation Docs](https://www.apollographql.com/docs/federation/)
- [Hasura DDN Docs](https://hasura.io/docs/3.0/index/)
- [OpenAI API Docs](https://platform.openai.com/docs/)
- [Anthropic API Docs](https://docs.anthropic.com/)

### Related Guides
- [Deployment Options](../deployment/README.md) - Production deployment strategies
- [Local Development](../deployment/local-lab/README.md) - Run everything locally

---

## 🏆 Bonus: Integration Challenge

**For learners who complete all 8 phases:**

Build a unified production system that integrates:
- Hasura DDN (Phase 7) as a modern data source
- Custom Appointments service (Phase 3 & 4) with manual schema
- Spring Boot Medications service (Phase 5 & 6) with JPA
- PromptQL (Phase 8) for natural language queries
- Apollo Federation to combine all subgraphs

**Benefits:**
- Modern DDN architecture with connector-based data access
- AI-powered natural language queries
- Mix of auto-generated and manual GraphQL schemas
- Polyglot microservices (Go, Node.js, Java)
- Federated data access across 4+ subgraphs
- Production-ready stack

---

## 🆘 Getting Help

**Stuck on a lab?**
1. Check the troubleshooting section in each lab's README
2. Review the [deployment troubleshooting guide](../deployment/README.md#-troubleshooting)
3. Open an issue on GitHub with the `help-wanted` tag

**Found a bug?**
- Open an issue with steps to reproduce
- Include error messages and logs
- Tag with the relevant phase (e.g., `phase-2`)

---

## 🎓 What's Next?

After completing the labs:

1. **Deploy to production** - Use [deployment guides](../deployment/) for Vercel, Render, or Azure
2. **Add authentication** - Implement JWT-based auth with Hasura session variables
3. **Implement security** - Add HIPAA-compliant RLS policies and audit logging
4. **Build custom features** - Extend the system with your own requirements
5. **Contribute back** - Share improvements via pull requests!

---

**Ready to start?** Begin with [Phase 1: Hasura Cloud Basics](./phase-1-hasura-cloud/README.md)!
