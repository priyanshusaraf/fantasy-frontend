"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";

export default function FixAdminAuthPage() {
  const [email, setEmail] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/fix-admin-auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          adminKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fix admin authentication");
      }

      setSuccess(true);
      
      // Redirect after a delay
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err) {
      console.error("Error fixing admin auth:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fix admin authentication. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-green-600">
              Admin Authentication Fixed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="default" className="bg-green-50 border-green-100 mb-4">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <AlertTitle>Success!</AlertTitle>
              <AlertDescription>
                Your admin account has been prepared for Google login.
              </AlertDescription>
            </Alert>
            
            <div className="bg-blue-50 border border-blue-100 rounded-md p-4 mb-6">
              <h3 className="text-md font-medium text-blue-800 mb-2">Next steps:</h3>
              <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-700">
                <li>Go to the login page</li>
                <li>Click "Sign in with Google"</li>
                <li>
                  <strong className="text-blue-800">IMPORTANT:</strong> Use your Google account with email address{" "}
                  <strong>{email}</strong>
                </li>
                <li>The system will automatically link your Google account to your admin account</li>
              </ol>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500 mb-4">
                Redirecting to login page...
              </p>
              <Link href="/login">
                <Button variant="default">Go to Login</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-[#00a1e0]">
            Fix Admin Authentication
          </CardTitle>
          <CardDescription className="text-center">
            Repair admin account access with Google Login
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="mb-6 bg-amber-50 border border-amber-100 rounded-md p-4">
            <h3 className="text-sm font-medium text-amber-800 mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Why am I seeing this?
            </h3>
            <p className="text-sm text-slate-700">
              This tool fixes authentication issues that occur when you've created an admin account but are having 
              trouble signing in with Google. It repairs the connection between your admin account and Google authentication.
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Admin Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">
                This <strong>must be</strong> the same email you use for Google sign-in
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="admin-key">Admin Key</Label>
              <Input
                id="admin-key"
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Enter admin key"
                required
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">
                The same key you used to create the admin account
              </p>
            </div>
            
            <Button
              type="submit"
              className="w-full bg-[#00a1e0] hover:bg-[#0072a3]"
              disabled={isLoading}
            >
              {isLoading ? "Fixing..." : "Fix Authentication"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 justify-center pt-0">
          <p className="text-xs text-gray-500">
            After fixing authentication, you'll need to sign in with Google using the same email address
          </p>
        </CardFooter>
      </Card>
    </div>
  );
} 