// src/components/auth/RoleRestrictedRoute.tsx
"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type UserRole =
  | "PLAYER"
  | "REFEREE"
  | "TOURNAMENT_ADMIN"
  | "MASTER_ADMIN"
  | "user";

export default function RoleRestrictedRoute({
  children,
  allowedRoles,
  redirectTo = "/login",
}: {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
}) {
  const { isAuthenticated, user } = useAuth();
  const { hasRole } = useRoleAccess();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(redirectTo);
      return;
    }

    if (!hasRole(allowedRoles)) {
      router.push("/unauthorized");
    }
  }, [isAuthenticated, hasRole, allowedRoles, router, redirectTo]);

  if (!isAuthenticated || !hasRole(allowedRoles)) {
    return null;
  }

  return <>{children}</>;
}
