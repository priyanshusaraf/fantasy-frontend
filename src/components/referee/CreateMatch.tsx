"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast as sonnerToast } from "@/components/ui/sonner";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Wrap Sonner toast to add typed variants
const toast = {
  error: (message: string) => sonnerToast(message, { type: "error" }),
  success: (message: string) => sonnerToast(message, { type: "success" }),
  info: (message: string) => sonnerToast(message, { type: "info" }),
  warning: (message: string) => sonnerToast(message, { type: "warning" })
};

// Types
interface Player {
  id: number;
  name: string;
  imageUrl?: string;
  skillLevel?: string;
}

interface Tournament {
  id: number;
  name: string;
}

// Form schema for creating a match
const createMatchSchema = z.object({
  tournamentId: z.number(),
  matchType: z.enum(["singles", "doubles"]),
  player1Id: z.number().optional(),
  player2Id: z.number().optional(),
  player3Id: z.number().optional(),
  player4Id: z.number().optional(),
  team1Id: z.number().optional(),
  team2Id: z.number().optional(),
  round: z.string().min(1, "Round is required"),
  courtNumber: z.number().min(1, "Court number is required"),
  maxScore: z.number().min(1, "Score limit is required"),
  sets: z.number().min(1, "Number of sets is required"),
  isGoldenPoint: z.boolean(),
  startTime: z.string(),
});

type CreateMatchFormValues = z.infer<typeof createMatchSchema>;

