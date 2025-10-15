# Phase 8: PromptQL with Hasura DDN (Local Development)

**Add AI-powered natural language queries to your locally running ClaimSight GraphQL API**

Learn how to enable Hasura's native PromptQL feature to chat with your data using natural language - all running locally on your machine with your own Anthropic API key.

---

## 🎯 Learning Objectives

By the end of this lab, you'll understand:

- **Local PromptQL setup** - Running AI queries without cloud deployment
- **Semantic metadata** - Describing your data for AI understanding
- **Natural language queries** - Chat with your local database
- **AI primitives** - Classify, summarize, and extract data
- **Automations** - Create reusable workflows from conversations
- **Artifacts** - Tables, visualizations, and structured outputs

---

## 📋 Prerequisites

**Required:**
- ✅ Completed [Phase 7: Hasura DDN](../phase-7-hasura-ddn/README.md)
- ✅ OpenAI or Anthropic API key (we'll set this up in Part 1)

**Current State (from Phase 7):**
You should have just finished Phase 7 with:
- ✅ DDN engine running on `localhost:3280`
- ✅ Cloud console at `https://console.hasura.io/local/graphql`
- ✅ Console connected to your local DDN instance
- ✅ Able to run GraphQL queries in the console

**If you closed everything:**
1. Restart DDN: `cd hasura-ddn && ddn run docker-start`
2. Reopen console: `https://console.hasura.io/local/graphql`
3. Reconnect to `http://localhost:3280/graphql`

**Accounts Needed:**
- OpenAI account (recommended) OR Anthropic account (we'll set this up in Part 1)

---

## ⏱️ Time Estimate

**Total: 1.5-2 hours**

- Part 1: Get LLM API Key (10 min)
- Part 2: Configure PromptQL (10 min)
- Part 3: Add Semantic Metadata (30 min)
- Part 4: Start PromptQL Services (10 min)
- Part 5: Access Local PromptQL Console (10 min)
- Part 6: Chat with Your Data (20 min)
- Part 7: Create Automations (15 min)
- Part 8 (Optional): Deploy to Cloud (20 min)

---

## 🏗️ What You'll Build

```
BEFORE (Phase 7):                    AFTER (Phase 8):
┌────────────────────┐              ┌─────────────────────────────┐
│  Local GraphQL     │              │  Hasura Cloud Console       │
│  Console           │              │  https://console.hasura.io/ │
│  localhost:3280    │              │  local/chat                 │
│                    │              │  ┌────────────────────────┐ │
│  (manual queries)  │              │  │   PromptQL Chat UI     │ │
│                    │              │  │   "Show me denied      │ │
└─────────┬──────────┘              │  │    claims over $1000"  │ │
          │                         │  └──────────┬─────────────┘ │
          │                         └─────────────┼───────────────┘
          │                                       │ HTTPS
          │                         ┌─────────────▼───────────────┐
          ▼                         │  Anthropic API              │
┌────────────────────┐              │  (Claude for NL→GraphQL)    │
│  DDN Engine        │              └─────────────┬───────────────┘
│  localhost:3280    │                            │ GraphQL Query
│  ┌──────────────┐  │              ┌─────────────▼───────────────┐
│  │  GraphQL     │◄─┼──────────────┤  DDN Engine (LOCAL)         │
│  │   Schema     │  │              │  localhost:3280             │
│  └──────┬───────┘  │              │  ┌──────────────┐           │
│         │          │              │  │  GraphQL     │           │
│  ┌──────▼───────┐  │              │  │   Schema     │           │
│  │  Connector   │  │              │  └──────┬───────┘           │
│  └──────┬───────┘  │              │         │                   │
└─────────┼──────────┘              │  ┌──────▼───────┐           │
          │                         │  │  Connector   │           │
          ▼                         │  └──────┬───────┘           │
┌────────────────────┐              └─────────┼───────────────────┘
│   PostgreSQL       │                        │
│   (local Docker)   │              ┌─────────▼─────────────────┐
└────────────────────┘              │   PostgreSQL (LOCAL)      │
                                    │   claimsight-postgres     │
                                    └───────────────────────────┘
```

**Key Points:**
- ✅ **PromptQL Console** runs in cloud (console.hasura.io) but connects to YOUR local endpoint
- ✅ **DDN Engine** stays local on localhost:3280
- ✅ **Database** stays local - no data leaves your machine
- ✅ **Anthropic API** only sees the GraphQL queries, not your data

---

## 📚 Part 1: Get LLM API Key

You can use either **OpenAI** or **Anthropic** for PromptQL. Choose one:

---

### Option A: OpenAI (Recommended)

#### 1A.1 Why OpenAI?

- **Familiar** - GPT-4 is widely known
- **Generous free tier** - $5 free credits for new accounts
- **Fast & accurate** - GPT-4 Turbo excels at structured queries
- **Cost-effective** - ~$0.01-0.03 per query

#### 1A.2 Create OpenAI Account

1. Go to https://platform.openai.com/signup
2. Click **Sign up**
3. Verify your email
4. Add billing (includes $5 free credit for new users)

#### 1A.3 Generate API Key

1. Navigate to **API Keys**: https://platform.openai.com/api-keys
2. Click **Create new secret key**
3. Name: "ClaimSight PromptQL Local"
4. Copy the key (starts with `sk-proj-...` or `sk-...`)

**⚠️ Important:** Save this key - you won't see it again!

#### 1A.4 Verify API Key

Test your key:

```bash
curl https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer YOUR_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4-turbo-preview",
    "messages": [{"role": "user", "content": "Hello"}],
    "max_tokens": 10
  }'
```

**Expected:** JSON response with GPT-4's greeting.

**✅ If using OpenAI, skip to Part 2.**

---

### Option B: Anthropic Claude (Alternative)

#### 1B.1 Why Anthropic?

- **Strong reasoning** - Claude 3.5 Sonnet excellent at complex queries
- **Detailed explanations** - Great query plan generation
- **Cost** - ~$0.01-0.05 per query
- **Credits** - $5 free credits available

#### 1B.2 Create Anthropic Account

1. Go to https://console.anthropic.com/
2. Click **Sign Up**
3. Verify email
4. Add credits (minimum $5, includes free trial credits)

#### 1B.3 Generate API Key

1. Navigate to **Settings** → **API Keys**
2. Click **Create Key**
3. Name it: "ClaimSight PromptQL Local"
4. Copy the key (starts with `sk-ant-api...`)

**⚠️ Important:** Save this key securely - it won't be shown again!

#### 1B.4 Verify API Key

Test your key:

```bash
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: YOUR_KEY_HERE" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 10,
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

**Expected:** Response with Claude's greeting.

---

## 📚 Part 2: Configure Local PromptQL

### 2.1 Verify Current State

Make sure your DDN setup from Phase 7 is still running:

```bash
cd hasura-ddn/

# Check if engine is running
curl -s http://localhost:3280/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}' | jq '.'
```

**Expected:** `{"data":{"__typename":"Query"}}`

**If not running:**
```bash
# Restart from Phase 7
ddn run docker-start
```

### 2.2 Update DDN CLI

PromptQL requires DDN CLI v2.28.0+:

```bash
# Check version
ddn version

# Update if needed (v3.7.0 recommended)
ddn update-cli
```

### 2.3 Generate PromptQL Secret Key

**Note:** PromptQL is built into modern DDN versions (v2.28.0+) and doesn't require a separate enable command.

Create a secret key for local PromptQL authentication:

```bash
# Generate and save to global config
ddn auth generate-promptql-secret-key

# This generates a key like: pql_xxxxxxxxxxxxx
```

**Expected output:**
```
✓ PromptQL secret key generated
✓ Saved to global configuration

Key: pql_abc123...xyz789
```

**Copy this key** - you'll need it in the next step!

### 2.4 Update Environment Variables

Edit your `.env` file:

```bash
cd hasura-ddn/
nano .env  # or use your preferred editor
```

Add these variables (choose ONE LLM provider):

**If using OpenAI:**
```bash
# OpenAI API Key (from Part 1A.3)
OPENAI_API_KEY=sk-proj-your-key-here

# PromptQL Secret Key (from Part 2.4)
PROMPTQL_SECRET_KEY=pql_your-generated-key-here

# Keep existing variables:
CLAIMSIGHT_POSTGRES_CONNECTION_URI="postgresql://claimsight:claimsight_dev@claimsight-postgres:5432/claimsight"
# ... etc
```

**If using Anthropic:**
```bash
# Anthropic API Key (from Part 1B.3)
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here

# PromptQL Secret Key (from Part 2.4)
PROMPTQL_SECRET_KEY=pql_your-generated-key-here

# Keep existing variables:
CLAIMSIGHT_POSTGRES_CONNECTION_URI="postgresql://claimsight:claimsight_dev@claimsight-postgres:5432/claimsight"
# ... etc
```

**Save the file.**

### 2.5 Verify Configuration

Check that environment variables are set:

**If using OpenAI:**
```bash
grep OPENAI_API_KEY .env
grep PROMPTQL_SECRET_KEY .env
```

**If using Anthropic:**
```bash
grep ANTHROPIC_API_KEY .env
grep PROMPTQL_SECRET_KEY .env
```

---

## 📚 Part 3: Add Semantic Metadata

**Why is this critical?**

PromptQL uses LLMs to understand your questions. The more context you provide through descriptions, the more accurate the AI responses will be.

**Example:**
- Without metadata: "Show me claims" → AI doesn't know what fields exist
- With metadata: "Show me claims" → AI knows about status, amounts, denial reasons, relationships

### 3.1 Understand Semantic Metadata

Semantic metadata provides natural language descriptions that help the AI:
- Understand what each model represents in business terms
- Know what fields mean and how they're used
- Recognize relationships between entities
- Apply correct filters and aggregations

### 3.2 Add Claims Model Description

Open `claimsight/metadata/Claims.hml` and update the Model description:

```yaml
kind: Model
version: v2
definition:
  name: Claims
  objectType: Claims
  description: |
    Medical claims submitted for healthcare services. Each claim represents a request
    for payment from a healthcare provider for services rendered to a member. Claims
    can be PAID (approved), DENIED (rejected), or PENDING (under review). The charge
    amount is what the provider billed, while the allowed amount is what the insurance
    plan approved for payment. Common denial reasons include lack of prior authorization,
    out-of-network providers, or services not covered by the member's plan.
  source:
    dataConnectorName: postgres
    collection: claims
  filterExpressionType: ClaimsBoolExp
  aggregateExpression: ClaimsAggExp
  orderByExpression: ClaimsOrderByExp
  graphql:
    selectMany:
      queryRootField: claims
      subscription:
        rootField: claims
    selectUniques:
      - queryRootField: claimsById
        uniqueIdentifier:
          - id
        subscription:
          rootField: claimsById
    filterInputTypeName: ClaimsFilterInput
    aggregate:
      queryRootField: claimsAggregate
      subscription:
        rootField: claimsAggregate
  # ... rest of model
```

### 3.3 Add Claims Field Descriptions

Find the `ObjectType` section in `Claims.hml` and add field descriptions:

```yaml
---
kind: ObjectType
version: v1
definition:
  name: Claims
  description: Medical claims submitted for services
  fields:
    - name: id
      type: Uuid!
      description: Unique claim identifier
    - name: memberId
      type: Uuid!
      description: Reference to the member (patient) who received the service
    - name: providerId
      type: Uuid!
      description: Reference to the healthcare provider who performed the service
    - name: dos
      type: Date!
      description: Date of Service - when the medical service was performed
    - name: cpt
      type: String_1!
      description: |
        Current Procedural Terminology code - standardized code for medical procedures.
        Examples: 99213 (office visit), 70450 (CT scan head), 80053 (metabolic panel).
        Used for billing and determining allowed amounts.
    - name: status
      type: String_1!
      description: |
        Claim processing status:
        - PAID: Claim was approved and payment processed
        - DENIED: Claim was rejected (see denialReason for why)
        - PENDING: Claim is under review, awaiting decision
    - name: chargeCents
      type: Int32!
      description: |
        Amount charged by the provider in cents (divide by 100 for dollars).
        This is what the provider billed, not necessarily what gets paid.
    - name: allowedCents
      type: Int32!
      description: |
        Amount allowed/approved by the insurance plan in cents (divide by 100 for dollars).
        This is what the insurance will actually pay. Zero if claim was denied.
        Always <= chargeCents.
    - name: denialReason
      type: String_1
      description: |
        Reason the claim was denied (only populated when status is DENIED).
        Common reasons:
        - "Prior authorization required"
        - "Out of network provider"
        - "Service not covered"
        - "Medical necessity not established"
        - "Duplicate claim"
    - name: createdAt
      type: Timestamptz!
      description: Timestamp when the claim was first created in the system
    - name: updatedAt
      type: Timestamptz!
      description: Timestamp when the claim was last updated
  graphql:
    typeName: Claims
    inputTypeName: ClaimsInput
  dataConnectorTypeMapping:
    - dataConnectorName: postgres
      dataConnectorObjectType: claims
      # ... field mappings
```

### 3.4 Add Members Model Description

Open `claimsight/metadata/Members.hml`:

```yaml
---
kind: ObjectType
version: v1
definition:
  name: Members
  description: |
    Insurance plan members (patients) enrolled in healthcare coverage.
    Members can have multiple claims and eligibility checks.
  fields:
    - name: id
      type: Uuid!
      description: Unique member identifier
    - name: firstName
      type: String_1!
      description: Member's legal first name
    - name: lastName
      type: String_1!
      description: Member's legal last name
    - name: dob
      type: Date!
      description: |
        Date of birth - used for eligibility verification and age-based coverage rules.
        Patients under 26 may be on parent's plan, over 65 qualify for Medicare.
    - name: memberNumber
      type: String_1!
      description: |
        Unique member ID number used for claims processing.
        This appears on insurance cards and claim forms.
    - name: plan
      type: String_1!
      description: |
        Insurance plan type:
        - HMO (Health Maintenance Organization): Requires in-network providers, PCPselection
        - PPO (Preferred Provider Organization): Allows out-of-network at higher cost
        - EPO (Exclusive Provider Organization): In-network only, no referrals needed
    - name: groupNumber
      type: String_1!
      description: Group number for employer-sponsored insurance plans
    - name: effectiveDate
      type: Date!
      description: Date when coverage became active
    - name: terminationDate
      type: Date
      description: Date when coverage ended (null if currently active)
    - name: createdAt
      type: Timestamptz!
      description: Timestamp when member was added to system
    - name: updatedAt
      type: Timestamptz!
      description: Timestamp when member record was last updated
  # ... rest of object type
```

### 3.5 Add ProviderRecords Model Description

Open `claimsight/metadata/ProviderRecords.hml`:

```yaml
---
kind: ObjectType
version: v1
definition:
  name: ProviderRecords
  description: |
    Healthcare providers (doctors, hospitals, clinics) in the network.
    Providers submit claims for services rendered to members.
  fields:
    - name: id
      type: Uuid!
      description: Unique provider identifier
    - name: npi
      type: String_1!
      description: |
        National Provider Identifier - unique 10-digit identifier for US healthcare providers.
        Required for all HIPAA transactions. Example: 1234567890
    - name: name
      type: String_1!
      description: Provider's full name (for individuals) or facility name (for organizations)
    - name: specialty
      type: String_1!
      description: |
        Medical specialty:
        - Cardiology (heart)
        - Orthopedic Surgery (bones/joints)
        - Family Medicine (primary care)
        - Radiology (imaging)
        - Internal Medicine (adult primary care)
    - name: networkStatus
      type: String_1!
      description: |
        Network participation status:
        - IN_NETWORK: Contracted rates, lower member cost
        - OUT_OF_NETWORK: No contract, higher member cost, claims may be denied
        - PENDING: Credentialing in progress, not yet accepting claims
    - name: phone
      type: String_1
      description: Primary contact phone number for the provider's office
    - name: email
      type: String_1
      description: Primary contact email address
    - name: addressLine1
      type: String_1!
      description: Street address line 1
    - name: addressLine2
      type: String_1
      description: Street address line 2 (suite, building, etc.)
    - name: city
      type: String_1!
      description: City
    - name: state
      type: String_1!
      description: State (2-letter code, e.g., CA, NY, TX)
    - name: zipCode
      type: String_1!
      description: ZIP code (5 or 9 digit)
    - name: createdAt
      type: Timestamptz!
      description: Timestamp when provider was added to system
    - name: updatedAt
      type: Timestamptz!
      description: Timestamp when provider record was last updated
  # ... rest of object type
```

### 3.6 Rebuild with New Metadata

After adding semantic descriptions:

```bash
# Rebuild the supergraph locally
ddn supergraph build local
```

**Expected output:**
```
✓ Using Supergraph config file "supergraph.yaml"
✓ Using localEnvFile ".env"
✓ Supergraph built for local Engine successfully
✓ Build artifacts exported to "engine/build"
```

You may see warnings about boolean expressions - these are safe to ignore.

---

## 📚 Part 4: Start PromptQL Services

### 4.1 Stop Current Services

```bash
# Stop the engine if it's running
docker compose down

# Or press Ctrl+C in the terminal where ddn run docker-start is running
```

### 4.2 Start with PromptQL Enabled

```bash
# Start all services with new PromptQL configuration
ddn run docker-start
```

**Expected output:**
```
[+] Running 3/3
 ✔ Container hasura-ddn-engine-1          Started
 ✔ Container hasura-ddn-otel-collector-1  Started
 ✔ Container postgres-claimsight_postgres-1 Running

engine-1 | starting server on [::]:3000
```

**Note:** You may see:
- PromptQL secret key message (this is normal)
- OTEL collector error (safe to ignore for local dev)

### 4.3 Verify Services

```bash
# Test GraphQL endpoint
curl -s http://localhost:3280/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ claims(limit: 1) { id status } }"}' | jq '.'
```

**Expected:** Claims data returned

```bash
# Test connector is healthy
cd claimsight/connector/postgres
docker compose ps
```

**Expected:** `healthy` status on port 4313

---

## 📚 Part 5: Access Local PromptQL Console

### 5.1 Open Hasura Local Console

Navigate to the **Hasura Cloud Console** that connects to your **local** DDN instance:

```
https://console.hasura.io/local/chat
```

**Important:** This is a cloud-hosted UI that connects to `localhost:3280`. Your data stays local!

### 5.2 Configure Local Connection

On first visit, you'll see connection settings:

1. **GraphQL Endpoint:** `http://localhost:3280/graphql`
2. **Admin Secret:** Leave blank (not required for local)
3. Click **Connect**

You should see:
```
✓ Connected to local DDN instance
✓ Schema loaded successfully
✓ PromptQL ready
```

### 5.3 Configure LLM Provider

In the PromptQL console, configure your chosen LLM provider:

**If using OpenAI:**

1. Click the **Settings** icon (gear) in top right
2. Under **LLM Provider**, select **OpenAI**
3. Paste your OpenAI API key from Part 1A.3
4. Click **Save**

You should see:
```
✓ OpenAI API key configured
✓ Model: gpt-4-turbo-preview
```

**If using Anthropic:**

1. Click the **Settings** icon (gear) in top right
2. Under **LLM Provider**, select **Anthropic**
3. Paste your Anthropic API key from Part 1B.3
4. Click **Save**

You should see:
```
✓ Anthropic API key configured
✓ Model: claude-3-5-sonnet-20241022
```

### 5.4 Troubleshooting Connection

**Issue: "Cannot connect to localhost"**

This is a browser security issue. Try:

**Option A:** Use Chrome (works best)

**Option B:** Use the local DDN console directly:
```bash
ddn console --local
```

Then navigate to the **PromptQL** tab.

**Option C:** If you need HTTPS for localhost:
```bash
# The DDN CLI can set up a secure tunnel
ddn run tunnel
```

---

## 📚 Part 6: Chat with Your Data

### 6.1 Interface Overview

You should see:
- **Chat input** box at the bottom
- **Conversation** area in the middle
- **Query Plan** panel (expandable)
- **Results** section
- **Artifacts** tab

### 6.2 Try Basic Queries

**Query 1: Explore Claims**
```
Show me the 5 most recent claims
```

**What happens:**
1. You type the question
2. Claude (via Anthropic API) reads your schema + metadata
3. Generates a GraphQL query
4. Shows you the **query plan** (reasoning)
5. Executes against `localhost:3280`
6. Returns results in a table

**Expected result:**
```
Query Plan:
1. Data source: Claims model
2. Fields: id, dos, status, chargeCents, createdAt
3. Sort: createdAt descending
4. Limit: 5

GraphQL Query:
query {
  claims(limit: 5, orderBy: {createdAt: Desc}) {
    id
    dos
    status
    chargeCents
    createdAt
  }
}

Results: [table with 5 claims]
Confidence: 98%
```

**Query 2: Analyze Denials**
```
What are the top 3 denial reasons and how many claims were denied for each?
```

**Expected:**
- Groups by `denialReason`
- Counts claims per reason
- Sorts by count descending
- Returns top 3

**Query 3: Filter by Amount**
```
Find all denied claims where the provider charged over $1000
```

**What the AI understands:**
- "$1000" → `100000` cents (from your metadata description!)
- "denied" → `status = "DENIED"`
- "provider charged" → `chargeCents` field

**Query 4: Cross-Model Analysis**
```
Show me all claims from cardiologists that were denied
```

**What this tests:**
- Relationship traversal: Claims → ProviderRecords
- Filter on relationship: `specialty = "Cardiology"`
- Filter on claim: `status = "DENIED"`

**Query 5: Time-Based**
```
How many claims were created each day in the last week?
```

**What this tests:**
- Date filtering: `createdAt > (now - 7 days)`
- Date grouping: Group by date
- Aggregation: COUNT

**Query 6: Business Logic**
```
Which members have the highest total allowed amount for paid claims?
```

**What this tests:**
- Filter: `status = "PAID"`
- Group by: `memberId`
- Aggregate: SUM of `allowedCents`
- Sort: descending
- Relationship: Show member name

### 6.3 Understanding Query Plans

Click **"Show Query Plan"** to see:

**1. Understanding Phase:**
```
User wants to find denied claims over $1000.

Key terms:
- "denied" → status field = "DENIED"
- "$1000" → chargeCents > 100000 (converted to cents)
- "claims" → Claims model
```

**2. Data Selection:**
```
Source: Claims
Fields needed:
- id (for reference)
- status (for verification)
- chargeCents (for display)
- denialReason (context)
- dos (when it happened)
```

**3. Filters Applied:**
```
WHERE status = 'DENIED'
  AND chargeCents > 100000
```

**4. Presentation:**
```
Format: Table
Sort: chargeCents DESC (highest first)
Limit: 100 (safety)
```

### 6.4 Confidence Scores

Each response includes a reliability score:

- **90-100%**: High confidence - AI clearly understood
- **70-89%**: Medium - likely correct, but verify
- **Below 70%**: Low - review carefully

**If confidence is low:**
1. Rephrase with specific field names
2. Break into simpler questions
3. Check if metadata descriptions are clear

### 6.5 Complex Healthcare Queries

**Query 7: Risk Analysis**
```
Show me members who have had more than 3 denied claims in the last 30 days
```

**Query 8: Provider Performance**
```
For each provider specialty, what is the average denial rate?
```

**Query 9: Cost Analysis**
```
What is the difference between total charged amount and total allowed amount for paid claims, broken down by plan type?
```

**Query 10: CPT Code Analysis**
```
Which CPT codes have the highest denial rate and what are the most common denial reasons for them?
```

---

## 📚 Part 7: Create Automations

Automations convert ad-hoc questions into reusable, parameterized workflows.

### 7.1 What are Automations?

**Before (manual query):**
```
Show me denied claims for member ID abc-123 from last 30 days
```

**After (automation):**
```yaml
name: DeniedClaimsForMember
parameters:
  - name: member_id
    type: UUID
    required: true
  - name: days_back
    type: Int
    default: 30
```

Now you can run:
```
DeniedClaimsForMember(member_id: "abc-123", days_back: 60)
```

### 7.2 Create Your First Automation

**Step 1:** Have a conversation:
```
Show me all denied claims for a specific member in the last 30 days
```

**Step 2:** PromptQL responds with results

**Step 3:** Click **"Create Automation"** button

**Step 4:** Configure:
- **Name:** `DeniedClaimsForMember`
- **Description:** "Returns denied claims for a member in specified timeframe"
- **Parameters:**
  - `member_id` (UUID, required)
  - `days_back` (Int, default: 30)

**Step 5:** Click **"Save Automation"**

### 7.3 Use the Automation

**In PromptQL console:**
```
Run DeniedClaimsForMember for member a9235834-0656-41bb-9538-da2b935255a0
```

**Via DDN CLI:**
```bash
# Add automation to your local project
ddn promptql-program add DeniedClaimsForMember

# This creates: claimsight/metadata/DeniedClaimsForMember.hml
```

### 7.4 Example Automation Ideas

**Automation 1: High-Risk Members**
```
Parameter: risk_threshold (default: 3)

Identify members with:
- More than {risk_threshold} denied claims in 6 months
- Total claim amount > $10,000
- Claims from more than 5 different providers

Return member ID, name, claim count, total amount
```

**Automation 2: Provider Performance Report**
```
Parameter: provider_id

For provider {provider_id}, show:
- Total claims (last 90 days)
- Approval rate
- Average processing time (createdAt → updatedAt)
- Total allowed amount paid
- Top denial reasons
```

**Automation 3: Daily Claims Digest**
```
Parameter: date (default: yesterday)

Summary for {date}:
- Total claims created
- Total charge amount
- Total allowed amount
- Breakdown by status (PAID, DENIED, PENDING)
- Top 5 CPT codes
- Top 3 providers by claim volume
```

### 7.5 Save Automations Locally

Automations are saved as `.hml` files:

```bash
# List automation programs
ls claimsight/metadata/*Program*.hml

# View an automation
cat claimsight/metadata/DeniedClaimsForMember.hml
```

Example structure:
```yaml
kind: PromptQLProgram
version: v1
definition:
  name: DeniedClaimsForMember
  description: Returns denied claims for a member in specified timeframe
  parameters:
    - name: member_id
      type: UUID!
    - name: days_back
      type: Int
      defaultValue: 30
  query: |
    query($member_id: UUID!, $days_back: Int!) {
      claims(
        where: {
          memberId: { _eq: $member_id }
          status: { _eq: "DENIED" }
          createdAt: { _gte: now() - interval($days_back days) }
        }
      ) {
        id
        dos
        cpt
        chargeCents
        denialReason
      }
    }
```

---

## 📚 Part 8 (Optional): Deploy to DDN Cloud

Want to share your PromptQL-enabled API? Deploy to Hasura DDN Cloud.

### 8.1 Why Deploy to Cloud?

**Local (what you have now):**
- ✅ Free (except Anthropic API costs)
- ✅ Data stays on your machine
- ✅ Fast iteration
- ❌ Only accessible from your computer
- ❌ Requires `ddn run docker-start` to be running

**Cloud deployment:**
- ✅ Accessible from anywhere
- ✅ Always available (no local services needed)
- ✅ Shareable with team
- ✅ Production-ready
- ⚠️ Data hosted on Hasura Cloud (or your own cloud with BYOC)

### 8.2 Authenticate with Hasura Cloud

```bash
# Login (opens browser)
ddn auth login

# Verify
ddn project list
```

### 8.3 Create Cloud Build

```bash
# Create and apply in one command
ddn supergraph build create --apply
```

**This uploads:**
- Your metadata (models, permissions, descriptions)
- Connector configurations
- PromptQL automations

**You'll get:**
- Build version (e.g., v1)
- Console URL: `https://console.hasura.io/project/your-project-id`
- PromptQL URL: `https://promptql.console.hasura.io/project/your-project-id`
- GraphQL endpoint: `https://your-project.ddn.hasura.io/graphql`

### 8.4 Configure Cloud Database

Your cloud deployment needs to connect to a database. Options:

**Option A:** Keep PostgreSQL local (not recommended for production)
- Use tunneling service (ngrok, cloudflare tunnel)
- Update `CLAIMSIGHT_POSTGRES_CONNECTION_URI` to public URL

**Option B:** Use Neon (from Phase 1)
- Update connector to use Neon connection string
- Migrate data: `pg_dump localhost | psql neon-connection-string`

**Option C:** Use Hasura Cloud Postgres
- Provision database in Hasura Console
- Update connector configuration

### 8.5 Test Cloud Deployment

```bash
# Get GraphQL URL
ddn project get-graphql-url

# Test it
curl -X POST https://your-project.ddn.hasura.io/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ claims(limit: 2) { id status } }"}'
```

### 8.6 Access Cloud PromptQL

Navigate to:
```
https://promptql.console.hasura.io/project/your-project-id
```

All your automations and metadata are now accessible from anywhere!

---

## 📊 Phase 8 Complete: What You've Learned

✅ **Local PromptQL** - AI queries without cloud deployment
✅ **Anthropic Integration** - Using Claude for natural language understanding
✅ **Semantic Metadata** - Describing data for AI comprehension
✅ **Natural Language Queries** - Chat with your local database
✅ **Query Plans** - Understanding AI decision-making
✅ **Confidence Scores** - Evaluating AI accuracy
✅ **Automations** - Reusable parameterized workflows
✅ **Local-First Development** - Fast iteration, data privacy
✅ **Optional Cloud Deployment** - Production-ready scaling

---

## 🆚 Comparison

| Feature | Local PromptQL | Cloud PromptQL |
|---------|---------------|----------------|
| **Data Location** | Your machine | Hasura Cloud or BYOC |
| **Accessibility** | Localhost only | Anywhere with internet |
| **Cost** | Anthropic API only (~$1-5/month) | Anthropic + Hasura Cloud |
| **Setup Time** | 30 min | 30 min + deployment |
| **Iteration Speed** | Instant | Need to rebuild/deploy |
| **Best For** | Development, learning | Production, team collaboration |

---

## 🎯 Next Steps

### Option A: Build Frontend Integration
Create a chat UI in your ClaimSight app that calls the local PromptQL endpoint

### Option B: Create More Automations
Build workflow automation library:
- Daily/weekly reports
- Risk scoring
- Fraud detection patterns
- Provider performance tracking

### Option C: Deploy to Production
Follow Part 8 to deploy to Hasura DDN Cloud for team access

### Option D: Advanced AI Workflows
Combine PromptQL primitives:
- Classify denial reasons into categories
- Summarize member claims history
- Extract trends from notes
- Generate insights and recommendations

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to console.hasura.io/local/chat"

**Cause:** Browser security blocking localhost connections from HTTPS site.

**Solutions:**
1. **Use Chrome** - Best compatibility
2. **Use local console:** `ddn console --local` then click PromptQL tab
3. **Use tunnel:** `ddn run tunnel` for HTTPS localhost

### Issue: "PromptQL queries return errors"

**Cause:** Anthropic API key issue.

**Solution:**
```bash
# Verify key in .env
grep ANTHROPIC_API_KEY .env

# Test key directly
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $(grep ANTHROPIC_API_KEY .env | cut -d= -f2)" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-3-5-sonnet-20241022","max_tokens":10,"messages":[{"role":"user","content":"test"}]}'
```

### Issue: "Low confidence scores on all queries"

**Cause:** Insufficient semantic metadata.

**Solution:**
1. Review Part 3 - add more field descriptions
2. Include business context and examples in descriptions
3. Add descriptions to relationships
4. Rebuild: `ddn supergraph build local`
5. Restart: `ddn run docker-start`

### Issue: "Query returns wrong results"

**Cause:** AI misunderstood the question.

**Solution:**
1. Click "Show Query Plan" to see AI's interpretation
2. Identify where misunderstanding occurred
3. Rephrase using exact field names from metadata
4. Add more context: "Show me claims where the status field is DENIED"

### Issue: "Service failed to start after enabling PromptQL"

**Cause:** Missing environment variables or configuration error.

**Solution:**
```bash
# Check all required env vars are set
grep -E "(ANTHROPIC|PROMPTQL)" .env

# Rebuild to catch config errors
ddn supergraph build local --verbose

# Check Docker logs
docker logs hasura-ddn-engine-1
```

### Issue: "Anthropic API rate limit exceeded"

**Cause:** Too many requests.

**Solution:**
- Wait a few minutes
- Check your usage: https://console.anthropic.com/settings/usage
- Add rate limiting to your queries
- Consider caching common queries

---

## 📚 Resources

- [PromptQL Documentation](https://promptql.io/docs/)
- [Anthropic Claude API](https://docs.anthropic.com/)
- [DDN CLI Reference](https://hasura.io/docs/3.0/reference/cli/)
- [PromptQL Sample Apps](https://github.com/hasura/promptql-sample-ecommerce-app)
- [Semantic Metadata Guide](https://promptql.io/docs/reference/metadata-reference/)

---

## 💡 Pro Tips

### Tip 1: Start Simple, Add Context Gradually

**Iteration 1:**
```
Show me claims
```
→ Works, but basic

**Iteration 2:**
```
Show me denied claims
```
→ AI uses status filter

**Iteration 3:**
```
Show me denied claims over $1000 from last month
```
→ AI applies multiple filters

**Iteration 4:**
```
Show me denied claims over $1000 from last month, grouped by denial reason with counts
```
→ AI adds grouping and aggregation

### Tip 2: Use Business Language, Not Technical

**❌ Technical:**
```
SELECT * FROM claims WHERE charge_cents > 100000 AND status = 'DENIED'
```

**✅ Business:**
```
Show me denied claims where the provider charged over $1000
```

The semantic metadata bridges the gap!

### Tip 3: Review Query Plans to Improve Metadata

If AI misunderstands:
1. Check query plan
2. See what it thought you meant
3. Add clarifying descriptions to metadata
4. Rebuild and try again

### Tip 4: Save Useful Questions as Automations

Instead of retyping:
```
Show me high-risk members with more than 3 denied claims
```

Create automation:
```
HighRiskMembers(denial_threshold: 3)
```

Then just:
```
Run HighRiskMembers with threshold 5
```

### Tip 5: Combine PromptQL with Traditional Queries

Use PromptQL for:
- ✅ Exploration and discovery
- ✅ Ad-hoc analysis
- ✅ Business user self-service

Use GraphQL directly for:
- ✅ Production app queries
- ✅ Performance-critical operations
- ✅ Complex custom logic

---

## 🔒 Data Privacy

**What stays local:**
- ✅ Your PostgreSQL database
- ✅ All claim, member, provider data
- ✅ DDN engine and connectors
- ✅ GraphQL schema

**What goes to Anthropic:**
- ⚠️ Your natural language question
- ⚠️ GraphQL schema structure (table/field names)
- ⚠️ Metadata descriptions
- ❌ **NOT your actual data**

**How it works:**
1. You ask: "Show me denied claims over $1000"
2. Anthropic sees: Schema + question → Generates GraphQL query
3. Query runs locally against your database
4. Results stay on your machine
5. Only the results (not the data) shown in console

---

**🎉 Congratulations!** You've added AI-powered natural language queries to your local ClaimSight platform!

[← Back to Phase 7: Hasura DDN](../phase-7-hasura-ddn/README.md) | [Back to Labs Overview →](../README.md)
