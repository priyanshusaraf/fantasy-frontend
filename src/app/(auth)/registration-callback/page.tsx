// src/app/registration-callback/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";

export default function RegistrationCallback() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(true);
  const router = useRouter();
  const { data: session, status, update } = useSession();

  useEffect(() => {
    async function completeRegistration() {
      if (status === "loading") return;

      if (status === "unauthenticated") {
        router.push("/auth?mode=signin");
        return;
      }

      try {
        const storedData = localStorage.getItem("pendingRegistration");

        if (!storedData) {
          if (session?.user?.role && session?.user?.username) {
            router.push("/dashboard");
            return;
          }

          setError("No registration data found. Please try registering again.");
          setIsProcessing(false);
          return;
        }

        const { role, username } = JSON.parse(storedData);

        if (session?.user?.email && role && username) {
          const response = await fetch("/api/auth/complete-registration", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: session.user.email,
              role,
              username,
            }),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || "Failed to complete registration");
          }

          const data = await response.json();

          // Update the session
          await update();

          // Clear stored registration data
          localStorage.removeItem("pendingRegistration");

          setSuccess(true);
          setIsProcessing(false);

          // Redirect after a delay
          setTimeout(() => {
            if (role === "REFEREE" || role === "TOURNAMENT_ADMIN") {
              router.push("/approval-pending");
            } else {
              router.push("/dashboard");
            }
          }, 2000);
        } else {
          throw new Error("Missing required registration data");
        }
      } catch (err) {
        console.error("Error completing registration:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to complete registration. Please try again."
        );
        setIsProcessing(false);
      }
    }

    completeRegistration();
  }, [session, status, router, update]);

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-xl text-center text-[#00a1e0]">
              Completing Registration
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 animate-spin text-[#00a1e0] mb-4" />
            <p className="text-center">
              Please wait while we set up your account...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-xl text-center text-red-600">
              Registration Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="flex justify-center mt-4">
              <Button
                onClick={() => router.push("/auth?mode=register")}
                className="bg-[#00a1e0] hover:bg-[#0072a3]"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-xl text-center text-green-600">
              Registration Complete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Success!</AlertTitle>
              <AlertDescription className="text-green-700">
                Your account has been successfully set up. Redirecting you to
                the dashboard...
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fallback UI (should not normally be reached)
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <p>Processing your registration...</p>
    </div>
  );
}
