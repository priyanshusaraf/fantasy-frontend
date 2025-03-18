// src/components/auth/AdminGuard.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If not loading and either not authenticated or not an admin, redirect
    if (
      !loading &&
      (!isAuthenticated ||
        !user ||
        !["MASTER_ADMIN", "TOURNAMENT_ADMIN"].includes(user.role))
    ) {
      router.push("/unauthorized");
    }
  }, [isAuthenticated, user, loading, router]);

  // Show loading state while checking authentication
  if (loading || !isAuthenticated) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#00a1e0]" />
      </div>
    );
  }

  // If not an admin, show access denied
  if (!user || !["MASTER_ADMIN", "TOURNAMENT_ADMIN"].includes(user.role)) {
    return null; // This will never render because the useEffect will redirect
  }

  // If authenticated and is an admin, render children
  return <>{children}</>;
}
