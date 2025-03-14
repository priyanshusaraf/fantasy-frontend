import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/lib/user-service";

export function useAuth() {
  const [user, setUser] = useState<null | User>(null); // Ideally, define a proper User type.
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
    setIsAuthenticated(false);
    router.push("/login");
  }, [router]);

  const validateToken = useCallback(
    async (token: string) => {
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
          logout();
        }
      } catch (error) {
        console.error("Token validation error:", error);
        logout();
      }
    },
    [logout]
  );

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      validateToken(token);
    }
  }, [validateToken]);

  const login = async (email: string, password: string) => {
    try {
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

      router.push("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const register = async (
    username: string,
    email: string,
    password: string
  ) => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      if (!response.ok) {
        throw new Error("Registration failed");
      }

      // Consume the response without storing it to avoid unused variable warning.
      await response.json();

      await login(email, password);
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  return {
    user,
    isAuthenticated,
    login,
    register,
    logout,
  };
}
