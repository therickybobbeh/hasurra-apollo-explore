# Phase 7.5: Add PromptQL to Local DDN

**Add AI-powered natural language queries to your locally running ClaimSight DDN**

Learn how to enable Hasura's PromptQL feature to chat with your data using natural language - all running locally with OpenAI.

---

## 🎯 Learning Objectives

By the end of this lab, you'll understand:

- **OpenAI Integration** - Using GPT-4 for natural language to GraphQL
- **Semantic Metadata** - Enhancing descriptions for AI understanding
- **PromptQL Console** - Chatting with your local database
- **Query Plans** - Understanding how AI interprets questions
- **Automations** - Creating reusable parameterized workflows

---

## 📋 Prerequisites

**Required:**
- ✅ Completed [Phase 7: Hasura DDN](../phase-7-hasura-ddn/README.md) through Part 5.5
- ✅ OpenAI API key (we'll set this up in Part 1)

**Current State (from Phase 7):**
You should have just finished Phase 7 Part 5.5 with:
- ✅ DDN engine running on `localhost:3280`
- ✅ Cloud console at `https://console.hasura.io/local/graphql`
- ✅ Console connected to your local DDN instance
- ✅ 5 models available and queryable (Claims, Members, Notes, ProviderRecords, EligibilityChecks)

**If you closed everything:**
1. Restart DDN: `cd hasura-ddn && ddn run docker-start`
2. Reopen console: `https://console.hasura.io/local/graphql`
3. Reconnect to `http://localhost:3280/graphql`

---

## ⏱️ Time Estimate

**Total: 1-1.5 hours**

- Part 1: Get OpenAI API Key (10 min)
- Part 2: Configure PromptQL (10 min)
- Part 3: Enhance Semantic Metadata (30 min)
- Part 4: Access PromptQL Console (10 min)
- Part 5: Chat with Your Data (20 min)
- Part 6 (Optional): Create Automations (15 min)

---

## 🏗️ What You'll Build

```
BEFORE (Phase 7):                    AFTER (Phase 7.5):
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
          ▼                         │  OpenAI API                 │
┌────────────────────┐              │  (GPT-4 for NL→GraphQL)     │
│  DDN Engine        │              └─────────────┬───────────────┘
│  localhost:3280    │                            │ GraphQL Query
│  ┌──────────────┐  │              ┌─────────────▼───────────────┐
│  │  GraphQL     │◄─┼──────────────┤  DDN Engine (LOCAL)         │
│  │   Schema     │  │              │  localhost:3280             │
│  └──────┬───────┘  │              │  ┌──────────────┐           │
│         │          │              │  │  GraphQL     │           │
│  ┌──────▼───────┐  │              │  │   Schema     │           │
│  │  Connector   │  │              │  │  + Semantic  │           │
│  └──────┬───────┘  │              │  │   Metadata   │           │
└─────────┼──────────┘              │  └──────┬───────┘           │
          │                         │         │                   │
          ▼                         │  ┌──────▼───────┐           │
┌────────────────────┐              │  │  Connector   │           │
│   PostgreSQL       │              │  └──────┬───────┘           │
│   (local Docker)   │              └─────────┼───────────────────┘
└────────────────────┘                        │
                                    ┌─────────▼─────────────────┐
                                    │   PostgreSQL (LOCAL)      │
                                    │   claimsight-postgres     │
                                    └───────────────────────────┘
```

**Key Points:**
- ✅ **PromptQL Console** runs in cloud (console.hasura.io) but connects to YOUR local endpoint
- ✅ **DDN Engine** stays local on localhost:3280
- ✅ **Database** stays local - no data leaves your machine
- ✅ **OpenAI API** only sees the GraphQL schema structure and your questions, not your data

---

## 📚 Part 1: Get OpenAI API Key

### 1.1 Why OpenAI?

- **Familiar** - GPT-4 is widely known and trusted
- **Generous free tier** - $5 free credits for new accounts
- **Fast & accurate** - GPT-4 Turbo excels at structured query generation
- **Cost-effective** - ~$0.01-0.03 per query

### 1.2 Create OpenAI Account

1. Go to https://platform.openai.com/signup
2. Click **Sign up**
3. Verify your email
4. Add billing information (includes $5 free credit for new users)

### 1.3 Generate API Key

1. Navigate to **API Keys**: https://platform.openai.com/api-keys
2. Click **Create new secret key**
3. Name: "ClaimSight PromptQL Local"
4. Copy the key (starts with `sk-proj-...` or `sk-...`)

**⚠️ Important:** Save this key securely - you won't see it again!

### 1.4 Verify API Key

Test your key works:

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

---

## 📚 Part 2: Configure PromptQL

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

### 2.2 Generate PromptQL Secret Key

**Note:** PromptQL is built into DDN CLI v2.28.0+ and requires no special enable command.

Create a secret key for PromptQL authentication:

```bash
# Generate and save to global config
ddn auth generate-promptql-secret-key
```

This generates a key like: `pql_xxxxxxxxxxxxx`

**Expected output:**
```
✓ PromptQL secret key generated
✓ Saved to global configuration

Key: pql_abc123...xyz789
```

**Copy this key** - you'll need it in the next step!

### 2.3 Update Environment Variables

Edit your `.env` file:

```bash
cd hasura-ddn/
nano .env  # or use your preferred editor
```

Add these variables at the end:

```bash
# OpenAI API Key (from Part 1.3)
OPENAI_API_KEY=sk-proj-your-key-here

# PromptQL Secret Key (from Part 2.2)
PROMPTQL_SECRET_KEY=pql_your-generated-key-here
```

**Save the file** (Ctrl+O, Enter, Ctrl+X in nano).

### 2.4 Verify Configuration

Check that environment variables are set:

```bash
grep OPENAI_API_KEY .env
grep PROMPTQL_SECRET_KEY .env
```

You should see both keys present (values will be masked for security).

---

## 📚 Part 3: Enhance Semantic Metadata

### 3.1 Why Semantic Metadata Matters

**The Problem:**
Your database has technical field names like `chargeCents`, `cpt`, `dos`. The AI doesn't know what these mean in a healthcare context.

**The Solution:**
Add rich, business-context descriptions that help the AI understand:
- What each field represents in healthcare terms
- How fields relate to real-world concepts
- What values are typical or important

**Example:**

**Without rich metadata:**
```
User: "Show me expensive denied claims"
AI: ❓ What's "expensive"? Which field has the amount?
```

**With rich metadata:**
```
User: "Show me expensive denied claims"
AI: ✓ "expensive" → chargeCents > 100000 ($1000)
AI: ✓ "denied" → status = "DENIED"
AI: ✓ Returns accurate results!
```

### 3.2 Enhance Claims Model

Open `claimsight/metadata/Claims.hml` and find the `ObjectType` section.

Update it with these enhanced descriptions:

```yaml
---
kind: ObjectType
version: v1
definition:
  name: Claims
  description: |
    Medical claims submitted for healthcare services. Each claim represents a request
    for payment from a healthcare provider for services rendered to a member. Claims
    can be PAID (approved), DENIED (rejected), or PENDING (under review). The charge
    amount is what the provider billed, while the allowed amount is what the insurance
    plan approved for payment. Common denial reasons include lack of prior authorization,
    out-of-network providers, or services not covered by the member's plan.
  fields:
    - name: id
      type: Uuid!
      description: Unique claim identifier (UUID format)
    - name: memberId
      type: Uuid!
      description: Reference to the member (patient) who received the service. Links to members table.
    - name: providerId
      type: Uuid!
      description: Reference to the healthcare provider who performed the service. Links to provider_records table.
    - name: dos
      type: Date!
      description: |
        Date of Service - when the medical service was actually performed.
        Format: YYYY-MM-DD. Used for eligibility checks and timely filing requirements.
    - name: cpt
      type: String_1!
      description: |
        Current Procedural Terminology code - standardized 5-digit code for medical procedures.
        Examples: 99213 (office visit), 70450 (CT scan head), 80053 (metabolic panel).
        Used for billing and determining allowed amounts. Each CPT has an associated fee schedule.
    - name: status
      type: String_1!
      description: |
        Claim processing status. Three possible values:
        - PAID: Claim was approved and payment processed to provider
        - DENIED: Claim was rejected (see denialReason for why)
        - PENDING: Claim is under review, awaiting adjudication decision
    - name: chargeCents
      type: Int32!
      description: |
        Amount charged by the provider in cents (divide by 100 for dollars).
        This is what the provider billed, not necessarily what gets paid.
        Example: 125000 = $1,250.00. Always >= allowedCents.
    - name: allowedCents
      type: Int32!
      description: |
        Amount allowed/approved by the insurance plan in cents (divide by 100 for dollars).
        This is what the insurance will actually pay according to the fee schedule.
        Zero if claim was denied. Always <= chargeCents.
        The difference (chargeCents - allowedCents) may be billed to the member.
    - name: denialReason
      type: String_1
      description: |
        Reason the claim was denied (only populated when status is DENIED).
        Common reasons in this dataset:
        - "Prior authorization required" - Service needed pre-approval
        - "Out of network provider" - Provider not in plan network
        - "Service not covered" - Procedure not included in plan benefits
        - "Medical necessity not established" - Clinical justification insufficient
        - "Duplicate claim" - Already paid for this service/date
    - name: createdAt
      type: Timestamptz!
      description: Timestamp when the claim was first submitted to the system
    - name: updatedAt
      type: Timestamptz!
      description: Timestamp when the claim was last modified (status change, resubmission, etc.)
  graphql:
    typeName: Claims
    inputTypeName: ClaimsInput
  dataConnectorTypeMapping:
    - dataConnectorName: postgres
      dataConnectorObjectType: claims
      fieldMapping:
        id:
          column:
            name: id
        memberId:
          column:
            name: member_id
        providerId:
          column:
            name: provider_id
        dos:
          column:
            name: dos
        cpt:
          column:
            name: cpt
        status:
          column:
            name: status
        chargeCents:
          column:
            name: charge_cents
        allowedCents:
          column:
            name: allowed_cents
        denialReason:
          column:
            name: denial_reason
        createdAt:
          column:
            name: created_at
        updatedAt:
          column:
            name: updated_at
```

**Pro tip:** Keep the rest of the file unchanged - just update the `ObjectType` section.

### 3.3 Enhance Members Model

Open `claimsight/metadata/Members.hml` and update the `ObjectType` section:

```yaml
---
kind: ObjectType
version: v1
definition:
  name: Members
  description: |
    Insurance plan members (patients) enrolled in healthcare coverage.
    Members can have multiple claims and eligibility checks. Each member
    has a unique member number used for claims processing and verification.
  fields:
    - name: id
      type: Uuid!
      description: Unique member identifier (UUID format)
    - name: firstName
      type: String_1!
      description: Member's legal first name as it appears on insurance card
    - name: lastName
      type: String_1!
      description: Member's legal last name as it appears on insurance card
    - name: dob
      type: Date!
      description: |
        Date of birth in YYYY-MM-DD format. Used for:
        - Eligibility verification and identity confirmation
        - Age-based coverage rules (pediatric vs adult benefits)
        - Dependent eligibility (children under 26 may be on parent's plan)
        - Medicare eligibility (over 65 qualifies for Medicare)
    - name: memberNumber
      type: String_1!
      description: |
        Unique member ID number used for claims processing and eligibility checks.
        This appears on the member's insurance card and must be included on all claim forms.
        Format varies by payer but typically alphanumeric (e.g., ABC123456789).
    - name: plan
      type: String_1!
      description: |
        Insurance plan type. Three common types:
        - HMO (Health Maintenance Organization): Requires in-network providers, PCP selection, referrals for specialists
        - PPO (Preferred Provider Organization): Allows out-of-network at higher cost, no referrals needed
        - EPO (Exclusive Provider Organization): In-network only except emergencies, no referrals needed
        Plan type affects coverage, cost-sharing, and claim approval.
    - name: groupNumber
      type: String_1!
      description: |
        Group number for employer-sponsored insurance plans.
        Identifies the employer group purchasing the coverage.
        Used for benefits configuration and premium billing.
    - name: effectiveDate
      type: Date!
      description: |
        Date when coverage became active (YYYY-MM-DD).
        Claims with DOS before this date will be denied.
        Also called "coverage start date" or "enrollment date".
    - name: terminationDate
      type: Date
      description: |
        Date when coverage ended (YYYY-MM-DD), null if currently active.
        Claims with DOS after this date will be denied.
        Termination reasons include: job change, non-payment, death, age out (for dependents).
    - name: createdAt
      type: Timestamptz!
      description: Timestamp when member record was first created in the system
    - name: updatedAt
      type: Timestamptz!
      description: Timestamp when member record was last updated (plan change, address update, etc.)
  graphql:
    typeName: Members
    inputTypeName: MembersInput
  dataConnectorTypeMapping:
    - dataConnectorName: postgres
      dataConnectorObjectType: members
      fieldMapping:
        id:
          column:
            name: id
        firstName:
          column:
            name: first_name
        lastName:
          column:
            name: last_name
        dob:
          column:
            name: dob
        memberNumber:
          column:
            name: member_number
        plan:
          column:
            name: plan
        groupNumber:
          column:
            name: group_number
        effectiveDate:
          column:
            name: effective_date
        terminationDate:
          column:
            name: termination_date
        createdAt:
          column:
            name: created_at
        updatedAt:
          column:
            name: updated_at
```

### 3.4 Enhance ProviderRecords Model

Open `claimsight/metadata/ProviderRecords.hml` and update the `ObjectType` section:

```yaml
---
kind: ObjectType
version: v1
definition:
  name: ProviderRecords
  description: |
    Healthcare providers (doctors, hospitals, clinics) in the network.
    Providers submit claims for services rendered to members. Network status
    determines reimbursement rates and member cost-sharing.
  fields:
    - name: id
      type: Uuid!
      description: Unique provider identifier (UUID format)
    - name: npi
      type: String_1!
      description: |
        National Provider Identifier - unique 10-digit identifier for US healthcare providers.
        Required for all HIPAA-compliant transactions. Example: 1234567890.
        NPIs are issued by CMS and never change, even if provider moves or changes practice.
    - name: name
      type: String_1!
      description: |
        Provider's full name (for individuals) or facility name (for organizations).
        Examples: "Dr. Sarah Johnson" or "City General Hospital" or "Main Street Clinic"
    - name: specialty
      type: String_1!
      description: |
        Medical specialty or practice area. Common specialties in this dataset:
        - Cardiology (heart and cardiovascular system)
        - Orthopedic Surgery (bones, joints, muscles)
        - Family Medicine (primary care for all ages)
        - Radiology (medical imaging: X-rays, CT, MRI)
        - Internal Medicine (adult primary care)
        - Pediatrics (children's health)
        Specialty affects fee schedules and authorization requirements.
    - name: networkStatus
      type: String_1!
      description: |
        Network participation status. Three possible values:
        - IN_NETWORK: Has contract with plan, negotiated rates, lower member cost-sharing
        - OUT_OF_NETWORK: No contract, higher rates, higher member cost, claims may be denied
        - PENDING: Credentialing in progress, cannot accept claims yet
        Out-of-network claims often denied or paid at reduced rate.
    - name: phone
      type: String_1
      description: Primary contact phone number for the provider's office (format: XXX-XXX-XXXX)
    - name: email
      type: String_1
      description: Primary contact email address for administrative communication
    - name: addressLine1
      type: String_1!
      description: Street address line 1 (street number and name)
    - name: addressLine2
      type: String_1
      description: Street address line 2 (suite, building, floor, etc.)
    - name: city
      type: String_1!
      description: City name
    - name: state
      type: String_1!
      description: US state (2-letter abbreviation, e.g., CA, NY, TX)
    - name: zipCode
      type: String_1!
      description: ZIP code (5-digit or 9-digit format)
    - name: createdAt
      type: Timestamptz!
      description: Timestamp when provider was added to the system
    - name: updatedAt
      type: Timestamptz!
      description: Timestamp when provider record was last updated (address change, network status update, etc.)
  graphql:
    typeName: ProviderRecords
    inputTypeName: ProviderRecordsInput
  dataConnectorTypeMapping:
    - dataConnectorName: postgres
      dataConnectorObjectType: provider_records
      fieldMapping:
        id:
          column:
            name: id
        npi:
          column:
            name: npi
        name:
          column:
            name: name
        specialty:
          column:
            name: specialty
        networkStatus:
          column:
            name: network_status
        phone:
          column:
            name: phone
        email:
          column:
            name: email
        addressLine1:
          column:
            name: address_line1
        addressLine2:
          column:
            name: address_line2
        city:
          column:
            name: city
        state:
          column:
            name: state
        zipCode:
          column:
            name: zip_code
        createdAt:
          column:
            name: created_at
        updatedAt:
          column:
            name: updated_at
```

### 3.5 Rebuild with Enhanced Metadata

After updating the descriptions, rebuild the supergraph:

```bash
cd hasura-ddn/

# Rebuild to incorporate new metadata
ddn supergraph build local
```

**Expected output:**
```
INF Using Supergraph config file "supergraph.yaml"
INF Using localEnvFile ".env"
INF Supergraph built for local Engine successfully
INF Build artifacts exported to "engine/build"
```

You may see warnings about boolean expressions - these are safe to ignore.

### 3.6 Restart DDN Engine

Restart the engine to load the new metadata:

```bash
# Stop current engine (Ctrl+C in the terminal where it's running)
# Or if running in background:
docker compose down

# Start with new metadata
ddn run docker-start
```

**Wait for:**
```
engine-1 | starting server on [::]:3000
```

Your enhanced semantic metadata is now active!

---

## 📚 Part 4: Access PromptQL Console

### 4.1 Open PromptQL Console

Navigate to the **Hasura Cloud PromptQL Console** that connects to your **local** DDN:

```
https://console.hasura.io/local/chat
```

**Important:** This is a cloud-hosted UI that connects to `localhost:3280`. Your data stays local!

### 4.2 Configure Local Connection

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

### 4.3 Configure OpenAI

In the console:

1. Click the **Settings** icon (gear) in top right
2. Under **LLM Provider**, select **OpenAI**
3. Paste your OpenAI API key from Part 1.3
4. Click **Save**

You should see:
```
✓ OpenAI API key configured
✓ Model: gpt-4-turbo-preview
```

### 4.4 Interface Overview

You should now see:
- **Chat input** box at the bottom
- **Conversation** area in the middle
- **Query Plan** panel (expandable)
- **Results** section
- **Artifacts** tab

---

## 📚 Part 5: Chat with Your Data

### 5.1 Try Basic Queries

Let's start with simple questions to understand how PromptQL works.

**Query 1: Explore Claims**

Type in the chat:
```
Show me the 5 most recent claims
```

**What happens:**
1. You type the question
2. OpenAI reads your schema + semantic metadata
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

---

**Query 2: Analyze Denials**

```
What are the top 3 denial reasons and how many claims were denied for each?
```

**Expected:**
- Groups by `denialReason`
- Counts claims per reason
- Sorts by count descending
- Returns top 3

**What the AI understands** (thanks to your semantic metadata):
- "denied" → `status = "DENIED"`
- "denial reasons" → `denialReason` field
- "how many" → COUNT aggregation

---

**Query 3: Filter by Amount**

```
Find all denied claims where the provider charged over $1000
```

**What the AI understands:**
- "$1000" → `100000` cents (from your metadata: "divide by 100 for dollars")
- "denied" → `status = "DENIED"`
- "provider charged" → `chargeCents` field (not allowedCents)

This is WHY semantic metadata is so important!

---

**Query 4: Cross-Model Analysis**

```
Show me all claims from cardiologists that were denied
```

**What this tests:**
- Relationship traversal: Claims → ProviderRecords
- Filter on relationship: `specialty = "Cardiology"`
- Filter on claim: `status = "DENIED"`

**Expected GraphQL:**
```graphql
query {
  claims(
    where: {
      status: { _eq: "DENIED" }
      provider: { specialty: { _eq: "Cardiology" } }
    }
  ) {
    id
    dos
    cpt
    chargeCents
    denialReason
    provider {
      name
      specialty
    }
  }
}
```

---

**Query 5: Time-Based Analysis**

```
How many claims were created each day in the last week?
```

**What this tests:**
- Date filtering: `createdAt > (now - 7 days)`
- Date grouping: Group by date
- Aggregation: COUNT

---

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

**Expected to show:** Members who have received the most insurance payouts.

---

### 5.2 Understanding Query Plans

Click **"Show Query Plan"** on any result to see:

**1. Understanding Phase:**
```
User wants to find denied claims over $1000.

Key terms identified:
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
Limit: 100 (safety limit)
```

### 5.3 Understanding Confidence Scores

Each response includes a reliability score:

- **90-100%**: High confidence - AI clearly understood your intent
- **70-89%**: Medium confidence - likely correct, but worth verifying
- **Below 70%**: Low confidence - review the query plan carefully

**If confidence is low:**
1. Rephrase using more specific terms from your metadata
2. Break complex questions into simpler parts
3. Use exact field names: "Show me claims where status is DENIED"

### 5.4 Complex Healthcare Queries

Try these advanced queries:

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

**Query 11: Member Coverage Gaps**
```
Show me members whose coverage has terminated but who have pending claims
```

**Query 12: Out-of-Network Impact**
```
Compare the denial rate for in-network vs out-of-network providers
```

---

## 📚 Part 6 (Optional): Create Automations

Automations convert ad-hoc questions into reusable, parameterized workflows.

### 6.1 What are Automations?

**Before (manual query):**
```
Show me denied claims for member ABC-123 from the last 30 days
```
*Every time you need this, you have to type it again and change the member ID.*

**After (automation):**
```yaml
name: DeniedClaimsForMember
parameters:
  - member_id (required)
  - days_back (default: 30)
```

Now you can run:
```
DeniedClaimsForMember for member ABC-123
```
or
```
DeniedClaimsForMember for member ABC-123 in last 60 days
```

### 6.2 Create Your First Automation

**Step 1:** Have a conversation with a specific example:
```
Show me all denied claims for member a9235834-0656-41bb-9538-da2b935255a0 in the last 30 days
```

**Step 2:** PromptQL responds with results

**Step 3:** Click **"Create Automation"** button

**Step 4:** Configure the automation:
- **Name:** `DeniedClaimsForMember`
- **Description:** "Returns denied claims for a member in specified timeframe"
- **Parameters:**
  - `member_id` (UUID, required)
  - `days_back` (Int, default: 30)

**Step 5:** Click **"Save Automation"**

### 6.3 Use Automations

**In PromptQL console:**
```
Run DeniedClaimsForMember for member a9235834-0656-41bb-9538-da2b935255a0
```

**Via DDN CLI:**
```bash
# Save automation to your local project
ddn promptql-program add DeniedClaimsForMember

# This creates: claimsight/metadata/DeniedClaimsForMember.hml
```

### 6.4 Example Automation Ideas

**Automation 1: High-Risk Members**
```
Parameter: risk_threshold (default: 3)

Find members with:
- More than {risk_threshold} denied claims in 6 months
- Total claim amount > $10,000
- Claims from more than 5 different providers

Return: member ID, name, claim count, total amount
```

**Automation 2: Provider Performance Report**
```
Parameter: provider_id

For provider {provider_id}, show:
- Total claims (last 90 days)
- Approval rate
- Average allowed amount
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

### 6.5 View Saved Automations

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

## 📊 Phase 7.5 Complete: What You've Learned

✅ **OpenAI Integration** - Using GPT-4 for natural language to GraphQL conversion
✅ **Semantic Metadata** - Rich business context descriptions for AI understanding
✅ **PromptQL Console** - Chatting with your local database using natural language
✅ **Query Plans** - Understanding how AI interprets and executes questions
✅ **Confidence Scores** - Evaluating AI accuracy and query reliability
✅ **Automations** - Creating reusable parameterized workflows from conversations
✅ **Local-First Development** - All data stays on your machine, only queries sent to OpenAI

---

## 🎯 Next Steps

### Option A: Enhance Your Semantic Metadata

Add descriptions to the remaining models:
- `Notes.hml` - Clinical notes and documentation
- `EligibilityChecks.hml` - Coverage verification records

The better your descriptions, the more accurate the AI responses!

### Option B: Build More Automations

Create a library of healthcare workflows:
- Member risk scoring
- Provider performance tracking
- Fraud detection patterns
- Cost trend analysis

### Option C: Integrate with Your Application

Build a frontend chat interface that:
- Calls the PromptQL endpoint
- Displays results in your app UI
- Saves favorite queries for quick access

### Option D: Explore Advanced Features

- Add relationship descriptions for cross-model queries
- Configure multiple LLM providers (fallback options)
- Set up query result caching for common questions

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to console.hasura.io/local/chat"

**Cause:** Browser security blocking localhost connections from HTTPS site.

**Solutions:**
1. **Use Chrome** - Best compatibility with localhost connections
2. **Use Firefox** with security settings adjusted
3. **Use local console:** `ddn console --local` then click PromptQL tab
4. **Use tunnel:** `ddn run tunnel` for HTTPS localhost

---

### Issue: "PromptQL queries return errors"

**Cause:** OpenAI API key issue or environment variable not loaded.

**Solution:**
```bash
# Verify key in .env
cd hasura-ddn/
grep OPENAI_API_KEY .env

# Test key directly
curl https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer $(grep OPENAI_API_KEY .env | cut -d= -f2)" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4-turbo-preview","max_tokens":10,"messages":[{"role":"user","content":"test"}]}'

