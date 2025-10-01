# PromptQL Query Results

Sample results from executing generated queries.

## Result 1: Top 5 Denial Reasons (Last 30 Days)

**Query Executed:** 2024-03-15 14:32:00 UTC

```json
[
  {
    "denial_reason": "Prior authorization required",
    "denial_count": 23,
    "avg_charge_amount": 1250.45
  },
  {
    "denial_reason": "Step therapy not followed",
    "denial_count": 18,
    "avg_charge_amount": 892.30
  },
  {
    "denial_reason": "Not medically necessary",
    "denial_count": 15,
    "avg_charge_amount": 1580.00
  },
  {
    "denial_reason": "Out of network",
    "denial_count": 12,
    "avg_charge_amount": 2100.75
  },
  {
    "denial_reason": "Missing documentation",
    "denial_count": 8,
    "avg_charge_amount": 675.50
  }
]
```

**Insights:**
- Prior authorization is the #1 denial reason (30% of denials)
- Out of network denials have highest average charge amount
- Documentation issues are relatively rare but preventable

---

## Result 2: Members with Step Therapy Notes

**Query Executed:** 2024-03-15 14:35:12 UTC

```json
[
  {
    "member_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "member_name": "John Smith",
    "plan": "PPO",
    "note_content": "Discussed step therapy requirements with member. Will try generic alternative first per plan guidelines.",
    "note_date": "2024-03-10T10:30:00Z"
  },
  {
    "member_id": "b2c3d4e5-f6g7-8901-bcde-f12345678901",
    "member_name": "Sarah Johnson",
    "plan": "HMO",
    "note_content": "Step therapy exception requested due to contraindication with generic option. Supporting documentation from specialist attached.",
    "note_date": "2024-03-08T15:45:00Z"
  },
  {
    "member_id": "c3d4e5f6-g7h8-9012-cdef-123456789012",
    "member_name": "Michael Brown",
    "plan": "PPO",
    "note_content": "Appeal filed for denied claim. Step therapy requirements were met with generic trial. Escalating to medical review.",
    "note_date": "2024-03-05T09:15:00Z"
  }
]
```

**Insights:**
- 3 members currently in step therapy process
- 1 exception request pending
- 1 appeal in progress

---

## Result 3: High-Value Claims with Denials

**Query Executed:** 2024-03-15 14:38:45 UTC

```json
[
  {
    "id": "d4e5f6g7-h8i9-0123-defg-234567890123",
    "first_name": "Jennifer",
    "last_name": "Davis",
    "plan": "EPO",
    "total_denied_amount": 4250.00,
    "denial_count": 2,
    "last_denial_reason": "Out of network"
  },
  {
    "id": "e5f6g7h8-i9j0-1234-efgh-345678901234",
    "first_name": "Robert",
    "last_name": "Wilson",
    "plan": "PPO",
    "total_denied_amount": 3890.50,
    "denial_count": 3,
    "last_denial_reason": "Prior authorization required"
  },
  {
    "id": "f6g7h8i9-j0k1-2345-fghi-456789012345",
    "first_name": "Lisa",
    "last_name": "Martinez",
    "plan": "HMO",
    "total_denied_amount": 2750.00,
    "denial_count": 1,
    "last_denial_reason": "Not medically necessary"
  }
]
```

**Insights:**
- $10,890.50 total in high-value denials
- Priority candidates for appeal/case management
- Out of network issues for EPO plan need provider education

---

## Result 4: Provider Denial Rate

**Query Executed:** 2024-03-15 14:42:10 UTC

```json
[
  {
    "id": "g7h8i9j0-k1l2-3456-ghij-567890123456",
    "name": "Emergency Care Center",
    "specialty": "Emergency Medicine",
    "total_claims": 45,
    "denied_claims": 18,
    "denial_rate_pct": 40.00
  },
  {
    "id": "h8i9j0k1-l2m3-4567-hijk-678901234567",
    "name": "Dr. Anderson Orthopedics",
    "specialty": "Orthopedics",
    "total_claims": 32,
    "denied_claims": 11,
    "denial_rate_pct": 34.38
  },
  {
    "id": "i9j0k1l2-m3n4-5678-ijkl-789012345678",
    "name": "City Cardiology Associates",
    "specialty": "Cardiology",
    "total_claims": 67,
    "denied_claims": 12,
    "denial_rate_pct": 17.91
  }
]
```

**Insights:**
- Emergency services have highest denial rate (40%)
- Specialty providers vary widely (17-34%)
- Opportunity for provider education and PA workflow improvement

---

## Performance Metrics

**Query Execution Times:**
- Query 1 (Aggregation): 45ms
- Query 2 (Full-text search): 120ms
- Query 3 (Complex CTE): 180ms
- Query 4 (Multi-join aggregate): 95ms

**Database:** PostgreSQL 15.3
**Dataset Size:**
- 50 members
- 20 providers
- 150 claims
- 25 notes
- 30 eligibility checks

**Index Usage:** All queries utilized appropriate indexes for optimal performance.
