# PromptQL Generated Queries

SQL queries generated from natural language prompts.

## Query 1: Top 5 Denial Reasons (Last 30 Days)

**Prompt:**
> Show me the top 5 denial reasons in the last 30 days with counts

**Generated SQL:**
```sql
SELECT
  denial_reason,
  COUNT(*) as denial_count,
  ROUND(AVG(charge_cents) / 100.0, 2) as avg_charge_amount
FROM claims
WHERE
  status = 'DENIED'
  AND dos >= CURRENT_DATE - INTERVAL '30 days'
  AND denial_reason IS NOT NULL
GROUP BY denial_reason
ORDER BY denial_count DESC
LIMIT 5;
```

---

## Query 2: Members with Step Therapy Notes

**Prompt:**
> For members with notes mentioning "step therapy", show me their member ID, name, and note content

**Generated SQL:**
```sql
SELECT DISTINCT
  m.id as member_id,
  m.first_name || ' ' || m.last_name as member_name,
  m.plan,
  n.body as note_content,
  n.created_at as note_date
FROM members m
JOIN notes n ON n.member_id = m.id
WHERE
  n.body ILIKE '%step therapy%'
  OR n.body ILIKE '%step-therapy%'
ORDER BY n.created_at DESC;
```

**Alternative (using full-text search):**
```sql
SELECT DISTINCT
  m.id as member_id,
  m.first_name || ' ' || m.last_name as member_name,
  n.body as note_content,
  n.created_at as note_date,
  ts_rank(to_tsvector('english', n.body), to_tsquery('english', 'step & therapy')) as relevance
FROM members m
JOIN notes n ON n.member_id = m.id
WHERE to_tsvector('english', n.body) @@ to_tsquery('english', 'step & therapy')
ORDER BY relevance DESC, n.created_at DESC;
```

---

## Query 3: High-Value Claims with Denials

**Prompt:**
> List members with allowed amount greater than $1,000 and any denial history, sorted by total denied amount

**Generated SQL:**
```sql
WITH member_denials AS (
  SELECT
    c.member_id,
    SUM(CASE WHEN c.status = 'DENIED' THEN c.charge_cents ELSE 0 END) as total_denied_cents,
    COUNT(CASE WHEN c.status = 'DENIED' THEN 1 END) as denial_count,
    MAX(CASE WHEN c.status = 'DENIED' THEN c.denial_reason END) as last_denial_reason
  FROM claims c
  WHERE c.allowed_cents > 100000  -- $1,000 in cents
  GROUP BY c.member_id
  HAVING COUNT(CASE WHEN c.status = 'DENIED' THEN 1 END) > 0
)
SELECT
  m.id,
  m.first_name,
  m.last_name,
  m.plan,
  md.total_denied_cents / 100.0 as total_denied_amount,
  md.denial_count,
  md.last_denial_reason
FROM member_denials md
JOIN members m ON m.id = md.member_id
ORDER BY md.total_denied_cents DESC;
```

---

## Query 4: Provider Denial Rate

**Prompt:**
> Which providers have the highest denial rate?

**Generated SQL:**
```sql
SELECT
  p.id,
  p.name,
  p.specialty,
  COUNT(*) as total_claims,
  COUNT(CASE WHEN c.status = 'DENIED' THEN 1 END) as denied_claims,
  ROUND(
    100.0 * COUNT(CASE WHEN c.status = 'DENIED' THEN 1 END) / COUNT(*),
    2
  ) as denial_rate_pct
FROM providers p
JOIN claims c ON c.provider_id = p.id
GROUP BY p.id, p.name, p.specialty
HAVING COUNT(*) >= 10  -- At least 10 claims for statistical significance
ORDER BY denial_rate_pct DESC
LIMIT 20;
```

---

## Query 5: Claim Amounts by Plan Type

**Prompt:**
> Compare average claim amounts by insurance plan type

**Generated SQL:**
```sql
SELECT
  m.plan,
  COUNT(c.id) as claim_count,
  ROUND(AVG(c.charge_cents) / 100.0, 2) as avg_charged,
  ROUND(AVG(c.allowed_cents) / 100.0, 2) as avg_allowed,
  ROUND(AVG(c.charge_cents - c.allowed_cents) / 100.0, 2) as avg_discount,
  ROUND(
    100.0 * AVG(c.allowed_cents) / NULLIF(AVG(c.charge_cents), 0),
    2
  ) as allowed_rate_pct
FROM members m
JOIN claims c ON c.member_id = m.id
WHERE c.status IN ('PAID', 'DENIED')
GROUP BY m.plan
ORDER BY claim_count DESC;
```

---

## Query 6: Recent Pending Claims

**Prompt:**
> Show all pending claims from the last 7 days

**Generated SQL:**
```sql
SELECT
  c.id,
  c.dos as date_of_service,
  m.first_name || ' ' || m.last_name as member_name,
  p.name as provider_name,
  c.cpt,
  c.charge_cents / 100.0 as charged_amount,
  c.created_at as claim_submitted
FROM claims c
JOIN members m ON m.id = c.member_id
JOIN providers p ON p.id = c.provider_id
WHERE
  c.status = 'PENDING'
  AND c.dos >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY c.dos DESC, c.created_at DESC;
```
