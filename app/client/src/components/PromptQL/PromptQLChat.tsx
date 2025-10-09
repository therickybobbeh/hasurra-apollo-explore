/**
 * PromptQL Chat Component
 *
 * Natural language input for queries
 */

import { useState } from 'react';

interface PromptQLChatProps {
  onQuery: (prompt: string) => void;
  loading: boolean;
}

export function PromptQLChat({ onQuery, loading }: PromptQLChatProps) {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !loading) {
      onQuery(prompt.trim());
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Ask a Question
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="What would you like to know? (e.g., 'Show me denied claims from last month')"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={4}
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Generating query...
            </span>
          ) : (
            '🚀 Run Query'
          )}
        </button>
      </form>

      <div className="mt-4 text-xs text-gray-500">
        <p>
          💡 <strong>Tip:</strong> Ask in plain English. The AI will generate a safe SQL query for you.
        </p>
      </div>
    </div>
  );
}
