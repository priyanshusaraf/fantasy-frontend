"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { toast } from "sonner";
import { UserRole } from "@/context/AuthContext";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Form validation schema
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Confirm password must be at least 8 characters"),
  role: z.enum(["USER", "PLAYER", "REFEREE"]).default("USER"),
  rank: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => {
  // Player role requires rank
  if (data.role === "PLAYER" && (!data.rank || data.rank.trim() === "")) {
    return false;
  }
  return true;
}, {
  message: "Players must specify their rank",
  path: ["rank"],
});

export function RegisterForm() {
  const router = useRouter();
  const { register } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState<UserRole>("USER");
  const [rank, setRank] = useState("");
  const [errors, setErrors] = useState<{ 
    username?: string; 
    email?: string; 
    password?: string;
    confirmPassword?: string;
    role?: string;
    rank?: string;
    general?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [dbIssue, setDbIssue] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    setErrors({});
    setDbIssue(false);
    
    try {
      // Validate form
      const result = registerSchema.safeParse({ 
        username, 
        email, 
        password, 
        confirmPassword,
        role,
        rank: role === "PLAYER" ? rank : undefined 
      });
      if (!result.success) {
        const formattedErrors = result.error.format();
        setErrors({
          username: formattedErrors.username?._errors[0],
          email: formattedErrors.email?._errors[0],
          password: formattedErrors.password?._errors[0],
          confirmPassword: formattedErrors.confirmPassword?._errors[0],
          role: formattedErrors.role?._errors[0],
          rank: formattedErrors.rank?._errors[0],
        });
        return;
      }
      
      setIsSubmitting(true);
      
      try {
        // Submit registration
        await register({
          username,
          email,
          password,
          name: username,
          role,
          // Include rank for players
          ...(role === "PLAYER" ? { rank } : {})
        });
        
        // Show success toast
        toast.success("Registration successful");
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Registration failed";
        
        // Check if this is a database connection issue
        if (
          errorMessage.includes("database") || 
          errorMessage.includes("connection") ||
          errorMessage.includes("timeout") ||
          errorMessage.includes("ECONNREFUSED")
        ) {
          setDbIssue(true);
          setErrors({
            general: "Database connection issue. Your account may have been created but we couldn't verify it."
          });
          
          // Show specialized toast for DB issues
          toast.error("Database connection issue. Please try again later.");
        } else {
          // Handle normal registration errors
          toast.error(errorMessage);
          setErrors({
            general: errorMessage
          });
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Registration failed";
      toast.error(errorMessage);
      setErrors({
        general: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Retry registration if there was a database issue
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    handleSubmit(new Event('submit') as any);
  };

  return (
    <div className="mx-auto max-w-md space-y-6 rounded-lg border bg-card p-6 shadow-sm">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Create an account</h1>
        <p className="text-muted-foreground">Enter your details to register</p>
      </div>
      
      {errors.general && (
        <Alert variant={dbIssue ? "warning" : "destructive"} className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errors.general}</AlertDescription>
          {dbIssue && (
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={handleRetry}
              disabled={isSubmitting || retryCount >= 3}
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {retryCount >= 3 ? "Too many retries" : `Retry (${retryCount}/3)`}
            </Button>
          )}
        </Alert>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            type="text"
            placeholder="johndoe"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={isSubmitting}
            className={errors.username ? "border-destructive" : ""}
          />
          {errors.username && (
            <p className="text-sm text-destructive">{errors.username}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isSubmitting}
            className={errors.email ? "border-destructive" : ""}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isSubmitting}
              className={`${errors.password ? "border-destructive" : ""} pr-10`}
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
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isSubmitting}
              className={`${errors.confirmPassword ? "border-destructive" : ""} pr-10`}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              tabIndex={-1}
            >
              {showConfirmPassword ? 
                <EyeOff size={18} aria-hidden="true" /> : 
                <Eye size={18} aria-hidden="true" />
              }
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-destructive">{errors.confirmPassword}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select
            value={role}
            onValueChange={(value: UserRole) => {
              setRole(value);
              // Reset rank if changing from PLAYER to something else
              if (value !== "PLAYER") {
                setRank("");
              }
            }}
            disabled={isSubmitting}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>User Roles</SelectLabel>
                <SelectItem value="USER">Fantasy Player</SelectItem>
                <SelectItem value="PLAYER">Player</SelectItem>
                <SelectItem value="REFEREE">Referee</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          {errors.role && (
            <p className="text-sm text-destructive">{errors.role}</p>
          )}
        </div>
        
        {/* Show rank field only if role is PLAYER */}
        {role === "PLAYER" && (
          <div className="space-y-2">
            <Label htmlFor="rank">Rank/Skill Level</Label>
            <Input
              id="rank"
              type="text"
              placeholder="e.g. Master, Diamond, Platinum"
              value={rank}
              onChange={(e) => setRank(e.target.value)}
              required
              disabled={isSubmitting}
              className={errors.rank ? "border-destructive" : ""}
            />
            {errors.rank && (
              <p className="text-sm text-destructive">{errors.rank}</p>
            )}
          </div>
        )}
        
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : "Register"}
        </Button>
      </form>
      
      <div className="text-center text-sm">
        Already have an account?{" "}
        <Link href="/auth?mode=signin" className="text-primary hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}
