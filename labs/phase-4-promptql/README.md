# Phase 4: PromptQL + AI Integration

**Build an AI-powered natural language query interface using OpenAI or Anthropic Claude**

Learn how to create a production-ready natural language to SQL interface with query validation, security, and a chat-style UI.

---

## 🎯 Learning Objectives

By the end of this lab, you'll understand:

- **Natural language to SQL** with LLMs (OpenAI GPT-4 / Anthropic Claude)
- **Query validation** and SQL injection prevention
- **Schema context building** for accurate AI-generated queries
- **AI safety patterns** (SELECT-only, LIMIT clauses, validation)
- **Cost management** for LLM API calls
- **Chat-style UI** for data exploration

---

## 📋 Prerequisites

**Required:**
- ✅ Completed [Phase 1: Hasura Cloud](../phase-1-hasura-cloud/README.md)
- ✅ Completed [Phase 2: Apollo Federation](../phase-2-apollo-federation/README.md)
- ✅ Node.js 18+ installed
- ✅ OpenAI or Anthropic API key (get $5-10 credit to start)

**Optional:**
- Phase 3 (DDN) - PromptQL works with both v2 and DDN

---

## ⏱️ Time Estimate

**Total: 1-2 hours**

- Part 1: Get LLM API Key (10 min)
- Part 2: Configure PromptQL Service (15 min)
- Part 3: Start PromptQL Server (10 min)
- Part 4: Test API Endpoints (15 min)
- Part 5: Launch UI & Query (20 min)
- Part 6: Deploy to Production (30 min - optional)

---

## 🏗️ What You'll Build

```
┌──────────────────┐
│  React Frontend  │
│  ┌────────────┐  │
│  │ PromptQL   │  │  Chat-style UI
│  │    UI      │  │  for natural language queries
│  └──────┬─────┘  │
└─────────┼────────┘
          │ HTTP
          ▼
┌──────────────────┐
│ PromptQL Service │  Node.js/Express
│  ┌────────────┐  │  Port: 3003
│  │    LLM     │  │
│  │ (OpenAI/   │  │  Generates safe SQL
│  │ Anthropic) │  │
│  └──────┬─────┘  │
│         │        │
│  ┌──────▼─────┐  │
│  │ Validator  │  │  SQL safety checks
│  └──────┬─────┘  │
│         │        │
│  ┌──────▼─────┐  │
│  │  Executor  │  │  Runs queries
│  └──────┬─────┘  │
└─────────┼────────┘
          │ GraphQL
          ▼
┌──────────────────┐
│  Hasura Cloud    │  PostgreSQL + GraphQL
│  (from Phase 1)  │
└──────────────────┘
```

---

## 📚 Part 1: Get LLM API Key

### Option A: OpenAI (Recommended for Beginners)

