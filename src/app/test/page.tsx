"use client";

import { useState } from 'react';

export default function TestPage() {
  const [count, setCount] = useState(0);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">React 18 Test Page</h1>
      <p className="mb-4">This is a simple test to verify React 18 is working correctly.</p>
      
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => setCount(count - 1)}
          className="px-4 py-2 bg-red-500 text-white rounded"
        >
          Decrement
        </button>
        
        <span className="text-xl font-bold">{count}</span>
        
        <button 
          onClick={() => setCount(count + 1)}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Increment
        </button>
      </div>
      
      <p>If you can see this page and the counter works, React 18 is functioning correctly!</p>
    </div>
  );
} 