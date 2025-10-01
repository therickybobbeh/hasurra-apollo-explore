import { gql } from '@apollo/client';
import { NOTE_FRAGMENT, ELIGIBILITY_CHECK_FRAGMENT } from './fragments';

// Add a note
export const ADD_NOTE = gql`
  ${NOTE_FRAGMENT}
  mutation AddNote($memberId: uuid!, $body: String!) {
    insert_notes_one(object: { member_id: $memberId, body: $body }) {
      ...NoteFields
    }
  }
`;

// Update a note
export const UPDATE_NOTE = gql`
  ${NOTE_FRAGMENT}
  mutation UpdateNote($id: uuid!, $body: String!) {
    update_notes_by_pk(pk_columns: { id: $id }, _set: { body: $body }) {
      ...NoteFields
    }
  }
`;

// Delete a note
export const DELETE_NOTE = gql`
  mutation DeleteNote($id: uuid!) {
    delete_notes_by_pk(id: $id) {
      id
    }
  }
`;

// Submit eligibility check (custom action)
export const SUBMIT_ELIGIBILITY_CHECK = gql`
  mutation SubmitEligibilityCheck($memberId: uuid!) {
    submitEligibilityCheck(memberId: $memberId) {
      id
      member_id
      checked_at
      result
      created_at
    }
  }
`;

// Update claim status (admin only)
export const UPDATE_CLAIM_STATUS = gql`
  mutation UpdateClaimStatus(
    $id: uuid!
    $status: String!
    $denial_reason: String
  ) {
    update_claims_by_pk(
      pk_columns: { id: $id }
      _set: { status: $status, denial_reason: $denial_reason }
    ) {
      id
      status
      denial_reason
      updated_at
    }
  }
`;
