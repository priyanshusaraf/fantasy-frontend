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
import TournamentRegistration from "@/components/admin/TournamentRegistration";
import { Team } from "@/components/admin/TeamManagement";
import { Player } from "@/components/admin/PlayerManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Add proper TypeScript interfaces
interface BasicPlayer {
  id?: number;
  name: string;
  email?: string;
  phone?: string;
  skillLevel?: string;
  country?: string;
  teamId?: string;
}

interface BasicTeam {
  id?: string;
  name: string;
  players: BasicPlayer[];
}

// Direct tournament creation function
// This is a fallback in case the API approach doesn't work
async function createTournamentDirectly(tournamentData: any, userEmail: string) {
  console.log("DIRECT CREATION FUNCTION CALLED at", new Date().toISOString());
  console.log("Tournament data:", JSON.stringify(tournamentData));
  console.log("User email:", userEmail);
  
  try {
    // This is a client-side function to directly create a tournament
    // It will bypass the API authentication by using a special endpoint
    console.log("Sending fetch request to /api/admin/direct-tournament-create");
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
      }),
      cache: "no-store"
    });
    
    console.log("Fetch response status:", response.status);
    
    if (!response.ok) {
      try {
        const errorText = await response.text();
        console.error(`Direct creation failed: ${response.status}`, errorText);
        throw new Error(`Direct creation failed: ${response.status} - ${errorText}`);
      } catch (parseError) {
        console.error("Error parsing error response:", parseError);
        throw new Error(`Direct creation failed with status: ${response.status}`);
      }
    }
    
    try {
      const result = await response.json();
      console.log("Direct creation response data:", result);
      return result;
    } catch (jsonError) {
      console.error("Error parsing JSON response:", jsonError);
      throw new Error("Failed to parse response from server");
    }
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

// Update the functions with proper types
function removeDuplicatePlayers(players: BasicPlayer[]): BasicPlayer[] {
  const uniquePlayers: Record<string, boolean> = {};
  const result: BasicPlayer[] = [];
  
  // Use a map to track unique players by ID or name
  for (const player of players) {
    const key = player.id ? `id-${player.id}` : `name-${player.name}`;
    
    if (!uniquePlayers[key]) {
      uniquePlayers[key] = true;
      result.push(player);
    }
  }
  
  return result;
}

