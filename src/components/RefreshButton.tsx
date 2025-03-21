"use client";

import React from 'react';

const RefreshButton = () => {
  return (
    <button
      onClick={() => window.location.reload()}
      className="flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 transition hover:bg-gray-50"
    >
      Refresh Page
    </button>
  );
};

export default RefreshButton; 