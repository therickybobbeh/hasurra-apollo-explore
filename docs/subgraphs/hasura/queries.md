# Hasura Subgraph Query Examples

Domain-specific query examples for healthcare entities.

---

## Members Queries

### Get All Members

```graphql
query GetAllMembers {
  members(limit: 50, order_by: { last_name: asc }) {
    id
    member_id
    first_name
    last_name
    dob
  }
}
```

### Get Member by ID

```graphql
query GetMemberById($id: uuid!) {
  members_by_pk(id: $id) {
    id
    member_id
    first_name
    last_name
    dob
    created_at
  }
}
```

### Get Member with All Claims

```graphql
query GetMemberWithClaims($memberId: uuid!) {
  members_by_pk(id: $memberId) {
    id
    first_name
    last_name
    dob

    claims(order_by: { service_date: desc }) {
      id
      status
      cpt
      billed_amount
      service_date

      provider_record {
        name
        specialty
      }
    }

    claims_aggregate {
      aggregate {
        count
        sum {
          billed_amount
        }
      }
    }
  }
}
```

### Search Members by Name

```graphql
query SearchMembers($searchTerm: String!) {
  members(
    where: {
      _or: [
        { first_name: { _ilike: $searchTerm } }
        { last_name: { _ilike: $searchTerm } }
        { member_id: { _ilike: $searchTerm } }
      ]
    }
    limit: 20
  ) {
    id
    member_id
    first_name
    last_name
    dob
  }
}
```

Variables:
```json
{
  "searchTerm": "%john%"
}
```

---

## Claims Queries

### Get All Claims

```graphql
query GetAllClaims {
  claims(
    limit: 100
    order_by: { service_date: desc }
  ) {
    id
    status
    cpt
    billed_amount
    service_date

    member {
      first_name
      last_name
      member_id
    }

    provider_record {
      name
      specialty
    }
  }
}
```

### Get Claims by Status

```graphql
query GetClaimsByStatus($status: String!) {
  claims(
    where: { status: { _eq: $status } }
    order_by: { service_date: desc }
  ) {
    id
    cpt
    status
    billed_amount
    service_date

    member {
      first_name
      last_name
    }
  }

  claims_aggregate(where: { status: { _eq: $status } }) {
    aggregate {
      count
      sum {
        billed_amount
      }
    }
  }
}
```

Variables:
```json
{
  "status": "pending"
}
```

### Get High-Value Claims

```graphql
query GetHighValueClaims($minAmount: numeric!) {
  claims(
    where: { billed_amount: { _gte: $minAmount } }
    order_by: { billed_amount: desc }
  ) {
    id
    cpt
    billed_amount
    status

    member {
      first_name
      last_name
    }

    provider_record {
      name
    }
  }
}
```

Variables:
```json
{
  "minAmount": 5000
}
```

### Get Claims by Date Range

```graphql
query GetClaimsByDateRange($startDate: date!, $endDate: date!) {
  claims(
    where: {
      service_date: {
        _gte: $startDate
        _lte: $endDate
      }
    }
    order_by: { service_date: asc }
  ) {
    id
    service_date
    cpt
    billed_amount
    status
  }
}
```

Variables:
```json
{
  "startDate": "2024-01-01",
  "endDate": "2024-12-31"
}
```

### Get Claim with Notes

```graphql
query GetClaimWithNotes($claimId: uuid!) {
  claims_by_pk(id: $claimId) {
    id
    status
    cpt
    billed_amount
    service_date

    member {
      first_name
      last_name
    }

    provider_record {
      name
      specialty
    }

    notes(order_by: { created_at: desc }) {
      id
      note
      created_by
      created_at
    }
  }
}
```

---

## Claims Statistics

### Claims by Status (Breakdown)

```graphql
query ClaimsByStatus {
  pending: claims_aggregate(where: { status: { _eq: "pending" } }) {
    aggregate {
      count
      sum {
        billed_amount
      }
    }
  }

  approved: claims_aggregate(where: { status: { _eq: "approved" } }) {
    aggregate {
      count
      sum {
        billed_amount
      }
    }
  }

  denied: claims_aggregate(where: { status: { _eq: "denied" } }) {
    aggregate {
      count
      sum {
        billed_amount
      }
    }
  }
}
```

### Monthly Claims Statistics

```graphql
query MonthlyClaimsStats($year: Int!, $month: Int!) {
  claims_aggregate(
    where: {
      _and: [
        { service_date: { _gte: "${year}-${month}-01" } }
        { service_date: { _lt: "${year}-${month+1}-01" } }
      ]
    }
  ) {
    aggregate {
      count
      sum {
        billed_amount
      }
      avg {
        billed_amount
      }
      min {
        billed_amount
      }
      max {
        billed_amount
      }
    }
  }
}
```

---

## Provider Records Queries

### Get All Providers

```graphql
query GetAllProviders {
  provider_records(
    limit: 100
    order_by: { name: asc }
  ) {
    id
    name
    specialty
    npi
    phone
    email
  }
}
```

### Search Providers by Specialty

```graphql
query SearchProvidersBySpecialty($specialty: String!) {
  provider_records(
    where: { specialty: { _ilike: $specialty } }
  ) {
    id
    name
    specialty
    npi
    phone
  }
}
```

Variables:
```json
{
  "specialty": "%cardiology%"
}
```

### Get Provider with Claims