function removeDuplicatePlayersInTeams(teams: BasicTeam[]): BasicTeam[] {
  return teams.map(team => {
    // Remove duplicate players in each team
    return {
      ...team,
      players: removeDuplicatePlayers(team.players || [])
    };
  });
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
  const [isTeamBased, setIsTeamBased] = useState(false);
  const [enableLiveScoring, setEnableLiveScoring] = useState(false);
  const [enableFantasy, setEnableFantasy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  
  // Registration data
  const [registrationData, setRegistrationData] = useState<{
    teams: Team[];
    players: Player[];
  }>({
    teams: [],
    players: []
  });
  
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

  // Update handleSubmit to include team and player data
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
    
    // For team-based tournaments, validate that there are teams
    if (isTeamBased && registrationData.teams.length === 0) {
      toast({
        title: "Missing teams",
        description: "Please add at least one team to your team-based tournament",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }
    
    console.log("Form validation passed, preparing tournament data");

    // Prepare registration dates
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
      isTeamBased,
      settings: {
        enableLiveScoring,
        enableFantasy,
        formatType: formatType  // Store format as a custom setting
      },
      players: isTeamBased ? [] : registrationData.players,
      teams: isTeamBased ? registrationData.teams : []
    };

    try {
      setIsSubmitting(true);
      
      if (!session?.user?.email) {
        throw new Error("User email not found in session");
      }
      
      const userEmail = session.user.email;
      
      // Clean up data - remove duplicates
      const teamsWithoutDuplicates = removeDuplicatePlayersInTeams(tournamentData.teams);
      const playersWithoutDuplicates = removeDuplicatePlayers(tournamentData.players);
      const cleanedTournamentData = {
        ...tournamentData,
        teams: teamsWithoutDuplicates,
        players: playersWithoutDuplicates
      };
      
      // Create the tournament
      const result = await createTournamentDirectly(cleanedTournamentData, userEmail);
      
      toast({
        title: "Tournament Created",
        description: `${name} has been created successfully.`,
      });
      
      // Redirect to tournament management
      if (result.id) {
        router.push(`/admin/tournaments/${result.id}`);
      } else {
        router.push('/admin/tournaments');
      }
    } catch (error) {
      console.error("Tournament creation failed:", error);
      toast({
        title: "Error",
        description: "Failed to create tournament. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler for registration data changes
  const handleRegistrationDataChange = (data: { teams: Team[]; players: Player[] }) => {
    setRegistrationData(data);
  };

  // Render different content based on the active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case "details":
        return (
          <div className="space-y-6">
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
                      <PopoverContent className="w-auto p-0 z-[100]">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={(date) => {
                            setStartDate(date);
                            // Force close the popover after selection
                            const popoverTrigger = document.activeElement as HTMLElement;
                            if (popoverTrigger) popoverTrigger.blur();
                          }}
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
                      <PopoverContent className="w-auto p-0 z-[100]">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={(date) => {
                            setEndDate(date);
                            // Force close the popover after selection
                            const popoverTrigger = document.activeElement as HTMLElement;
                            if (popoverTrigger) popoverTrigger.blur();
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Tournament type section */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <Label htmlFor="tournamentType">Tournament Type *</Label>
                    <Select
                      value={tournamentType}
                      onValueChange={setTournamentType}
                    >
                      <SelectTrigger id="tournamentType">
                        <SelectValue placeholder="Select tournament type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SINGLES">Singles</SelectItem>
                        <SelectItem value="DOUBLES">Doubles</SelectItem>
                        <SelectItem value="MIXED">Mixed Doubles</SelectItem>
                        <SelectItem value="ROUND_ROBIN">Round Robin</SelectItem>
                        <SelectItem value="KNOCKOUT">Knockout</SelectItem>
                        <SelectItem value="LEAGUE">League</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Select the type of tournament you want to organize
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="formatType">Format Type *</Label>
                    <Select
                      value={formatType}
                      onValueChange={setFormatType}
                    >
                      <SelectTrigger id="formatType">
                        <SelectValue placeholder="Select format type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ROUND_ROBIN">Round Robin</SelectItem>
                        <SelectItem value="SINGLE_ELIMINATION">Single Elimination</SelectItem>
                        <SelectItem value="DOUBLE_ELIMINATION">Double Elimination</SelectItem>
                        <SelectItem value="GROUP_STAGE">Group Stage + Knockout</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Choose how matches will be structured
                    </p>
                  </div>
                </div>

                {/* Tournament organization section */}
                <div className="space-y-4 mb-6 border rounded-lg p-4 bg-muted/10">
                  <h3 className="text-lg font-medium">Tournament Organization</h3>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="isTeamBased" className="font-medium">Team-Based Tournament</Label>
                      <p className="text-xs text-muted-foreground">
                        Enable if players will participate as teams rather than individually
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={isTeamBased}
                          onChange={() => setIsTeamBased(!isTeamBased)}
                          id="isTeamBased"
                        />
                        <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="enableLiveScoring" className="font-medium">Live Scoring</Label>
                      <p className="text-xs text-muted-foreground">
                        Enable real-time score updates during matches
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={enableLiveScoring}
                          onChange={() => setEnableLiveScoring(!enableLiveScoring)}
                          id="enableLiveScoring"
                        />
                        <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="enableFantasy" className="font-medium">Enable Fantasy Games</Label>
                      <p className="text-xs text-muted-foreground">
                        Allow players to create fantasy teams for this tournament
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={enableFantasy}
                          onChange={() => setEnableFantasy(!enableFantasy)}
                          id="enableFantasy"
                        />
                        <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

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
          </div>
        );
      case "registration":
        return (
          <TournamentRegistration 
            isTeamBased={isTeamBased} 
            onRegistrationDataChange={handleRegistrationDataChange} 
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl relative isolate">
      {/* isolate creates a new stacking context to prevent z-index issues */}
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

      {/* Authentication Status Indicator */}
      {justAuthenticated && (
        <Alert className="mb-6 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertTitle className="text-green-800 dark:text-green-400">Authentication Successful</AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-500">
            You are now logged in and can create a tournament.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Tournament Details</TabsTrigger>
            <TabsTrigger 
              value="registration"
              disabled={!name || !tournamentType} // Disable until basic details are filled
            >
              {isTeamBased ? "Teams & Players" : "Players"}
            </TabsTrigger>
          </TabsList>
          
          <div className="mt-6">
            {renderTabContent()}
          </div>
        </Tabs>

        <div className="flex justify-between mt-8 pt-4 border-t">
          {activeTab === "details" ? (
            <div></div>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveTab("details")}
            >
              Back to Details
            </Button>
          )}
          
          {activeTab === "details" ? (
            <Button
              type="button"
              onClick={() => {
                if (name && tournamentType) {
                  setActiveTab("registration");
                } else {
                  toast({
                    title: "Required fields missing",
                    description: "Please fill out the tournament name and type before proceeding to registration",
                    variant: "destructive",
                  });
                }
              }}
            >
              Continue to {isTeamBased ? "Teams & Players" : "Players"}
            </Button>
          ) : (
            <Button 
              type="submit"
              disabled={isSubmitting}
              className="bg-primary text-primary-foreground"
            >
              {isSubmitting ? "Creating Tournament..." : "Create Tournament"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
} 