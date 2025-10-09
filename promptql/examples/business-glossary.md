# PromptQL Business Glossary

Domain-specific terms and abbreviations that PromptQL understands.

## Healthcare Insurance Terms

### PA / Prior Authorization
**Meaning:** Insurance approval required before receiving specific services
**Usage:**
```
Show me claims that mention PA in the denial reason
Find members with notes about prior authorization
```

### Step Therapy
**Meaning:** Insurance requirement to try lower-cost drugs before higher-cost alternatives
**Usage:**
```
Show me denials related to step therapy
Find members affected by step therapy requirements
```

### Allowed Amount
**Meaning:** Maximum amount insurance will pay for a service
**Usage:**
```
Compare charge amounts vs allowed amounts
Show me claims where charge exceeds allowed amount
```

## Plan Types

### PPO (Preferred Provider Organization)
- Most flexible, higher premiums
- Can see out-of-network providers

### HMO (Health Maintenance Organization)
- Lower premiums, less flexibility
- Must use in-network providers

### EPO (Exclusive Provider Organization)
- Mid-range flexibility
- No out-of-network coverage except emergencies

### POS (Point of Service)
- Hybrid of HMO and PPO
- Requires referrals for specialists

### HDHP (High Deductible Health Plan)
- Lower premiums, higher deductibles
- Often paired with HSA

## Claim Statuses

### PAID
- Claim processed and paid to provider
- Final status

### DENIED
- Claim rejected by insurance
- Check denial_reason for details

### PENDING
- Claim submitted, awaiting review
- May need additional information

## Medical Codes

### CPT (Current Procedural Terminology)
- Standardized codes for medical procedures
- Example: 99213 = Office visit

### NPI (National Provider Identifier)
- Unique 10-digit identifier for healthcare providers
- Required for all claims

---

**💡 Using the Glossary:**

The AI automatically understands these terms. You can use:
- Full names: "Prior Authorization"
- Abbreviations: "PA"
- Variations: "prior auth", "pre-authorization"

**Example Queries:**
```
Show me all PA-related denials
Find high-cost members on HDHP plans
List claims with CPT codes starting with 992
```
