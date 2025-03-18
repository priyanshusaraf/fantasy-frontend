"use client";

import { useToast } from "@/utils/toast-util";
import Link from "next/link";

export default function TestPage() {
  const { showToast } = useToast();
  
  const showSuccessToast = () => {
    showToast("Success message example", "success");
  };
  
  const showErrorToast = () => {
    showToast("Error message example", "error"); 
  };
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 gap-6">
      <h1 className="text-3xl font-bold">Test Page</h1>
      <p className="text-xl">This is a test page with no database connections</p>
      
      <div className="flex flex-col gap-4 max-w-md">
        <div className="p-6 bg-card rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Toast System</h2>
          <div className="flex gap-3">
            <button 
              onClick={showSuccessToast}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
            >
              Success Toast
            </button>
            <button 
              onClick={showErrorToast}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
            >
              Error Toast
            </button>
          </div>
        </div>
        
        <div className="p-6 bg-card rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Color Samples</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-primary text-primary-foreground rounded">Primary</div>
            <div className="p-4 bg-secondary text-secondary-foreground rounded">Secondary</div>
            <div className="p-4 bg-accent text-accent-foreground rounded">Accent</div>
            <div className="p-4 bg-muted text-muted-foreground rounded">Muted</div>
          </div>
        </div>
        
        <Link href="/test-toast" className="text-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded">
          Go to Toast Test Page
        </Link>
      </div>
    </main>
  );
} 