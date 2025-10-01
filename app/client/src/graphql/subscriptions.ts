import { gql } from '@apollo/client';
import { CLAIM_CORE_FRAGMENT } from './fragments';

// Subscribe to claims updates
export const CLAIMS_UPDATED = gql`
  ${CLAIM_CORE_FRAGMENT}
  subscription ClaimsUpdated($memberId: uuid!) {
    claims(
      where: { member_id: { _eq: $memberId } }
      order_by: { updated_at: desc }
      limit: 50
    ) {
      ...ClaimCoreFields
      provider {
        id
        name
        specialty
      }
    }
  }
`;

// Subscribe to notes updates
export const NOTES_UPDATED = gql`
  subscription NotesUpdated($memberId: uuid!) {
    notes(
      where: { member_id: { _eq: $memberId } }
      order_by: { created_at: desc }
      limit: 20
    ) {
      id
      member_id
      created_at
      body
    }
  }
`;