1. Go to https://platform.openai.com/signup
2. Create an account (free)
3. Add $5-10 credit (https://platform.openai.com/account/billing)
4. Create API key: https://platform.openai.com/api-keys
5. Copy key (starts with `sk-`)

**Cost:** ~$0.01-0.03 per query with GPT-4

### Option B: Anthropic Claude (Advanced)

1. Go to https://console.anthropic.com/
2. Create account
3. Add credits ($5 minimum)
4. Create API key
5. Copy key (starts with `sk-ant-`)

**Cost:** ~$0.01-0.05 per query with Claude 3.5

---

## 📚 Part 2: Configure PromptQL Service

### 2.1 Install Dependencies

```bash
cd app/promptql
npm install
```

This installs:
- Express (web server)
- OpenAI SDK
- Anthropic SDK
- GraphQL client (for Hasura)
- Zod (validation)

### 2.2 Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env
nano .env  # or your preferred editor
```

**For OpenAI:**
```bash
# LLM Provider
PROMPTQL_LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here

# Hasura (from Phase 1)
HASURA_GRAPHQL_ENDPOINT=https://your-project.hasura.app
HASURA_GRAPHQL_ADMIN_SECRET=your-admin-secret

# Server
PROMPTQL_PORT=3003
```

**For Anthropic:**
```bash
# LLM Provider
PROMPTQL_LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Hasura (from Phase 1)
HASURA_GRAPHQL_ENDPOINT=https://your-project.hasura.app
HASURA_GRAPHQL_ADMIN_SECRET=your-admin-secret

# Server
PROMPTQL_PORT=3003
```

---

## 📚 Part 3: Start PromptQL Server

### 3.1 Start the Service

```bash
# From app/promptql/
npm run dev
```

Expected output:
```
🤖 PromptQL Server
   LLM Provider: OpenAI (gpt-4-turbo-preview)
   Hasura: https://your-project.hasura.app

✓ Hasura connection successful

✓ PromptQL server running on port 3003
  API endpoint: http://localhost:3003/api/query
  Health check: http://localhost:3003/health
```

### 3.2 Test Health Endpoint

```bash
curl http://localhost:3003/health
```

Should return:
```json
{
  "status": "ok",
  "service": "promptql",
  "llmProvider": "OpenAI (gpt-4-turbo-preview)"
}
```

---

## 📚 Part 4: Test API Endpoints

### 4.1 Test SQL Generation

```bash
curl -X POST http://localhost:3003/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Show me the top 5 members by last name"}'
```

Response:
```json
{
  "sql": "SELECT * FROM members ORDER BY last_name LIMIT 5",
  "explanation": "This query retrieves the first 5 members sorted alphabetically by last name.",
  "confidence": 0.95,
  "warnings": []
}
```

### 4.2 Test Query Execution

```bash
curl -X POST http://localhost:3003/api/query \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Show me all members with last name Smith"}'
```

Response:
```json
{
  "prompt": "Show me all members with last name Smith",
  "sql": "SELECT * FROM members WHERE last_name = 'Smith' LIMIT 100",
  "explanation": "...",
  "confidence": 0.92,
  "warnings": [],
  "data": [
    {
      "id": "uuid-here",
      "first_name": "John",
      "last_name": "Smith",
      "dob": "1985-03-15",
      "plan": "PPO"
    }
  ],
  "rowCount": 1,
  "executionTime": 45
}
```

### 4.3 Test Safety Features

Try a dangerous query:
```bash
curl -X POST http://localhost:3003/api/query \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Delete all members"}'
```

Should return validation error:
```json
{
  "error": "Generated SQL failed validation",
  "validationErrors": ["Forbidden keyword detected: DELETE"],
  "sql": "DELETE FROM members"
}
```

✅ **Security working!** Only SELECT queries are allowed.

---

## 📚 Part 5: Launch UI & Query

### 5.1 Start the Frontend

Open a new terminal:

```bash
cd app/client
npm run dev
```

### 5.2 Navigate to PromptQL

Open browser: http://localhost:5173/promptql

You should see:
- 🤖 **PromptQL - AI Query Interface** header
- Natural language input box
- Example queries

### 5.3 Try Example Queries

**Example 1: Top Denial Reasons**
```
Show me the top 5 denial reasons
```

**Example 2: High-Value Claims**
```
Find all claims over $5000
```

**Example 3: Provider Search**
```
List all providers with specialty Cardiology
```

**Example 4: Member Query**
```
Show me members on PPO plans
```

### 5.4 Understand the Results

For each query, you'll see:

1. **Generated SQL** - The actual SQL query
2. **Explanation** - What the query does
3. **Confidence** - AI confidence score (0-1)
4. **Warnings** - Any safety warnings
5. **Results Table** - Query results
6. **Execution Time** - How long it took

---

## 📊 Phase 4 Complete: What You've Learned

✅ **Natural Language to SQL** - LLM integration for query generation
✅ **Query Validation** - SQL injection prevention and safety
✅ **Schema Context** - Providing database context to LLMs
✅ **AI Safety** - SELECT-only, LIMIT clauses, validation
✅ **Cost Management** - Monitoring LLM API usage
✅ **Chat UI** - User-friendly data exploration

---

## 🎯 Optional: Part 6 - Deploy to Production

### 6.1 Deploy PromptQL Service to Render.com

```bash
# Add to git
git add app/promptql/
git commit -m "Add PromptQL service"
git push
```

On Render.com:
1. New Web Service
2. Connect GitHub repo
3. Settings:
   - **Root Directory:** `app/promptql`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Port:** 3003

4. Environment Variables:
   - `PROMPTQL_LLM_PROVIDER=openai`
   - `OPENAI_API_KEY=your-key`
   - `HASURA_GRAPHQL_ENDPOINT=https://your-project.hasura.app`
   - `HASURA_GRAPHQL_ADMIN_SECRET=your-secret`

### 6.2 Update Frontend

Edit `app/client/src/components/PromptQL/PromptQLPage.tsx`:

```typescript
// Change from:
const response = await fetch('http://localhost:3003/api/query', {

// To:
const response = await fetch('https://your-promptql.onrender.com/api/query', {
```

### 6.3 Cost Monitoring

**Track API usage:**
- OpenAI: https://platform.openai.com/usage
- Anthropic: https://console.anthropic.com/account/billing

**Typical costs:**
- 100 queries/day = ~$1-3/month
- 1000 queries/day = ~$10-30/month

---

## 🔒 Security Best Practices

### ✅ What We Implemented:

1. **SQL Validation** - Only SELECT queries allowed
2. **Keyword Blocking** - DROP, DELETE, UPDATE blocked
3. **Injection Prevention** - Pattern detection
4. **LIMIT Clauses** - Prevent large result sets
5. **Query Timeout** - 30 second max execution

### ⚠️ For Production, Also Add:

1. **Authentication** - Require user login
2. **Rate Limiting** - 100 queries/hour per user
3. **Audit Logging** - Log all queries
4. **Cost Limits** - Set monthly API budget
5. **Row-Level Security** - Apply Hasura permissions

---

## 🐛 Troubleshooting

### Issue: "LLM API key not found"
**Solution:** Check `.env` file has correct key format:
```bash
# OpenAI keys start with: sk-
# Anthropic keys start with: sk-ant-
```

### Issue: "Hasura connection failed"
**Solution:** Verify Hasura endpoint and admin secret:
```bash
curl -X POST https://your-project.hasura.app/v1/graphql \
  -H "x-hasura-admin-secret: your-secret" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ members { id } }"}'
```

### Issue: "Generated SQL is inaccurate"
**Solution:** Check schema context in `app/promptql/src/schema/context-builder.ts`. Ensure table/column descriptions are accurate.

### Issue: "High API costs"
**Solution:**
1. Use caching for repeated queries
2. Set rate limits per user
3. Use cheaper models (gpt-3.5 instead of gpt-4)
4. Add query complexity limits

---

## 📚 Resources

- [OpenAI API Docs](https://platform.openai.com/docs/)
- [Anthropic API Docs](https://docs.anthropic.com/)
- [Hasura run_sql API](https://hasura.io/docs/latest/api-reference/metadata-api/run-sql/)
- [SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)

---

## 🎓 What's Next?

### Option A: Integration Challenge
Complete [Challenge 16: Integrate DDN + PromptQL](../../DOCUMENTS/CHALLENGES.md)

### Option B: Production Deployment
Follow [deployment guides](../../deployment/) for Render.com / Vercel

### Option C: Extend PromptQL
- Add query history
- Add favorites
- Add export to CSV
- Add chart/visualization generation

---

**🎉 Congratulations!** You've built an AI-powered data query interface!

[← Back to Labs Overview](../README.md) | [Phase 3: Hasura DDN ←](../phase-3-hasura-ddn/README.md)
