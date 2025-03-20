"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/Button";
import { AlertTriangle, ArrowRight, Info, Loader2 } from "lucide-react";
import Link from "next/link";

// Define error messages and solutions
const errorMessages: Record<string, { title: string; description: string; solution: string }> = {
  OAuthAccountNotLinked: {
    title: "Account Not Linked",
    description: "The email associated with your Google account already exists in our system, but it's not linked to your Google account.",
    solution: "Please use the Fix Auth tool to link your Google account to your existing account."
  },
  Default: {
    title: "Authentication Error",
    description: "There was a problem authenticating your account.",
    solution: "Please try again or contact support if the problem persists."
  },
  Callback: {
    title: "Callback Error",
    description: "There was a problem with the authentication callback.",
    solution: "Please try again or use a different sign-in method."
  },
  AccessDenied: {
    title: "Access Denied",
    description: "You don't have permission to access this resource.",
    solution: "Please contact an administrator if you believe this is an error."
  },
  Verification: {
    title: "Verification Error",
    description: "There was a problem verifying your identity.",
    solution: "Please try signing in again or contact support."
  }
};

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-[#00a1e0] mb-4" />
            <p className="text-center text-gray-500">Loading error details...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const [errorType, setErrorType] = useState<string>("Default");
  
  useEffect(() => {
    const error = searchParams.get("error");
    if (error && Object.keys(errorMessages).includes(error)) {
      setErrorType(error);
    }
  }, [searchParams]);

  const errorInfo = errorMessages[errorType] || errorMessages.Default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-red-600 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6" />
            {errorInfo.title}
          </CardTitle>
          <CardDescription>
            Authentication error details and solutions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error: {errorType}</AlertTitle>
            <AlertDescription>
              {errorInfo.description}
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <h3 className="text-md font-medium flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-500" />
              Recommended Solution
            </h3>
            <p className="text-sm text-slate-600">
              {errorInfo.solution}
            </p>
            
            {errorType === "OAuthAccountNotLinked" && (
              <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-100">
                <h4 className="text-sm font-medium text-blue-700">Quick Fix Options:</h4>
                <ul className="mt-2 space-y-2 text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                    <span>
                      <Link href="/fix-admin-auth" className="text-blue-600 hover:underline font-medium">
                        Use the Fix Admin Auth Tool
                      </Link> to properly link your account.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                    <span>
                      Use a different email address for your Google sign-in.
                    </span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Link href="/auth">
            <Button variant="outline">Back to Sign In</Button>
          </Link>
          
          {errorType === "OAuthAccountNotLinked" && (
            <Link href="/fix-admin-auth">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Fix Authentication
              </Button>
            </Link>
          )}
        </CardFooter>
      </Card>
    </div>
  );
} 