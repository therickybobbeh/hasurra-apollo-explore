# Claude Code Prompt — Cross-Platform, No Docker

You are an expert full-stack engineer. Scaffold a project called **ClaimSight** that teaches GraphQL + Hasura + Apollo + PromptQL without Docker, and works identically on Windows, macOS, and Linux.

---

## Cross-Platform Constraints (must follow)

1. **No Docker.** Provide native setup for Postgres + Hasura.

2. **No Bash-only tooling.**
   - Provide both **PowerShell** (`.ps1`) and **Bash** (`.sh`) helper scripts for all tasks.
   - All NPM scripts must be OS-agnostic using `cross-env` and `concurrently`; no `&&` chains that break on Windows CMD.

3. **No symlinks.** Avoid features that fail on Windows corp devices.

4. **Line endings:** set `.gitattributes` to normalize to LF on commit and allow local checkout as is. Avoid shebang reliance.

5. **Paths:** never hardcode `/`; use Node path helpers in any tooling scripts.

6. **Postgres tooling:** don't require `psql`. Provide a Node seeder using `pg` so Windows users aren't blocked if psql isn't installed.

7. **Hasura CLI:** document install for Windows/macOS/Linux; include CLI metadata/migrations so repo is reproducible.

8. **Env files:** use `.env` + `.env.example`; load via `dotenv`. Never commit secrets.

---

## What to Build

A minimal, production-adjacent learning app:

- **Postgres 15+ schema + Node seeder** (no psql requirement).
- **Hasura GraphQL Engine** (standalone binary or Hasura Cloud).
  Track tables/relationships, RLS with roles, one Action calling a mock REST, subscriptions on claims.
- **React (Vite) + TypeScript + Apollo Client** with HTTP + WS links, optimistic updates, fragments.
- **Optional Apollo Server subgraph** (Node) to demo federation by enriching `Provider.rating`.
- **PromptQL config + example natural-language queries** over the same data.
- **A DOCUMENTS/ folder** containing UML diagrams, best practices, architecture overview, learning checklist, and ADRs.
- **Cross-platform scripts** to run everything from a fresh machine.

---

## Repo Layout (create exactly this)

```
claimsight/
  .gitattributes
  .gitignore
  .editorconfig
  .env.example
  README.md

  scripts/
    setup.ps1
    setup.sh
    start-all.ps1
    start-all.sh
    seed.ps1
    seed.sh
    apply-hasura.ps1
    apply-hasura.sh

  db/
    schema.sql
    indexes.sql
    rls.sql
    seed-data.json              # generated or static
    seed.js                     # Node seeder using `pg`
    knexfile.cjs                # optional (don't require knex globally)
    README.md

  hasura/
    metadata/
    migrations/
    actions/
      handlers/
        eligibility.mock.ts     # tiny mock REST handler (Node/Express)
      actions.yaml
    README.md

  app/
    client/
      src/
        apollo/
          client.ts
        components/
        pages/
        graphql/                # .graphql ops and fragments
        router.tsx
      index.html
      vite.config.ts
      tsconfig.json
      package.json
      README.md

    server/                     # optional Apollo subgraph (federation)
      src/
        index.ts
        ratings.json
        schema.graphql
      tsconfig.json
      package.json
      README.md

  promptql/
    config/
      promptql.config.yml
    examples/
      prompts.md
      queries.md
      results.md
    package.json
    README.md

  DOCUMENTS/
    UML/
      context-diagram.puml
      component-diagram.puml
      sequence-claim-detail.puml
      deployment-diagram.puml
    BEST_PRACTICES.md
    ARCHITECTURE_OVERVIEW.md
    LEARNING_CHECKLIST.md
    ADRs/
      0001-hasura-vs-custom-resolvers.md
      0002-why-apollo-client.md
      0003-adding-promptql.md
    README.md
```

---

## Domain & Data (implement)

### Tables (UUID PKs, sensible FKs + indexes):

- **members**(id, first_name, last_name, dob DATE, plan TEXT)
- **providers**(id, npi TEXT, name TEXT, specialty TEXT)
- **claims**(id, member_id FK, provider_id FK, dos DATE, cpt TEXT, charge_cents INT, allowed_cents INT, status TEXT CHECK ('PAID','DENIED','PENDING'), denial_reason TEXT NULL)
- **eligibility_checks**(id, member_id FK, checked_at TIMESTAMPTZ, result JSONB)
- **notes**(id, member_id FK, created_at TIMESTAMPTZ, body TEXT)

**Seed:** 100–200 rows with realistic mixes (CPT codes, denial reasons like "no PA", "step therapy", "not medically necessary"), plus 20–30 notes containing "PA", "appeal", "step therapy".

---

## Hasura (no Docker)

- Provide CLI metadata/migrations so `apply-hasura.ps1|.sh` performs:
  1. `hasura metadata apply`
  2. `hasura migrate apply`
  3. `hasura metadata reload`

- **Relationships:** members↔claims, providers↔claims, members↔notes, members↔eligibility_checks.

- **Roles & RLS:**
  - Roles: `admin`, `member`, `provider`.
  - `member` sees rows matching `x-hasura-user-id = member_id`.
  - `provider` sees rows where `claims.provider_id = x-hasura-provider-id`.
  - Document sample headers for testing in Hasura console and cURL.

- **Action:** `submitEligibilityCheck(memberId: uuid!): EligibilityCheck!`
  - Calls `eligibility.mock.ts` (Express) which returns fake JSON, then insert into `eligibility_checks`.

- **Subscriptions:** enable on `claims` for list updates.

---

## Frontend (React + Vite + Apollo)

