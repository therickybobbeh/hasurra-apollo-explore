# PromptQL for ClaimSight

Natural language to SQL query examples using PromptQL concepts.

## What is PromptQL?

PromptQL is a conceptual approach to querying databases using natural language. Instead of writing SQL, users can ask questions in plain English and get structured query results.

## Configuration

The `config/promptql.config.yml` file defines:
- Database connection details
- Schema information (tables, columns, relationships)
- Business glossary (domain-specific terms)
- Query patterns and templates

## Examples

See the `examples/` directory for:

1. **`prompts.md`** - 10 natural language prompts
2. **`queries.md`** - Generated SQL from those prompts
3. **`results.md`** - Sample query results with insights

## Sample Prompts

```
Show me the top 5 denial reasons in the last 30 days with counts
```

```
For members with notes mentioning "step therapy", show me their member ID, name, and note content
```

```
List members with allowed amount greater than $1,000 and any denial history
```

## Key Features Demonstrated

### 1. Aggregation Queries
- Top denial reasons
- Provider performance metrics
- Plan comparisons

### 2. Full-Text Search
- Search notes for healthcare terms
- PA, step therapy, appeal mentions

### 3. Complex Joins
- Multi-table correlations
- Member + Claims + Notes
- Temporal analysis

### 4. Business Logic
- Denial rate calculations
- High-value claim identification
- Time-based filters

## Using with ClaimSight

### Option 1: Direct PostgreSQL

Connect PromptQL to the PostgreSQL database:

```yaml
database:
  type: postgresql
  connection:
    host: localhost
    port: 5432
    database: claimsight
    user: claimsight
    password: your_password
```

### Option 2: Via Hasura GraphQL

Alternative approach using Hasura's GraphQL endpoint:

```yaml
graphql:
  endpoint: http://localhost:8080/v1/graphql
  admin_secret: your_admin_secret
```

## Testing Queries

To test the example queries:

1. Ensure database is seeded:
```bash
npm run seed
```

2. Connect to PostgreSQL:
```bash
psql -d claimsight
```

3. Copy and paste SQL from `examples/queries.md`

4. Analyze results

## Business Value

PromptQL enables non-technical users to:
- **Claims Managers** - Identify denial trends without SQL knowledge
- **Case Managers** - Search member notes efficiently
- **Analysts** - Explore data with natural language
- **Executives** - Get quick insights via conversational queries

## Schema Coverage

The configuration covers all ClaimSight tables:
- `members` - Patient demographics
- `providers` - Healthcare provider details
- `claims` - Medical claims with status and financial info
- `notes` - Case management notes (with full-text search)
- `eligibility_checks` - Verification results (JSONB queries)

## Advanced Features

### Glossary Terms
Business terms like "PA" (Prior Authorization) and "step therapy" are mapped to database columns for context-aware querying.

### Query Patterns
Common query patterns are templated for reuse:
- Top N analysis
- Member filtering
- Time-based aggregation

### Full-Text Search
Notes table uses PostgreSQL's full-text search capabilities for natural language search.

## Production Considerations

For production use of PromptQL:

1. **Access Control** - Implement role-based query restrictions
2. **Query Limits** - Set timeouts and result size limits
3. **Caching** - Cache frequent queries for performance
4. **Audit Logging** - Track who runs what queries
5. **Query Review** - Validate generated SQL before execution

## Resources

- [PostgreSQL Full-Text Search](https://www.postgresql.org/docs/current/textsearch.html)
- [SQL Query Optimization](https://www.postgresql.org/docs/current/performance-tips.html)
- [Healthcare Data Standards](https://www.hl7.org/)
- [Natural Language to SQL Research](https://arxiv.org/abs/2204.00498)

## Example Implementation

For a working PromptQL implementation, consider:
- [Langchain SQL Agent](https://python.langchain.com/docs/use_cases/sql/)
- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)
- [Semantic Kernel](https://github.com/microsoft/semantic-kernel)
