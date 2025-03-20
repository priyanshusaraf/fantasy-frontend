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
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

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
  status: string;
}

interface Team {
  id: number;
  name: string;
  players: Player[];
}

// Form schema for creating a match
const createMatchSchema = z.object({
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

export default function TournamentCreateMatch({ params }: { params: { id: string } }) {
  const tournamentId = parseInt(params.id);
  const router = useRouter();
  const { data: session, status } = useSession();
  const [tournamentDetails, setTournamentDetails] = useState<Tournament | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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

  // Ensure that only authenticated referees can access this page
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    
    if (status === "authenticated" && session?.user?.role !== "REFEREE") {
      router.push("/dashboard");
      return;
    }
  }, [status, session, router]);

  // Fetch tournament details, players, and teams
  useEffect(() => {
    const fetchTournamentData = async () => {
      try {
        setLoading(true);
        
        // Fetch tournament details
        const tournamentRes = await fetch(`/api/tournaments/${tournamentId}`);
        if (!tournamentRes.ok) {
          throw new Error("Failed to fetch tournament details");
        }
        const tournamentData = await tournamentRes.json();
        setTournamentDetails(tournamentData);
        
        // Check if referee is assigned to this tournament
        const isAssignedRes = await fetch(`/api/referee/tournaments/${tournamentId}/verification`);
        if (!isAssignedRes.ok) {
          toast("You are not authorized to create matches in this tournament");
          router.push("/referee/dashboard");
          return;
        }
        
        // Fetch players in tournament
        const playersRes = await fetch(`/api/tournaments/${tournamentId}/players`);
        if (!playersRes.ok) {
          throw new Error("Failed to fetch tournament players");
        }
        const playersData = await playersRes.json();
        setPlayers(playersData.players || []);
        setFilteredPlayers(playersData.players || []);
        
        // Fetch teams in tournament
        const teamsRes = await fetch(`/api/tournaments/${tournamentId}/teams`);
        if (!teamsRes.ok) {
          throw new Error("Failed to fetch tournament teams");
        }
        const teamsData = await teamsRes.json();
        setTeams(teamsData.teams || []);
        
      } catch (error) {
        console.error("Error fetching tournament data:", error);
        toast("Failed to load tournament data");
      } finally {
        setLoading(false);
      }
    };
    
    if (tournamentId && status === "authenticated") {
      fetchTournamentData();
    }
  }, [tournamentId, status, router]);

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

  const onSubmit = async (values: CreateMatchFormValues) => {
    if (!tournamentId) {
      toast("Tournament ID is required");
      return;
    }
    
    setSubmitting(true);
    try {
      const matchData: any = {
        tournamentId,
        round: values.round,
        maxScore: values.maxScore,
        sets: values.sets,
        isGoldenPoint: values.isGoldenPoint,
        courtNumber: values.courtNumber,
        startTime: values.startTime,
        refereeId: session?.user?.id,
      };

      // Handle match data based on match type
      if (values.matchType === "singles") {
        Object.assign(matchData, {
          player1Id: values.player1Id,
          player2Id: values.player2Id,
          isDoubles: false,
        });
      } else {
        if (teams.length > 0 && values.team1Id && values.team2Id) {
          // Use pre-defined teams
          Object.assign(matchData, {
            team1Id: values.team1Id,
            team2Id: values.team2Id,
            isDoubles: true,
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

      const res = await fetch(`/api/tournaments/${tournamentId}/matches`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(matchData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create match");
      }

      const createdMatch = await res.json();
      toast("Match created successfully");
      router.push(`/referee/live-scoring/${createdMatch.id}`);
    } catch (error: any) {
      console.error("Error creating match:", error);
      toast(error.message || "Failed to create match");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Loading tournament data...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => router.back()}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-[#00a1e0]">
            Create Match in {tournamentDetails?.name}
          </CardTitle>
          <CardDescription>
            Set up a new match for players in this tournament
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Match Type */}
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

              {/* Player or Team Selection */}
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
                            onValueChange={(value) => field.onChange(parseInt(value))}
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
                                  {player.skillLevel && `(${player.skillLevel})`}
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
                            onValueChange={(value) => field.onChange(parseInt(value))}
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
                                  {player.skillLevel && `(${player.skillLevel})`}
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
                            onValueChange={(value) => field.onChange(parseInt(value))}
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
                            onValueChange={(value) => field.onChange(parseInt(value))}
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
                                onValueChange={(value) => field.onChange(parseInt(value))}
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
                                      {player.skillLevel && `(${player.skillLevel})`}
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
                                onValueChange={(value) => field.onChange(parseInt(value))}
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
                                      {player.skillLevel && `(${player.skillLevel})`}
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
                                onValueChange={(value) => field.onChange(parseInt(value))}
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
                                      {player.skillLevel && `(${player.skillLevel})`}
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
                                onValueChange={(value) => field.onChange(parseInt(value))}
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
                                      {player.skillLevel && `(${player.skillLevel})`}
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

              {/* Match Details */}
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
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Scoring Rules */}
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
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
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
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
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
                          If checked, win by 1 point; if unchecked, win by 2 (deuce).
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Schedule */}
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button
            className="bg-[#00a1e0] hover:bg-[#0072a3]"
            onClick={form.handleSubmit(onSubmit)}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Match"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 