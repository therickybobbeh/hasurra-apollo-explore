# PromptQL Example Prompts

Natural language prompts to query the ClaimSight database.

## Denial Analysis

### Prompt 1: Top Denial Reasons
**Natural Language:**
> Show me the top 5 denial reasons in the last 30 days with counts

**Intent:** Aggregate denial reasons for trend analysis

---

### Prompt 2: Member Notes Search
**Natural Language:**
> For members with notes mentioning "step therapy", show me their member ID, name, and note content

**Intent:** Search full-text in notes for specific healthcare terms

---

### Prompt 3: High-Value Denials
**Natural Language:**
> List members with allowed amount greater than $1,000 and any denial history, sorted by total denied amount

**Intent:** Identify high-value claims with denials for potential appeals

---

## Additional Examples

### Prompt 4: Provider Performance
**Natural Language:**
> Which providers have the highest denial rate?

---

### Prompt 5: Plan Analysis
**Natural Language:**
> Compare average claim amounts by insurance plan type

---

### Prompt 6: Recent Activity
**Natural Language:**
> Show all pending claims from the last 7 days

---

### Prompt 7: Complex Join
**Natural Language:**
> Find members who have both a denied claim for "Prior authorization required" and a note mentioning "PA" or "prior auth"

---

### Prompt 8: Temporal Analysis
**Natural Language:**
> What is the trend of claim denials over time, grouped by month?

---

### Prompt 9: Specialty Analysis
**Natural Language:**
> Which medical specialties have the longest time between service date and claim payment?

---

### Prompt 10: Eligibility Correlation
**Natural Language:**
> Show members with denied claims who haven't had an eligibility check in the last 90 days
