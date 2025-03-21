import React from 'react';
import Link from 'next/link';

export default function MaintenancePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-white p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="mb-2 text-2xl font-bold text-gray-800">Database Maintenance</h1>
          <div className="mb-4 rounded-full bg-blue-100 p-3 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mx-auto h-8 w-8 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <p className="text-gray-600">
            We're experiencing database connectivity issues at the moment.
          </p>
        </div>

        <div className="space-y-4 text-sm text-gray-600">
          <div className="rounded-md bg-blue-50 p-4">
            <p className="font-medium text-blue-800">What's happening?</p>
            <p className="mt-1">
              Our database is currently undergoing maintenance or experiencing connectivity issues. 
              Some features of the application may be temporarily unavailable.
            </p>
          </div>

          <div className="rounded-md bg-green-50 p-4">
            <p className="font-medium text-green-800">What you can do now:</p>
            <ul className="mt-1 list-inside list-disc">
              <li>Wait a few minutes and try refreshing the page</li>
              <li>Basic browsing functionality should still be available</li>
              <li>Your data is safe and will be accessible once our systems are back online</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/dashboard"
            className="flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
          >
            Return to Dashboard
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 transition hover:bg-gray-50"
          >
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  );
} 