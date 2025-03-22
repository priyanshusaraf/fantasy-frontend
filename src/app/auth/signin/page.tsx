"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { redirect } from "next/navigation";
import { useSession } from "next-auth/react";
import { LoginForm } from "@/components/auth/LoginForm";

function DatabaseStatusBanner() {
  const [dbStatus, setDbStatus] = useState<{
    status: { isConnected: boolean; lastError: string };
    testQuery: { success: boolean; responseTime: string };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const checkDatabaseStatus = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/diagnostics/database');
        if (response.ok) {
          const data = await response.json();
          setDbStatus(data);
          
          // If database is not connected, check again after 5 seconds
          if (!data.status.isConnected || !data.testQuery.success) {
            setTimeout(() => setRetryCount(prev => prev + 1), 5000);
          }
        } else {
          setTimeout(() => setRetryCount(prev => prev + 1), 5000);
        }
      } catch (error) {
        console.error("Error checking database status:", error);
        setTimeout(() => setRetryCount(prev => prev + 1), 5000);
      } finally {
        setLoading(false);
      }
    };

    checkDatabaseStatus();
  }, [retryCount]);

  if (loading && !dbStatus) return null;
  
  // If database is connected properly, don't show any banner
  if (dbStatus?.status.isConnected && dbStatus?.testQuery.success) return null;

  return (
    <div className="bg-red-50 border-l-4 border-red-600 p-4 mb-6">
      <div className="flex items-start">
        <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
        <div>
          <h3 className="text-sm font-medium text-red-800">
            Database connection problem detected
          </h3>
          <p className="text-sm text-red-700 mt-1">
            Your login might fail. Please try again in a few moments.
          </p>
          {dbStatus?.status.lastError && (
            <p className="text-xs text-gray-600 mt-1">
              Error: {dbStatus.status.lastError}
            </p>
          )}
          <button 
            onClick={() => setRetryCount(prev => prev + 1)}
            className="text-sm text-red-800 font-medium underline mt-2"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  const { data: session } = useSession();

  // Redirect to the dashboard if the user is already logged in
  useEffect(() => {
    if (session) {
      redirect("/dashboard");
    }
  }, [session]);

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground">
            Enter your credentials to sign in to your account
          </p>
        </div>
        
        <DatabaseStatusBanner />
        
        <LoginForm callbackUrl="/dashboard" />
      </div>
    </div>
  );
} 