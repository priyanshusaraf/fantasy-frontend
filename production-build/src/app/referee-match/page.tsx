"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RefereMatchRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the correct referee matches page
    router.push("/referee/matches");
  }, [router]);
  
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
        <h2 className="text-2xl font-bold">Redirecting...</h2>
        <p>Please wait while we redirect you to the referee matches page.</p>
      </div>
    </div>
  );
} 