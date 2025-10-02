import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';

const GET_PROVIDERS_WITH_RATINGS = gql`
  query GetProvidersWithRatings {
    providers(limit: 20) {
      id
      name
      specialty
      npi
      rating
      ratingCount
      reviews {
        id
        rating
        comment
        date
      }
    }
  }
`;

export function ProviderRatings() {
  const { loading, error, data } = useQuery(GET_PROVIDERS_WITH_RATINGS);

  if (loading) return <div className="text-center py-8">Loading providers...</div>;
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-red-800 mb-2">⚠️ Federation Not Available</h2>
        <p className="text-red-700 mb-4">
          Unable to load provider ratings. This feature requires Apollo Federation.
        </p>
        <div className="text-sm text-red-600 bg-red-100 p-3 rounded">
          <strong>Error:</strong> {error.message}
        </div>
        <div className="mt-4 text-sm text-gray-700 bg-white p-4 rounded border border-red-200">
          <p className="font-semibold mb-2">To enable federation:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Make sure your <code className="bg-gray-100 px-1">.env</code> points to the gateway:
              <pre className="bg-gray-100 p-2 rounded mt-1 text-xs">
                VITE_GRAPHQL_HTTP_URL=http://localhost:4000/graphql
              </pre>
            </li>
            <li>Start all services with: <code className="bg-gray-100 px-1">npm run federated:dev</code></li>
            <li>Restart the dev server</li>
          </ol>
        </div>
      </div>
    );
  }

  const providers = data?.providers || [];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-500 to-blue-600 text-white p-6 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-2">🌟 Provider Ratings</h1>
        <p className="text-purple-100">
          Powered by <strong>TRUE Apollo Federation</strong> - Provider type split across services!
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <span className="text-2xl mr-3">💡</span>
          <div>
            <p className="font-semibold text-blue-900">TRUE Federation Demo</p>
            <p className="text-sm text-blue-700 mt-1">
              The <code className="bg-blue-100 px-1">Provider</code> type is <strong>split across services</strong>:
              base fields (name, specialty, NPI) come from <strong>Hasura</strong>, while
              extension fields (rating, reviews) come from the <strong>ratings subgraph</strong>.
              The Apollo Gateway performs <strong>entity resolution</strong> to combine them into one unified response!
            </p>
          </div>
        </div>
      </div>

      {providers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No providers found.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {providers.map((provider: any) => (
          <div key={provider.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{provider.name}</h3>
                <p className="text-sm text-gray-600">{provider.specialty}</p>
                <p className="text-xs text-gray-500 mt-1">NPI: {provider.npi}</p>
              </div>
              {provider.rating && (
                <div className="bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200">
                  <span className="text-yellow-700 font-bold">⭐ {provider.rating.toFixed(1)}</span>
                </div>
              )}
            </div>

            {provider.rating ? (
              <>
                <div className="text-sm text-gray-600 mb-3">
                  {provider.ratingCount} reviews
                </div>

                {provider.reviews && provider.reviews.length > 0 && (
                  <div className="border-t pt-3 space-y-2">
                    <p className="text-xs font-semibold text-gray-700 uppercase">Recent Reviews:</p>
                    {provider.reviews.slice(0, 2).map((review: any) => (
                      <div key={review.id} className="bg-gray-50 p-2 rounded text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-yellow-500">
                            {'⭐'.repeat(review.rating)}
                          </span>
                          <span className="text-xs text-gray-500">{review.date}</span>
                        </div>
                        <p className="text-gray-700 text-xs italic">"{review.comment}"</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-gray-500 italic">
                No ratings available yet
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-8">
        <h3 className="font-semibold text-gray-900 mb-2">🔍 How This Works (Entity Resolution)</h3>
        <div className="text-sm text-gray-700 space-y-2">
          <p>
            <strong>1. Hasura Subgraph (Port 8080):</strong> Defines base Provider type (id, name, specialty, NPI)
          </p>
          <p>
            <strong>2. Ratings Subgraph (Port 3002):</strong> Extends Provider with @key(fields: "id") to add rating & reviews
          </p>
          <p>
            <strong>3. Apollo Gateway (Port 4000):</strong> Combines both via entity resolution
          </p>
          <p className="pt-2 border-t">
            <span className="text-purple-600 font-semibold">Entity Resolution Flow:</span><br />
            Gateway queries Hasura for providers → Gets provider IDs → Calls ratings subgraph's
            <code className="bg-gray-100 px-1">__resolveReference</code> for each ID → Merges results →
            Returns unified Provider with both base fields and extensions!
          </p>
          <p className="text-xs text-gray-600 mt-2 pt-2 border-t">
            <strong>Requirement:</strong> Hasura v2.10.0+ with HASURA_GRAPHQL_ENABLE_APOLLO_FEDERATION=true
          </p>
        </div>
      </div>
    </div>
  );
}
