"use client";

import React, { useState, useMemo, useEffect } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

// Simple form validation schema - minimal requirements
const loginSchema = z.object({
  username: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});
//meow meow
interface LoginFormProps {
  callbackUrl?: string;
}

export function LoginForm({ callbackUrl = "/user/dashboard" }: LoginFormProps) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginFailed, setLoginFailed] = useState(false);
  const [error, setError] = useState("");
  
  useEffect(() => {
    const checkDatabase = async () => {
      try {
        // Try to check database connection - we'll now use our direct endpoint
        const response = await fetch('/api/check-db-connection');
        
        if (!response.ok) {
          console.error('Database check failed:', response.status);
          return; // Don't block the login flow
        }
        
        const data = await response.json();
        
        if (!data.connected) {
          console.error('Database connection issue:', data);
          toast.error('Database connection issue detected. You may still be able to log in.');
        }
      } catch (error) {
        console.error('Failed to check database:', error);
        // Don't show an error to the user, just log it
      }
    };
    
    // Run the check but don't await it - don't block the login page rendering
    checkDatabase();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLoginFailed(false);
    setError("");
    
    // Basic validation
    if (!username || !password) {
      toast.error("Please enter both email and password");
      setIsSubmitting(false);
      return;
    }

    try {
      console.log(`Attempting login with username: ${username}`);
      
      // Sign in with credentials
      const result = await signIn("credentials", {
        usernameOrEmail: username,
        password,
        redirect: false,
      });

      if (result?.error) {
        console.error("Login error:", result.error);
        
        // Show more user-friendly error messages
        if (result.error.includes("CredentialsSignin")) {
          toast.error("Invalid email or password");
        } else if (result.error.includes("connection")) {
          toast.error("Database connection issue. Please try again.");
        } else {
          toast.error(result.error);
        }
        
        setLoginFailed(true);
        setError(result.error);
        setIsSubmitting(false);
        return;
      }

      // Success!
      toast.success("Login successful!");
      
      // Redirect without window.location (let NextAuth handle it)
      router.push("/user/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      toast.error("An unexpected error occurred");
      setLoginFailed(true);
      setError(err instanceof Error ? err.message : "Unknown error");
      setIsSubmitting(false);
    }
  };

  const testDirectAuth = async () => {
    try {
      const response = await fetch('/api/auth/debug');
      const data = await response.json();
      console.log('Auth debug info:', data);
      toast.info('Check console for auth debug info');
    } catch (error) {
      console.error('Auth debug test error:', error);
      toast.error('Auth debug test failed');
    }
  };

  const attemptDirectAdminLogin = async () => {
    try {
      setIsSubmitting(true);
      toast.info("Attempting direct admin login...");
      
      // Try both providers sequentially
      const adminResult = await signIn("admin-credentials", {
        redirect: false,
        usernameOrEmail: username || process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@example.com",
        password: password || process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "adminpass",
        callbackUrl: "/admin/dashboard"
      });
      
      console.log("Direct admin login attempt:", {
        success: !adminResult?.error,
        error: adminResult?.error,
        email: username,
        passwordProvided: !!password
      });
      
      if (!adminResult?.error) {
        toast.success("Admin login successful");
        window.location.href = "/admin/dashboard";
        return;
      }
      
      toast.error("Direct admin login failed: " + adminResult.error);
    } catch (error) {
      console.error("Direct admin login error:", error);
      toast.error("Direct admin login attempt failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6 rounded-lg border bg-card p-6 shadow-sm">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Sign In</h1>
        <p className="text-muted-foreground">Enter your email and password to access your account</p>
        <div className="mt-2 text-sm text-amber-600 bg-amber-50 p-2 rounded-md">
          <strong>Important:</strong> Make sure to use the exact email and password you registered with. 
          The login is case-sensitive.
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Email</Label>
          <Input
            id="username"
            type="email"
            placeholder="Enter your email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={isSubmitting}
            className={errors.username ? "border-destructive" : ""}
            autoComplete="email"
          />
          {errors.username && (
            <p className="text-sm text-destructive">{errors.username}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isSubmitting}
              className={`${errors.password ? "border-destructive" : ""} pr-10`}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? 
                <EyeOff size={18} aria-hidden="true" /> : 
                <Eye size={18} aria-hidden="true" />
              }
              <span className="sr-only">
                {showPassword ? "Hide password" : "Show password"}
              </span>
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password}</p>
          )}
        </div>
        
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>
      
      <div className="text-center text-sm">
        Don't have an account?{" "}
        <Link href="/auth?mode=signup" className="text-primary hover:underline">
          Sign up
        </Link>
      </div>

      <button 
        type="button" 
        className="text-sm text-muted-foreground mt-4"
        onClick={testDirectAuth}
      >
        Run Auth Diagnostics
      </button>

      <div className="mt-4">
        <button 
          type="button" 
          className="text-xs text-muted-foreground underline"
          onClick={attemptDirectAdminLogin}
        >
          Admin Login Troubleshooter
        </button>
      </div>

      {loginFailed && (
        <div className="mt-4 text-center text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}
