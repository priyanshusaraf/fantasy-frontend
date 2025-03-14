// src/hooks/useRoleAccess.ts
import { useAuth } from "@/hooks/useAuth";

type UserRole =
  | "PLAYER"
  | "REFEREE"
  | "TOURNAMENT_ADMIN"
  | "MASTER_ADMIN"
  | "user";

export function useRoleAccess() {
  const { user } = useAuth();

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user) return false;

    const userRole = user.role as UserRole;
    if (Array.isArray(roles)) {
      return roles.includes(userRole);
    }
    return roles === userRole;
  };

  const isAdmin = (): boolean => {
    return hasRole(["TOURNAMENT_ADMIN", "MASTER_ADMIN"]);
  };

  const isReferee = (): boolean => {
    return hasRole("REFEREE");
  };

  const isPlayer = (): boolean => {
    return hasRole("PLAYER");
  };

  const isMasterAdmin = (): boolean => {
    return hasRole("MASTER_ADMIN");
  };

  return {
    hasRole,
    isAdmin,
    isReferee,
    isPlayer,
    isMasterAdmin,
  };
}
