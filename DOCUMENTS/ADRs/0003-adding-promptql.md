# ADR 0003: PromptQL for Natural Language Database Queries

**Status:** Accepted (Concept Demonstration)
**Date:** 2024-03-15
**Deciders:** Product & Engineering Team

## Context

ClaimSight users (claims managers, analysts, executives) need to explore data without SQL knowledge. Current options:
1. Pre-built reports with fixed parameters
2. Custom dashboard development per request
3. Direct database access (requires SQL skills)

We want to enable ad-hoc data exploration for non-technical users.

## Decision

We will include **PromptQL concepts** in ClaimSight as a learning example and future capability demonstration.

**Note:** This ADR documents the *concept* and examples, not a full production implementation.

## Rationale

### Advantages of Natural Language Queries

**1. Accessibility**
- Non-technical users can explore data
- No SQL knowledge required
- Reduces dependency on engineers/analysts

**2. Speed**
- Instant insights without waiting for reports
- Ad-hoc exploration becomes feasible
- Iterative query refinement

**3. Accuracy**
- Business terminology mapped to schema
- Contextual understanding of domain
- Reduced errors from manual SQL

### Why PromptQL Concepts (Not Full Implementation)

**For Learning:**
- Demonstrates modern AI-powered data access
- Shows how to structure schema metadata
- Provides example queries and patterns

**For Future:**
- Foundation for production implementation
- Clear path to integration
- Documented use cases and examples

## Consequences

### Positive
- Users can explore data independently
- Reduced bottleneck on data team
- Better understanding of data needs
- Foundation for future AI features

### Negative (If Fully Implemented)
- Requires LLM integration (OpenAI, etc.)
- Query validation complexity
- Cost of API calls
- Potential for confusing results
- Security concerns (SQL injection via LLM)

### Neutral
- Need to maintain schema documentation
- Business glossary requires updates
- Example queries need curation

## Implementation (Conceptual)

### 1. Schema Configuration
```yaml
tables:
  - name: claims
    description: Medical claims for services
    columns:
      - name: status
        description: "PAID, DENIED, or PENDING"
```

### 2. Business Glossary
```yaml
glossary:
  - term: "PA"
    expansion: "Prior Authorization"
    related_columns:
      - notes.body
      - claims.denial_reason
```

### 3. Query Patterns
```yaml
prompt_patterns:
  - pattern: "top {n} denial reasons"
    template: |
      SELECT denial_reason, COUNT(*) as count
      FROM claims WHERE status = 'DENIED'
      GROUP BY denial_reason
      ORDER BY count DESC LIMIT {n}
```

### 4. Example Prompts
Documented in `promptql/examples/`:
- "Show me the top 5 denial reasons in the last 30 days"
- "For members with notes mentioning 'step therapy', show their info"
- "List high-value claims with denial history"

## Architecture (Future Production)

```
User Prompt
  ↓
LLM (GPT-4, Claude)
  + Schema Context
  + Business Glossary
  + Few-Shot Examples
  ↓
Generated SQL
  ↓
Validation Layer
  ↓
PostgreSQL Execution
  ↓
Results to User
```

## Security Considerations

### Query Validation (Required for Production)
- Whitelist allowed operations (SELECT only)
- Block dangerous operations (DROP, DELETE)
- Apply RLS policies
- Limit result size
- Timeout long queries

### Access Control
- Role-based query capabilities
- Audit log all queries
- Rate limiting
- Cost tracking (LLM API calls)

## Alternatives Considered

### 1. Pre-Built Dashboards
**Pros:** Safe, predictable, no LLM cost
**Cons:** Not flexible, requires engineering for changes
**Chosen for:** Production use today
**PromptQL for:** Future ad-hoc exploration

### 2. Direct SQL Access
**Pros:** Maximum flexibility
**Cons:** Requires SQL skills, security risk
**Rejected for:** Non-technical users

### 3. Cube.js Semantic Layer
**Pros:** Strong data modeling, API-first
**Cons:** Still requires defining queries, not natural language
**Rejected because:** Doesn't solve the natural language requirement

### 4. Langchain SQL Agent
**Pros:** Open-source, customizable
**Cons:** Requires Python, more complex setup
**Considered for:** Future implementation

## Roadmap

### Phase 1: Concepts & Examples (Current)
- ✅ Schema documentation
- ✅ Example prompts and queries
- ✅ Sample results
- ✅ Business glossary

### Phase 2: POC Integration (Future)
- LLM integration (OpenAI/Anthropic)
- Query validation layer
- Simple UI for prompts
- Result rendering

### Phase 3: Production (Future)
- Advanced query validation
- Comprehensive audit logging
- Cost optimization
- User feedback loop
- Query caching

## Success Metrics (If Implemented)

- Time to insight reduced by 70%
- Self-service queries increase 3x
- Data team tickets reduce 50%
- User satisfaction score > 4.5/5

## Related ADRs
- ADR 0001: Hasura for GraphQL API
- ADR 0002: Apollo Client for frontend

## References
- [Langchain SQL Agent](https://python.langchain.com/docs/use_cases/sql/)
- [Text-to-SQL Research](https://arxiv.org/abs/2204.00498)
- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)
- [PostgreSQL Full-Text Search](https://www.postgresql.org/docs/current/textsearch.html)
