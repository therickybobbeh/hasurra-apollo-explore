import { gql } from '@apollo/client';

// Member fragment
export const MEMBER_FRAGMENT = gql`
  fragment MemberFields on members {
    id
    first_name
    last_name
    dob
    plan
    created_at
    updated_at
  }
`;

// Provider fragment
export const PROVIDER_FRAGMENT = gql`
  fragment ProviderFields on providers {
    id
    npi
    name
    specialty
  }
`;

// Claim core fields fragment
export const CLAIM_CORE_FRAGMENT = gql`
  fragment ClaimCoreFields on claims {
    id
    member_id
    provider_id
    dos
    cpt
    charge_cents
    allowed_cents
    status
    denial_reason
    created_at
    updated_at
  }
`;

// Claim with relationships fragment
export const CLAIM_DETAIL_FRAGMENT = gql`
  ${CLAIM_CORE_FRAGMENT}
  ${MEMBER_FRAGMENT}
  ${PROVIDER_FRAGMENT}
  fragment ClaimDetailFields on claims {
    ...ClaimCoreFields
    member {
      ...MemberFields
    }
    provider {
      ...ProviderFields
    }
  }
`;

// Note fragment
export const NOTE_FRAGMENT = gql`
  fragment NoteFields on notes {
    id
    member_id
    created_at
    body
  }
`;

// Eligibility check fragment
export const ELIGIBILITY_CHECK_FRAGMENT = gql`
  fragment EligibilityCheckFields on eligibility_checks {
    id
    member_id
    checked_at
    result
    created_at
  }
`;
