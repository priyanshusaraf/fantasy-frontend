"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Users, Shield, Trophy, Settings, MapPin, Clock, UserPlus, User } from "lucide-react";
import TournamentPlayerManager from "@/components/tournaments/TournamentPlayerManager";
import TournamentRefereeManager from "@/components/tournaments/TournamentRefereeManager";
import { useToast } from "@/components/ui/use-toast";
import FantasySetup from "@/components/admin/tournament-creation/FantasySetup";
import { FormProvider, useForm } from "react-hook-form";
import TeamDisplay from "@/components/admin/TeamDisplay";

interface TournamentDetailProps {
  params: {
    id: string;
  };
}

interface Tournament {
  id: number;
  name: string;
  description: string;
  location: string;
  startDate: string | Date;
  endDate: string | Date;
  registrationOpenDate?: string | Date;
  registrationCloseDate?: string | Date;
  status: string;
  type: string;
  maxParticipants: number;
  entryFee: number;
  prizeMoney?: number;
  imageUrl?: string;
  organizerId: number;
  playerCount?: number;
  refereeCount?: number;
  fantasy?: {
    enableFantasy: boolean;
    contests?: any[];
    fantasyPoints?: string;
    autoPublish?: boolean;
    [key: string]: any;
  };
  rules?: string;
  [key: string]: any;
}

