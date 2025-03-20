// src/app/complete-registration/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertCircle, Loader2, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Player skill levels from the database schema
const PLAYER_SKILL_LEVELS = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
  { value: "PROFESSIONAL", label: "Professional" },
  { value: "A_PLUS", label: "A+" },
  { value: "A", label: "A" },
  { value: "A_MINUS", label: "A-" },
  { value: "B_PLUS", label: "B+" },
  { value: "B", label: "B" },
  { value: "B_MINUS", label: "B-" },
  { value: "C", label: "C" },
  { value: "D", label: "D" },
];

export default function CompleteRegistrationPage() {
  const { data: session, status, update } = useSession();
  const [role, setRole] = useState("USER");
  const [username, setUsername] = useState("");
  const [skillLevel, setSkillLevel] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // If not authenticated, redirect to login
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Pre-fill username from email if available
  useEffect(() => {
    if (session?.user?.email) {
      const suggestedUsername = session.user.email.split("@")[0];
      setUsername(suggestedUsername);
    }
  }, [session]);

  // Check if user is already registered (has a role and username)
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      // If user already has a role and username, redirect to dashboard
      if (
        session.user.role &&
        session.user.role !== "USER" &&
        session.user.username
      ) {
        router.push("/dashboard");
      }
    }
  }, [session, status, router]);

  // Reset skill level when role changes
  useEffect(() => {
    if (role !== "PLAYER") {
      setSkillLevel("");
    }
  }, [role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      setError("Username is required");
      return;
    }

    if (role === "PLAYER" && !skillLevel) {
      setError("Please select your skill level");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/complete-registration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: session?.user?.email,
          role,
          username,
          skillLevel: role === "PLAYER" ? skillLevel : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to complete registration");
      }

      // Show success message
      setSuccess(true);

      // Update the session with new user data
      await update({
        ...session,
        user: {
          ...session?.user,
          role: data.user.role,
          username: data.user.username,
          isApproved: data.user.isApproved,
        },
      });

      // Redirect based on role after a short delay
      setTimeout(() => {
        if (role === "TOURNAMENT_ADMIN") {
          router.push("/approval-pending");
        } else {
          router.push("/dashboard");
        }
      }, 1500);
    } catch (err) {
      console.error("Registration completion error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to complete registration"
      );
    } finally {
      setLoading(false);
    }
  };

  // Show loading while session is being fetched
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#00a1e0]" />
      </div>
    );
  }

  const handleRoleChange = (newRole: string) => {
    setRole(newRole);
    if (newRole !== "PLAYER") {
      setSkillLevel("");
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-[#00a1e0]">
            Complete Your Registration
          </CardTitle>
          <CardDescription className="text-center">
            Welcome to Pickleball Fantasy! Please select your role and set a
            username.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">
                Registration Complete!
              </AlertTitle>
              <AlertDescription className="text-green-700">
                Your account has been set up successfully. Redirecting you to
                the dashboard...
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                required
                disabled={loading || success}
              />
              <p className="text-xs text-gray-500">
                This will be your display name in the app
              </p>
            </div>

            <div className="space-y-2">
              <Label>Account Type</Label>
              <RadioGroup
                value={role}
                onValueChange={handleRoleChange}
                className="space-y-2"
                disabled={loading || success}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="USER" id="user" />
                  <Label htmlFor="user" className="cursor-pointer">
                    Fantasy Player
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="PLAYER" id="player" />
                  <Label htmlFor="player" className="cursor-pointer">
                    Tournament Player
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="REFEREE" id="referee" />
                  <Label htmlFor="referee" className="cursor-pointer">
                    Referee
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="TOURNAMENT_ADMIN"
                    id="tournament-admin"
                  />
                  <Label htmlFor="tournament-admin" className="cursor-pointer">
                    Tournament Admin
                  </Label>
                </div>
              </RadioGroup>

              {role === "TOURNAMENT_ADMIN" && (
                <Alert className="mt-2 border-amber-200 bg-amber-50">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    This role requires approval from administrators before you
                    can access all features.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Show skill level dropdown if PLAYER is selected */}
            {role === "PLAYER" && (
              <div className="space-y-2">
                <Label htmlFor="skillLevel">Skill Level</Label>
                <Select
                  value={skillLevel}
                  onValueChange={setSkillLevel}
                  disabled={loading || success}
                >
                  <SelectTrigger id="skillLevel">
                    <SelectValue placeholder="Select your skill level" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLAYER_SKILL_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  This will be used for matchmaking and team balancing
                </p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-[#00a1e0] hover:bg-[#0072a3]"
              disabled={loading || success}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Completing
                  Registration...
                </>
              ) : success ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" /> Registration Complete
                </>
              ) : (
                "Complete Registration"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
