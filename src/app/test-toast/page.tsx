"use client";

import { useToast } from "@/utils/toast-util";

export default function TestToast() {
  const { showToast } = useToast();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
      <h1 className="text-2xl font-bold mb-6">Toast Utility Test</h1>
      
      <div className="flex flex-wrap gap-4 justify-center">
        <button
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          onClick={() => showToast("Success message example", "success")}
        >
          Show Success Toast
        </button>
        
        <button
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          onClick={() => showToast("Error message example", "error")}
        >
          Show Error Toast
        </button>
        
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => showToast("Info message example", "info")}
        >
          Show Info Toast
        </button>
        
        <button
          className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          onClick={() => showToast("Warning message example", "warning")}
        >
          Show Warning Toast
        </button>
      </div>
    </div>
  );
} 