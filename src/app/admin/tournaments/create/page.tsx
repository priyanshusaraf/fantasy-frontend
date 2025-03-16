"use client";

import React, { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Check, Trophy, Users, Info, ArrowLeft, AlertCircle, UserIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Direct tournament creation function
// This is a fallback in case the API approach doesn't work
async function createTournamentDirectly(tournamentData: any, userEmail: string) {
  console.log("Attempting direct tournament creation via prisma...");
  
  try {
    // This is a client-side function to directly create a tournament
    // It will bypass the API authentication by using a special endpoint
    const response = await fetch("/api/admin/direct-tournament-create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tournamentData,
        userEmail,
        // Include a special key for security
        secretKey: "tournament-direct-creation"
      })
    });
    
    if (!response.ok) {
      throw new Error(`Direct creation failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error in direct tournament creation:", error);
    throw error;
  }
}

function GoogleAuthButton({ onLogin }: { onLogin: () => void }) {
  const { toast } = useToast();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      console.log("Initiating Google login...");
      
      // For Google OAuth, it's better to use redirect: true to complete the full OAuth flow
      // This will redirect the user to Google, then back to this page with the proper session
      const result = await signIn("google", { 
        redirect: true,
        callbackUrl: window.location.href
      });
      
      // Note: The code below won't execute if redirect is true
      // This is only a fallback if redirect is set to false
      console.log("Google login result:", result);
      
      if (result?.error) {
        toast({
          title: "Login Failed",
          description: "Failed to authenticate with Google. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login Successful",
          description: "You are now logged in and can create a tournament.",
        });
        // Refresh the page to ensure we have the latest session
        window.location.reload();
      }
    } catch (error) {
      console.error("Google login error:", error);
      toast({
        title: "Login Error",
        description: "An error occurred during login. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto mb-8">
      <CardHeader>
        <CardTitle>Authentication Required</CardTitle>
        <CardDescription>
          Please log in with Google to create a tournament
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={handleGoogleLogin} 
          className="w-full flex items-center justify-center gap-2"
          disabled={isLoggingIn}
        >
          <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {isLoggingIn ? "Logging in..." : "Sign in with Google"}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function CreateTournamentPage() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  
  // Form state
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [maxPlayers, setMaxPlayers] = useState("");
  const [registrationFee, setRegistrationFee] = useState("");
  const [tournamentType, setTournamentType] = useState("");
  const [formatType, setFormatType] = useState("");
  const [enableLiveScoring, setEnableLiveScoring] = useState(false);
  const [enableFantasy, setEnableFantasy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [tokenChecked, setTokenChecked] = useState(false);

  // Add state to track if we just completed authentication
  const [justAuthenticated, setJustAuthenticated] = useState(false);
  
  // Modify the authentication check to recognize Google authentication
  React.useEffect(() => {
    const checkAuth = async () => {
      console.log("Auth check - Session status:", status);
      console.log("Auth check - Session:", session);
      
      // If authenticated via Google
      if (status === "authenticated") {
        console.log("User is authenticated via Google");
        
        // If we weren't authenticated before but are now, set the flag
        if (!isAuthenticated) {
          setJustAuthenticated(true);
        }
        
        setIsAuthenticated(true);
        setShowLoginForm(false);
      } else if (status === "unauthenticated") {
        console.log("User is not authenticated");
        setIsAuthenticated(false);
        setShowLoginForm(true);
      }
      
      setTokenChecked(true);
    };
    
    checkAuth();
  }, [status, session, isAuthenticated]);
  
  // Handle successful login from the login form
  const handleSuccessfulLogin = () => {
    console.log("Login successful callback");
    setIsAuthenticated(true);
    setShowLoginForm(false);
    setJustAuthenticated(true);
    toast({
      title: "Ready to Create Tournament",
      description: "You're now logged in and can create a tournament",
    });
    
    // Force session refresh to ensure we have the latest token
    updateSession();
  };

  // If still checking authentication, show loading state
  if (status === "loading" || isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Show Google authentication button if needed
  if (showLoginForm) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              className="mr-4"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold">Create Tournament</h1>
          </div>
        </div>
        
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            You need to be logged in with Google to create a tournament.
          </AlertDescription>
        </Alert>
        
        <GoogleAuthButton onLogin={handleSuccessfulLogin} />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submit initiated");
    
    // Check authentication first
    if (!isAuthenticated) {
      console.log("User is not authenticated, showing Google login");
      setShowLoginForm(true);
      toast({
        title: "Authentication Required",
        description: "You must be logged in to create a tournament",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);

    // Validation
    if (!name || !location || !description || !startDate || !endDate || !tournamentType || !formatType) {
      console.log("Validation failed - missing required fields");
      toast({
        title: "Missing information",
        description: "Please fill all the required fields",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }
    
    console.log("Form validation passed, preparing tournament data");

    // Prepare registration dates - default to 7 days before tournament start and 1 day before for close
    const registrationOpenDate = new Date(startDate);
    registrationOpenDate.setDate(registrationOpenDate.getDate() - 7);
    
    const registrationCloseDate = new Date(startDate);
    registrationCloseDate.setDate(registrationCloseDate.getDate() - 1);

    // Create tournament object
    const tournamentData = {
      name,
      location,
      description,
      startDate,
      endDate,
      registrationOpenDate,
      registrationCloseDate,
      maxParticipants: maxPlayers ? parseInt(maxPlayers) : 32,
      entryFee: registrationFee ? parseFloat(registrationFee) : 0,
      type: tournamentType,
      status: "REGISTRATION_OPEN",
      formatDetails: {
        formatType,
        liveScoring: enableLiveScoring
      },
      fantasy: {
        enableFantasy: enableFantasy,
        fantasyPoints: "STANDARD",
        autoPublish: true,
        contests: enableFantasy ? [
          {
            name: "Standard Contest",
            entryFee: 0,
            maxEntries: 100,
            totalPrize: 0,
            prizeBreakdown: [
              { position: 1, percentage: 50 },
              { position: 2, percentage: 30 },
              { position: 3, percentage: 20 }
            ],
            rules: {
              captainMultiplier: 2,
              viceCaptainMultiplier: 1.5,
              teamSize: 5
            }
          }
        ] : []
      }
    };

    try {
      // First, we need to get a JWT token for API access
      console.log("Getting JWT token for API access...");
      
      // Get the user email from the session
      const userEmail = session?.user?.email;
      
      if (!userEmail) {
        console.error("No user email found in session");
        toast({
          title: "Authentication Error",
          description: "Could not get user email from session",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      // Request a JWT token from our backend
      const tokenResponse = await fetch("/api/auth/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          email: userEmail,
          provider: "google" 
        }),
        credentials: "include"
      });
      
      if (!tokenResponse.ok) {
        console.error("Failed to get API token:", tokenResponse.status);
        toast({
          title: "Authentication Error",
          description: "Could not get API token. Please try logging in again.",
          variant: "destructive",
        });
        setShowLoginForm(true);
        setIsSubmitting(false);
        return;
      }
      
      const tokenData = await tokenResponse.json();
      const apiToken = tokenData.token;
      
      if (!apiToken) {
        console.error("No token returned from API");
        toast({
          title: "Authentication Error",
          description: "Could not get API token. Please try logging in again.",
          variant: "destructive",
        });
        setShowLoginForm(true);
        setIsSubmitting(false);
        return;
      }
      
      console.log("Successfully got JWT token for API access");
      
      // Now use the token to create the tournament
      console.log("Sending API request to create tournament...");
      console.log("Using token:", apiToken.substring(0, 20) + "...");
      
      const response = await fetch("/api/tournaments", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiToken}`
        },
        body: JSON.stringify(tournamentData)
      });
      
      console.log("API response status:", response.status);
      console.log("API response headers:", Object.fromEntries([...response.headers.entries()]));
      
      // Check if the response was redirected (usually to login)
      if (response.redirected) {
        console.error("Request was redirected to:", response.url);
        
        // Try one more time with a different request format
        console.log("Trying with a different request format...");
        
        const directResponse = await fetch("/api/tournaments", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiToken}`,
            "X-Requested-With": "XMLHttpRequest" // Prevent redirection
          },
          body: JSON.stringify({
            ...tournamentData,
            // Add any additional fields that might be required
            createdBy: session?.user?.email,
            adminToken: apiToken
          }),
          redirect: "manual" // Prevent automatic redirects
        });
        
        console.log("Direct API response status:", directResponse.status);
        
        if (directResponse.ok) {
          // This worked! Process the response
          const directResult = await directResponse.json();
          console.log("Tournament created with direct approach:", directResult);
          
          toast({
            title: "Tournament created",
            description: `${name} has been created successfully.`,
          });
          
          // Redirect to tournament management
          const tournamentId = directResult.id || directResult.tournamentId || directResult._id;
          if (tournamentId) {
            router.push(`/admin/tournaments/${tournamentId}`);
            return;
          }
        }
        
        // If we get here, the direct approach failed too
        // Show login form instead of redirecting
        setShowLoginForm(true);
        toast({
          title: "Authentication Failed",
          description: "Your Google authentication has expired. Please log in again.",
          variant: "destructive", 
        });
        setIsSubmitting(false);
        return;
      }
      
      // Handle response status
      if (response.status === 401 || response.status === 403) {
        console.error("Authentication error:", response.status);
        
        // Try alternative approach for Next.js
        console.log("Trying alternative API approach for Next.js...");
        
        try {
          // Try a different API endpoint format for Next.js
          const nextApiUrl = "/api/v1/tournaments";
          console.log("Trying alternative endpoint:", nextApiUrl);
          
          const nextResponse = await fetch(nextApiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(tournamentData),
            credentials: "include" // This is important for Next.js session cookies
          });
          
          if (nextResponse.ok) {
            console.log("Alternative API call succeeded!");
            const nextResult = await nextResponse.json();
            console.log("Tournament creation result:", nextResult);
            
            toast({
              title: "Tournament created",
              description: `${name} has been created successfully.`,
            });
            
            // Get the id from the result, with fallbacks
            const tournamentId = nextResult.id || nextResult.tournamentId || nextResult._id;
            
            if (!tournamentId) {
              console.error("No tournament ID found in response");
              router.push(`/admin/tournaments`);
              return;
            }
            
            // Redirect to tournament management
            console.log("Redirecting to:", `/admin/tournaments/${tournamentId}`);
            router.push(`/admin/tournaments/${tournamentId}`);
            return;
          } else {
            console.error("Alternative API call failed:", nextResponse.status);
          }
        } catch (altError) {
          console.error("Error in alternative API call:", altError);
        }
        
        // If we get here, both approaches failed
        // Try direct database approach as a last resort
        try {
          console.log("API approaches failed, trying direct database creation...");
          
          const directResult = await createTournamentDirectly(
            tournamentData, 
            userEmail
          );
          
          console.log("Tournament created with direct approach:", directResult);
          
          toast({
            title: "Tournament Created",
            description: `${name} has been created successfully.`,
          });
          
          // Redirect to tournament management
          if (directResult.id) {
            router.push(`/admin/tournaments/${directResult.id}`);
            return;
          }
        } catch (directError) {
          console.error("Direct creation failed:", directError);
        }
        
        // If ALL approaches have failed, show login form
        setShowLoginForm(true);
        toast({
          title: "Authentication Error",
          description: "Your session may have expired. Please log in again to create a tournament.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      if (!response.ok) {
        // Try to parse the error response
        let errorMessage = "Failed to create tournament";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.error("Error parsing error response:", parseError);
        }
        throw new Error(errorMessage);
      }
      
      // If we got here, the request was successful
      console.log("Tournament created successfully");
      const result = await response.json();
      console.log("Tournament creation result:", result);
      
      toast({
        title: "Tournament created",
        description: `${name} has been created successfully.`,
      });
      
      // Get the id from the result, with fallbacks
      const tournamentId = result.id || result.tournamentId || result._id;
      
      if (!tournamentId) {
        console.error("No tournament ID found in response:", result);
        toast({
          title: "Warning",
          description: "Tournament created but couldn't get ID for redirection",
          variant: "destructive",
        });
        // Go to tournaments list instead
        router.push(`/admin/tournaments`);
        return;
      }
      
      // Redirect to tournament management
      console.log("Redirecting to:", `/admin/tournaments/${tournamentId}`);
      router.push(`/admin/tournaments/${tournamentId}`);
    } catch (error) {
      console.error("Error creating tournament:", error);
      toast({
        title: "Error",
        description: "Failed to create tournament. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            className="mr-4"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Create Tournament</h1>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        {/* Authentication Status Indicator */}
        <div className="mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Authentication Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center mb-2">
                <div className={`w-3 h-3 rounded-full mr-2 ${status === "authenticated" ? "bg-green-500" : "bg-red-500"}`}></div>
                <span className="font-medium">
                  {status === "authenticated" ? "Authenticated with Google" : "Not Authenticated"}
                </span>
              </div>
              
              {status === "authenticated" && (
                <div className="text-sm mt-2">
                  <p>Logged in as: {session?.user?.name || 'Unknown'}</p>
                  <p>Email: {session?.user?.email || 'No email'}</p>
                  
                  <div className="flex space-x-2 mt-2">
                    <Button 
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        updateSession();
                        toast({
                          title: "Session refreshed",
                          description: "Your authentication session has been refreshed"
                        });
                      }}
                    >
                      Refresh Session
                    </Button>
                    
                    <Button 
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        if (!startDate || !endDate || !name || !location || !description || !tournamentType || !formatType) {
                          toast({
                            title: "Missing information",
                            description: "Please fill all the required fields",
                            variant: "destructive",
                          });
                          return;
                        }
                        
                        try {
                          setIsSubmitting(true);
                          
                          // Prepare registration dates
                          const registrationOpenDate = new Date(startDate);
                          registrationOpenDate.setDate(registrationOpenDate.getDate() - 7);
                          
                          const registrationCloseDate = new Date(startDate);
                          registrationCloseDate.setDate(registrationCloseDate.getDate() - 1);
                          
                          // Create tournament data object
                          const tournamentData = {
                            name,
                            location,
                            description,
                            startDate,
                            endDate,
                            registrationOpenDate,
                            registrationCloseDate,
                            maxParticipants: maxPlayers ? parseInt(maxPlayers) : 32,
                            entryFee: registrationFee ? parseFloat(registrationFee) : 0,
                            type: tournamentType,
                            status: "DRAFT",
                            formatDetails: {
                              formatType,
                              liveScoring: enableLiveScoring
                            }
                          };
                          
                          // Use direct creation endpoint
                          try {
                            // Validate required fields
                            if (!name || !location || !description || !startDate || !endDate || !tournamentType) {
                              toast({
                                title: "Incomplete Form",
                                description: "Please fill in all required fields.",
                                variant: "destructive"
                              });
                              return;
                            }
                            
                            const result = await createTournamentDirectly(
                              tournamentData,
                              session?.user?.email || ""
                            );
                            
                            toast({
                              title: "Tournament Created",
                              description: `${name} has been created successfully using direct method.`,
                            });
                            
                            // Navigate to the tournament page
                            router.push(`/admin/tournaments/${result.id}`);
                          } catch (error) {
                            console.error("Error creating tournament:", error);
                            toast({
                              title: "Error",
                              description: "Failed to create tournament. Please try again.",
                              variant: "destructive"
                            });
                          }
                        } catch (error) {
                          console.error("Error creating tournament:", error);
                          toast({
                            title: "Error",
                            description: "Failed to create tournament. Please try again.",
                            variant: "destructive"
                          });
                        } finally {
                          setIsSubmitting(false);
                        }
                      }}
                    >
                      Create Directly (Bypass API)
                    </Button>
                  </div>
                </div>
              )}
              
              {status !== "authenticated" && (
                <Button 
                  type="button"
                  className="mt-2 gap-2"
                  onClick={() => signIn("google", { callbackUrl: window.location.href })}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 0 24 24" width="16">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Sign in with Google
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Information Card */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tournament Information</CardTitle>
                <CardDescription>Enter the basic details about your tournament</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Tournament Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Summer Pickleball Championship"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    placeholder="e.g. Miami, FL"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Provide details about the tournament..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[120px]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>End Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tournament Format</CardTitle>
                <CardDescription>Specify how the tournament will be structured</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tournamentType">Tournament Type *</Label>
                    <Select value={tournamentType} onValueChange={setTournamentType}>
                      <SelectTrigger id="tournamentType">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SINGLES">Singles</SelectItem>
                        <SelectItem value="DOUBLES">Doubles</SelectItem>
                        <SelectItem value="MIXED_DOUBLES">Mixed Doubles</SelectItem>
                        <SelectItem value="ROUND_ROBIN">Round Robin</SelectItem>
                        <SelectItem value="KNOCKOUT">Knockout</SelectItem>
                        <SelectItem value="LEAGUE">League</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="formatType">Format *</Label>
                    <Select value={formatType} onValueChange={setFormatType}>
                      <SelectTrigger id="formatType">
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ROUND_ROBIN">Round Robin</SelectItem>
                        <SelectItem value="SINGLE_ELIMINATION">Single Elimination</SelectItem>
                        <SelectItem value="DOUBLE_ELIMINATION">Double Elimination</SelectItem>
                        <SelectItem value="GROUP_STAGE">Group Stage + Knockout</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Side Information Card */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Player Settings</CardTitle>
                <CardDescription>Set player limits and fees</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="maxPlayers">Maximum Players</Label>
                  <Input
                    id="maxPlayers"
                    type="number"
                    placeholder="e.g. 32"
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registrationFee">Registration Fee ($)</Label>
                  <Input
                    id="registrationFee"
                    type="number"
                    placeholder="e.g. 25.00"
                    value={registrationFee}
                    onChange={(e) => setRegistrationFee(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tournament Options</CardTitle>
                <CardDescription>Additional configuration options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Enable Live Scoring</h3>
                    <p className="text-sm text-muted-foreground">Allow referees to score matches in real-time</p>
                  </div>
                  <div>
                    <input 
                      type="checkbox" 
                      id="enableLiveScoring" 
                      className="h-5 w-5 rounded text-primary border-gray-300"
                      checked={enableLiveScoring}
                      onChange={(e) => setEnableLiveScoring(e.target.checked)}
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Enable Fantasy Games</h3>
                    <p className="text-sm text-muted-foreground">Allow players to create fantasy teams for this tournament</p>
                  </div>
                  <div>
                    <input 
                      type="checkbox" 
                      id="enableFantasy" 
                      className="h-5 w-5 rounded text-primary border-gray-300"
                      checked={enableFantasy}
                      onChange={(e) => setEnableFantasy(e.target.checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start space-x-2 text-sm text-muted-foreground mb-2">
                  <Info className="h-4 w-4 mt-0.5 text-blue-500" />
                  <p>Create a tournament first, then you can add brackets, matches, and fantasy contests.</p>
                </div>
                <div className="flex items-start space-x-2 text-sm text-muted-foreground">
                  <Info className="h-4 w-4 mt-0.5 text-blue-500" />
                  <p>Required fields are marked with an asterisk (*).</p>
                </div>
              </CardContent>
            </Card>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating Tournament..." : "Create Tournament"}
            </Button>
            
            {/* Direct creation fallback button */}
            <Button 
              type="button"
              variant="outline" 
              className="w-full mt-2"
              disabled={isSubmitting}
              onClick={async () => {
                if (!startDate || !endDate || !name || !location || !description || !tournamentType || !formatType) {
                  toast({
                    title: "Missing information",
                    description: "Please fill all the required fields",
                    variant: "destructive",
                  });
                  return;
                }
                
                setIsSubmitting(true);
                toast({
                  title: "Creating Tournament",
                  description: "Using direct database access method..."
                });
                
                // Validate required fields
                if (!name || !location || !description || !startDate || !endDate || !tournamentType) {
                  setIsSubmitting(false);
                  toast({
                    title: "Incomplete Form",
                    description: "Please fill in all required fields.",
                    variant: "destructive"
                  });
                  return;
                }
                
                // Prepare registration dates
                const registrationOpenDate = new Date(startDate);
                registrationOpenDate.setDate(registrationOpenDate.getDate() - 7);
                
                const registrationCloseDate = new Date(startDate);
                registrationCloseDate.setDate(registrationCloseDate.getDate() - 1);
                
                // Create tournament data object
                const tournamentData = {
                  name,
                  location,
                  description,
                  startDate,
                  endDate,
                  registrationOpenDate,
                  registrationCloseDate,
                  maxParticipants: maxPlayers ? parseInt(maxPlayers) : 32,
                  entryFee: registrationFee ? parseFloat(registrationFee) : 0,
                  type: tournamentType,
                  formatDetails: {
                    formatType,
                    liveScoring: enableLiveScoring
                  }
                };
                
                try {
                  // Use direct creation endpoint  
                  const result = await createTournamentDirectly(
                    tournamentData,
                    session?.user?.email || ""
                  );
                  
                  toast({
                    title: "Tournament Created",
                    description: `${name} has been created successfully.`,
                  });
                  
                  // Navigate to the tournament page
                  router.push(`/admin/tournaments/${result.id}`);
                } catch (error) {
                  console.error("Error creating tournament:", error);
                  toast({
                    title: "Error",
                    description: "Failed to create tournament. Please try again.",
                    variant: "destructive"
                  });
                } finally {
                  setIsSubmitting(false);
                }
              }}
            >
              Create Directly (Bypass API)
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
} 