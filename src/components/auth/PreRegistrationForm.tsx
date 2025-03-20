import React, { useState, useEffect } from "react";
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
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Player skill levels from the database schema
const PLAYER_SKILL_LEVELS = [
  { value: "A_PLUS", label: "A+" },
  { value: "A", label: "A" },
  { value: "A_MINUS", label: "A-" },
  { value: "B_PLUS", label: "B+" },
  { value: "B", label: "B" },
  { value: "B_MINUS", label: "B-" },
  { value: "C", label: "C" },
  { value: "D", label: "D" },
];

export default function PreRegistrationForm() {
  const [role, setRole] = useState("USER");
  const [username, setUsername] = useState("");
  const [skillLevel, setSkillLevel] = useState("");
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

    if (role === "PLAYER" && !skillLevel) {
      setError("Please select your skill level");
      return;
    }

    setIsLoading(true);
    setError(null);

    // Store the role, username and skill level in localStorage
    localStorage.setItem(
      "pendingRegistration",
      JSON.stringify({
        role,
        username,
        skillLevel: role === "PLAYER" ? skillLevel : undefined,
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
  
  const handleRoleChange = (value: string) => {
    if (!isLoading) {
      setRole(value);
      if (value !== "PLAYER") {
        setSkillLevel("");
      }
    }
  };

  return (
    <Card className="border-0 bg-gray-900 text-white rounded-xl overflow-hidden">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl font-bold text-[#0dc5c1]">
          Create Account
        </CardTitle>
        <CardDescription className="text-gray-400">
          Select your account type before continuing with Google
        </CardDescription>
      </CardHeader>
      <CardContent className="py-4">
        {error && (
          <Alert variant="destructive" className="mb-4 bg-red-900/40 border-red-800">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-white font-medium">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter a username"
              required
              disabled={isLoading}
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
            />
            <p className="text-xs text-gray-400">
              This will be your display name in the app
            </p>
          </div>

          <div className="space-y-3">
            <Label className="text-white font-medium">Account Type</Label>
            <RadioGroup
              value={role}
              onValueChange={handleRoleChange}
              className="space-y-3"
              disabled={isLoading}
            >
              <label 
                className={`flex items-center space-x-2 p-3 rounded-md bg-gray-800 border ${role === "USER" ? "border-[#3b82f6]" : "border-gray-700"} cursor-pointer hover:bg-gray-700 transition-colors`}
                htmlFor="user-option"
              >
                <RadioGroupItem value="USER" id="user-option" className="border-[#3b82f6] text-[#3b82f6]" />
                <span className="font-medium text-white flex-grow">
                  Fantasy Player
                </span>
              </label>

              <label 
                className={`flex items-center space-x-2 p-3 rounded-md bg-gray-800 border ${role === "PLAYER" ? "border-[#3b82f6]" : "border-gray-700"} cursor-pointer hover:bg-gray-700 transition-colors`}
                htmlFor="player-option"
              >
                <RadioGroupItem value="PLAYER" id="player-option" className="border-[#3b82f6] text-[#3b82f6]" />
                <span className="font-medium text-white flex-grow">
                  Tournament Player
                </span>
              </label>

              <label 
                className={`flex items-center space-x-2 p-3 rounded-md bg-gray-800 border ${role === "REFEREE" ? "border-[#3b82f6]" : "border-gray-700"} cursor-pointer hover:bg-gray-700 transition-colors`}
                htmlFor="referee-option"
              >
                <RadioGroupItem value="REFEREE" id="referee-option" className="border-[#3b82f6] text-[#3b82f6]" />
                <span className="font-medium text-white flex-grow">
                  Referee
                </span>
              </label>

              <label 
                className={`flex items-center space-x-2 p-3 rounded-md bg-gray-800 border ${role === "TOURNAMENT_ADMIN" ? "border-[#3b82f6]" : "border-gray-700"} cursor-pointer hover:bg-gray-700 transition-colors`}
                htmlFor="admin-option"
              >
                <RadioGroupItem value="TOURNAMENT_ADMIN" id="admin-option" className="border-[#3b82f6] text-[#3b82f6]" />
                <span className="font-medium text-white flex-grow">
                  Tournament Admin
                </span>
                <span className="text-xs text-amber-500 ml-auto px-2 py-0.5 bg-amber-900/20 rounded-full">
                  Requires approval
                </span>
              </label>
            </RadioGroup>

            {role === "TOURNAMENT_ADMIN" && (
              <Alert
                className="mt-2 border-amber-800 bg-amber-900/20"
              >
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <AlertDescription className="text-amber-400">
                  This role requires administrator approval before you can
                  access all features.
                </AlertDescription>
              </Alert>
            )}
            
            {/* Show skill level dropdown if PLAYER is selected */}
            {role === "PLAYER" && (
              <div className="mt-4 space-y-2">
                <Label htmlFor="skillLevel" className="text-white font-medium">Skill Level</Label>
                <Select
                  value={skillLevel}
                  onValueChange={setSkillLevel}
                  disabled={isLoading}
                >
                  <SelectTrigger id="skillLevel" className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Select your skill level" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {PLAYER_SKILL_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value} className="text-white">
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-400">
                  This will be used for matchmaking and tournament categories
                </p>
              </div>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-[#3b82f6] to-[#0dc5c1] hover:opacity-90 text-white py-5 rounded-md"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
      <CardFooter className="text-center text-sm text-gray-400 border-t border-gray-800 pt-4 px-8 pb-6">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </CardFooter>
    </Card>
  );
}
