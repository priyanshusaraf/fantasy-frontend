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
import { Eye, EyeOff, RefreshCw, AlertCircle, CheckCircle, Database } from "lucide-react";

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
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [isCheckingDb, setIsCheckingDb] = useState(false);
  
  // Function to check database connection
  const checkDatabase = async () => {
    try {
      setIsCheckingDb(true);
      
      // Try the check-db-connection endpoint
      let response = await fetch('/api/check-db-connection');
      
      // If that fails with a 404, try system/db-check as fallback
      if (!response.ok && response.status === 404) {
        console.log('DB check endpoint not found, trying system/db-check instead');
        response = await fetch('/api/system/db-check');
        
        // If that fails too, try the health endpoint as last resort
        if (!response.ok && response.status === 404) {
          console.log('System db-check endpoint not found, trying health endpoint');
          response = await fetch('/api/health');
        }
      }
      
      if (!response.ok) {
        console.error('All database check endpoints unavailable:', response.status);
        setDbStatus('disconnected');
        return;
      }
      
      const data = await response.json();
      console.log('Database connection check response:', data);
      
      // Properly handle the response structure
      // The API now returns a 'connected' property directly
      const isConnected = typeof data.connected === 'boolean' 
        ? data.connected 
        : data.status === 'healthy';
      
      console.log('Database connected status:', isConnected);
      setDbStatus(isConnected ? 'connected' : 'disconnected');
      
      if (isConnected) {
        toast.success('Database connection restored!', {
          id: 'db-connection-status'
        });
      } else {
        console.error('Database connection issue:', data);
        toast.error('System issue: Database connection problem detected', {
          id: 'db-connection-status',
          description: 'Your login might fail. Please try again in a few moments.',
          action: {
            label: 'Retry',
            onClick: () => checkDatabase()
          }
        });
      }
    } catch (error) {
      console.error('Failed to check database:', error);
      setDbStatus('disconnected');
    } finally {
      setIsCheckingDb(false);
    }
  };
  
  // Check database connection on component mount
  useEffect(() => {
    checkDatabase();
    
    // Set up periodic checks every 30 seconds
    const interval = setInterval(() => {
      // Only check if currently disconnected
      if (dbStatus === 'disconnected') {
        checkDatabase();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [dbStatus]);

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
      // Check database connection first
      if (dbStatus === 'disconnected') {
        await checkDatabase();
        
        // If still disconnected, warn the user
        if (dbStatus === 'disconnected') {
          toast.warning("Database connection issue detected. Login might fail.");
        }
      }
      
      // Proceed with sign in
      const result = await signIn("credentials", {
        usernameOrEmail: username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setLoginFailed(true);
        
        // Special handling for database connection errors
        if (result.error.includes('Database connection') || result.error.includes('database issue')) {
          setError("Database connection issue. Please try again in a few moments.");
          toast.error("Database connection issue detected", {
            description: "The server couldn't connect to the database. Please try again later.",
            action: {
              label: 'Retry',
              onClick: () => checkDatabase()
            }
          });
        } else {
          setError(result.error);
          toast.error("Login failed: " + result.error);
        }
        
        setIsSubmitting(false);
        return;
      }

      toast.success("Login successful!");
      
      // Simple redirect to dashboard (NextAuth callbacks will handle role-based redirects)
      window.location.href = "/user/dashboard";
    } catch (err) {
      console.error("Login error:", err);
      toast.error("An unexpected error occurred");
      setLoginFailed(true);
      setError("An unexpected error occurred during login. Please try again.");
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
        
        {/* Database connection status indicator */}
        <div className={`flex items-center justify-center gap-2 text-sm p-2 rounded-md mt-2 
          ${dbStatus === 'connected' ? 'text-green-600 bg-green-50' : 
            dbStatus === 'disconnected' ? 'text-red-600 bg-red-50' : 
            'text-amber-600 bg-amber-50'}`}>
          
          {dbStatus === 'connected' ? (
            <>
              <CheckCircle size={16} />
              <span>Database connected</span>
            </>
          ) : dbStatus === 'disconnected' ? (
            <>
              <AlertCircle size={16} />
              <span>Database connection issue detected</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={checkDatabase} 
                disabled={isCheckingDb} 
                className="ml-2 h-7 px-2"
              >
                <RefreshCw size={14} className={`mr-1 ${isCheckingDb ? 'animate-spin' : ''}`} />
                Retry
              </Button>
            </>
          ) : (
            <>
              <Database size={16} className="animate-pulse" />
              <span>Checking database connection...</span>
            </>
          )}
        </div>
        
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
        
        <Button 
          type="submit" 
          className="w-full" 
          disabled={isSubmitting || (dbStatus === 'disconnected')} 
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
        
        {dbStatus === 'disconnected' && (
          <p className="text-xs text-center text-destructive">
            Warning: Database is currently unavailable. Login may fail.
          </p>
        )}
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
        <div className="mt-4 p-3 text-center text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}
    </div>
  );
}
