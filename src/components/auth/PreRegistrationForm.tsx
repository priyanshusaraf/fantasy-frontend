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
import { AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [skillLevel, setSkillLevel] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [registrationMethod, setRegistrationMethod] = useState<"email" | "google">("email");
  const router = useRouter();

  // TEMPORARY: State for fallback mode when database is down
  const [useFallbackMode, setUseFallbackMode] = useState(false);

  const handleGoogleSubmit = async (e: React.FormEvent) => {
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

  // Function to save user locally when database is down
  const saveUserToLocalStorage = (userData: any) => {
    try {
      // Get existing temp users or initialize empty array
      const existingUsers = JSON.parse(localStorage.getItem('tempUsers') || '[]');
      
      // Check if email already exists
      if (existingUsers.some((user: any) => user.email === userData.email)) {
        return { success: false, error: "A user with this email already exists" };
      }
      
      // Check if username already exists
      if (existingUsers.some((user: any) => user.username === userData.username)) {
        return { success: false, error: "A user with this username already exists" };
      }
      
      // Add the new user with a timestamp and ID
      const newUser = {
        ...userData,
        id: existingUsers.length + 1,
        createdAt: new Date().toISOString()
      };
      
      // Save to localStorage
      localStorage.setItem('tempUsers', JSON.stringify([...existingUsers, newUser]));
      
      // Also set as current user
      localStorage.setItem('currentUser', JSON.stringify(newUser));
      
      return { success: true };
    } catch (error) {
      console.error("Error saving user to localStorage:", error);
      return { success: false, error: "Failed to save user data" };
    }
  };

  const handleEmailRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!username.trim()) {
      setError("Username is required");
      return;
    }
    
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    
    if (!password) {
      setError("Password is required");
      return;
    }
    
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (role === "PLAYER" && !skillLevel) {
      setError("Please select your skill level");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    // Create user data object
    const userData = {
      username,
      email,
      password, // In real app, never store raw passwords in localStorage
      role,
      skillLevel: role === "PLAYER" ? skillLevel : undefined,
    };
    
    try {
      console.log(`Attempting to register user: ${email} with role: ${role}`);
      
      // First try the normal API call
      try {
        // Call API to register the user
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          console.error("Registration failed with status:", response.status);
          console.error("Server response:", data);
          
          // If we get a database connection error, use fallback mode
          if (response.status === 503 || data.error?.includes("database") || data.error?.includes("Database")) {
            console.log("Using fallback registration mode due to database issues");
            throw new Error("Database connection error");
          }
          
          // Display a more specific error message if available
          const errorMessage = data.error || data.message || "Registration failed";
          
          // If we have detailed validation errors, show the first one
          if (data.details && typeof data.details === 'object') {
            const firstErrorField = Object.keys(data.details)[0];
            const fieldError = data.details[firstErrorField];
            if (fieldError && fieldError._errors && fieldError._errors.length > 0) {
              throw new Error(`${firstErrorField}: ${fieldError._errors[0]}`);
            }
          }
          
          throw new Error(errorMessage);
        }
        
        console.log("Registration successful:", data);
        
        // If registration is successful, sign in the user
        try {
          console.log("Attempting to sign in after registration");
          const signInResult = await signIn("credentials", {
            email,
            password,
            redirect: false,
          });
          
          console.log("Sign-in result:", signInResult);
          
          if (signInResult?.error) {
            console.error("Error signing in after registration:", signInResult.error);
            // Even if sign-in fails, still redirect to dashboard as registration was successful
            setTimeout(() => {
              window.location.href = "/dashboard";
            }, 1000);
          } else if (signInResult?.ok) {
            console.log("Sign-in successful, redirecting to dashboard");
            setTimeout(() => {
              window.location.href = "/dashboard";
            }, 1000);
          } else {
            // Handle unexpected result
            console.warn("Unexpected sign-in result:", signInResult);
            // Still redirect to dashboard
            setTimeout(() => {
              window.location.href = "/dashboard";
            }, 1000);
          }
        } catch (signInError) {
          console.error("Error during sign-in after registration:", signInError);
          // Even if sign-in fails, still redirect to dashboard as registration was successful
          setTimeout(() => {
            window.location.href = "/dashboard";
          }, 1000);
        }
      
      } catch (apiError: any) {
        console.error("API registration error:", apiError);
        
        // If there's a database connection error, use fallback mechanism
        if (apiError.message === "Database connection error" || useFallbackMode) {
          console.log("Using localStorage fallback for registration");
          
          // Save user to localStorage instead
          const result = saveUserToLocalStorage(userData);
          
          if (result.success) {
            // Show success message with explanation
            setSuccess("Account created successfully in temporary mode. While our database is being updated, you can use the application with limited functionality. Your data will be synchronized when the database is available again.");
            
            // Clear form fields
            setUsername("");
            setEmail("");
            setPassword("");
            setConfirmPassword("");
            setSkillLevel("");
            
            // Redirect to dashboard after delay
            setTimeout(() => {
              window.location.href = "/dashboard";
            }, 4000);
            
          } else {
            setError(result.error || "Failed to create account. Please try again.");
          }
        } else {
          // For other errors, show the error message
          throw apiError;
        }
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || "Failed to register. Please try again.");
    } finally {
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
    <Card className="border-0 bg-gray-900 text-white rounded-xl overflow-hidden w-full">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl font-bold text-[#0dc5c1]">
          Create Account
        </CardTitle>
        <CardDescription className="text-gray-400">
          {registrationMethod === "email" 
            ? "Create an account with your email and password" 
            : "Select your account type before continuing with Google"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="py-4">
        {error && (
          <Alert variant="destructive" className="mb-4 bg-red-900/40 border-red-800">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-4 bg-green-900/40 border-green-800">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="mb-4 flex border border-gray-700 rounded-md overflow-hidden">
          <button
            type="button"
            onClick={() => setRegistrationMethod("email")}
            className={`flex-1 py-2 text-center text-sm font-medium ${
              registrationMethod === "email"
                ? "bg-[#3b82f6] text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
            disabled={isLoading}
          >
            Email
          </button>
          <button
            type="button"
            onClick={() => setRegistrationMethod("google")}
            className={`flex-1 py-2 text-center text-sm font-medium ${
              registrationMethod === "google"
                ? "bg-[#3b82f6] text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
            disabled={isLoading}
          >
            Google
          </button>
        </div>

        {registrationMethod === "email" ? (
          <form onSubmit={handleEmailRegistration} className="space-y-6">
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
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={isLoading}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                required
                disabled={isLoading}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              />
              <p className="text-xs text-gray-400">
                Password must be at least 8 characters
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-white font-medium">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
                disabled={isLoading}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              />
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
              ) : "Create Account"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleGoogleSubmit} className="space-y-6">
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
                  htmlFor="user-option-google"
                >
                  <RadioGroupItem value="USER" id="user-option-google" className="border-[#3b82f6] text-[#3b82f6]" />
                  <span className="font-medium text-white flex-grow">
                    Fantasy Player
                  </span>
                </label>

                <label 
                  className={`flex items-center space-x-2 p-3 rounded-md bg-gray-800 border ${role === "PLAYER" ? "border-[#3b82f6]" : "border-gray-700"} cursor-pointer hover:bg-gray-700 transition-colors`}
                  htmlFor="player-option-google"
                >
                  <RadioGroupItem value="PLAYER" id="player-option-google" className="border-[#3b82f6] text-[#3b82f6]" />
                  <span className="font-medium text-white flex-grow">
                    Tournament Player
                  </span>
                </label>

                <label 
                  className={`flex items-center space-x-2 p-3 rounded-md bg-gray-800 border ${role === "REFEREE" ? "border-[#3b82f6]" : "border-gray-700"} cursor-pointer hover:bg-gray-700 transition-colors`}
                  htmlFor="referee-option-google"
                >
                  <RadioGroupItem value="REFEREE" id="referee-option-google" className="border-[#3b82f6] text-[#3b82f6]" />
                  <span className="font-medium text-white flex-grow">
                    Referee
                  </span>
                </label>

                <label 
                  className={`flex items-center space-x-2 p-3 rounded-md bg-gray-800 border ${role === "TOURNAMENT_ADMIN" ? "border-[#3b82f6]" : "border-gray-700"} cursor-pointer hover:bg-gray-700 transition-colors`}
                  htmlFor="admin-option-google"
                >
                  <RadioGroupItem value="TOURNAMENT_ADMIN" id="admin-option-google" className="border-[#3b82f6] text-[#3b82f6]" />
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
                  <Label htmlFor="skillLevel-google" className="text-white font-medium">Skill Level</Label>
                  <Select
                    value={skillLevel}
                    onValueChange={setSkillLevel}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="skillLevel-google" className="bg-gray-800 border-gray-700 text-white">
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
        )}

        {/* Add a manual override for fallback mode for testing */}
        {process.env.NODE_ENV !== 'production' && (
          <div className="mt-4 mb-2 flex items-center justify-between">
            <Label htmlFor="fallback-mode" className="text-sm text-gray-400">
              Use fallback mode
            </Label>
            <input 
              type="checkbox" 
              id="fallback-mode"
              checked={useFallbackMode}
              onChange={(e) => setUseFallbackMode(e.target.checked)}
              className="h-4 w-4"
            />
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t border-gray-800 pt-4 px-8 pb-6">
        <div className="text-center text-sm text-gray-400 w-full">
          Already have an account?{" "}
          <Link
            href="/auth?mode=signin"
            className="text-[#0dc5c1] hover:underline"
          >
            Sign in here
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
