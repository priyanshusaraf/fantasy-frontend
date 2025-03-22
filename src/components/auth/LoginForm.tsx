"use client";

import React, { useState, useMemo } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { toast } from "sonner";

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
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
      
      // Fix: Use usernameOrEmail instead of email to match server expectations
      const signInResult = await signIn("credentials", {
        redirect: false,
        usernameOrEmail: username, // Fix: Changed from 'email' to 'usernameOrEmail'
        password,
        callbackUrl: callbackUrl
      });
      
      if (signInResult?.error) {
        console.error("Login error:", signInResult.error);
        toast.error("Login failed: " + signInResult.error);
        setErrors({
          username: "Authentication failed. Please check your credentials.",
          password: "Authentication failed. Please check your credentials.",
        });
        return;
      }
      
      // Show success toast
      toast.success("Login successful");
      
      // Redirect immediately without timeout
      console.log("Login successful, redirecting to user dashboard");
      
      // Use router.push instead of window.location for smoother navigation
      if (signInResult?.url) {
        window.location.href = signInResult.url;
      } else {
        window.location.href = callbackUrl || "/user/dashboard";
      }
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
          <Input
            id="password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isSubmitting}
            className={errors.password ? "border-destructive" : ""}
            autoComplete="current-password"
          />
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
    </div>
  );
}
