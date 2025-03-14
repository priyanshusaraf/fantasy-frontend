"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/Input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Info, AlertCircle, Check } from "lucide-react";

// Define the registration schema with Zod
const registerSchema = z
  .object({
    name: z
      .string()
      .min(3, { message: "Name must be at least 3 characters" })
      .max(50, { message: "Name must be at most 50 characters" }),
    email: z.string().email({ message: "Please enter a valid email address" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" })
      .regex(/[A-Z]/, {
        message: "Password must contain at least one uppercase letter",
      })
      .regex(/[a-z]/, {
        message: "Password must contain at least one lowercase letter",
      })
      .regex(/[0-9]/, { message: "Password must contain at least one number" }),
    confirmPassword: z.string(),
    role: z.enum(["USER", "PLAYER", "REFEREE", "TOURNAMENT_ADMIN"], {
      required_error: "Please select an account type",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleSigningIn, setGoogleSigningIn] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(
    null
  );

  // Initialize the form with react-hook-form and Zod validation
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "USER",
    },
  });

  // Handle form submission for email registration
  const onSubmit = async (data: RegisterFormValues) => {
    setIsSubmitting(true);
    setRegistrationError(null);

    try {
      // Store registration data in sessionStorage in case you need it later
      sessionStorage.setItem("registration_data", JSON.stringify(data));

      // Here, you can add your backend API call to create the user.
      // For example:
      // await fetch('/api/register', { method: 'POST', body: JSON.stringify(data) });

      // For now, we simulate a successful registration and trigger Google sign in.
      toast.success(
        "Registration successful! Redirecting to Google sign in..."
      );
      await handleGoogleSignIn();
    } catch (error) {
      console.error("Registration error:", error);
      setRegistrationError(
        error instanceof Error
          ? error.message
          : "Registration failed. Please try again."
      );
      toast.error("Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Google sign in separately
  const handleGoogleSignIn = async () => {
    try {
      setGoogleSigningIn(true);
      // Redirect to Google sign in with a callback URL (ensure you have a registration-callback page)
      await signIn("google", { callbackUrl: "/registration-callback" });
    } catch (error) {
      console.error("Google sign-in error:", error);
      toast.error("Google sign-in failed. Please try again.");
    } finally {
      setGoogleSigningIn(false);
    }
  };

  return (
    <div className="container mx-auto flex flex-col items-center justify-center min-h-screen py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-[#00a1e0]">
            Create an Account
          </CardTitle>
          <CardDescription className="text-center">
            Sign up to join fantasy pickleball tournaments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {registrationSuccess ? (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <Check className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">
                Registration successful!
              </AlertTitle>
              <AlertDescription className="text-green-700">
                Your account has been created. Redirecting to login...
              </AlertDescription>
            </Alert>
          ) : registrationError ? (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Registration Failed</AlertTitle>
              <AlertDescription>{registrationError}</AlertDescription>
            </Alert>
          ) : null}

          {/* Registration Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your full name" {...field} />
                    </FormControl>
                    <FormDescription>
                      This will be your public display name
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter your email address"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      We'll send you a verification email
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Create a password"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Must be at least 8 characters with uppercase, lowercase,
                      and a number
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Confirm your password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USER">
                          Fan / Fantasy Player
                        </SelectItem>
                        <SelectItem value="PLAYER">
                          Tournament Player
                        </SelectItem>
                        <SelectItem value="REFEREE">Referee</SelectItem>
                        <SelectItem value="TOURNAMENT_ADMIN">
                          Tournament Organizer
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {field.value === "PLAYER"
                        ? "Player accounts require approval to ensure fair play."
                        : field.value === "REFEREE"
                        ? "Referee accounts require approval before you can referee matches."
                        : field.value === "TOURNAMENT_ADMIN"
                        ? "Organizer accounts require approval before managing tournaments."
                        : "Fan accounts are instantly approved."}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {(form.watch("role") === "REFEREE" ||
                form.watch("role") === "TOURNAMENT_ADMIN" ||
                form.watch("role") === "PLAYER") && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Approval Required</AlertTitle>
                  <AlertDescription>
                    {form.watch("role") === "REFEREE"
                      ? "Referee accounts require approval before you can referee matches."
                      : form.watch("role") === "TOURNAMENT_ADMIN"
                      ? "Organizer accounts require approval before managing tournaments."
                      : "Player accounts require approval to ensure fair play."}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-[#00a1e0] hover:bg-[#0072a3]"
                disabled={isSubmitting || googleSigningIn}
              >
                {isSubmitting || googleSigningIn
                  ? "Processing..."
                  : "Register with Email"}
              </Button>
            </form>
          </Form>

          <div className="relative my-4">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-xs text-gray-500">
              OR
            </span>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={googleSigningIn}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
              width="24px"
              height="24px"
              className="mr-2"
            >
              <path
                fill="#FFC107"
                d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
              />
              <path
                fill="#FF3D00"
                d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
              />
              <path
                fill="#4CAF50"
                d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
              />
              <path
                fill="#1976D2"
                d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
              />
            </svg>
            {googleSigningIn
              ? "Signing in with Google..."
              : "Continue with Google"}
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-center text-sm">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-[#00a1e0] hover:text-[#0072a3] font-medium"
            >
              Sign in
            </Link>
          </div>
          <div className="text-center text-xs text-gray-500">
            By registering, you agree to our{" "}
            <Link href="/terms" className="underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline">
              Privacy Policy
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
