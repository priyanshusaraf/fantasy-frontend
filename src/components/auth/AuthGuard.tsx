// src/components/auth/AuthGuard.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useSession } from "next-auth/react";
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
  const { user, isAuthenticated, isLoading: customAuthLoading } = useAuth();
  const { status: sessionStatus } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for both auth systems to resolve
    if (customAuthLoading || sessionStatus === "loading") {
      return;
    }

    // NextAuth is authenticated, allow access
    if (sessionStatus === "authenticated") {
      setLoading(false);
      return;
    }

    // Custom auth is authenticated, allow access
    if (isAuthenticated) {
      setLoading(false);
      return;
    }

    // Both auth systems have completed loading and user is not authenticated
    if (!isAuthenticated && sessionStatus === "unauthenticated") {
      // Store current URL to return after login, but prevent redirect loops
      const currentPath = window.location.pathname;
      
      // Don't redirect to login page if already on a login-related page
      const loginRelatedPaths = ['/login', '/auth', '/register'];
      if (loginRelatedPaths.some(path => currentPath.startsWith(path))) {
        setLoading(false);
        return;
      }
      
      router.push(
        "/login?callbackUrl=" + encodeURIComponent(currentPath)
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
  }, [isAuthenticated, customAuthLoading, sessionStatus, user, router, allowedRoles, requireApproval]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        please wait...
      </div>
    );
  }

  return <>{children}</>;
}
