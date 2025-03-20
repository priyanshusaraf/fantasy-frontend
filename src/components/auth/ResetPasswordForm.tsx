import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { z } from "zod";
import { toast } from "sonner";
import Link from "next/link";

// Form validation schema
const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Confirm password must be at least 8 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get("token") || "";
  const { resetPassword } = useAuth();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{ 
    password?: string;
    confirmPassword?: string;
    token?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    setErrors({});
    
    // Validate token
    if (!token) {
      setErrors({ token: "Reset token is missing" });
      return;
    }
    
    try {
      // Validate form
      const result = resetPasswordSchema.safeParse({ password, confirmPassword });
      if (!result.success) {
        const formattedErrors = result.error.format();
        setErrors({
          password: formattedErrors.password?._errors[0],
          confirmPassword: formattedErrors.confirmPassword?._errors[0],
        });
        return;
      }
      
      setIsSubmitting(true);
      
      // Reset password
      await resetPassword(token, password);
      
      // Show success toast and state
      toast.success("Password reset successful!");
      setIsSuccess(true);
      
      // Clear form
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to reset password";
      toast.error(errorMessage);
      
      // Check for token issues
      if (errorMessage.toLowerCase().includes("token")) {
        setErrors({ token: "Invalid or expired token" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="mx-auto max-w-md space-y-6 rounded-lg border bg-card p-6 shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Password Reset Complete</h1>
          <p className="text-muted-foreground">Your password has been successfully updated.</p>
        </div>
        
        <Button asChild className="w-full">
          <Link href="/auth?mode=signin">
            Go to Login
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6 rounded-lg border bg-card p-6 shadow-sm">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Reset Your Password</h1>
        <p className="text-muted-foreground">Enter your new password below</p>
      </div>
      
      {errors.token && (
        <div className="rounded-md bg-destructive/15 p-4 text-center">
          <p className="text-sm font-medium text-destructive">{errors.token}</p>
          <Button variant="outline" className="mt-2" asChild>
            <Link href="/auth/reset-password/request">
              Request New Reset Link
            </Link>
          </Button>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isSubmitting || Boolean(errors.token)}
            className={errors.password ? "border-destructive" : ""}
          />
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={isSubmitting || Boolean(errors.token)}
            className={errors.confirmPassword ? "border-destructive" : ""}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-destructive">{errors.confirmPassword}</p>
          )}
        </div>
        
        <Button 
          type="submit" 
          className="w-full" 
          disabled={isSubmitting || Boolean(errors.token)}
        >
          {isSubmitting ? "Resetting..." : "Reset Password"}
        </Button>
      </form>
      
      <div className="text-center text-sm">
        Remember your password?{" "}
        <Link href="/auth?mode=signin" className="text-primary hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}