# If key is valid, restart DDN engine
ddn run docker-start
```

---

### Issue: "Low confidence scores on all queries"

**Cause:** Insufficient or unclear semantic metadata.

**Solution:**
1. Review Part 3 - enhance descriptions with more business context
2. Add examples in descriptions: "Example: 99213 (office visit)"
3. Explain relationships: "Links to members table"
4. Rebuild: `ddn supergraph build local`
5. Restart: `ddn run docker-start`

---

### Issue: "Query returns wrong results"

**Cause:** AI misunderstood the question.

**Solution:**
1. Click "Show Query Plan" to see AI's interpretation
2. Identify where misunderstanding occurred
3. Rephrase using exact field names from metadata
4. Be more specific: "Show me claims where status field equals DENIED"

---

### Issue: "Service failed to restart after metadata changes"

**Cause:** Syntax error in .hml file or environment variable issue.

**Solution:**
```bash
# Check build for errors
ddn supergraph build local --verbose

# Verify environment variables
grep -E "(OPENAI|PROMPTQL)" .env

# Check Docker logs
docker logs hasura-ddn-engine-1
```

---

### Issue: "OpenAI API rate limit exceeded"

**Cause:** Too many requests in short time period.

**Solution:**
- Wait a few minutes before trying again
- Check your usage: https://platform.openai.com/usage
- Consider caching common queries
- Upgrade OpenAI account tier if needed

---

## 💡 Pro Tips

### Tip 1: Start Simple, Add Context Gradually

**Iteration 1:**
```
Show me claims
```
→ Works, but basic results

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

---

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

---

### Tip 3: Review Query Plans to Improve Metadata

When AI misunderstands:
1. Check the query plan to see what it thought you meant
2. Identify the confusion point
3. Add clarifying descriptions to your metadata
4. Rebuild and try again

This creates a feedback loop that continuously improves your AI's accuracy.

---

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

---

### Tip 5: Combine PromptQL with Traditional Queries

**Use PromptQL for:**
- ✅ Exploration and discovery
- ✅ Ad-hoc analysis
- ✅ Business user self-service
- ✅ Rapid prototyping

**Use GraphQL directly for:**
- ✅ Production application queries
- ✅ Performance-critical operations
- ✅ Complex custom logic
- ✅ Predictable, high-volume requests

---

## 🔒 Data Privacy

**What stays local:**
- ✅ Your PostgreSQL database
- ✅ All claim, member, provider data
- ✅ DDN engine and connectors
- ✅ Query results

**What goes to OpenAI:**
- ⚠️ Your natural language question
- ⚠️ GraphQL schema structure (table/field names, types)
- ⚠️ Metadata descriptions
- ❌ **NOT your actual data**

**How it works:**
1. You ask: "Show me denied claims over $1000"
2. OpenAI sees: Schema + question → Generates GraphQL query
3. Query runs locally against your database
4. Results stay on your machine
5. Only the generated query (not results) might be logged by OpenAI

---

## 📚 Resources

- [PromptQL Documentation](https://promptql.io/docs/)
- [OpenAI API Documentation](https://platform.openai.com/docs/)
- [DDN CLI Reference](https://hasura.io/docs/3.0/cli/overview/)
- [Semantic Metadata Guide](https://promptql.io/docs/reference/metadata-reference/)

---

**🎉 Congratulations!** You've added AI-powered natural language queries to your local ClaimSight DDN!

[← Back to Phase 7: Hasura DDN](../phase-7-hasura-ddn/README.md) | [Back to Labs Overview →](../README.md)
