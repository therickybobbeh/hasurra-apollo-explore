import { gql } from '@apollo/client';
import {
  CLAIM_CORE_FRAGMENT,
  CLAIM_DETAIL_FRAGMENT,
  MEMBER_FRAGMENT,
  PROVIDER_FRAGMENT,
  NOTE_FRAGMENT,
  ELIGIBILITY_CHECK_FRAGMENT
} from './fragments';

// Get claims list with filters
export const GET_CLAIMS = gql`
  ${CLAIM_CORE_FRAGMENT}
  ${PROVIDER_FRAGMENT}
  query GetClaims(
    $where: claims_bool_exp
    $order_by: [claims_order_by!]
    $limit: Int
    $offset: Int
  ) {
    claims(
      where: $where
      order_by: $order_by
      limit: $limit
      offset: $offset
    ) {
      ...ClaimCoreFields
      provider {
        id
        name
        specialty
      }
    }
    claims_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

// Get single claim with full details
export const GET_CLAIM = gql`
  ${CLAIM_DETAIL_FRAGMENT}
  ${NOTE_FRAGMENT}
  query GetClaim($id: uuid!, $memberId: uuid!) {
    claims_by_pk(id: $id) {
      ...ClaimDetailFields
    }
    notes(
      where: { member_id: { _eq: $memberId } }
      order_by: { created_at: desc }
      limit: 10
    ) {
      ...NoteFields
    }
  }
`;

// Get member details
export const GET_MEMBER = gql`
  ${MEMBER_FRAGMENT}
  query GetMember($id: uuid!) {
    members_by_pk(id: $id) {
      ...MemberFields
    }
  }
`;

// Get member with claims summary
export const GET_MEMBER_WITH_SUMMARY = gql`
  ${MEMBER_FRAGMENT}
  query GetMemberWithSummary($id: uuid!) {
    members_by_pk(id: $id) {
      ...MemberFields
      claims_aggregate {
        aggregate {
          count
          sum {
            charge_cents
            allowed_cents
          }
        }
      }
    }
  }
`;

// Get notes for a member
export const GET_NOTES = gql`
  ${NOTE_FRAGMENT}
  query GetNotes($memberId: uuid!, $limit: Int = 20, $offset: Int = 0) {
    notes(
      where: { member_id: { _eq: $memberId } }
      order_by: { created_at: desc }
      limit: $limit
      offset: $offset
    ) {
      ...NoteFields
    }
  }
`;

// Get eligibility checks for a member
export const GET_ELIGIBILITY_CHECKS = gql`
  ${ELIGIBILITY_CHECK_FRAGMENT}
  query GetEligibilityChecks($memberId: uuid!, $limit: Int = 10) {
    eligibility_checks(
      where: { member_id: { _eq: $memberId } }
      order_by: { checked_at: desc }
      limit: $limit
    ) {
      ...EligibilityCheckFields
    }
  }
`;

// Search members
export const SEARCH_MEMBERS = gql`
  ${MEMBER_FRAGMENT}
  query SearchMembers($search: String!) {
    members(
      where: {
        _or: [
          { first_name: { _ilike: $search } }
          { last_name: { _ilike: $search } }
        ]
      }
      limit: 20
    ) {
      ...MemberFields
    }
  }
`;
