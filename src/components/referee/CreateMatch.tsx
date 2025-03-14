// src/components/referee/CreateMatch.tsx
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
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
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
}

// Form schema
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
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

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

  // Fetch tournaments and players
  useEffect(() => {
    if (!isAuthenticated || user?.role !== "REFEREE") {
      router.push("/");
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch tournaments
        const tournamentsResponse = await fetch(
          "/api/tournaments?status=IN_PROGRESS",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (tournamentsResponse.ok) {
          const data = await tournamentsResponse.json();
          setTournaments(data.tournaments);
        }
      } catch (error) {
        console.error("Error fetching tournaments:", error);
        toast.error("Failed to load tournaments");
      }
    };

    fetchData();
  }, [isAuthenticated, user, router]);

  // Fetch players when tournament is selected
  useEffect(() => {
    if (!watchTournamentId) return;

    const fetchPlayers = async () => {
      try {
        const playersResponse = await fetch(
          `/api/tournaments/${watchTournamentId}/players`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (playersResponse.ok) {
          const data = await playersResponse.json();
          setPlayers(data.players);
          setFilteredPlayers(data.players);
        }

        // Fetch teams if available
        const teamsResponse = await fetch(
          `/api/tournaments/${watchTournamentId}/teams`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (teamsResponse.ok) {
          const data = await teamsResponse.json();
          setTeams(data.teams);
        }
      } catch (error) {
        console.error("Error fetching players:", error);
        toast.error("Failed to load players");
      }
    };

    fetchPlayers();
  }, [watchTournamentId]);

  // Filter players based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredPlayers(players);
    } else {
      const filtered = players.filter((player) =>
        player.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPlayers(filtered);
    }
  }, [searchTerm, players]);

  const onSubmit = async (values: CreateMatchFormValues) => {
    setLoading(true);
    try {
      // Format data based on match type
      const matchData = {
        tournamentId: values.tournamentId,
        round: values.round,
        maxScore: values.maxScore,
        sets: values.sets,
        isGoldenPoint: values.isGoldenPoint,
        courtNumber: values.courtNumber,
        startTime: values.startTime,
        refereeId: user?.id, // Current referee
      };

      // Add player or team data based on match type
      if (values.matchType === "singles") {
        Object.assign(matchData, {
          player1Id: values.player1Id,
          player2Id: values.player2Id,
        });
      } else {
        if (teams.length > 0) {
          // Using pre-defined teams
          Object.assign(matchData, {
            team1Id: values.team1Id,
            team2Id: values.team2Id,
          });
        } else {
          // Creating ad-hoc teams for doubles match
          // This would require additional backend support to create temporary teams
          Object.assign(matchData, {
            player1Id: values.player1Id,
            player2Id: values.player2Id,
            player3Id: values.player3Id,
            player4Id: values.player4Id,
            isDoubles: true,
          });
        }
      }

      const response = await fetch(
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

      if (!response.ok) {
        throw new Error("Failed to create match");
      }

      const createdMatch = await response.json();
      toast.success("Match created successfully");

      // Redirect to live scoring page for the new match
      router.push(`/referee/live-scoring/${createdMatch.id}`);
    } catch (error) {
      console.error("Error creating match:", error);
      toast.error("Failed to create match");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-[#00a1e0]">Create Match</CardTitle>
        <CardDescription>Set up a new match to referee</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Tournament Selection */}
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
                </FormItem>
              )}
            />

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
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="singles" />
                        </FormControl>
                        <FormLabel className="font-normal">Singles</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="doubles" />
                        </FormControl>
                        <FormLabel className="font-normal">Doubles</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Player Selection */}
            {watchTournamentId && (
              <div className="space-y-4">
                <div>
                  <Label>Search Players</Label>
                  <Input
                    placeholder="Search by player name"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mb-4"
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
                  // If teams are available, select teams
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
                  // If no teams are available, select individual players for doubles
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

            {/* Match Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="round"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Round</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Quarterfinal, Round 1"
                        {...field}
                      />
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
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              id="isGoldenPoint"
                              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                            />
                            <label htmlFor="isGoldenPoint">Golden Point</label>
                          </div>
                        </FormControl>
                      </div>
                      <FormDescription>
                        If checked, win by 1 point. If unchecked, win by 2
                        points (deuce).
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
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Match"}
        </Button>
      </CardFooter>
    </Card>
  );
}
