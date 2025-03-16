import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/Input";
import { signIn } from "next-auth/react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function PreRegistrationForm() {
  const [role, setRole] = useState("USER");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      setError("Username is required");
      return;
    }

    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }

    setIsLoading(true);
    setError(null);

    // Store the role and username in localStorage
    localStorage.setItem(
      "pendingRegistration",
      JSON.stringify({
        role,
        username,
      })
    );

    // Redirect to Google auth
    try {
      await signIn("google", {
        callbackUrl: "/registration-callback",
      });
    } catch (err) {
      console.error("Error during Google sign-in:", err);
      setError("Failed to initiate Google sign-in. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center text-[#00a1e0]">
          Create Account
        </CardTitle>
        <CardDescription className="text-center">
          Select your account type before continuing with Google
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter a username"
              required
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500">
              This will be your display name in the app
            </p>
          </div>

          <div className="space-y-2">
            <Label>Account Type</Label>
            <RadioGroup
              value={role}
              onValueChange={setRole}
              className="space-y-2"
              disabled={isLoading}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="USER" id="user" />
                <Label htmlFor="user" className="cursor-pointer">
                  Fantasy Player
                </Label>
                <span className="text-xs text-green-600 ml-2">
                  (Instantly approved)
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="PLAYER" id="player" />
                <Label htmlFor="player" className="cursor-pointer">
                  Tournament Player
                </Label>
                <span className="text-xs text-green-600 ml-2">
                  (Instantly approved)
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="REFEREE" id="referee" />
                <Label htmlFor="referee" className="cursor-pointer">
                  Referee
                </Label>
                <span className="text-xs text-amber-600 ml-2">
                  (Requires approval)
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="TOURNAMENT_ADMIN"
                  id="tournament-admin"
                />
                <Label htmlFor="tournament-admin" className="cursor-pointer">
                  Tournament Admin
                </Label>
                <span className="text-xs text-amber-600 ml-2">
                  (Requires approval)
                </span>
              </div>
            </RadioGroup>

            {(role === "REFEREE" || role === "TOURNAMENT_ADMIN") && (
              <Alert
                variant="warning"
                className="mt-2 bg-amber-50 border-amber-200"
              >
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  This role requires administrator approval before you can
                  access all features.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-[#00a1e0] hover:bg-[#0072a3]"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  width="20px"
                  height="20px"
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
                Continue with Google
              </>
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="text-center text-xs text-gray-500">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </CardFooter>
    </Card>
  );
}
