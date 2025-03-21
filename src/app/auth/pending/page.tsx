import React from 'react';
import Link from 'next/link';

export default function PendingAuthPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="mb-2 text-2xl font-bold text-gray-800">Registration Pending</h1>
          <div className="mb-4 rounded-full bg-yellow-100 p-3 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mx-auto h-8 w-8 text-yellow-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-gray-600">
            Your account has been registered but is waiting for database synchronization.
          </p>
        </div>

        <div className="space-y-4 text-sm text-gray-600">
          <div className="rounded-md bg-blue-50 p-4">
            <p className="font-medium text-blue-800">What happened?</p>
            <p className="mt-1">
              We are experiencing a temporary database connection issue. Your registration information has been saved locally and will be synchronized when the connection is restored.
            </p>
          </div>

          <div className="rounded-md bg-green-50 p-4">
            <p className="font-medium text-green-800">What should I do now?</p>
            <ul className="mt-1 list-inside list-disc">
              <li>You can try logging in later when the database connection is restored.</li>
              <li>No need to register again - your information has been saved.</li>
              <li>Our system will automatically synchronize your account when possible.</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/auth"
            className="flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
          >
            Return to Login
          </Link>
          <Link
            href="/"
            className="flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 transition hover:bg-gray-50"
          >
            Go to Home Page
          </Link>
        </div>
      </div>
    </div>
  );
} 