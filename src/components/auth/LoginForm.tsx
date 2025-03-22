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
  
  useEffect(() => {
    const checkDatabase = async () => {
      try {
        const res = await fetch('/api/system/db-check');
        const data = await res.json();
        if (!data.connected) {
          console.error('Database connection issue:', data);
          toast.error('System issue: Database connection problem detected');
        }
      } catch (error) {
        console.error('Failed to check database:', error);
      }
    };
    
    checkDatabase();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    setErrors({});
    
    try {
      // Basic validation
      const result = loginSchema.safeParse({ username, password });
      if (!result.success) {
        const formattedErrors = result.error.format();
        setErrors({
          username: formattedErrors.username?._errors[0],
          password: formattedErrors.password?._errors[0],
        });
        return;
      }
      
      setIsSubmitting(true);
      
      // Check if this might be an admin login
      let signInResult;
      
      // First try admin authentication if email looks like admin
      if (username.toLowerCase().includes("admin") || 
          username.toLowerCase() === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
        console.log("Attempting admin authentication");
        signInResult = await signIn("admin-credentials", {
          redirect: false,
          usernameOrEmail: username,
          password,
          callbackUrl: callbackUrl
        });
        
        // Log admin auth attempt result
        console.log("Admin auth attempt result:", {
          success: !signInResult?.error,
          error: signInResult?.error
        });
      }
      
      // If admin auth failed or wasn't attempted, try regular auth
      if (!signInResult || signInResult.error) {
        signInResult = await signIn("credentials", {
          redirect: false,
          usernameOrEmail: username,
          password,
          callbackUrl: callbackUrl
        });
      }
      
      if (signInResult?.error) {
        console.error("Login error details:", {
          error: signInResult.error,
          status: signInResult.status,
          ok: signInResult.ok,
          url: signInResult.url
        });
        
        // Log any additional details available
        toast.error("Login failed: " + signInResult.error);
        setErrors({
          username: "Authentication failed. Please check your credentials.",
          password: "Authentication failed. Please check your credentials.",
        });
        return;
      }
      
      // Show success toast
      toast.success("Login successful");
      
      // Get session to check user role
      const session = await fetch('/api/auth/session');
      const sessionData = await session.json();
      
      // Determine correct dashboard based on user role
      let targetUrl = callbackUrl;
      if (!targetUrl || targetUrl === "/user/dashboard") {
        const role = sessionData?.user?.role;
        // Only override if it's the default
        if (role === "TOURNAMENT_ADMIN" || role === "MASTER_ADMIN") {
          targetUrl = "/admin/dashboard";
        } else if (role === "REFEREE") {
          targetUrl = "/referee/dashboard";
        } else if (role === "PLAYER") {
          targetUrl = "/player/dashboard";
        } else {
          targetUrl = "/user/dashboard";
        }
        console.log(`Redirecting based on role: ${role} to ${targetUrl}`);
      }
      
      // Use signInResult.url if available (NextAuth redirect logic), otherwise use role-based redirect
      window.location.href = signInResult?.url || targetUrl;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Authentication failed";
      console.error("Login error:", error);
      toast.error(errorMessage);
      setErrors({
        username: "Authentication failed. Please try again.",
        password: "Authentication failed. Please try again.",
      });
    } finally {
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
        <p className="text-muted-foreground">Enter your credentials</p>
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
    </div>
  );
}
