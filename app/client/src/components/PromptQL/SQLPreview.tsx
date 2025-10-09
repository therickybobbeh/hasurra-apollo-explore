/**
 * SQL Preview Component
 *
 * Shows generated SQL and explanation
 */

interface SQLPreviewProps {
  sql: string;
  explanation: string;
  confidence: number;
  warnings: string[];
}

export function SQLPreview({ sql, explanation, confidence, warnings }: SQLPreviewProps) {
  const confidenceColor =
    confidence >= 0.8 ? 'text-green-600' : confidence >= 0.6 ? 'text-yellow-600' : 'text-red-600';

  const confidenceLabel =
    confidence >= 0.8 ? 'High' : confidence >= 0.6 ? 'Medium' : 'Low';

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Generated SQL</h3>
        <span className={`text-sm font-medium ${confidenceColor}`}>
          Confidence: {confidenceLabel} ({Math.round(confidence * 100)}%)
        </span>
      </div>

      {/* SQL Code */}
      <div className="mb-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
        <pre className="text-sm text-gray-800 overflow-x-auto">
          <code>{sql}</code>
        </pre>
      </div>

      {/* Explanation */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Explanation</h4>
        <p className="text-sm text-gray-600">{explanation}</p>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <h4 className="text-sm font-semibold text-yellow-800 mb-2">⚠️ Warnings</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            {warnings.map((warning, index) => (
              <li key={index}>• {warning}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
