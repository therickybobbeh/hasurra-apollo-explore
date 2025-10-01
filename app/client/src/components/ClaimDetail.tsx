import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { GET_CLAIM, GET_NOTES } from '../graphql/queries';
import { ADD_NOTE } from '../graphql/mutations';
import { useRole } from '../context/RoleContext';
import { formatCurrency, formatDate, formatDateTime, getStatusBadgeClass } from '../utils/format';
import { useState } from 'react';

export function ClaimDetail() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useRole();
  const [noteBody, setNoteBody] = useState('');

  const { loading, error, data } = useQuery(GET_CLAIM, {
    variables: {
      id,
      memberId: currentUser.memberId || currentUser.providerId || '00000000-0000-0000-0000-000000000000'
    },
    skip: !id
  });

  const { data: notesData } = useQuery(GET_NOTES, {
    variables: { memberId: data?.claims_by_pk?.member_id },
    skip: !data?.claims_by_pk?.member_id
  });

  const [addNote, { loading: addingNote }] = useMutation(ADD_NOTE, {
    refetchQueries: ['GetNotes'],
    optimisticResponse: {
      insert_notes_one: {
        __typename: 'notes',
        id: 'temp-id',
        member_id: data?.claims_by_pk?.member_id,
        created_at: new Date().toISOString(),
        body: noteBody
      }
    }
  });

  if (loading) return <div className="p-8 text-center">Loading claim...</div>;
  if (error) return <div className="p-8 text-center text-red-600">Error: {error.message}</div>;
  if (!data?.claims_by_pk) return <div className="p-8 text-center">Claim not found</div>;

  const claim = data.claims_by_pk;
  const notes = notesData?.notes || [];

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteBody.trim()) return;

    try {
      await addNote({
        variables: {
          memberId: claim.member_id,
          body: noteBody
        }
      });
      setNoteBody('');
    } catch (err) {
      console.error('Error adding note:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Claim Header */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold">Claim Details</h1>
            <p className="text-gray-500 text-sm">ID: {claim.id}</p>
          </div>
          <span className={getStatusBadgeClass(claim.status)}>{claim.status}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2">Member</h3>
            <p>{claim.member?.first_name} {claim.member?.last_name}</p>
            <p className="text-sm text-gray-600">DOB: {formatDate(claim.member?.dob)}</p>
            <p className="text-sm text-gray-600">Plan: {claim.member?.plan}</p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Provider</h3>
            <p>{claim.provider?.name}</p>
            <p className="text-sm text-gray-600">{claim.provider?.specialty}</p>
            <p className="text-sm text-gray-600">NPI: {claim.provider?.npi}</p>
          </div>
        </div>
      </div>

      {/* Claim Details */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Service Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600">Date of Service</label>
            <p className="font-medium">{formatDate(claim.dos)}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">CPT Code</label>
            <p className="font-medium font-mono">{claim.cpt}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Charged Amount</label>
            <p className="font-medium">{formatCurrency(claim.charge_cents)}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Allowed Amount</label>
            <p className="font-medium">{formatCurrency(claim.allowed_cents)}</p>
          </div>
        </div>

        {claim.denial_reason && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
            <label className="text-sm font-semibold text-red-800">Denial Reason</label>
            <p className="text-red-700">{claim.denial_reason}</p>
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Case Notes</h2>

        {/* Add Note Form */}
        <form onSubmit={handleAddNote} className="mb-6">
          <textarea
            className="w-full border rounded p-3 mb-2"
            rows={3}
            placeholder="Add a case note..."
            value={noteBody}
            onChange={(e) => setNoteBody(e.target.value)}
          />
          <button
            type="submit"
            disabled={addingNote || !noteBody.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {addingNote ? 'Adding...' : 'Add Note'}
          </button>
        </form>

        {/* Notes List */}
        <div className="space-y-3">
          {notes.length === 0 ? (
            <p className="text-gray-500 text-sm">No notes yet</p>
          ) : (
            notes.map((note: any) => (
              <div key={note.id} className="border-l-4 border-blue-500 pl-4 py-2">
                <p className="text-sm">{note.body}</p>
                <p className="text-xs text-gray-500 mt-1">{formatDateTime(note.created_at)}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
