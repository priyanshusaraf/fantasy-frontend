// src/components/auth/AuthGuard.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
// import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requireApproval?: boolean;
}

export function AuthGuard({
  children,
  allowedRoles = [],
  requireApproval = false,
}: AuthGuardProps) {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      router.push(
        "/login?callbackUrl=" + encodeURIComponent(window.location.pathname)
      );
      return;
    }

    // Check if user has the required role
    if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
      router.push("/unauthorized");
      return;
    }

    // Check if approval is required
    if (requireApproval && user && !user.isApproved) {
      router.push("/approval-pending");
      return;
    }

    setLoading(false);
  }, [isAuthenticated, user, router, allowedRoles, requireApproval]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        please wait...
      </div>
    );
  }

  return <>{children}</>;
}
