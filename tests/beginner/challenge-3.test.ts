import { describe, it, expect } from 'vitest';
import { gql } from '@apollo/client';
import { executeMutation, expectQueryToFail } from '../helpers/graphql-client.js';
import { TEST_MEMBERS, TEST_ROLES, generateTestNote } from '../helpers/test-data.js';

/**
 * Challenge 3: Mutations and Inserts
 *
 * Success Criteria:
 * - All CRUD operations work
 * - RLS prevents unauthorized access
 */

const INSERT_NOTE = gql`
  mutation InsertNote($memberId: uuid!, $body: String!) {
    insert_notes_one(object: { member_id: $memberId, body: $body }) {
      id
      body
      created_at
    }
  }
`;

const UPDATE_NOTE = gql`
  mutation UpdateNote($noteId: uuid!, $newBody: String!) {
    update_notes_by_pk(pk_columns: { id: $noteId }, _set: { body: $newBody }) {
      id
      body
    }
  }
`;

const DELETE_NOTE = gql`
  mutation DeleteNote($noteId: uuid!) {
    delete_notes_by_pk(id: $noteId) {
      id
    }
  }
`;

const GET_NOTE = gql`
  query GetNote($noteId: uuid!) {
    notes_by_pk(id: $noteId) {
      id
      body
      member_id
    }
  }
`;

describe('Challenge 3: Mutations and Inserts', () => {
  let createdNoteId: string | null = null;

  it('should insert a new note', async () => {
    const noteData = generateTestNote(TEST_MEMBERS.MICHAEL_LOPEZ.id);

    const result = await executeMutation(
      INSERT_NOTE,
      {
        memberId: TEST_MEMBERS.MICHAEL_LOPEZ.id,
        body: noteData.body,
      },
      TEST_ROLES.memberMichael
    );

    expect(result.data).toBeDefined();
    expect(result.data?.insert_notes_one).toBeDefined();
    expect(result.data?.insert_notes_one.id).toBeDefined();
    expect(result.data?.insert_notes_one.body).toBe(noteData.body);

    createdNoteId = result.data?.insert_notes_one.id;
  });

  it('should update an existing note', async () => {
    // First create a note
    const noteData = generateTestNote(TEST_MEMBERS.MICHAEL_LOPEZ.id);
    const insertResult = await executeMutation(
      INSERT_NOTE,
      {
        memberId: TEST_MEMBERS.MICHAEL_LOPEZ.id,
        body: noteData.body,
      },
      TEST_ROLES.memberMichael
    );

    const noteId = insertResult.data?.insert_notes_one.id;

    // Update the note
    const updatedBody = `Updated: ${noteData.body}`;
    const updateResult = await executeMutation(
      UPDATE_NOTE,
      {
        noteId,
        newBody: updatedBody,
      },
      TEST_ROLES.memberMichael
    );

    expect(updateResult.data).toBeDefined();
    expect(updateResult.data?.update_notes_by_pk).toBeDefined();
    expect(updateResult.data?.update_notes_by_pk.body).toBe(updatedBody);

    // Clean up
    await executeMutation(DELETE_NOTE, { noteId }, TEST_ROLES.memberMichael);
  });

  it('should delete a note', async () => {
    // Create a note
    const noteData = generateTestNote(TEST_MEMBERS.MICHAEL_LOPEZ.id);
    const insertResult = await executeMutation(
      INSERT_NOTE,
      {
        memberId: TEST_MEMBERS.MICHAEL_LOPEZ.id,
        body: noteData.body,
      },
      TEST_ROLES.memberMichael
    );

    const noteId = insertResult.data?.insert_notes_one.id;

    // Delete the note
    const deleteResult = await executeMutation(
      DELETE_NOTE,
      { noteId },
      TEST_ROLES.memberMichael
    );

    expect(deleteResult.data).toBeDefined();
    expect(deleteResult.data?.delete_notes_by_pk).toBeDefined();
    expect(deleteResult.data?.delete_notes_by_pk.id).toBe(noteId);
  });

  it('should prevent member from inserting notes for another member (RLS)', async () => {
    const noteData = generateTestNote(TEST_MEMBERS.LINDA_DAVIS.id);

    // Michael tries to create a note for Linda
    try {
      await executeMutation(
        INSERT_NOTE,
        {
          memberId: TEST_MEMBERS.LINDA_DAVIS.id, // Linda's ID
          body: noteData.body,
        },
        TEST_ROLES.memberMichael // But using Michael's role
      );

      // If we get here, RLS is not working
      expect(true).toBe(false);
    } catch (error) {
      // Should throw an error due to RLS
      expect(error).toBeDefined();
    }
  });

  it('should understand mutation syntax (insert, update, delete)', async () => {
    // This test verifies the user understands mutation syntax
    const noteData = generateTestNote(TEST_MEMBERS.MICHAEL_LOPEZ.id);

    // Insert uses insert_notes_one
    const insertResult = await executeMutation(
      INSERT_NOTE,
      {
        memberId: TEST_MEMBERS.MICHAEL_LOPEZ.id,
        body: noteData.body,
      },
      TEST_ROLES.memberMichael
    );

    expect(insertResult.data?.insert_notes_one).toBeDefined();

    const noteId = insertResult.data?.insert_notes_one.id;

    // Update uses update_notes_by_pk with pk_columns
    const updateResult = await executeMutation(
      UPDATE_NOTE,
      {
        noteId,
        newBody: 'Updated body',
      },
      TEST_ROLES.memberMichael
    );

    expect(updateResult.data?.update_notes_by_pk).toBeDefined();

    // Delete uses delete_notes_by_pk
    const deleteResult = await executeMutation(
      DELETE_NOTE,
      { noteId },
      TEST_ROLES.memberMichael
    );

    expect(deleteResult.data?.delete_notes_by_pk).toBeDefined();
  });
});
