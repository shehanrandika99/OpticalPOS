'use client';

import { useState } from 'react';

interface ConnectionStatus {
  loading: boolean;
  success: boolean | null;
  message: string;
  timestamp?: string;
  error?: string;
}

export default function DBTest() {
  const [status, setStatus] = useState<ConnectionStatus>({
    loading: false,
    success: null,
    message: '',
  });

  const testConnection = async () => {
    setStatus({ loading: true, success: null, message: 'Connecting to database...', error: undefined });
    
    try {
      // Create AbortController for timeout handling - reduced to 8 seconds
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      const response = await fetch('/api/test-db', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      setStatus({
        loading: false,
        success: data.success,
        message: data.message,
        timestamp: data.timestamp,
        error: data.error,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Handle timeout/abort specifically
      if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
        setStatus({
          loading: false,
          success: false,
          message: 'Connection timeout. The database is taking too long to respond.',
          error: 'Request timed out after 8 seconds. Please check your connection string.',
        });
      } else {
        setStatus({
          loading: false,
          success: false,
          message: 'Failed to connect to database',
          error: errorMessage,
        });
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 border rounded-lg bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
      <h2 className="text-xl font-semibold text-black dark:text-zinc-50">
        Database Connection Test
      </h2>
      <button
        onClick={testConnection}
        disabled={status.loading}
        className="px-6 py-2 rounded-full bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[160px]"
      >
        {status.loading ? (
          <span className="flex items-center gap-2">
            <span className="animate-spin">⏳</span>
            Connecting...
          </span>
        ) : (
          'Test Connection'
        )}
      </button>
      
      {status.loading && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Please wait, connecting to database...
        </p>
      )}
      
      {status.success !== null && (
        <div
          className={`p-4 rounded-lg ${
            status.success
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
          }`}
        >
          <p className="font-medium">{status.message}</p>
          {status.timestamp && (
            <p className="text-sm mt-2 opacity-75">
              Server time: {new Date(status.timestamp).toLocaleString()}
            </p>
          )}
          {status.error && (
            <p className="text-sm mt-2 opacity-75 font-mono">
              Error: {status.error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

