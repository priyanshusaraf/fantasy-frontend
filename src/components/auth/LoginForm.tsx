"use client";

import React, { useState, useMemo, useEffect } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff, RefreshCw } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Simple form validation schema - minimal requirements
const loginSchema = z.object({
  username: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

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
  const [retryCount, setRetryCount] = useState(0);
  const [dbChecked, setDbChecked] = useState(false);
  const [dbConnected, setDbConnected] = useState(true);
  const [checkingDb, setCheckingDb] = useState(true);
  const searchParams = useSearchParams();
  
  // Form setup with validation
  const form = useForm<typeof loginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: searchParams?.get("email") || "",
      password: "",
    },
  });
  
  // Auto-focus password field if email is pre-filled from URL
  useEffect(() => {
    const email = searchParams?.get("email");
    const autoLogin = searchParams?.get("autoLogin");
    
    if (email && autoLogin === "true") {
      // Auto-focus password field after a short delay
      setTimeout(() => {
        const passwordInput = document.querySelector('input[name="password"]') as HTMLInputElement;
        if (passwordInput) {
          passwordInput.focus();
        }
      }, 100);
    }
  }, [searchParams]);
  
  // Check database connection without blocking login flow
  useEffect(() => {
    const checkDbConnection = async () => {
      try {
        setCheckingDb(true);
        const response = await fetch("/api/check-db-connection");
        const data = await response.json();
        setDbConnected(data.connected);
        console.log("Database connection status:", data.connected);
      } catch (error) {
        console.error("Error checking database connection:", error);
        setDbConnected(false);
      } finally {
        setCheckingDb(false);
        setDbChecked(true);
      }
    };
    
    checkDbConnection();
  }, [retryCount]);
  
  const handleRetryDbConnection = () => {
    if (retryCount < 3) {
      setRetryCount(prevCount => prevCount + 1);
      setCheckingDb(true);
      toast.info("Retrying database connection...");
    } else {
      toast.error("Maximum retry attempts reached. Please try again later.");
    }
  };

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
        
        // Check if we should retry on database error
        if ((result.error.includes("connection") || result.error.includes("database")) && retryCount < 3) {
          setRetryCount(prev => prev + 1);
          toast.error(`Database connection issue. Retrying (${retryCount + 1}/3)...`);
          
          // Wait a moment and retry
          setTimeout(() => {
            handleSubmit(e);
          }, 2000);
          return;
        }
        
        // Show more user-friendly error messages
        if (result.error.includes("CredentialsSignin")) {
          toast.error("Invalid email or password");
        } else if (result.error.includes("connection")) {
          toast.error("Database connection issue. Please try again later.");
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
        
        {/* Database status indicator */}
        {!dbChecked ? (
          <div className="mt-2 text-sm text-blue-600 bg-blue-50 p-2 rounded-md flex items-center">
            <div className="animate-spin h-4 w-4 mr-2 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            Checking database connection...
          </div>
        ) : (
          dbConnected ? (
            <div className="mt-2 text-sm text-green-600 bg-green-50 p-2 rounded-md">
              <strong>Database connection:</strong> Successful
            </div>
          ) : (
            <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="text-yellow-700 dark:text-yellow-500 font-medium">
                  Database connection issue detected
                </div>
                {retryCount < 3 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="ml-auto"
                    onClick={handleRetryDbConnection}
                    disabled={checkingDb}
                  >
                    {checkingDb ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-1" />
                    )}
                    Retry
                  </Button>
                )}
              </div>
              <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                Please make sure you're using the correct email and password.
              </p>
            </div>
          )
        )}
        
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
