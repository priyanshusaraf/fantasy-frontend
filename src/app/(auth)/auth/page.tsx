"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import PreRegistrationForm from "@/components/auth/PreRegistrationForm";

export default function AuthPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("mode") || "signin";
  const [loading, setLoading] = useState(false);

  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const authError = searchParams.get("error");

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  const handleTabChange = (value: string) => {
    router.push(
      `/auth?mode=${value}${callbackUrl ? `&callbackUrl=${callbackUrl}` : ""}`
    );
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signIn("google", { callbackUrl });
    } catch (err) {
      console.error("Google sign-in error:", err);
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#00a1e0]" />
      </div>
    );
  }

  return (
    <div className="container flex items-center justify-center min-h-screen p-4">
      <Tabs
        defaultValue={activeTab}
        onValueChange={handleTabChange}
        className="w-full max-w-md"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="signin">Sign In</TabsTrigger>
          <TabsTrigger value="register">Register</TabsTrigger>
        </TabsList>

        <TabsContent value="signin">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center text-[#00a1e0]">
                Sign In
              </CardTitle>
              <CardDescription className="text-center">
                Sign in with your Google account to continue
              </CardDescription>
            </CardHeader>
            <CardContent>
              {authError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Authentication Error</AlertTitle>
                  <AlertDescription>
                    {authError === "OAuthCreateAccount"
                      ? "There was an error creating your account. Please try again."
                      : "Authentication failed. Please try again."}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full justify-center"
                variant="outline"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing
                    in...
                  </>
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
            <CardFooter className="flex flex-col space-y-2">
              <div className="text-center text-xs text-gray-500">
                Don&apos;t have an account?{" "}
                <Link
                  href="/auth?mode=register"
                  className="text-[#00a1e0] hover:underline"
                >
                  Register here
                </Link>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="register">
          <PreRegistrationForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
