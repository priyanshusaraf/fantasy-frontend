"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(() => {
    // Check if redirected with error
    const errorParam = searchParams.get("error");
    if (errorParam === "OAuthAccountNotLinked") {
      return "This email is already associated with a different sign-in method.";
    }
    return searchParams.get("error") ?? null;
  });

  // Handle redirect if user is already authenticated
  useEffect(() => {
    if (status === "authenticated") {
      const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
      router.push(callbackUrl);
    }
  }, [status, router, searchParams]);

  const handleGoogleLogin = async () => {
    try {
      setIsLoggingIn(true);
      setError(null);

      // Extract callbackUrl from search params or default to dashboard
      const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

      await signIn("google", { callbackUrl });
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Failed to sign in with Google. Please try again.");
      setError("Failed to sign in with Google. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // If already authenticated, show loading
  if (status === "authenticated" || status === "loading") {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00a1e0] mx-auto mb-4"></div>
          <p className="text-gray-500">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-[#00a1e0]">
            Sign In
          </CardTitle>
          <CardDescription className="text-center">
            Log in to manage your fantasy teams or create tournaments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Authentication Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            className="w-full bg-[#00a1e0] hover:bg-[#0072a3] flex items-center justify-center"
            onClick={handleGoogleLogin}
            disabled={isLoggingIn}
          >
            {isLoggingIn ? (
              <div className="flex items-center">
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Signing in...
              </div>
            ) : (
              <>
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
                Sign in with Google
              </>
            )}
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="text-[#00a1e0] hover:text-[#0072a3] font-medium"
            >
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
