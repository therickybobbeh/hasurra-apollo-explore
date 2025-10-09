# ClaimSight GraphQL Labs

**Learn GraphQL, Federation, and AI Integration** through hands-on cloud deployment labs.

This learning path takes you from GraphQL basics to advanced federation and AI-powered queries in 4 progressive labs. Each lab builds real cloud infrastructure you can use for demos and learning.

---

## 🎯 Learning Path Overview

```
Phase 1 (30 min)          Phase 2 (45 min)          Phase 3 (2-3 hrs)         Phase 4 (1-2 hrs)
┌────────────────┐       ┌────────────────┐       ┌────────────────┐       ┌────────────────┐
│  Hasura Cloud  │  -->  │     Apollo     │  -->  │  Hasura DDN    │       │   PromptQL +   │
│   + Neon DB    │       │   Federation   │       │   Migration    │       │   AI Queries   │
│                │       │                │       │                │       │                │
│   GraphQL      │       │   Supergraph   │       │  Connectors    │       │   OpenAI/      │
│   Basics       │       │   Stitching    │       │  Metadata v3   │       │   Anthropic    │
└────────────────┘       └────────────────┘       └────────────────┘       └────────────────┘
      REQUIRED                REQUIRED                 OPTIONAL                 OPTIONAL
```

**Required Labs:** Phase 1 + Phase 2
**Optional Advanced:** Phase 3 OR Phase 4 (or both!)
**Integration Challenge:** Complete both Phase 3 & 4, then integrate them

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

## 📍 Phase 3: Hasura DDN Migration (Advanced)

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

**📖 Lab Guide:** [phase-3-hasura-ddn/README.md](./phase-3-hasura-ddn/README.md)

**Prerequisites:** Complete Phase 1 + Phase 2

### Why DDN?
- **Modern architecture:** Connector-based, not limited to PostgreSQL
- **Multi-team CI/CD:** Modular metadata for team collaboration
- **Global performance:** Deploy to multiple regions automatically
- **Future-proof:** Hasura's next-generation platform

**✅ Checkpoint:** You've migrated to Hasura's next-gen platform!

---

## 📍 Phase 4: PromptQL + AI Integration (Advanced)

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

**📖 Lab Guide:** [phase-4-promptql/README.md](./phase-4-promptql/README.md)

**Prerequisites:** Complete Phase 1 + Phase 2 (Phase 3 optional)

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

### Path A: Federation Focus (Most Popular)
1. ✅ Phase 1: Hasura Cloud Basics (30 min)
2. ✅ Phase 2: Apollo Federation (45 min)
3. ✅ Phase 3: Hasura DDN Migration (2-3 hrs)

**Best for:** Learning modern GraphQL federation architecture

---

### Path B: AI Integration Focus
1. ✅ Phase 1: Hasura Cloud Basics (30 min)
2. ✅ Phase 2: Apollo Federation (45 min)
3. ✅ Phase 4: PromptQL + AI (1-2 hrs)

**Best for:** Learning AI-powered data access patterns

---

### Path C: Complete Mastery (Challenge Mode)
1. ✅ Phase 1: Hasura Cloud Basics (30 min)
2. ✅ Phase 2: Apollo Federation (45 min)
3. ✅ Phase 3: Hasura DDN Migration (2-3 hrs)
4. ✅ Phase 4: PromptQL + AI (1-2 hrs)
5. 🏆 **Integration Challenge:** Integrate PromptQL with DDN (bonus)

**Best for:** Building complete production-ready architecture

---

## 🆚 Lab Comparison

| Feature | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|---------|---------|---------|---------|---------|
| **Time** | 30 min | 45 min | 2-3 hrs | 1-2 hrs |
| **Cost** | FREE | FREE | FREE | $1-5 |
| **Difficulty** | 🟢 Beginner | 🟡 Intermediate | 🔴 Advanced | 🔴 Advanced |
| **GraphQL Basics** | ✅ | ✅ | ✅ | ✅ |
| **Federation** | ❌ | ✅ | ✅ | ❌ |
| **Cloud Deploy** | ✅ | ✅ | ✅ | ✅ |
| **AI Integration** | ❌ | ❌ | ❌ | ✅ |
| **Modern Architecture** | ❌ | ✅ | ✅ | ✅ |
| **Production Ready** | ⚠️ | ✅ | ✅ | ⚠️ |

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
- **Phase 3:** Hasura DDN CLI installed
- **Phase 4:** OpenAI or Anthropic API key (~$5 credit to start)

---

## 🚀 Getting Started

**New to GraphQL?** Start here:

1. Read the main [README.md](../README.md) for project overview
2. Complete [Phase 1: Hasura Cloud](./phase-1-hasura-cloud/README.md)
3. Move to [Phase 2: Apollo Federation](./phase-2-apollo-federation/README.md)
4. Choose your path: Phase 3 (DDN) or Phase 4 (AI) or both!

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
- [Challenges](../DOCUMENTS/CHALLENGES.md) - Additional learning exercises

---

## 🏆 Bonus: Integration Challenge

**For learners who complete both Phase 3 AND Phase 4:**

Build a unified system that uses:
- Hasura DDN (Phase 3) as the data source
- PromptQL (Phase 4) for natural language queries
- Apollo Federation to combine DDN + PromptQL subgraph

**Benefits:**
- Modern DDN architecture
- AI-powered queries
- Federated data access
- Production-ready stack

**Guide:** See [Challenge 16: DDN + PromptQL Integration](../DOCUMENTS/CHALLENGES.md#challenge-16-ddn-promptql-integration)

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
2. **Add security** - Complete [Challenge 15: Security Hardening](../DOCUMENTS/CHALLENGES.md#challenge-15--security-hardening--hipaa-compliance)
3. **Build features** - Work through [other challenges](../DOCUMENTS/CHALLENGES.md)
4. **Contribute back** - Share improvements via pull requests!

---

**Ready to start?** Begin with [Phase 1: Hasura Cloud Basics](./phase-1-hasura-cloud/README.md)!
