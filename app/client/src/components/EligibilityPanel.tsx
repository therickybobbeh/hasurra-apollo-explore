import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_ELIGIBILITY_CHECKS } from '../graphql/queries';
import { SUBMIT_ELIGIBILITY_CHECK } from '../graphql/mutations';
import { getCurrentUserId } from '../apollo/client';
import { formatDateTime } from '../utils/format';

export function EligibilityPanel() {
  const memberId = getCurrentUserId();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, loading, refetch } = useQuery(GET_ELIGIBILITY_CHECKS, {
    variables: { memberId },
    skip: !memberId
  });

  const [submitCheck] = useMutation(SUBMIT_ELIGIBILITY_CHECK, {
    refetchQueries: ['GetEligibilityChecks']
  });

  const handleSubmit = async () => {
    if (!memberId) return;

    setIsSubmitting(true);
    try {
      await submitCheck({ variables: { memberId } });
      await refetch();
    } catch (err) {
      console.error('Error submitting eligibility check:', err);
      alert('Failed to submit eligibility check');
    } finally {
      setIsSubmitting(false);
    }
  };

  const checks = data?.eligibility_checks || [];
  const latestCheck = checks[0];

  if (!memberId) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-600">Member ID not configured. Set VITE_DEV_MEMBER_ID in .env</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Eligibility Check</h1>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Checking...' : 'Run Check'}
          </button>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : latestCheck ? (
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Last checked: {formatDateTime(latestCheck.checked_at)}
            </p>

            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-semibold mb-2">Result</h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(latestCheck.result, null, 2)}
              </pre>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">No eligibility checks yet. Click "Run Check" to start.</p>
        )}
      </div>

      {/* History */}
      {checks.length > 1 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">History</h2>
          <div className="space-y-2">
            {checks.slice(1).map((check: any) => (
              <div key={check.id} className="border-l-4 border-gray-300 pl-4 py-2">
                <p className="text-sm text-gray-600">{formatDateTime(check.checked_at)}</p>
                <p className="text-sm">
                  Eligible: {check.result.eligible ? '✓ Yes' : '✗ No'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
