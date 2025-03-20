import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { z } from "zod";
import { toast } from "sonner";
import Link from "next/link";

// Form validation schema
const requestResetSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export function RequestPasswordResetForm() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ email?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    setErrors({});
    
    try {
      // Validate form
      const result = requestResetSchema.safeParse({ email });
      if (!result.success) {
        const formattedErrors = result.error.format();
        setErrors({
          email: formattedErrors.email?._errors[0],
        });
        return;
      }
      
      setIsSubmitting(true);
      
      // Request password reset
      await requestPasswordReset(email);
      
      // Show success state
      setIsSuccess(true);
      toast.success("Password reset link sent to your email");
      
      // Clear form
      setEmail("");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Request failed";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="mx-auto max-w-md space-y-6 rounded-lg border bg-card p-6 shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Check Your Email</h1>
          <p className="text-muted-foreground">
            If an account exists with {email}, we've sent a password reset link.
            Please check your inbox and spam folder.
          </p>
        </div>
        
        <div className="space-y-2">
          <Button className="w-full" onClick={() => setIsSuccess(false)}>
            Try Another Email
          </Button>
          
          <Button variant="outline" asChild className="w-full">
            <Link href="/auth?mode=signin">
              Return to Login
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6 rounded-lg border bg-card p-6 shadow-sm">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Reset Password</h1>
        <p className="text-muted-foreground">
          Enter your email address and we'll send you a link to reset your password
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
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
        
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send Reset Link"}
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