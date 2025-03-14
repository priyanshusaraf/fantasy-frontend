// src/app/approval-pending/page.tsx
"use client";

import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Clock } from "lucide-react";
import Link from "next/link";

export default function ApprovalPendingPage() {
  const { user, logout } = useAuth();

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
          <p className="text-center mb-4">
            Your {user?.role.toLowerCase().replace("_", " ")} account has been
            created and is awaiting approval from our administrators.
          </p>
          <p className="text-center mb-4">
            You will receive an email notification once your account is
            approved.
          </p>
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
            onClick={() => logout()}
          >
            Sign Out
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
