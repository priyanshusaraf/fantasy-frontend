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

export default function AdminAccountSetupPage() {
  const [email, setEmail] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [googleId, setGoogleId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/link-google-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          adminKey,
          googleId,
          accessToken,
          refreshToken: refreshToken || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to link Google account");
      }

      setSuccess(true);
      
      // Redirect after a delay
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err) {
      console.error("Error linking Google account:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to link Google account. Please try again."
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
              Google Account Linked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="default" className="bg-green-50 border-green-100">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <AlertTitle>Success!</AlertTitle>
              <AlertDescription>
                Your Google account has been linked to your MASTER_ADMIN account. You can now log in.
              </AlertDescription>
            </Alert>
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
            Link Google Account to Admin
          </CardTitle>
          <CardDescription className="text-center">
            Connect your Google account to an existing admin account
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
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="google-id">Google Account ID</Label>
              <Input
                id="google-id"
                value={googleId}
                onChange={(e) => setGoogleId(e.target.value)}
                placeholder="Google ID (from OAuth)"
                required
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">
                You can get this after logging in with Google
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="access-token">Google Access Token</Label>
              <Input
                id="access-token"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="OAuth access token"
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="refresh-token">Google Refresh Token (optional)</Label>
              <Input
                id="refresh-token"
                value={refreshToken}
                onChange={(e) => setRefreshToken(e.target.value)}
                placeholder="OAuth refresh token"
                disabled={isLoading}
              />
            </div>
            
            <Button
              type="submit"
              className="w-full bg-[#00a1e0] hover:bg-[#0072a3]"
              disabled={isLoading}
            >
              {isLoading ? "Linking Account..." : "Link Google Account"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center pt-0">
          <p className="text-xs text-gray-500">
            This page should only be used to repair admin access issues
          </p>
        </CardFooter>
      </Card>
    </div>
  );
} 