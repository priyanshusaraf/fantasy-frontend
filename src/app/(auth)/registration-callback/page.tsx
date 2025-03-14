"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function RegistrationCallbackPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [processing, setProcessing] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsApproval, setNeedsApproval] = useState(false);

  // Function to complete the registration process
  const completeRegistration = async () => {
    // If session status is still loading, do nothing
    if (status === "loading") return;

    if (status === "unauthenticated") {
      setError("Authentication failed. Please try again.");
      setProcessing(false);
      return;
    }

    // Retrieve stored registration data from sessionStorage
    const registrationDataStr = sessionStorage.getItem("registration_data");
    if (!registrationDataStr) {
      // No registration data found – likely a direct login
      setSuccess(true);
      setProcessing(false);
      router.push("/dashboard");
      return;
    }

    try {
      const registrationData = JSON.parse(registrationDataStr);

      // Update the user's role (and name) on the backend
      const response = await fetch("/api/auth/update-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: registrationData.name,
          role: registrationData.role,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update user role");
      }

      // Optionally, you can use the returned data if needed:
      await response.json();

      // Clear stored registration data
      sessionStorage.removeItem("registration_data");

      // Check if the role requires manual approval
      if (
        registrationData.role === "REFEREE" ||
        registrationData.role === "TOURNAMENT_ADMIN" ||
        registrationData.role === "PLAYER"
      ) {
        setNeedsApproval(true);
      }

      setSuccess(true);
      toast.success("Registration completed successfully!");
    } catch (err) {
      console.error("Error completing registration:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Registration failed. Please try again."
      );
      toast.error("Registration failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    completeRegistration();
    // We include 'status' in the dependency array to re-run when it changes.
  }, [status, router]);

  // Continue button handler: If registration failed, retry by reloading the page.
  const handleRetry = () => {
    router.reload();
  };

  // If registration succeeded, send user to either the approval pending page or the dashboard.
  const handleContinue = () => {
    router.push(needsApproval ? "/approval-pending" : "/dashboard");
  };

  return (
    <div className="container mx-auto flex flex-col items-center justify-center min-h-screen py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-[#00a1e0]">
            {processing
              ? "Processing Registration"
              : success
              ? "Registration Successful"
              : "Registration Error"}
          </CardTitle>
          <CardDescription className="text-center">
            {processing
              ? "Please wait while we complete your registration..."
              : success
              ? needsApproval
                ? "Your account has been created and is awaiting approval."
                : "Your account has been created successfully."
              : "There was a problem completing your registration."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center pt-6">
          {processing ? (
            <Loader2
              className="h-16 w-16 text-[#00a1e0] animate-spin"
              aria-label="Loading"
            />
          ) : success ? (
            <CheckCircle
              className="h-16 w-16 text-green-500"
              aria-label="Success"
            />
          ) : (
            <AlertCircle
              className="h-16 w-16 text-red-500"
              aria-label="Error"
            />
          )}

          {success && needsApproval && (
            <Alert className="mt-6 bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800">
                Approval Required
              </AlertTitle>
              <AlertDescription className="text-amber-700">
                Your account requires administrator approval. You'll receive an
                email when your account is approved.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mt-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          {!processing && (
            <Button
              onClick={error ? handleRetry : handleContinue}
              className="bg-[#00a1e0] hover:bg-[#0072a3]"
            >
              {error
                ? "Retry Registration"
                : success
                ? needsApproval
                  ? "View Approval Status"
                  : "Continue to Dashboard"
                : "Try Again"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