- **GraphQL ops** (in `app/client/src/graphql`):
  - `GET_CLAIMS(memberId, filters)`, `GET_CLAIM(id)` (with member, provider, notes fragments).
  - `ADD_NOTE(memberId, body)` ⇒ optimistic cache update.
  - `CLAIMS_UPDATED` subscription ⇒ toast + list refresh.

- **Apollo setup** (`client.ts`):
  - HTTP link + WS link (`graphql-ws`) with split.
  - Inject dev headers (role/user) from `.env` for quick testing.

- **Pages:**
  - **ClaimsList** (filters: status, date range; pagination).
  - **ClaimDetail** (linked from list).
  - **EligibilityPanel** to run the Action and show last result (pretty-print JSON).

- Clean loading/error states; fragments for reuse; Apollo DevTools-friendly cache IDs.

---

## Optional Apollo Subgraph (Federation)

- Minimal Node service exposing `Provider { id, rating }` from `ratings.json`.
- Provide `schema.graphql` with federation directives; document how a gateway would compose (not required to run).
- Add a sample query including `rating` (feature-flag this field in the client).

---

## PromptQL

- `promptql.config.yml` pointing at Postgres or Hasura GraphQL endpoint.
- **Example prompts** (store raw produced queries + results in `promptql/examples`):
  - "Top 5 denial reasons in the last 30 days with counts."
  - "For Member X, summarize notes mentioning 'step therapy'."
  - "Members with allowed_amount > $1,000 and any denial history."

---

## DOCUMENTS (UML + Docs)

- **UML (PlantUML `.puml`):** context, component, sequence (open claim detail & add note), deployment (native binaries/ports).
- **BEST_PRACTICES.md:** GraphQL fragments, pagination, error handling, optimistic UI; Hasura RLS; when to use Actions vs Remote Schemas; federation basics; testing strategy.
- **ARCHITECTURE_OVERVIEW.md:** data flow, trust boundaries, headers, auth assumptions.
- **LEARNING_CHECKLIST.md:** step-by-step tasks (query → mutation → subscription → action → PromptQL → federation).
- **ADRs:** short, opinionated decisions as listed above.
- **DOCUMENTS/README.md** should link each artifact and mention the repo uses UML in this separate folder for clarity and best practices.

---

## Cross-Platform Scripts (must generate)

All scripts must exist in both **PowerShell** and **Bash** variants and call Node scripts where possible:

- **`scripts/setup.ps1|.sh`**
  - Checks Node 18+, installs Hasura CLI (print platform-specific instructions & links), copies `.env.example → .env`, installs NPM deps (`app/client`, `app/server`, `promptql` if needed).

- **`scripts/seed.ps1|.sh`**
  - Runs `node db/seed.js` (uses `pg` & `.env` connection).

- **`scripts/apply-hasura.ps1|.sh`**
  - Runs Hasura CLI apply steps; prints success summary.

- **`scripts/start-all.ps1|.sh`**
  - Starts Hasura action mock (`eligibility.mock.ts`), client dev server, and optional subgraph concurrently using `concurrently`.
  - Provide `package.json` scripts at repo root that call these.

---

## Root package.json (create)

Include OS-safe scripts (no `&&`), for example:

```json
{
  "private": true,
  "scripts": {
    "setup": "node ./scripts/run-plat.js setup",
    "seed": "node ./scripts/run-plat.js seed",
    "hasura:apply": "node ./scripts/run-plat.js hasura",
    "dev": "node ./scripts/run-plat.js dev"
  },
  "devDependencies": {
    "concurrently": "^9.0.0",
    "cross-env": "^7.0.3",
    "dotenv": "^16.4.0"
  }
}
```

Also generate a tiny Node router `scripts/run-plat.js` that detects platform and invokes the appropriate `.ps1` or `.sh` so users can always run `npm run dev` on any OS without thinking.

---

## Env & Config

- **`.env.example`** with:
  - `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`
  - `HASURA_GRAPHQL_ENDPOINT`, `HASURA_GRAPHQL_ADMIN_SECRET`
  - `GRAPHQL_HTTP_URL`, `GRAPHQL_WS_URL`
  - `DEV_ROLE`, `DEV_MEMBER_ID`, `DEV_PROVIDER_ID`

- Use `cross-env` to pass env vars to Node services on all OSes.

---

## Root README (write clearly)

### Prereqs by OS (Windows/macOS/Linux):
- Node LTS
- Postgres install
- Hasura CLI install

### Quickstart:
1. `cp .env.example .env` (or PowerShell copy variant—include both commands)
2. `npm run setup`
3. Create DB (if needed) and set connection string in `.env`
4. `npm run seed`
5. `npm run hasura:apply`
6. `npm run dev` → starts: Action mock, Client app, (optional) Subgraph

### Role testing:
- Show `curl` and Apollo DevTools header injection examples.

### Troubleshooting (Windows):
- PowerShell execution policy
- Firewall prompts
- WSL optional note (but not required)

---

## Acceptance Criteria (automate simple checks)

- Query claims for a given member, filter by status/date.
- Receive subscription update after a simulated claim status change (seeder can update one row after N seconds).
- Add note shows optimistic UI then confirms.
- Action writes JSON to `eligibility_checks`.
- PromptQL examples produce saved queries/results.
- DOCUMENTS/ UML files render (link to Mermaid Live) and README cross-links work.

---

## Generate All Files

Generate all files, code, scripts, configs, seeds, metadata, and documentation per this spec. Ensure every command works on **Windows, macOS, and Linux**. Favor Node-based scripts over native CLI dependencies to keep it portable.

---

**End of Prompt**
