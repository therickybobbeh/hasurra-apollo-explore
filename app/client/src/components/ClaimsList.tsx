import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { Link } from 'react-router-dom';
import { GET_CLAIMS } from '../graphql/queries';
import { ClaimsFilter } from '../types';
import { formatCurrency, formatDate, getStatusBadgeClass } from '../utils/format';

const ITEMS_PER_PAGE = 20;

export function ClaimsList() {
  const [filters, setFilters] = useState<ClaimsFilter>({});
  const [page, setPage] = useState(0);

  const { loading, error, data } = useQuery(GET_CLAIMS, {
    variables: {
      where: {
        ...(filters.status && { status: { _eq: filters.status } }),
        ...(filters.startDate && { dos: { _gte: filters.startDate } }),
        ...(filters.endDate && { dos: { _lte: filters.endDate } })
      },
      order_by: { dos: 'desc' },
      limit: ITEMS_PER_PAGE,
      offset: page * ITEMS_PER_PAGE
    }
  });

  const claims = data?.claims || [];
  const totalCount = data?.claims_aggregate?.aggregate?.count || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        <p className="text-red-800">Error loading claims: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Claims</h1>
        <div className="text-sm text-gray-600">
          Showing {page * ITEMS_PER_PAGE + 1}-{Math.min((page + 1) * ITEMS_PER_PAGE, totalCount)} of {totalCount}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4 md:space-y-0 md:flex md:gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={filters.status || ''}
            onChange={(e) => {
              setFilters({ ...filters, status: e.target.value as any || undefined });
              setPage(0);
            }}
          >
            <option value="">All</option>
            <option value="PAID">Paid</option>
            <option value="DENIED">Denied</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={filters.startDate || ''}
            onChange={(e) => {
              setFilters({ ...filters, startDate: e.target.value || undefined });
              setPage(0);
            }}
          />
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="date"
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={filters.endDate || ''}
            onChange={(e) => {
              setFilters({ ...filters, endDate: e.target.value || undefined });
              setPage(0);
            }}
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={() => {
              setFilters({});
              setPage(0);
            }}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Claims Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading claims...</div>
        ) : claims.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No claims found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date of Service</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">CPT</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Charged</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Allowed</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {claims.map((claim: any) => (
                  <tr key={claim.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{formatDate(claim.dos)}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium">{claim.provider?.name}</div>
                      <div className="text-gray-500 text-xs">{claim.provider?.specialty}</div>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono">{claim.cpt}</td>
                    <td className="px-4 py-3 text-sm text-right">{formatCurrency(claim.charge_cents)}</td>
                    <td className="px-4 py-3 text-sm text-right">{formatCurrency(claim.allowed_cents)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={getStatusBadgeClass(claim.status)}>{claim.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/claims/${claim.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page === totalPages - 1}
            className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
