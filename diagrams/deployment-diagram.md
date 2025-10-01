# ClaimSight Deployment Diagram (Cross-Platform, No Docker)

```mermaid
graph TB
    subgraph Browser["🌐 Web Browser<br/>(Chrome, Firefox, Safari, Edge)"]
        SPA[ClaimSight UI<br/>SPA<br/>Apollo Client connects<br/>via HTTP + WebSocket]
    end

    subgraph DevMachine["💻 Developer Machine<br/>(Windows, macOS, or Linux)"]

        subgraph NodeRuntime["Node.js 18+ LTS Runtime"]
            ViteDev[Vite Dev Server<br/>Port 5173<br/>React app with HMR]
            ActionHandler[Eligibility Action Handler<br/>Port 4000<br/>Express mock service]
            ApolloSubgraph[Apollo Subgraph Optional<br/>Port 4001<br/>Provider ratings service]
            Seeder[Database Seeder<br/>Node script<br/>Uses pg library, no psql required]
        end

        subgraph HasuraBinary["Hasura CLI/Binary (Standalone)"]
            HasuraEngine[Hasura GraphQL Engine<br/>Port 8080<br/>Metadata + migrations<br/>applied via CLI]
        end

        subgraph PostgresNative["PostgreSQL 15+ (Native install or managed)"]
            PostgresDB[(claimsight_db<br/>Tables: members, providers,<br/>claims, notes, eligibility_checks)]
        end

        subgraph PromptQLEnv["PromptQL Engine (Python/Node)"]
            PromptQL[PromptQL Service<br/>Port 5000 optional<br/>Natural language query interface]
        end
    end

    SPA -->|HTTPS<br/>Port 5173| ViteDev
    SPA -->|GraphQL HTTP<br/>Port 8080| HasuraEngine
    SPA -->|GraphQL WSS subscriptions<br/>Port 8080| HasuraEngine

    ViteDev -->|GraphQL queries/mutations<br/>Port 8080| HasuraEngine
    HasuraEngine -->|SQL with RLS<br/>Port 5432| PostgresDB
    HasuraEngine -->|REST<br/>Port 4000| ActionHandler

    ApolloSubgraph -->|SQL optional<br/>Port 5432| PostgresDB
    Seeder -->|SQL INSERT<br/>Port 5432| PostgresDB
    PromptQL -->|Generated SQL<br/>Port 5432| PostgresDB

    style SPA fill:#61DAFB,color:#000
    style ViteDev fill:#646CFF,color:#fff
    style HasuraEngine fill:#1EB4D4,color:#fff
    style PostgresDB fill:#336791,color:#fff
    style PromptQL fill:#E74C3C,color:#fff
```

## Cross-Platform Setup

**Scripts Available:**
- PowerShell (`.ps1`) and Bash (`.sh`) scripts
- `npm run setup`, `seed`, `hasura:apply`, `dev`
- No Docker, no symlinks, no Bash-only tools
- Works on Windows corporate laptops, macOS, Linux

**Environment:**
- `.env` file with connection strings
- `cross-env` for OS-agnostic env vars
- `concurrently` for parallel process management

## Installation by Platform

### PostgreSQL Installation

| Platform | Installation Method |
|----------|-------------------|
| **Windows** | PostgreSQL installer or `choco install postgresql` |
| **macOS** | `brew install postgresql@15` |
| **Linux** | `apt install postgresql-15` or `yum install postgresql15-server` |

**Connection managed via `.env`:**
```
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=your_password
PGDATABASE=claimsight_db
```

### Hasura CLI Installation

| Platform | Installation Method |
|----------|-------------------|
| **Windows** | Scoop: `scoop install hasura-cli` or [direct binary download](https://hasura.io/docs/latest/hasura-cli/install-hasura-cli/) |
| **macOS** | `brew install hasura-cli` |
| **Linux** | `curl -L https://github.com/hasura/graphql-engine/raw/stable/cli/get.sh \| bash` |

**Metadata/migrations:**
- Stored in `hasura/` folder
- Applied via: `hasura metadata apply && hasura migrate apply`
