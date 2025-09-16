"use client";

import React, { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, Loader2, Users } from 'lucide-react';

export function MetadataCleanup() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCleanup = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/admin/clean-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to execute metadata cleanup');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center space-x-3 mb-4">
        <Shield className="h-6 w-6 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Security: Clerk Metadata Cleanup
        </h3>
      </div>

      <div className="mb-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-amber-800">
                <strong>Security Issue:</strong> Some user data (roles, tenant IDs) may be stored in
                public metadata where it can be accessed by client-side code.
              </p>
              <p className="text-sm text-amber-700 mt-1">
                This tool moves sensitive data to private metadata (server-side only) for better security.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleCleanup}
          disabled={isLoading}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-4 py-2 rounded-md flex items-center space-x-2 text-sm font-medium transition-colors"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Shield className="h-4 w-4" />
          )}
          <span>
            {isLoading ? 'Cleaning Metadata...' : 'Clean User Metadata'}
          </span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-2 mb-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">{result.message}</p>
              <div className="mt-2 flex items-center space-x-4 text-xs text-green-700">
                <span>Total Users: {result.totalUsers}</span>
                <span>Cleaned: {result.cleanedCount}</span>
              </div>
            </div>
          </div>

          {result.results && result.results.length > 0 && (
            <div className="mt-4">
              <div className="text-xs font-medium text-green-800 mb-2">Details:</div>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {result.results.map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between text-xs bg-green-100 rounded px-2 py-1">
                    <span className="truncate flex-1">{item.email}</span>
                    <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                      item.status === 'cleaned'
                        ? 'bg-green-200 text-green-800'
                        : item.status === 'error'
                        ? 'bg-red-200 text-red-800'
                        : 'bg-gray-200 text-gray-800'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MetadataCleanup;