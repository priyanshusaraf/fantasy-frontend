import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";

export type UserRole =
  | "USER"
  | "PLAYER"
  | "REFEREE"
  | "TOURNAMENT_ADMIN"
  | "MASTER_ADMIN";

interface User {
  id: string;
  email: string;
  username: string;
  profileImage?: string;
  role: UserRole;
  isApproved: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (provider: string) => Promise<void>;
  register: (username: string, email: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  isApproved: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Update user state when session changes
  useEffect(() => {
    if (status === "loading") {
      setIsLoading(true);
      return;
    }

    if (session && session.user) {
      setUser({
        id: session.user.id as string,
        email: session.user.email as string,
        username: session.user.name as string,
        profileImage: session.user.image || undefined,
        role: (session.user.role as UserRole) || "USER",
        isApproved: (session.user.isApproved as boolean) || false,
      });
      setIsLoading(false);
    } else {
      setUser(null);
      setIsLoading(false);
    }
  }, [session, status]);

  // Login using OAuth provider
  const login = async (provider: string = "google") => {
    setIsLoading(true);
    try {
      await signIn(provider, { callbackUrl: "/dashboard" });
    } catch (error) {
      console.error("Authentication error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register new user
  const register = async (
    username: string,
    email: string,
    role: UserRole = "USER"
  ) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, role }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Registration failed");
      }

      // After registration, redirect to login
      await login("google");
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout user
  const logout = async () => {
    try {
      await signOut({ callbackUrl: "/" });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Check if user has specified role(s)
  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user) return false;

    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }

    return user.role === roles;
  };

  // Check if user is approved
  const isApproved = (): boolean => {
    return Boolean(user?.isApproved);
  };

  const contextValue: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    hasRole,
    isApproved,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
