/**
 * PromptQL Page Component
 *
 * AI-powered natural language query interface
 */

import { useState } from 'react';
import { PromptQLChat } from './PromptQLChat';
import { QueryResult } from './QueryResult';
import { SQLPreview } from './SQLPreview';

export interface QueryResponse {
  prompt: string;
  sql: string;
  explanation: string;
  confidence: number;
  warnings: string[];
  data: any[];
  rowCount: number;
  executionTime: number;
}

export function PromptQLPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QueryResponse | null>(null);

  const handleQuery = async (prompt: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3003/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Query failed');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="promptql-page">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🤖 PromptQL - AI Query Interface
          </h1>
          <p className="text-gray-600">
            Ask questions in natural language and get instant data insights
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Chat Interface */}
          <div className="space-y-4">
            <PromptQLChat onQuery={handleQuery} loading={loading} />

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-red-800 font-semibold mb-1">Error</h3>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                <SQLPreview
                  sql={result.sql}
                  explanation={result.explanation}
                  confidence={result.confidence}
                  warnings={result.warnings}
                />
              </div>
            )}
          </div>

          {/* Right: Results */}
          <div>
            {result && (
              <QueryResult
                data={result.data}
                rowCount={result.rowCount}
                executionTime={result.executionTime}
              />
            )}
          </div>
        </div>

        {/* Example Queries */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-blue-900 font-semibold mb-3">📝 Example Queries</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• "Show me the top 5 denial reasons from last month"</li>
            <li>• "Find members with claims over $10,000"</li>
            <li>• "List all providers with specialty Cardiology"</li>
            <li>• "Show me pending claims for members on PPO plans"</li>
            <li>• "Get the total claim amount by status"</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
