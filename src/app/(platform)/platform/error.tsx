'use client';

import { useEffect } from 'react';

export default function PlatformError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Platform page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="mt-4 text-xl font-bold text-center text-gray-900">
          Connection Error
        </h2>
        <p className="mt-2 text-center text-gray-600">
          {error.message?.includes('Connection terminated') || error.message?.includes('ECONNREFUSED')
            ? 'Unable to connect to the database. Please ensure:'
            : 'An error occurred on the platform page.'}
        </p>
        <ul className="mt-4 text-sm text-gray-600 list-disc list-inside space-y-2">
          <li>.env.local file exists with DATABASE_URL</li>
          <li>PostgreSQL database is running</li>
          <li>Database credentials are correct</li>
        </ul>
        <button
          onClick={() => reset()}
          className="mt-6 w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