export default function CreateMatch() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [approvedTournaments, setApprovedTournaments] = useState<Tournament[]>([]);

  const steps = [
    { title: "Select Tournament", description: "Choose a tournament you're approved to referee" },
    { title: "Match Type", description: "Select singles or doubles match" },
    { title: "Select Players", description: "Choose players or teams for the match" },
    { title: "Set Scoring Rules", description: "Configure points, sets and winning format" },
    { title: "Schedule Match", description: "Set time and court details" },
    { title: "Review & Create", description: "Review match details before creating" }
  ];

  const form = useForm<CreateMatchFormValues>({
    resolver: zodResolver(createMatchSchema),
    defaultValues: {
      matchType: "singles",
      maxScore: 11,
      sets: 1,
      isGoldenPoint: false,
      courtNumber: 1,
      startTime: new Date().toISOString().slice(0, 16),
    },
  });

  const watchMatchType = form.watch("matchType");
  const watchTournamentId = form.watch("tournamentId");

  // Ensure that only authenticated referees can access this page
  useEffect(() => {
    if (!isAuthenticated || user?.role !== "REFEREE") {
      router.push("/");
    }
  }, [isAuthenticated, user, router]);

  // Fetch tournaments where the referee is approved
  useEffect(() => {
    const fetchApprovedTournaments = async () => {
      try {
        // Get tournaments where the referee is approved
        const res = await fetch("/api/referees/approved-tournaments", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        
        if (res.ok) {
          const data = await res.json();
          setApprovedTournaments(data.tournaments || []);
          setTournaments(data.tournaments || []);
          
          // Show notification if referee isn't approved for any tournaments
          if (data.tournaments.length === 0) {
            toast.info("You're not approved for any tournaments yet. Please request approval from the tournament admin.");
          }
        } else {
          // Fallback to all tournaments if the approved endpoint fails
          const allTournamentsRes = await fetch("/api/tournaments?status=IN_PROGRESS", {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });
          if (allTournamentsRes.ok) {
            const data = await allTournamentsRes.json();
            setTournaments(data.tournaments);
            toast.warning("Couldn't fetch your approved tournaments. Showing all tournaments instead.");
          }
        }
      } catch (error) {
        console.error("Error fetching tournaments:", error);
        toast.error("Failed to load tournaments");
      }
    };
    fetchApprovedTournaments();
  }, []);

  // Fetch players and teams when a tournament is selected
  useEffect(() => {
    if (!watchTournamentId) return;
    const fetchPlayersAndTeams = async () => {
      try {
        const playersRes = await fetch(
          `/api/tournaments/${watchTournamentId}/players`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        if (playersRes.ok) {
          const data = await playersRes.json();
          setPlayers(data.players);
          setFilteredPlayers(data.players);
        }
        const teamsRes = await fetch(
          `/api/tournaments/${watchTournamentId}/teams`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        if (teamsRes.ok) {
          const data = await teamsRes.json();
          setTeams(data.teams);
        }
      } catch (error) {
        console.error("Error fetching players/teams:", error);
        toast.error("Failed to load players or teams");
      }
    };
    fetchPlayersAndTeams();
  }, [watchTournamentId]);

  // Filter players based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredPlayers(players);
    } else {
      setFilteredPlayers(
        players.filter((player) =>
          player.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
  }, [searchTerm, players]);

  // Navigation functions for steps
  const nextStep = () => {
    const currentValues = form.getValues();
    
    // Validate current step before proceeding
    if (currentStep === 0 && !currentValues.tournamentId) {
      toast.error("Please select a tournament first");
      return;
    }
    
    if (currentStep === 1 && !currentValues.matchType) {
      toast.error("Please select a match type");
      return;
    }
    
    if (currentStep === 2) {
      const isValid = validatePlayerSelection(currentValues);
      if (!isValid) return;
    }
    
    if (currentStep === 3) {
      const isValid = validateScoringRules(currentValues);
      if (!isValid) return;
    }
    
    if (currentStep === 4) {
      const isValid = validateSchedule(currentValues);
      if (!isValid) return;
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Validation helpers
  const validatePlayerSelection = (values: CreateMatchFormValues) => {
    if (values.matchType === "singles") {
      if (!values.player1Id || !values.player2Id) {
        toast.error("Please select both players");
        return false;
      }
      if (values.player1Id === values.player2Id) {
        toast.error("Player 1 and Player 2 cannot be the same");
        return false;
      }
    } else { // doubles
      if (teams.length > 0) {
        if (!values.team1Id || !values.team2Id) {
          toast.error("Please select both teams");
          return false;
        }
        if (values.team1Id === values.team2Id) {
          toast.error("Team 1 and Team 2 cannot be the same");
          return false;
        }
      } else {
        if (!values.player1Id || !values.player2Id || !values.player3Id || !values.player4Id) {
          toast.error("Please select all four players");
          return false;
        }
        const players = [values.player1Id, values.player2Id, values.player3Id, values.player4Id];
        const uniquePlayers = new Set(players);
        if (uniquePlayers.size !== 4) {
          toast.error("All players must be different");
          return false;
        }
      }
    }
    return true;
  };

  const validateScoringRules = (values: CreateMatchFormValues) => {
    if (!values.maxScore || values.maxScore < 1) {
      toast.error("Points to win must be at least 1");
      return false;
    }
    if (!values.sets || values.sets < 1 || values.sets > 5) {
      toast.error("Number of sets must be between 1 and 5");
      return false;
    }
    return true;
  };

  const validateSchedule = (values: CreateMatchFormValues) => {
    if (!values.round) {
      toast.error("Please enter a round");
      return false;
    }
    if (!values.courtNumber || values.courtNumber < 1) {
      toast.error("Court number must be at least 1");
      return false;
    }
    if (!values.startTime) {
      toast.error("Please select a start time");
      return false;
    }
    return true;
  };

  const onSubmit = async (values: CreateMatchFormValues) => {
    // Only submit when we reach the final step
    if (currentStep < steps.length - 1) {
      nextStep();
      return;
    }
    
    setLoading(true);
    try {
      const matchData: any = {
        tournamentId: values.tournamentId,
        round: values.round,
        maxScore: values.maxScore,
        sets: values.sets,
        isGoldenPoint: values.isGoldenPoint,
        courtNumber: values.courtNumber,
        startTime: values.startTime,
        refereeId: user?.id,
      };

      // Handle match data based on match type
      if (values.matchType === "singles") {
        Object.assign(matchData, {
          player1Id: values.player1Id,
          player2Id: values.player2Id,
        });
      } else {
        if (teams.length > 0) {
          // Use pre-defined teams if available
          Object.assign(matchData, {
            team1Id: values.team1Id,
            team2Id: values.team2Id,
          });
        } else {
          // Ad-hoc doubles match: select individual players
          Object.assign(matchData, {
            player1Id: values.player1Id,
            player2Id: values.player2Id,
            player3Id: values.player3Id,
            player4Id: values.player4Id,
            isDoubles: true,
          });
        }
      }

      const res = await fetch(
        `/api/tournaments/${values.tournamentId}/matches`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(matchData),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to create match");
      }

      const createdMatch = await res.json();
      toast.success("Match created successfully");
      router.push(`/referee/live-scoring/${createdMatch.id}`);
    } catch (error) {
      console.error("Error creating match:", error);
      toast.error("Failed to create match");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto my-8">
      <CardHeader>
        <CardTitle className="text-2xl text-[#00a1e0]">Create Match</CardTitle>
        <CardDescription>Set up a new match to referee</CardDescription>
      </CardHeader>
      
      {/* Step indicators */}
      <div className="px-6 mb-4">
        <div className="flex justify-between items-center">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className={`flex flex-col items-center ${index > 0 ? 'ml-2' : ''}`}
              style={{ width: `${100 / steps.length}%` }}
            >
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  index < currentStep 
                    ? 'bg-green-500 text-white' 
                    : index === currentStep 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {index < currentStep ? '✓' : index + 1}
              </div>
              <div className="text-xs text-center mt-1 hidden sm:block">
                {step.title}
              </div>
            </div>
          ))}
        </div>
        <div className="relative mt-2">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200"></div>
          <div 
            className="absolute top-0 left-0 h-1 bg-blue-500 transition-all"
            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          ></div>
        </div>
      </div>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Current step title and description */}
            <div className="mb-4">
              <h3 className="text-lg font-medium">{steps[currentStep].title}</h3>
              <p className="text-sm text-gray-500">{steps[currentStep].description}</p>
            </div>
            
            {/* Step 1: Tournament Selection */}
            {currentStep === 0 && (
              <FormField
                control={form.control}
                name="tournamentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tournament</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select tournament" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tournaments.map((tournament) => (
                          <SelectItem
                            key={tournament.id}
                            value={tournament.id.toString()}
                          >
                            {tournament.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                    {tournaments.length === 0 && (
                      <div className="text-yellow-600 text-sm mt-2">
                        You haven't been approved for any tournaments yet. Please contact the tournament admin.
                      </div>
                    )}
                  </FormItem>
                )}
              />
            )}

            {/* Step 2: Match Type */}
            {currentStep === 1 && (
              <FormField
                control={form.control}
                name="matchType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Match Type</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="singles" id="singles" />
                          <Label htmlFor="singles" className="font-normal">
                            Singles
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="doubles" id="doubles" />
                          <Label htmlFor="doubles" className="font-normal">
                            Doubles
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Step 3: Player Selection */}
            {currentStep === 2 && watchTournamentId && (
              <div className="space-y-4">
                <div className="mb-4">
                  <Label>Search Players</Label>
                  <Input
                    placeholder="Search by player name"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mt-1"
                  />
                </div>
                {watchMatchType === "singles" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="player1Id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Player 1</FormLabel>
                          <Select
                            onValueChange={(value) =>
                              field.onChange(parseInt(value))
                            }
                            defaultValue={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select player 1" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {filteredPlayers.map((player) => (
                                <SelectItem
                                  key={player.id}
                                  value={player.id.toString()}
                                >
                                  {player.name}{" "}
                                  {player.skillLevel &&
                                    `(${player.skillLevel})`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="player2Id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Player 2</FormLabel>
                          <Select
                            onValueChange={(value) =>
                              field.onChange(parseInt(value))
                            }
                            defaultValue={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select player 2" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {filteredPlayers.map((player) => (
                                <SelectItem
                                  key={player.id}
                                  value={player.id.toString()}
                                >
                                  {player.name}{" "}
                                  {player.skillLevel &&
                                    `(${player.skillLevel})`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ) : teams.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="team1Id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Team 1</FormLabel>
                          <Select
                            onValueChange={(value) =>
                              field.onChange(parseInt(value))
                            }
                            defaultValue={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select team 1" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {teams.map((team) => (
                                <SelectItem
                                  key={team.id}
                                  value={team.id.toString()}
                                >
                                  {team.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="team2Id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Team 2</FormLabel>
                          <Select
                            onValueChange={(value) =>
                              field.onChange(parseInt(value))
                            }
                            defaultValue={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select team 2" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {teams.map((team) => (
                                <SelectItem
                                  key={team.id}
                                  value={team.id.toString()}
                                >
                                  {team.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Team 1</h4>
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="player1Id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Player 1</FormLabel>
                              <Select
                                onValueChange={(value) =>
                                  field.onChange(parseInt(value))
                                }
                                defaultValue={field.value?.toString()}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select player 1" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {filteredPlayers.map((player) => (
                                    <SelectItem
                                      key={player.id}
                                      value={player.id.toString()}
                                    >
                                      {player.name}{" "}
                                      {player.skillLevel &&
                                        `(${player.skillLevel})`}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="player2Id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Player 2</FormLabel>
                              <Select
                                onValueChange={(value) =>
                                  field.onChange(parseInt(value))
                                }
                                defaultValue={field.value?.toString()}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select player 2" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {filteredPlayers.map((player) => (
                                    <SelectItem
                                      key={player.id}
                                      value={player.id.toString()}
                                    >
                                      {player.name}{" "}
                                      {player.skillLevel &&
                                        `(${player.skillLevel})`}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Team 2</h4>
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="player3Id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Player 3</FormLabel>
                              <Select
                                onValueChange={(value) =>
                                  field.onChange(parseInt(value))
                                }
                                defaultValue={field.value?.toString()}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select player 3" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {filteredPlayers.map((player) => (
                                    <SelectItem
                                      key={player.id}
                                      value={player.id.toString()}
                                    >
                                      {player.name}{" "}
                                      {player.skillLevel &&
                                        `(${player.skillLevel})`}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="player4Id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Player 4</FormLabel>
                              <Select
                                onValueChange={(value) =>
                                  field.onChange(parseInt(value))
                                }
                                defaultValue={field.value?.toString()}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select player 4" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {filteredPlayers.map((player) => (
                                    <SelectItem
                                      key={player.id}
                                      value={player.id.toString()}
                                    >
                                      {player.name}{" "}
                                      {player.skillLevel &&
                                        `(${player.skillLevel})`}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Scoring Rules */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Scoring Rules</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="maxScore"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Points to Win</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormDescription>Usually 11 or 21</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sets"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Sets</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="5"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormDescription>Usually 1, 3, or 5</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isGoldenPoint"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Winning Format</FormLabel>
                        <div className="flex items-center space-x-2 mt-2">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={(e) => field.onChange(e.target.checked)}
                              id="isGoldenPoint"
                              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                            />
                          </FormControl>
                          <Label htmlFor="isGoldenPoint">Golden Point</Label>
                        </div>
                        <FormDescription>
                          If checked, win by 1 point; if unchecked, win by 2
                          (deuce).
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Step 5: Schedule */}
            {currentStep === 4 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="round"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Round</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Quarterfinal" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="courtNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Court Number</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem className="col-span-1 md:col-span-2">
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 6: Review */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Review Match Details</h3>
                <div className="bg-gray-50 p-4 rounded-md space-y-3">
                  {form.getValues().tournamentId && (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="font-medium">Tournament:</div>
                      <div className="col-span-2">{tournaments.find(t => t.id === form.getValues().tournamentId)?.name}</div>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="font-medium">Match Type:</div>
                    <div className="col-span-2">{form.getValues().matchType === 'singles' ? 'Singles' : 'Doubles'}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="font-medium">Players:</div>
                    <div className="col-span-2">
                      {form.getValues().matchType === 'singles' ? (
                        <>
                          {filteredPlayers.find(p => p.id === form.getValues().player1Id)?.name} vs {filteredPlayers.find(p => p.id === form.getValues().player2Id)?.name}
                        </>
                      ) : teams.length > 0 ? (
                        <>
                          {teams.find(t => t.id === form.getValues().team1Id)?.name} vs {teams.find(t => t.id === form.getValues().team2Id)?.name}
                        </>
                      ) : (
                        <>
                          Team 1: {filteredPlayers.find(p => p.id === form.getValues().player1Id)?.name}, {filteredPlayers.find(p => p.id === form.getValues().player2Id)?.name}<br/>
                          Team 2: {filteredPlayers.find(p => p.id === form.getValues().player3Id)?.name}, {filteredPlayers.find(p => p.id === form.getValues().player4Id)?.name}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="font-medium">Scoring:</div>
                    <div className="col-span-2">
                      {form.getValues().maxScore} points to win, {form.getValues().sets} set(s), {form.getValues().isGoldenPoint ? 'Golden Point' : 'Win by 2 (Deuce)'}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="font-medium">Round & Court:</div>
                    <div className="col-span-2">{form.getValues().round}, Court #{form.getValues().courtNumber}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="font-medium">Start Time:</div>
                    <div className="col-span-2">{new Date(form.getValues().startTime).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            )}
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={currentStep === 0 ? () => router.back() : prevStep}
          disabled={loading}
        >
          {currentStep === 0 ? 'Cancel' : 'Previous'}
        </Button>
        <Button 
          onClick={form.handleSubmit(onSubmit)} 
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="mr-2">Loading...</span>
            </>
          ) : currentStep === steps.length - 1 ? (
            'Create Match'
          ) : (
            'Next'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
