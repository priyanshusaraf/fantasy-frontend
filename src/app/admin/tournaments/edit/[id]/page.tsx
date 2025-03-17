"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Check, Trophy, Users, Info, ArrowLeft, AlertCircle, UserIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import TournamentRegistration from "@/components/admin/TournamentRegistration";
import { Team } from "@/components/admin/TeamManagement";
import { Player } from "@/components/admin/PlayerManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Switch } from "@/components/ui/switch";

// Function to update an existing tournament
async function updateTournamentDirectly(tournamentId: string, tournamentData: any, userEmail: string) {
  console.log("UPDATE FUNCTION CALLED at", new Date().toISOString());
  console.log("Tournament ID:", tournamentId);
  console.log("Tournament data:", JSON.stringify(tournamentData));
  
  try {
    const response = await fetch(`/api/tournaments/${tournamentId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tournamentData,
        userEmail,
        secretKey: "tournament-direct-update" // Security key similar to creation
      }),
      cache: "no-store"
    });
    
    console.log("Update response status:", response.status);
    
    if (!response.ok) {
      try {
        const errorText = await response.text();
        console.error(`Tournament update failed: ${response.status}`, errorText);
        throw new Error(`Tournament update failed: ${response.status} - ${errorText}`);
      } catch (parseError) {
        console.error("Error parsing error response:", parseError);
        throw new Error(`Tournament update failed with status: ${response.status}`);
      }
    }
    
    try {
      const result = await response.json();
      console.log("Tournament update response data:", result);
      return result;
    } catch (jsonError) {
      console.error("Error parsing JSON response:", jsonError);
      throw new Error("Failed to parse response from server");
    }
  } catch (error) {
    console.error("Error in tournament update:", error);
    throw error;
  }
}

export default function EditTournamentPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [initialTeams, setInitialTeams] = useState<Team[]>([]);
  const [initialPlayers, setInitialPlayers] = useState<Player[]>([]);
  const [tournament, setTournament] = useState<any>(null);
  const [isLoadingTournament, setIsLoadingTournament] = useState(true);

  const tournamentId = params.id as string;

  // Define form schema
  const formSchema = z.object({
    name: z.string().min(3, { message: "Tournament name is required" }),
    description: z.string().optional(),
    location: z.string().optional(),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    maxPlayers: z.coerce.number().int().positive().optional(),
    maxTeams: z.coerce.number().int().positive().optional(),
    registrationFee: z.coerce.number().min(0).optional(),
    isTeamBased: z.boolean().default(false),
    isPublic: z.boolean().default(true),
    enableFantasy: z.boolean().default(false),
    fantasyEnabled: z.boolean().default(false),
    fantasyEntryFee: z.coerce.number().min(0).optional(),
    fantasyPrizePool: z.coerce.number().min(0).optional(),
  });

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      location: "",
      maxPlayers: 0,
      maxTeams: 0,
      registrationFee: 0,
      isTeamBased: false,
      isPublic: true,
      enableFantasy: false,
      fantasyEnabled: false,
      fantasyEntryFee: 0,
      fantasyPrizePool: 0,
    },
  });

  // Load tournament data
  useEffect(() => {
    const fetchTournament = async () => {
      try {
        setIsLoadingTournament(true);
        const response = await fetch(`/api/tournaments/${tournamentId}`);
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        setTournament(data.tournament);
        
        // Set form values
        form.reset({
          name: data.tournament.name || "",
          description: data.tournament.description || "",
          location: data.tournament.location || "",
          startDate: data.tournament.startDate ? new Date(data.tournament.startDate) : undefined,
          endDate: data.tournament.endDate ? new Date(data.tournament.endDate) : undefined,
          maxPlayers: data.tournament.maxPlayers || 0,
          maxTeams: data.tournament.maxTeams || 0,
          registrationFee: data.tournament.registrationFee || 0,
          isTeamBased: data.tournament.isTeamBased || false,
          isPublic: data.tournament.isPublic !== false,
          enableFantasy: data.tournament.enableFantasy || false,
          fantasyEnabled: data.tournament.fantasyEnabled || false,
          fantasyEntryFee: data.tournament.fantasyEntryFee || 0,
          fantasyPrizePool: data.tournament.fantasyPrizePool || 0,
        });
        
        // Fetch teams and players for this tournament
        await fetchTeamsAndPlayers(data.tournament.id);
      } catch (error) {
        console.error("Failed to load tournament:", error);
        toast({
          title: "Error",
          description: "Failed to load tournament data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingTournament(false);
      }
    };
    
    if (tournamentId) {
      fetchTournament();
    }
  }, [tournamentId, form, toast]);

  // Fetch teams and players for the tournament
  const fetchTeamsAndPlayers = async (tournamentId: string) => {
    try {
      // Fetch teams for this tournament
      const teamsResponse = await fetch(`/api/tournaments/${tournamentId}/teams`);
      
      if (!teamsResponse.ok) {
        throw new Error(`Error fetching teams: ${teamsResponse.status}`);
      }
      
      const teamsData = await teamsResponse.json();
      
      // Process teams and players
      const formattedTeams: Team[] = teamsData.teams.map((team: any) => ({
        id: team.id,
        name: team.name,
        players: team.players.map((player: any) => ({
          id: player.id,
          name: player.name,
          email: player.email || '',
          phone: player.phone || '',
          teamId: team.id
        }))
      }));
      
      // Get all players from teams
      const allPlayers: Player[] = formattedTeams.flatMap(team => 
        team.players.map(player => ({
          ...player,
          teamId: team.id
        }))
      );
      
      setInitialTeams(formattedTeams);
      setInitialPlayers(allPlayers);
      setTeams(formattedTeams);
      setPlayers(allPlayers);
      
    } catch (error) {
      console.error("Failed to load teams and players:", error);
      toast({
        title: "Warning",
        description: "Failed to load teams and players. You can still edit tournament details.",
        variant: "destructive",
      });
    }
  };

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!session?.user?.email) {
      toast({
        title: "Error",
        description: "You must be logged in to update a tournament",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      // Prepare tournament data
      const tournamentData = {
        ...values,
        teams,
        players,
      };

      // Update tournament
      const result = await updateTournamentDirectly(
        tournamentId,
        tournamentData,
        session.user.email
      );

      toast({
        title: "Success",
        description: "Tournament updated successfully",
      });

      // Redirect to tournament list
      router.push("/admin/tournaments");
    } catch (error) {
      console.error("Failed to update tournament:", error);
      toast({
        title: "Error",
        description: "Failed to update tournament. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle registration data changes
  const handleRegistrationDataChange = (data: { teams: Team[]; players: Player[] }) => {
    setTeams(data.teams);
    setPlayers(data.players);
  };

  if (isLoadingTournament) {
    return <div className="flex justify-center items-center h-screen">Loading tournament data...</div>;
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Edit Tournament</h1>
        <p className="text-muted-foreground">Update an existing tournament</p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Tournament Details</TabsTrigger>
              <TabsTrigger value="registration">Registration Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>
                    Enter the basic details for your tournament
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tournament Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter tournament name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter tournament description"
                            className="min-h-32"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter tournament location" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Start Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>End Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="registration" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tournament Setup</CardTitle>
                  <CardDescription>
                    Configure registration settings for your tournament
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Choose whether your tournament is team-based or individual player-based
                    </AlertDescription>
                  </Alert>
                  
                  <FormField
                    control={form.control}
                    name="isTeamBased"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Team-Based Tournament</FormLabel>
                          <FormDescription>
                            Enable this for tournaments with multiple teams
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {form.watch("isTeamBased") ? (
                      <FormField
                        control={form.control}
                        name="maxTeams"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Maximum Teams</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0 for unlimited"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Set to 0 for unlimited teams
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <FormField
                        control={form.control}
                        name="maxPlayers"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Maximum Players</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0 for unlimited"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Set to 0 for unlimited players
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    
                    <FormField
                      control={form.control}
                      name="registrationFee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Registration Fee ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0 for free entry"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Set to 0 for free entry
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Separator className="my-6" />
                  
                  <FormField
                    control={form.control}
                    name="isPublic"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Public Tournament</FormLabel>
                          <FormDescription>
                            Make this tournament visible to all users
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="enableFantasy"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Fantasy Mode</FormLabel>
                          <FormDescription>
                            Enable fantasy contests for this tournament
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  {form.watch("enableFantasy") && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                      <FormField
                        control={form.control}
                        name="fantasyEntryFee"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fantasy Entry Fee ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0 for free entry"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Set to 0 for free entry
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="fantasyPrizePool"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fantasy Prize Pool ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Total prize pool amount"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <TournamentRegistration 
                isTeamBased={form.watch("isTeamBased")}
                onRegistrationDataChange={handleRegistrationDataChange}
                initialTeams={initialTeams}
                initialPlayers={initialPlayers}
              />
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/tournaments")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Tournament"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
} 