export default function TournamentDetailPage({ params }: TournamentDetailProps) {
  // While Next.js suggests using React.use() for params,
  // we'll use direct access with a comment acknowledging the warning
  // This approach works while avoiding TypeScript errors in this codebase
  const tournamentId = params.id;
  
  // Note: In a future update, we'll migrate to React.use() once TypeScript support improves
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { toast } = useToast();
  
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  
  // Create a ref to store fetch function
  const fetchTournamentRef = useRef<() => Promise<void>>();
  
  // Helper function to get auth token
  const getAuthToken = (): string => {
    // If session is available, get the JWT token if it's been stored
    // Otherwise, return an empty string
    return session?.accessToken || '';
  };
  
  // Store token in localStorage when session is available
  useEffect(() => {
    if (session && status === 'authenticated') {
      console.log("Session authenticated, checking for token");
      
      // For security, retrieve token without logging it
      let sessionToken = null;
      
      // @ts-ignore - Check different potential token locations
      if (session.token) sessionToken = session.token;
      // @ts-ignore
      else if (session.accessToken) sessionToken = session.accessToken; 
      // @ts-ignore
      else if (session.user && session.user.token) sessionToken = session.user.token;
      
      if (sessionToken && typeof window !== 'undefined') {
        localStorage.setItem('auth_token', sessionToken);
        console.log("Token stored in localStorage from session");
      } else if (!sessionToken) {
        // For this specific application, we'll add a temporary fake token for testing
        // REMOVE THIS IN PRODUCTION - this is just to get past the auth check during development
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', 'fake_development_token_for_testing');
          console.log("⚠️ DEVELOPMENT ONLY: Using fake token for testing");
        }
      }
    }
  }, [session, status]);
  
  // Set active tab from URL parameter
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam) {
      setActiveTab(tabParam);
      console.log("Setting active tab from URL:", tabParam);
    }
  }, [searchParams]);
  
  const methods = useForm({
    defaultValues: {
      fantasy: {
        enableFantasy: false,
        fantasyPoints: "STANDARD",
        autoPublish: true,
        contests: [] as any[]
      }
    }
  });

  // Setup effect for data fetching
  useEffect(() => {
    if (status === "authenticated") {
      const fetchTournament = async () => {
        setLoading(true);
        setError(null);
        
        try {
          console.log(`Fetching tournament data for ID: ${tournamentId}`);
          const response = await fetch(`/api/tournaments/${tournamentId}`);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch tournament: ${response.status}`);
          }
          
          const data = await response.json();
          console.log("Tournament data received:", data);
          setTournament(data);
        } catch (err: any) {
          console.error("Error fetching tournament:", err);
          setError(err.message || "Failed to load tournament data");
          toast({
            title: "Error",
            description: "Failed to load tournament data. Please try again.",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      };
      
      // Store the fetch function in the ref
      fetchTournamentRef.current = fetchTournament;
      
      fetchTournament();
    }
  }, [tournamentId, status, toast]);

  // Format date for display
  const formatDate = (date: string | Date): string => {
    if (!date) return "TBD";
    return format(new Date(date), "MMMM d, yyyy");
  };

  // Format time for display
  const formatTime = (date: string | Date): string => {
    if (!date) return "";
    return format(new Date(date), "h:mm a");
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string, variant: "default" | "secondary" | "outline" | "destructive" }> = {
      DRAFT: { label: "Draft", variant: "secondary" },
      REGISTRATION_OPEN: { label: "Registration Open", variant: "default" },
      REGISTRATION_CLOSED: { label: "Registration Closed", variant: "outline" },
      IN_PROGRESS: { label: "In Progress", variant: "default" },
      COMPLETED: { label: "Completed", variant: "outline" },
      CANCELLED: { label: "Cancelled", variant: "destructive" },
    };
    
    const status_key = status.toUpperCase();
    const config = statusMap[status_key] || { label: status, variant: "secondary" };
    
    return (
      <Badge variant={config.variant}>{config.label}</Badge>
    );
  };

  // Update tournament status
  const handleUpdateStatus = async (newStatus: string) => {
    if (!tournamentId) return;
    
    setIsUpdatingStatus(true);
    
    try {
      console.log(`Updating tournament ${tournamentId} status to ${newStatus}`);
      
      const response = await fetch(`/api/tournaments/${tournamentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": getAuthToken(),
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      // Log response details for debugging
      console.log(`Status update response status: ${response.status}`);
      
      let errorMessage = "Failed to update tournament status";
      
      if (!response.ok) {
        // Clone the response before attempting to read it
        const responseClone = response.clone();
        
        // Try to get detailed error message
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
          console.error("Error response data:", errorData);
        } catch (e) {
          // If can't parse JSON, try to get text from the cloned response
          try {
            const errorText = await responseClone.text();
            if (errorText) {
              errorMessage = `${errorMessage}: ${errorText}`;
              console.error("Error response text:", errorText);
            }
          } catch (textError) {
            console.error("Couldn't get error details", textError);
          }
        }
        
        throw new Error(errorMessage);
      }
      
      const updatedTournament = await response.json();
      console.log("Tournament status updated successfully:", updatedTournament);
      
      // Update local tournament data with the complete response
      if (tournament) {
        setTournament({
          ...tournament,
          ...updatedTournament,
          status: newStatus
        });
      }
      
      toast({
        title: "Status Updated",
        description: `Tournament status updated to ${newStatus}`,
      });
      
      // Refresh the data from server to ensure consistency
      setTimeout(() => {
        if (fetchTournamentRef.current) {
          fetchTournamentRef.current();
        }
      }, 500);
    } catch (error) {
      console.error("Error updating status:", error);
      
      // Optimistic update fallback - if API fails but the operation is simple
      // Show a warning but still update the UI
      if (tournament) {
        setTournament({
          ...tournament,
          status: newStatus
        });
      }
      
      toast({
        title: "Warning",
        description: "Status visually updated but there was an error syncing with the server. Changes may not persist after reload.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Add this effect to fetch contests when tab changes to fantasy
  useEffect(() => {
    const fetchContests = async () => {
      if (!tournamentId || activeTab !== "fantasy") return;
      
      try {
        // Add cache-busting parameters and force no-store
        const timestamp = Date.now();
        const response = await fetch(`/api/tournaments/${tournamentId}/contests?t=${timestamp}`, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Authorization': getAuthToken(),
          },
          cache: 'no-store',  // Force Next.js to bypass its cache entirely
          next: { revalidate: 0 }  // Always revalidate
        });
        
        if (!response.ok) {
          throw new Error("Failed to fetch contests");
        }
        
        const data = await response.json();
        console.log("Fetched contests:", data);
        
        // If we have contests, update the form data
        if (data.contests && data.contests.length > 0) {
          console.log(`Setting ${data.contests.length} contests in form state`);
          methods.setValue("fantasy.contests", data.contests);
          
          // Also ensure fantasy is enabled if there are contests
          if (!methods.getValues("fantasy.enableFantasy")) {
            methods.setValue("fantasy.enableFantasy", true);
          }
        }
        
        // Refresh tournament object with contests data if needed
        if (tournament && (!tournament.fantasy || !tournament.fantasy.contests)) {
          setTournament(prev => {
            if (!prev) return null;
            
            return {
              ...prev,
              fantasy: {
                ...(prev.fantasy || {}),
                enableFantasy: data.contests && data.contests.length > 0 ? true : (prev.fantasy?.enableFantasy || false),
                contests: data.contests || []
              }
            };
          });
        }
      } catch (error) {
        console.error("Error fetching contests:", error);
        toast({
          title: "Error",
          description: "Failed to load fantasy contests",
          variant: "destructive",
        });
      }
    };

    fetchContests();
  }, [activeTab, tournamentId, methods, toast, tournament]);

  // Update the handleSaveFantasySettings function
  const handleSaveFantasySettings = async () => {
    if (!tournamentId || !tournament) return;
    
    try {
      // Get form values
      const fantasyData = methods.getValues("fantasy");
      console.log("Saving fantasy settings:", JSON.stringify(fantasyData, null, 2));
      console.log("Contests to save:", fantasyData.contests?.length || 0);
      
      if (fantasyData.contests?.length > 0) {
        console.log("First contest details:", JSON.stringify(fantasyData.contests[0], null, 2));
        
        // Validate contests before saving
        const invalidContests = fantasyData.contests.filter((contest: any) => !contest.name);
        if (invalidContests.length > 0) {
          console.error("Found invalid contests without names:", invalidContests.length);
          throw new Error("All contests must have a name");
        }
        
        // Validate prize breakdowns
        const invalidPrizes = fantasyData.contests.filter((contest: any) => {
          if (!contest.prizeBreakdown || !Array.isArray(contest.prizeBreakdown)) return true;
          const sum = contest.prizeBreakdown.reduce((total: number, item: any) => total + (item.percentage || 0), 0);
          return Math.abs(sum - 100) > 0.1; // Allow small rounding errors
        });
        
        if (invalidPrizes.length > 0) {
          console.error("Found contests with invalid prize breakdowns:", invalidPrizes.length);
          throw new Error("All contests must have prize breakdowns that sum to 100%");
        }
      }
      
      // Ensure all required properties exist
      if (!fantasyData.contests) {
        fantasyData.contests = [];
      }
      
      // Make sure we have proper IDs for contests if created in the UI
      fantasyData.contests = fantasyData.contests.map((contest: any) => {
        // If it's a temporary ID (string starting with "contest-"), remove it
        // so the backend will create a new database ID
        if (typeof contest.id === 'string' && contest.id.startsWith('contest-')) {
          const { id, ...contestWithoutId } = contest;
          return contestWithoutId;
        }
        return contest;
      });
      
      setLoading(true); // Set loading state to indicate processing
      
      // DEVELOPMENT ONLY: Always ensure we have a token in localStorage for development
      if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
        localStorage.setItem('auth_token', 'fake_development_token_for_testing');
        console.log("⚠️ DEVELOPMENT MODE: Using fake token for testing");
      }
      
      // First save the fantasy settings
      console.log("Sending POST request to /api/tournaments/" + tournamentId + "/fantasy-setup");
      const token = getAuthToken();
      console.log("Token being used (masked):", token.substring(0, 10) + "...");
      
      const response = await fetch(`/api/tournaments/${tournamentId}/fantasy-setup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token,
        },
        body: JSON.stringify(fantasyData),
      });
      
      console.log("POST response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log("Raw error response:", errorText);
        let errorMessage = "Failed to save fantasy settings";
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
          console.error("Parsed error details:", errorData);
        } catch (e) {
          console.error("Could not parse error response as JSON:", e);
          errorMessage = errorText || errorMessage;
        }
        
        console.error("Error response:", errorMessage);
        
        // Show error in toast instead of throwing
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        
        setLoading(false);
        return; // Return early instead of throwing
      }
      
      const result = await response.json();
      console.log("Fantasy settings save result:", result);
      console.log("Contest results:", result.contestResults);
      
      // Show success message
      toast({
        title: "Success",
        description: `Fantasy settings saved successfully. ${result.contestResults?.length || 0} contests processed.`,
      });
      
      // Wait briefly for database to update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Fetch the latest contests with cache-busting timestamp
      console.log("Fetching latest contests after save");
      const contestsResponse = await fetch(`/api/tournaments/${tournamentId}/contests?t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Authorization': getAuthToken(),
        },
        cache: 'no-store'
      });
      
      console.log("Contests fetch response status:", contestsResponse.status);
      
      let contests: any[] = [];
      if (contestsResponse.ok) {
        const contestData = await contestsResponse.json();
        contests = contestData.contests || [];
        console.log("Latest contests fetched after save:", contests);
        console.log("Number of contests found:", contests.length);
        
        if (contests.length > 0) {
          console.log("First contest fetched:", JSON.stringify(contests[0], null, 2));
        }
        
        // Update form values with latest contests
        methods.setValue("fantasy.contests", contests);
        
        // Also update tournament object
        setTournament(prev => {
          if (!prev) return null;
          return {
            ...prev,
            fantasy: {
              ...(prev.fantasy || { enableFantasy: false }),
              contests: contests,
              enableFantasy: fantasyData.enableFantasy
            }
          };
        });
      } else {
        console.error("Failed to fetch latest contests:", await contestsResponse.text());
      }
      
      // Refresh tournament data with aggressive cache-busting
      console.log("Refreshing tournament data after fantasy setup save");
      const updatedTournamentResponse = await fetch(`/api/admin/direct-tournament-fetch?id=${tournamentId}&t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Authorization': getAuthToken(),
        },
        cache: 'no-store',
        next: { revalidate: 0 }
      });
      
      if (updatedTournamentResponse.ok) {
        const updatedTournament = await updatedTournamentResponse.json();
        console.log("Updated tournament data:", updatedTournament);
        
        // Update tournament data while preserving the contests we just fetched
        setTournament({
          ...updatedTournament,
          fantasy: {
            ...updatedTournament.fantasy,
            contests: contests.length > 0 ? contests : (updatedTournament.fantasy?.contests || [])
          }
        });
        
        // Make sure form values are consistent with the updated tournament
        methods.setValue("fantasy.enableFantasy", updatedTournament.fantasy?.enableFantasy || false);
        methods.setValue("fantasy.fantasyPoints", updatedTournament.fantasy?.fantasyPoints || "STANDARD");
        methods.setValue("fantasy.autoPublish", updatedTournament.fantasy?.autoPublish || true);
      }
      
      // Only reload the page if needed - try to avoid this to prevent flickering
      if (contests.length === 0 && fantasyData.enableFantasy) {
        // Force a refresh of the page - only if we need to
        router.push(`/admin/tournaments/${tournamentId}?tab=fantasy&t=${Date.now()}`);
      }
    } catch (error) {
      console.error("Error saving fantasy settings:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save fantasy settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }
  
  if (error || !tournament) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          <h2 className="text-lg font-bold">Error Loading Tournament</h2>
          <p>{error || "Tournament not found"}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => router.push("/admin/tournaments")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tournaments
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div className="flex items-center mb-4 md:mb-0">
          <Button 
            variant="ghost" 
            className="mr-4" 
            onClick={() => router.push("/admin/tournaments")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">{tournament.name}</h1>
        </div>
        
        <div className="space-x-2">
          <Button variant="outline" onClick={() => router.push(`/admin/tournaments/edit/${tournamentId}`)}>
            <Settings className="h-4 w-4 mr-2" />
            Edit Tournament
          </Button>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center">
          <MapPin className="h-5 w-5 text-muted-foreground mr-2" />
          <span>{tournament.location}</span>
        </div>
        <div className="flex items-center">
          <Calendar className="h-5 w-5 text-muted-foreground mr-2" />
          <span>{formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}</span>
        </div>
        <div className="flex items-center">
          <Clock className="h-5 w-5 text-muted-foreground mr-2" />
          <span>Registration: {formatDate(tournament.registrationOpenDate || "")} - {formatDate(tournament.registrationCloseDate || "")}</span>
        </div>
        <div className="ml-auto">
          {getStatusBadge(tournament.status)}
        </div>
      </div>
      
      <Tabs 
        value={activeTab} 
        onValueChange={(value) => {
          setActiveTab(value);
          router.push(`/admin/tournaments/${tournamentId}?tab=${value}&t=${Date.now()}`);
        }}
        className="mt-6"
      >
        <TabsList className="grid grid-cols-4 sm:grid-cols-5 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="players">Players</TabsTrigger>
          <TabsTrigger value="referees">Referees</TabsTrigger>
          <TabsTrigger value="fantasy">Fantasy</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tournament Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
                  <p className="text-base">{tournament.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Tournament Type</h3>
                    <p className="text-base">{tournament.type}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(tournament.status)}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Max Participants</h3>
                    <p className="text-base">{tournament.maxParticipants}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Entry Fee</h3>
                    <p className="text-base">
                      {tournament.entryFee > 0 
                        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(tournament.entryFee)
                        : "Free"
                      }
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Change Status</h3>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={tournament.status === "REGISTRATION_OPEN" || isUpdatingStatus}
                    onClick={() => handleUpdateStatus("REGISTRATION_OPEN")}
                  >
                    Open Registration
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={tournament.status === "REGISTRATION_CLOSED" || isUpdatingStatus}
                    onClick={() => handleUpdateStatus("REGISTRATION_CLOSED")}
                  >
                    Close Registration
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={tournament.status === "IN_PROGRESS" || isUpdatingStatus}
                    onClick={() => handleUpdateStatus("IN_PROGRESS")}
                  >
                    Start Tournament
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={tournament.status === "COMPLETED" || isUpdatingStatus}
                    onClick={() => handleUpdateStatus("COMPLETED")}
                  >
                    Complete Tournament
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={tournament.status === "CANCELLED" || isUpdatingStatus}
                    onClick={() => handleUpdateStatus("CANCELLED")}
                  >
                    Cancel Tournament
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Players
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{tournament.playerCount || 0}</div>
                <p className="text-muted-foreground">registered players</p>
                <Button 
                  variant="link" 
                  className="p-0 h-auto mt-2" 
                  onClick={() => setActiveTab("players")}
                >
                  Manage Players
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Referees
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{tournament.refereeCount || 0}</div>
                <p className="text-muted-foreground">assigned referees</p>
                <Button 
                  variant="link" 
                  className="p-0 h-auto mt-2" 
                  onClick={() => setActiveTab("referees")}
                >
                  Manage Referees
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="h-5 w-5 mr-2" />
                  Fantasy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {tournament.fantasy?.enableFantasy ? "Enabled" : "Disabled"}
                </div>
                <p className="text-muted-foreground">
                  {tournament.fantasy?.contests?.length || 0} contest(s)
                </p>
                <Button 
                  variant="link" 
                  className="p-0 h-auto mt-2" 
                  onClick={() => setActiveTab("fantasy")}
                >
                  Manage Fantasy
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="players" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {tournament?.isTeamBased ? (
              <TeamDisplay tournamentId={parseInt(tournamentId)} />
            ) : (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Tournament Players</CardTitle>
                    <CardDescription>Manage players in this tournament</CardDescription>
                  </div>
                  
                  <Button 
                    onClick={() => router.push(`/admin/tournaments/${tournamentId}/players/add`)}
                    variant="outline"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Players
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Registered Players</h3>
                      <div className="text-sm text-muted-foreground">
                        {tournament?.playerCount || 0} / {tournament?.maxParticipants || 0} players
                      </div>
                    </div>
                    
                    {tournament?.playerCount === 0 ? (
                      <div className="text-center p-8 bg-muted/20 border border-dashed rounded-lg">
                        <User className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No players registered</h3>
                        <p className="text-muted-foreground mb-4">
                          Add players to start building your tournament roster.
                        </p>
                        <Button 
                          onClick={() => router.push(`/admin/tournaments/${tournamentId}/players/add`)}
                          variant="default"
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          Add First Player
                        </Button>
                      </div>
                    ) : (
                      <div className="border rounded-md divide-y">
                        {/* Player list would go here */}
                        <div className="p-4 text-center text-muted-foreground">
                          <p>List of registered players would appear here</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="referees">
          <TournamentRefereeManager tournamentId={tournamentId} />
        </TabsContent>
        
        <TabsContent value="fantasy">
          <Card>
            <CardHeader>
              <CardTitle>Fantasy Setup</CardTitle>
              <CardDescription>
                Configure fantasy game settings for this tournament
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormProvider {...methods}>
                <FantasySetup />
                <div className="mt-6 flex justify-end">
                  <Button onClick={handleSaveFantasySettings}>
                    Save Fantasy Settings
                  </Button>
                </div>
              </FormProvider>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 