```graphql
query GetProviderWithClaims($providerId: uuid!) {
  provider_records_by_pk(id: $providerId) {
    id
    name
    specialty
    npi

    claims(order_by: { service_date: desc }, limit: 20) {
      id
      status
      cpt
      billed_amount
      service_date

      member {
        first_name
        last_name
      }
    }

    claims_aggregate {
      aggregate {
        count
        sum {
          billed_amount
        }
      }
    }
  }
}
```

---

## Eligibility Checks

### Get Eligibility History for Member

```graphql
query GetMemberEligibilityHistory($memberId: uuid!) {
  eligibility_checks(
    where: { member_id: { _eq: $memberId } }
    order_by: { checked_at: desc }
  ) {
    id
    service_date
    cpt
    eligible
    reason
    checked_at
  }
}
```

### Recent Eligibility Checks

```graphql
query RecentEligibilityChecks {
  eligibility_checks(
    order_by: { checked_at: desc }
    limit: 50
  ) {
    id
    service_date
    cpt
    eligible
    reason
    checked_at

    member {
      first_name
      last_name
      member_id
    }
  }
}
```

---

## Notes Queries

### Get Notes for Claim

```graphql
query GetClaimNotes($claimId: uuid!) {
  notes(
    where: { claim_id: { _eq: $claimId } }
    order_by: { created_at: desc }
  ) {
    id
    note
    created_by
    created_at

    claim {
      id
      status
    }
  }
}
```

### Get Recent Notes

```graphql
query GetRecentNotes {
  notes(
    order_by: { created_at: desc }
    limit: 20
  ) {
    id
    note
    created_by
    created_at

    claim {
      id
      status
      member {
        first_name
        last_name
      }
    }
  }
}
```

---

## Mutations

### Create Note

```graphql
mutation CreateNote($claimId: uuid!, $note: String!, $createdBy: String!) {
  insert_notes_one(
    object: {
      claim_id: $claimId
      note: $note
      created_by: $createdBy
    }
  ) {
    id
    note
    created_at
    claim {
      id
      status
    }
  }
}
```

### Update Claim Status

```graphql
mutation UpdateClaimStatus($claimId: uuid!, $status: String!) {
  update_claims_by_pk(
    pk_columns: { id: $claimId }
    _set: { status: $status }
  ) {
    id
    status
    updated_at
  }
}
```

### Approve All Pending Claims

```graphql
mutation ApproveAllPendingClaims {
  update_claims(
    where: { status: { _eq: "pending" } }
    _set: { status: "approved" }
  ) {
    affected_rows
    returning {
      id
      status
    }
  }
}
```

### Delete Note

```graphql
mutation DeleteNote($noteId: uuid!) {
  delete_notes_by_pk(id: $noteId) {
    id
    note
  }
}
```

---

## Subscriptions

### Watch New Claims

```graphql
subscription WatchNewClaims {
  claims(
    order_by: { created_at: desc }
    limit: 10
  ) {
    id
    status
    cpt
    billed_amount

    member {
      first_name
      last_name
    }
  }
}
```

### Watch Claim Updates

```graphql
subscription WatchClaimUpdates($claimId: uuid!) {
  claims_by_pk(id: $claimId) {
    id
    status
    updated_at

    notes(order_by: { created_at: desc }) {
      id
      note
      created_at
    }
  }
}
```

### Watch Pending Claims Count

```graphql
subscription WatchPendingClaimsCount {
  claims_aggregate(where: { status: { _eq: "pending" } }) {
    aggregate {
      count
    }
  }
}
```

---

## Actions

### Check Eligibility

```graphql
mutation CheckEligibility($input: CheckEligibilityInput!) {
  checkEligibility(input: $input) {
    eligible
    reason
    coverageDetails {
      planName
      copay
      deductibleRemaining
    }
  }
}
```

Variables:
```json
{
  "input": {
    "memberId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "serviceDate": "2024-01-15",
    "cpt": "99213"
  }
}
```

---

## Complex Queries

### Dashboard Overview

```graphql
query DashboardOverview {
  # Total claims by status
  pending_claims: claims_aggregate(where: { status: { _eq: "pending" } }) {
    aggregate {
      count
      sum {
        billed_amount
      }
    }
  }

  approved_claims: claims_aggregate(where: { status: { _eq: "approved" } }) {
    aggregate {
      count
      sum {
        billed_amount
      }
    }
  }

  # Total members
  members_aggregate {
    aggregate {
      count
    }
  }

  # Total providers
  provider_records_aggregate {
    aggregate {
      count
    }
  }

  # Recent claims
  recent_claims: claims(
    order_by: { created_at: desc }
    limit: 5
  ) {
    id
    status
    billed_amount
    member {
      first_name
      last_name
    }
  }
}
```

### Member Complete Profile

```graphql
query MemberCompleteProfile($memberId: uuid!) {
  members_by_pk(id: $memberId) {
    id
    member_id
    first_name
    last_name
    dob

    # All claims
    claims(order_by: { service_date: desc }) {
      id
      status
      cpt
      billed_amount
      service_date

      provider_record {
        name
        specialty
      }

      notes {
        note
        created_at
      }
    }

    # Claims statistics
    claims_aggregate {
      aggregate {
        count
        sum {
          billed_amount
        }
      }
    }

    # Eligibility checks
    eligibility_checks(order_by: { checked_at: desc }, limit: 5) {
      service_date
      cpt
      eligible
      reason
    }
  }
}
```

---

## Next Steps

- **[Common Patterns](../../guides/common-patterns.md)** - Filtering, pagination, aggregations
- **[Providers Subgraph](../providers/overview.md)** - Federated provider ratings
- **[API Reference](../../api/index.html)** - Complete schema documentation

