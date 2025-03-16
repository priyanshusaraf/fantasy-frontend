// src/hooks/useAuth.ts
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/lib/user-service";
import { useSession } from "next-auth/react";

export function useAuth() {
  const [user, setUser] = useState<null | User>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { data: session, status } = useSession();

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
    setIsAuthenticated(false);
    router.push("/login");
  }, [router]);

  const validateToken = useCallback(
    async (token: string) => {
      try {
        setIsLoading(true);
        
        // First check if we have a NextAuth session, use that if available
        if (status === "authenticated" && session?.user) {
          setUser(session.user as unknown as User);
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }
        
        // Try using the API endpoint if it exists
        try {
          const response = await fetch("/api/auth/validate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            setIsAuthenticated(true);
          } else {
            // If validate endpoint fails, don't immediately logout
            // Just clear the auth state without redirect
            localStorage.removeItem("token");
            setUser(null);
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error("Token validation error:", error);
          // Don't redirect on error, just clear state
          localStorage.removeItem("token");
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [session, status]
  );

  useEffect(() => {
    // If we have a NextAuth session, use that
    if (status === "authenticated" && session?.user) {
      setUser(session.user as unknown as User);
      setIsAuthenticated(true);
      setIsLoading(false);
      return;
    }
    
    // Otherwise try the token from localStorage
    const token = localStorage.getItem("token");
    if (token) {
      validateToken(token);
    } else {
      setIsLoading(false);
    }
  }, [validateToken, session, status]);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const data = await response.json();

      localStorage.setItem("token", data.token);
      setUser(data.user);
      setIsAuthenticated(true);

      // Redirect based on role and approval status
      if (data.user.role !== "user" && !data.user.isApproved) {
        router.push("/approval-pending");
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    username: string,
    email: string,
    password: string,
    role: string = "user"
  ) => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, role }),
      });

      if (!response.ok) {
        throw new Error("Registration failed");
      }

      // Consume the response without storing it to avoid unused variable warning.
      await response.json();

      if (role !== "user") {
        // If role requires approval, redirect to pending approval page
        router.push("/approval-pending");
      } else {
        // Otherwise proceed with login
        await login(email, password);
      }
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user has a specific role
  const hasRole = (roles: string | string[]) => {
    if (!user) return false;

    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }

    return user.role === roles;
  };

  // Check if user is approved
  const isApproved = () => {
    return user?.isApproved || false;
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    hasRole,
    isApproved,
  };
}
