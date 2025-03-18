// src/app/unauthorized/page.tsx
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
import { ArrowLeft, ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function UnauthorizedPage() {
  const { logout } = useAuth();

  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-red-100 p-4">
              <ShieldAlert className="h-12 w-12 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Access Denied
          </CardTitle>
          <CardDescription className="text-center">
            You dont have permission to access this page
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center mb-4">
            You need additional permissions to view this page. If you believe
            this is an error, please contact the administrator.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3">
          <Link href="/dashboard" className="w-full">
            <Button
              variant="default"
              className="w-full bg-[#00a1e0] hover:bg-[#0072a3]"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Dashboard
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
