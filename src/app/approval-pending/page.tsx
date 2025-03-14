"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { Clock, ArrowLeft } from "lucide-react";
import { signOut } from "next-auth/react";

export default function ApprovalPendingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Redirect if not authenticated
    if (status === "unauthenticated") {
      router.push("/login");
    }

    // Redirect to dashboard if already approved
    if (status === "authenticated" && session?.user?.isApproved) {
      router.push("/dashboard");
    }
  }, [session, status, router]);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  // Show loading state if session is loading
  if (status === "loading") {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00a1e0] mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // If already approved or not authenticated, don't render (useEffect will redirect)
  if (
    (status === "authenticated" && session?.user?.isApproved) ||
    status === "unauthenticated"
  ) {
    return null;
  }

  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-amber-100 p-4">
              <Clock className="h-12 w-12 text-amber-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Approval Pending
          </CardTitle>
          <CardDescription className="text-center">
            Your account requires administrator approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-center">
              Your {session?.user?.role?.toLowerCase()?.replace("_", " ")}{" "}
              account has been created and is awaiting approval from our
              administrators.
            </p>
            <p className="text-center">
              You will receive an email notification once your account is
              approved.
            </p>
            <div className="rounded-lg bg-amber-50 p-4 border border-amber-200">
              <h3 className="font-semibold text-amber-800 mb-2">
                What happens next?
              </h3>
              <ul className="list-disc list-inside text-sm text-amber-700 space-y-1">
                <li>Our team will review your application</li>
                <li>This usually takes 1-2 business days</li>
                <li>Youll receive an email when your account is approved</li>
                <li>After approval, you can log in and access all features</li>
              </ul>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3">
          <Link href="/" className="w-full">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Home
            </Button>
          </Link>
          <Button
            variant="ghost"
            className="text-gray-500"
            onClick={handleSignOut}
          >
            Sign Out
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
