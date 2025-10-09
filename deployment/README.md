# ClaimSight Deployment Guide

Complete guide to deploying ClaimSight to production using managed cloud services.

> **🎓 New to GraphQL?** Start with the [Learning Labs](../labs/) for step-by-step tutorials on Hasura Cloud, Apollo Federation, DDN, and PromptQL.

> **💻 Looking for local development?** See the [local-lab](./local-lab/) subdirectory for Docker and native PostgreSQL setup.

This guide focuses exclusively on **production deployment options**.

---

## 📋 Overview

This guide covers deploying ClaimSight's federated GraphQL stack using **100% free cloud services** - perfect for learning, demos, and temporary projects.

**Architecture Components:**
- **Hasura Cloud** - GraphQL engine + PostgreSQL (free tier includes database!)
- **Apollo Gateway** - Federation gateway (combines Hasura + custom subgraphs)
- **Providers Subgraph** - Custom Node.js GraphQL service (provider ratings)
- **React Frontend** - Client application with Apollo Client

**Deployment Philosophy:**
- 💰 **100% Free** - Complete stack costs $0/month
- 🎯 **Managed services** (Hasura Cloud, Apollo GraphOS, Vercel, Render.com)
- 🚀 **Quick to deploy** (<30 minutes for full stack)
- 🎓 **Perfect for learning** - No credit card required for most services
- 🔒 **Security by default** (see [Challenge 15: Security Hardening](../DOCUMENTS/CHALLENGES.md#challenge-15--security-hardening--hipaa-compliance))

---

## 🛤️ Deployment Paths

Choose the deployment path that fits your needs:

| Path | Best For | Time | Cost | Difficulty |
|------|----------|------|------|------------|
| **[Hasura Cloud + Vercel](#quick-start-hasura-cloud--vercel)** | Learning, MVPs, demos | 15 min | **Free** | 🟢 Easy |
| **[Hasura Cloud + Apollo GraphOS + Vercel](#recommended-managed-services)** | Full federated GraphQL | 30 min | **Free** | 🟡 Medium |
| **[Render.com Full Stack](#rendercom-full-stack)** | Simple all-in-one deployment | 20 min | **Free** ⭐ | 🟢 Easy |
| **[Azure Enterprise](#azure-enterprise-advanced)** | Enterprise, HIPAA compliance | 2-4 hrs | $264+/mo | 🔴 Advanced |

**💡 All free tier options** are perfect for learning and temporary deployments (lasting weeks to months). Services may sleep after 15 minutes of inactivity but wake up automatically on first request.

---

## 💰 Free Tier Limitations

All services below are **100% free** with these limitations:

| Service | Free Tier Includes | Limitations |
|---------|-------------------|-------------|
| **Hasura Cloud** | PostgreSQL database + GraphQL engine | 60 req/min, 100MB storage, 100MB data transfer/mo |
| **Render.com** | 750 hours/mo web services | Services sleep after 15 min inactivity (30s wake-up time) |
| **Vercel** | Unlimited static sites | 100GB bandwidth/mo |
| **Apollo GraphOS** | Schema registry + monitoring | Free for teams <10 people |

**Perfect for:**
- ✅ Learning GraphQL and federation
- ✅ Building MVPs and demos
- ✅ Temporary projects (lasting weeks to months)
- ✅ Portfolio projects

**Not ideal for:**
- ❌ High-traffic production apps (>60 req/min)
- ❌ Large datasets (>100MB)
- ❌ Apps requiring instant response (no cold starts)

---

## 🚀 Quick Start: Hasura Cloud + Vercel

**Deploy in 15 minutes** - Fastest way to get ClaimSight running in the cloud.

**Stack:**
- Hasura Cloud (managed Hasura **+ PostgreSQL** - database included FREE!)
- Vercel (React frontend)

**Cost: $0/month** ⭐

**Free Tier Includes:**
- Hasura Cloud: GraphQL engine + PostgreSQL database (60 req/min, 100MB storage)
- Vercel: Static hosting (100GB bandwidth, unlimited sites)

**Prerequisites:**
- GitHub account
- Hasura Cloud account (free)
- Vercel account (free)

### Step 1: Deploy Hasura to Hasura Cloud

See detailed guide: **[Phase 1: Hasura Cloud](../labs/phase-1-hasura-cloud/README.md)**

Quick version:
1. Visit https://cloud.hasura.io/
2. Click "New Project" → Choose region → Launch
3. Note your GraphQL endpoint: `https://your-project.hasura.app/v1/graphql`
4. Connect PostgreSQL database (auto-provisioned)
5. Apply metadata and migrations (see guide)

### Step 2: Deploy Frontend to Vercel

See detailed guide: **[vercel/README.md](./vercel/README.md)**

Quick version:
```bash
# Navigate to frontend directory
cd app/client

# Deploy with npx (no installation needed)
npx vercel --prod

# Set environment variables in Vercel dashboard
VITE_GRAPHQL_ENDPOINT=https://your-project.hasura.app/v1/graphql
VITE_HASURA_ADMIN_SECRET=your-admin-secret
```

**Result:** Frontend at `https://your-app.vercel.app` connected to Hasura Cloud.

**Limitations:**
- No Apollo Federation (single Hasura endpoint only)
- No custom subgraphs (Providers subgraph not deployed)
- Good for learning Challenges 1-6

---

## ⭐ Recommended: Managed Services

**Full federated stack with managed services** - Production-ready deployment with Apollo Federation.

**Stack:**
- Hasura Cloud (GraphQL engine **+ free PostgreSQL database**)
- Apollo GraphOS (schema registry + managed federation)
- Vercel (React frontend)
- Render.com (custom subgraphs + gateway)

**Cost: $0/month** ⭐

**Free Tier Includes:**
- Hasura Cloud: PostgreSQL database + GraphQL engine (60 req/min, 100MB storage)
- Apollo GraphOS: Schema registry + monitoring (free for teams <10 people)
- Render.com: Web services (750 hours/mo, services sleep after 15 min inactivity)
- Vercel: Static hosting (100GB bandwidth/mo)

**Time:** 30 minutes

### Architecture Diagram

```
┌─────────────┐
│   Vercel    │  React Frontend (Static)
│  (Frontend) │
└──────┬──────┘
       │
       │ GraphQL
       ▼
┌─────────────┐
│  Render.com │  Apollo Gateway (Node.js)
│  (Gateway)  │  Port: 4000
└──────┬──────┘
       │
       ├─────────────────┬──────────────────┐
       │                 │                  │
       ▼                 ▼                  ▼
┌──────────────┐  ┌─────────────┐  ┌──────────────┐
│ Hasura Cloud │  │ Render.com  │  │    Apollo    │
│  (Subgraph)  │  │ (Providers  │  │   GraphOS    │
│              │  │  Subgraph)  │  │   (Schema    │
│ PostgreSQL   │  │  Port: 3002 │  │   Registry)  │
└──────────────┘  └─────────────┘  └──────────────┘
```

### Deployment Steps

#### 1. Deploy Hasura to Hasura Cloud
See **[Phase 1: Hasura Cloud](../labs/phase-1-hasura-cloud/README.md)** for detailed steps.

#### 2. Deploy Providers Subgraph to Render.com
See **[render/providers-subgraph-guide.md](./render/providers-subgraph-guide.md)** for detailed steps.

Quick version:
```bash
# Push to GitHub
git add .
git commit -m "Ready for deployment"
git push

# Create new Web Service on Render.com
# - Connect GitHub repo
# - Root directory: app/server
# - Build command: npm install
# - Start command: npm start
# - Port: 3002
```

#### 3. Deploy Gateway to Render.com
See **[render/gateway-guide.md](./render/gateway-guide.md)** for detailed steps.

Set environment variables:
```bash
HASURA_ENDPOINT=https://your-project.hasura.app/v1/graphql
HASURA_ADMIN_SECRET=your-secret
PROVIDERS_SUBGRAPH_URL=https://your-subgraph.onrender.com
```

#### 4. Publish Schemas to Apollo GraphOS
See **[Phase 2: Apollo Federation](../labs/phase-2-apollo-federation/README.md)** for detailed steps.

```bash
# Install Rover CLI locally
npm install --save-dev @apollo/rover

# Publish Hasura subgraph
npx @apollo/rover subgraph publish YOUR_GRAPH_REF \
  --name hasura \
  --routing-url https://your-project.hasura.app/v1/graphql \
  --schema ./hasura-schema.graphql

# Publish Providers subgraph
npx @apollo/rover subgraph publish YOUR_GRAPH_REF \
  --name providers \
  --routing-url https://your-subgraph.onrender.com \
  --schema ./app/server/src/schema.graphql
```

#### 5. Deploy Frontend to Vercel
See **[vercel/README.md](./vercel/README.md)** for detailed steps.

Point frontend to gateway:
```bash
VITE_GRAPHQL_ENDPOINT=https://your-gateway.onrender.com/graphql
```

**Result:** Full federated GraphQL stack with Apollo Studio observability!

---

## 🎯 Render.com Full Stack

**All-in-one deployment** - Simplest option for self-hosting the complete stack.

**Stack:**
- Hasura Cloud (PostgreSQL database - **FREE!**)
- Render.com (Gateway + Providers subgraph)
- Vercel (React frontend) OR Render Static Site

**Cost: $0/month** ⭐

**Free Tier Includes:**
- Hasura Cloud: PostgreSQL database (100MB storage)
- Render.com: Web services (750 hours/mo, services sleep after 15 min inactivity)
- Vercel: Static hosting (100GB bandwidth/mo)

See detailed guide: **[render/README.md](./render/README.md)**

**Blueprint Deployment** (simplified):
1. Deploy Hasura to Hasura Cloud ([guide](../labs/phase-1-hasura-cloud/README.md))
2. Click "New Blueprint Instance" on Render.com
3. Connect GitHub repo
4. Review resources:
   - Gateway (Node.js)
   - Providers subgraph (Node.js)
   - Frontend (Static site, optional)
5. Set `DATABASE_URL` to Hasura Cloud's database connection string
6. Click "Apply"
7. Wait 3-5 minutes

**Configuration:** Use `render.yaml` (Infrastructure as Code)

---

## 🏢 Azure Enterprise (Advanced)

⚠️ **ENTERPRISE ONLY** - This deployment path costs **$264+/month** and is not suitable for learning or temporary projects. Use the free tier options above instead.

**Enterprise-grade deployment** for production environments requiring HIPAA compliance, VNets, and Azure services.

**Stack:**
- Azure Database for PostgreSQL (Flexible Server)
- Azure Container Apps (Hasura)
- Azure App Service (Gateway + Subgraphs)
- Azure Static Web Apps (React frontend)
- Azure Key Vault (secrets)
- Azure Application Insights (monitoring)

**Time:** 2-4 hours
**Cost:** $264+/month (varies by region/tier)
**Difficulty:** 🔴 Advanced

See detailed guide: **[azure/README.md](./azure/README.md)**

**Prerequisites:**
- Azure subscription
- Azure CLI installed
- Bicep or Terraform knowledge

**When to use Azure:**
- Enterprise requirements (SLA, support)
- HIPAA compliance mandatory
- Integration with existing Azure infrastructure
- Advanced networking (VNets, Private Endpoints)
- Active Directory integration

---

## 📊 Deployment Comparison

| Feature | Quick Start | Managed Services | Render.com | Azure |
|---------|-------------|------------------|------------|-------|
| **Setup Time** | 15 min | 30 min | 20 min | 2-4 hrs |
| **Monthly Cost** | **$0** ⭐ | **$0** ⭐ | **$0** ⭐ | $264+ |
| **Federation** | ❌ | ✅ | ✅ | ✅ |
| **Observability** | Basic | Apollo Studio ⭐ | Basic | Application Insights |
| **HIPAA Ready** | ❌ | ⚠️ (with BAA) | ⚠️ (with BAA) | ✅ |
| **Custom Domain** | ✅ | ✅ | ✅ | ✅ |
| **Auto-scaling** | ✅ | ✅ | Limited | ✅ |
| **SLA** | None | 99.9% | 99.9% | 99.95% |
| **Support** | Community | Email | Email | 24/7 (with plan) |
| **Service Sleep** | Yes (15min) | Yes (15min) | Yes (15min) | No |

---

## 🔒 Security Considerations

**Before deploying to production**, complete [Challenge 15: Security Hardening](../DOCUMENTS/CHALLENGES.md#challenge-15--security-hardening--hipaa-compliance).

### Minimum Security Requirements

- ✅ **JWT authentication** configured (not admin secret in production)
- ✅ **HTTPS/SSL** enforced on all endpoints
- ✅ **Environment variables** stored in secret management (not in code)
- ✅ **Rate limiting** enabled (100 req/min recommended)
- ✅ **Query depth limit** set (max 5 levels)
- ✅ **CORS** configured correctly (restrict origins)
- ✅ **Introspection** disabled in production
- ✅ **RLS policies** applied to all tables
- ✅ **Audit logging** enabled for ePHI access
- ✅ **Backups** automated and encrypted

### HIPAA Compliance

If handling Protected Health Information (PHI):

1. **Sign Business Associate Agreement (BAA)** with all service providers
   - Hasura Cloud: Available (contact sales)
   - Azure: Available (built-in)
   - Render.com: Available (Team plan+)
   - Vercel: Not available (use for public pages only)

2. **Enable encryption at rest and in transit** (all services)

3. **Configure audit logging** (6-year retention minimum)

4. **Implement zero-trust** (JWT + RLS + principle of least privilege)

5. **Test 72-hour restoration** requirement (2024 HIPAA rule)

See [Challenge 15: HIPAA Compliance Checklist](../DOCUMENTS/CHALLENGES.md#part-6-hipaa-compliance-checklist) for details.

---

## 🎓 Sequential Learning Path

Follow these phases in order to build understanding progressively:

---

### 📍 Phase 1: Single GraphQL Endpoint (Start Here!)
**Time:** 30 minutes | **Cost:** Free | **Difficulty:** 🟢 Beginner

**What You'll Build:**
- Hasura Cloud with Neon PostgreSQL database
- Auto-generated GraphQL API from database tables
- Sample data (members, claims, providers)

**What You'll Learn:**
- How Hasura auto-generates GraphQL from your database
- GraphQL queries, mutations, and subscriptions
- Row-level security and permissions

**Deployment Guide:** [Phase 1: Hasura Cloud](../labs/phase-1-hasura-cloud/README.md)

**Testing Your Work:**
```graphql
# Try this query in Hasura Console
query GetMembers {
  members {
    id
    first_name
    last_name
    claims {
      cpt
      status
    }
  }
}
```

**✅ Checkpoint:** You have a working GraphQL API! Continue when ready.

---

### 📍 Phase 2: GraphQL Federation (Add Second Service)
**Time:** 45 minutes | **Cost:** Free | **Difficulty:** 🟡 Intermediate

**What You'll Build:**
- Apollo GraphOS account with Supergraph
- Register Hasura Cloud as a federated subgraph
- Custom Providers subgraph (Node.js) with ratings/reviews
- Unified supergraph combining both services

**What You'll Learn:**
- Why federation matters (multiple teams, services)
- Apollo Federation directives (`@key`, `@extends`)
- Entity resolution across subgraphs
- Supergraph composition

**Deployment Guide:** [Phase 2: Apollo Federation](../labs/phase-2-apollo-federation/README.md)

**Before Starting:** Complete Phase 1 (you need working Hasura Cloud)

**Testing Your Work:**
```graphql
# Query data from BOTH subgraphs in one request!
query FederatedQuery {
  providerRecords {
    id
    name              # From Hasura subgraph
    rating            # From Providers subgraph 🎉
    reviewCount       # From Providers subgraph 🎉
  }
}
```

**✅ Checkpoint:** You understand GraphQL federation! Continue when ready.

---

### 📍 Phase 3: Production Deployment (Full Stack)
**Time:** 1-2 hours | **Cost:** Free | **Difficulty:** 🟡 Intermediate

**What You'll Build:**
- Apollo Gateway deployed to Render.com
- React frontend connected to gateway
- All services integrated and working together

**What You'll Learn:**
- Deploying Apollo Gateway
- Frontend integration with Apollo Client
- Environment configuration across services

**Deployment Guides:**
- [Render.com Full Stack](./render/README.md)
- [Vercel Frontend](./vercel/README.md)

**Before Starting:** Complete Phase 2 (you need Apollo GraphOS supergraph)

---

### 📍 Phase 4: Enterprise & Security (Optional - Advanced)
**Time:** 2-4 hours | **Cost:** $264+/mo | **Difficulty:** 🔴 Advanced

**What You'll Build:**
- Azure enterprise deployment
- HIPAA-compliant infrastructure
- Advanced monitoring and security

**What You'll Learn:**
- Enterprise-grade cloud architecture
- HIPAA compliance requirements
- Advanced security hardening

**Deployment Guide:** [Azure Enterprise](./azure/README.md)

**⚠️ Enterprise Only:** Requires Azure subscription and production use case

---

## 🚀 Quick Start Recommendation

**For Learning:** Start with Phase 1 → Phase 2 (100% free, ~1 hour total)

**For MVPs/Demos:** Complete Phase 1 → Phase 2 → Phase 3 (100% free)

**For Production:** All phases + [Challenge 15: Security Hardening](../DOCUMENTS/CHALLENGES.md#challenge-15--security-hardening--hipaa-compliance)

---

## 🛠️ Deployment Checklist

Use this checklist when deploying to any environment:

### Pre-Deployment
- [ ] Complete [Challenge 15: Security Hardening](../DOCUMENTS/CHALLENGES.md#challenge-15--security-hardening--hipaa-compliance)
- [ ] Run `npm audit fix` to patch vulnerabilities
- [ ] Test locally with `npm run federated:dev`
- [ ] Review environment variables (no hardcoded secrets)
- [ ] Update CORS allowed origins for production domain
- [ ] Generate API documentation: `npm run docs:generate`

### Database
- [ ] PostgreSQL database provisioned
- [ ] Migrations applied: `hasura migrate apply`
- [ ] Seed data loaded (if needed): `hasura seed apply`
- [ ] Metadata applied: `hasura metadata apply`
- [ ] RLS policies enabled and tested
- [ ] Backups configured (automated daily)

### Hasura
- [ ] Hasura deployed and accessible
- [ ] Admin secret set (never use default!)
- [ ] JWT secret configured
- [ ] Environment variables set correctly
- [ ] Console disabled in production (`HASURA_GRAPHQL_ENABLE_CONSOLE=false`)
- [ ] Query depth limit set (`HASURA_GRAPHQL_QUERY_DEPTH_LIMIT=5`)

### Subgraphs
- [ ] Providers subgraph deployed
- [ ] Health check endpoint working: `/health`
- [ ] Environment variables set correctly
- [ ] Apollo federation working (test `_entities` query)

### Gateway
- [ ] Apollo Gateway deployed
- [ ] All subgraphs reachable from gateway
- [ ] Health check endpoint working: `/health`
- [ ] CORS configured for frontend origin
- [ ] Rate limiting enabled
- [ ] GraphQL Armor installed and configured

### Frontend
- [ ] React app deployed
- [ ] Environment variables set (gateway URL)
- [ ] Apollo Client connected successfully
- [ ] Authentication flow tested (JWT)
- [ ] Role switcher working (admin/member/provider)

### Apollo GraphOS (Optional)
- [ ] Schemas published to registry
- [ ] Managed federation enabled
- [ ] Gateway reports metrics to Studio
- [ ] Schema checks passing

### Testing
- [ ] Basic query works: `{ members { id } }`
- [ ] Mutation works: Create note, claim
- [ ] Subscription works: Note updates
- [ ] Federation works: Provider with ratings
- [ ] Authentication works: JWT accepted, admin secret rejected
- [ ] Authorization works: Members see only their data
- [ ] Rate limiting works: 101st request blocked

### Monitoring
- [ ] Error logging configured
- [ ] Performance monitoring enabled (Apollo Studio or Application Insights)
- [ ] Alerts configured (errors, high latency)
- [ ] Uptime monitoring (UptimeRobot, Pingdom, etc.)

### Documentation
- [ ] API documentation published (see [Challenge 14](../DOCUMENTS/CHALLENGES.md#challenge-14-modern--auto-generated))
- [ ] Deployment runbook documented
- [ ] Incident response plan defined
- [ ] Team trained on deployment process

---

## 📚 Resources

### Learning Labs
- [Phase 1: Hasura Cloud](../labs/phase-1-hasura-cloud/README.md) - Deploy database + GraphQL
- [Phase 2: Apollo Federation](../labs/phase-2-apollo-federation/README.md) - Add federation
- [Phase 3: Hasura DDN](../labs/phase-3-hasura-ddn/README.md) - Migrate to DDN v3
- [Phase 4: PromptQL + AI](../labs/phase-4-promptql/README.md) - AI-powered queries

### Production Deployment Guides
- [Vercel Deployment](./vercel/README.md)
- [Render.com Deployment](./render/README.md)
- [Azure Enterprise Deployment](./azure/README.md)

### Local Development
- [Local Lab Setup](./local-lab/README.md) - Docker & native PostgreSQL setup for local development

### Official Documentation
- [Hasura Cloud Docs](https://hasura.io/docs/latest/graphql/cloud/index.html)
- [Apollo GraphOS Docs](https://www.apollographql.com/docs/graphos/)
- [Vercel Docs](https://vercel.com/docs)
- [Render.com Docs](https://render.com/docs)
- [Azure Docs](https://learn.microsoft.com/en-us/azure/)

### Related Challenges
- [Challenge 13: Cloud Deployment](../DOCUMENTS/CHALLENGES.md#challenge-13-cloud-deployment-windows)
- [Challenge 14: API Documentation](../DOCUMENTS/CHALLENGES.md#challenge-14-modern--auto-generated)
- [Challenge 15: Security Hardening & HIPAA Compliance](../DOCUMENTS/CHALLENGES.md#challenge-15--security-hardening--hipaa-compliance)

---

## 🆘 Troubleshooting

### Common Issues

**Issue:** Hasura can't connect to database
- **Solution:** Check `DATABASE_URL` format, firewall rules, and SSL settings

**Issue:** Gateway can't reach Hasura subgraph
- **Solution:** Verify `HASURA_ENDPOINT` is publicly accessible, check CORS settings

**Issue:** Frontend gets 401 Unauthorized
- **Solution:** Verify JWT configuration matches between Hasura and auth service

**Issue:** Federation entity resolution fails
- **Solution:** Check `@key` directives, verify `_entities` query works on subgraphs

**Issue:** Rate limit not working
- **Solution:** Ensure rate limiter middleware is before GraphQL handler

**Issue:** Deployment succeeds but app doesn't work
- **Solution:** Check environment variables in deployment platform, review logs

---

## 🚦 Next Steps

1. **Choose your deployment path** based on requirements
2. **Follow the detailed guide** for your chosen path
3. **Complete the deployment checklist** above
4. **Test thoroughly** before announcing to users
5. **Set up monitoring and alerts**
6. **Document your deployment** for team reference

**Ready to deploy?** Start with the [Quick Start](#-quick-start-hasura-cloud--vercel) or jump to [Managed Services](#-recommended-managed-services)!

---

**Questions?** See individual deployment guides for detailed walkthroughs and troubleshooting.
