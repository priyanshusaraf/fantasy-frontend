// src/components/fantasy-pickleball/TeamCreationForm.tsx
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
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Filter,
  Search,
  Star,
  StarOff,
  AlertCircle,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";

interface Player {
  id: number;
  name: string;
  imageUrl?: string;
  skillLevel?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "PROFESSIONAL";
  country?: string;
  price: number;
}

interface TeamCreationFormProps {
  contestId: string;
}

export default function TeamCreationForm({ contestId }: TeamCreationFormProps) {
  const router = useRouter();
  const [teamName, setTeamName] = useState("My Fantasy Team");
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [captain, setCaptain] = useState<number | null>(null);
  const [viceCaptain, setViceCaptain] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortCriteria, setSortCriteria] = useState<"name" | "price">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [filterSkillLevel, setFilterSkillLevel] = useState<string | null>(null);
  const [walletSize, setWalletSize] = useState(100000);
  const [maxTeamSize, setMaxTeamSize] = useState(7);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const remainingBudget =
    walletSize - selectedPlayers.reduce((total, p) => total + p.price, 0);

  useEffect(() => {
    const fetchContestDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/fantasy-pickleball/contests/${contestId}/players`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch contest details");
        }

        const data = await response.json();
        setAvailablePlayers(data.players);
        setWalletSize(data.walletSize || 100000);
        setMaxTeamSize(data.maxTeamSize || 7);
      } catch (error) {
        console.error("Error fetching contest details:", error);
        setError(
          error instanceof Error ? error.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchContestDetails();
  }, [contestId]);

  const filteredPlayers = availablePlayers
    .filter(
      (player) =>
        player.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (filterSkillLevel ? player.skillLevel === filterSkillLevel : true)
    )
    .sort((a, b) => {
      if (sortCriteria === "name") {
        return sortDirection === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else {
        return sortDirection === "asc" ? a.price - b.price : b.price - a.price;
      }
    });

  const toggleSort = (criteria: "name" | "price") => {
    if (sortCriteria === criteria) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortCriteria(criteria);
      setSortDirection("asc");
    }
  };

  const handleSelectPlayer = (player: Player) => {
    if (selectedPlayers.length >= maxTeamSize) {
      toast("You can select a maximum of " + maxTeamSize + " players");
      return;
    }

    if (player.price > remainingBudget) {
      toast("You don't have enough budget to add this player");
      return;
    }

    setSelectedPlayers([...selectedPlayers, player]);
  };

  const handleRemovePlayer = (playerId: number) => {
    setSelectedPlayers(selectedPlayers.filter((p) => p.id !== playerId));

    if (captain === playerId) {
      setCaptain(null);
    }

    if (viceCaptain === playerId) {
      setViceCaptain(null);
    }
  };

  const handleSetCaptain = (playerId: number) => {
    if (viceCaptain === playerId) {
      setViceCaptain(null);
    }
    setCaptain(playerId);
  };

  const handleSetViceCaptain = (playerId: number) => {
    if (captain === playerId) {
      setCaptain(null);
    }
    setViceCaptain(playerId);
  };

  const handleCreateTeam = async () => {
    if (selectedPlayers.length < maxTeamSize) {
      toast(`Please select ${maxTeamSize} players to create your team`);
      return;
    }

    if (captain === null) {
      toast("Please select a captain for your team");
      return;
    }

    if (viceCaptain === null) {
      toast("Please select a vice captain for your team");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        `/api/fantasy-pickleball/contests/${contestId}/join`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            name: teamName,
            players: selectedPlayers.map((p) => p.id),
            captain,
            viceCaptain,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create team");
      }

      toast("Your fantasy team has been created successfully!");
      router.push(`/fantasy/contests/${contestId}`);
    } catch (error) {
      console.error("Error creating team:", error);
      toast(error instanceof Error ? error.message : "Failed to create team");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading contest details...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-md">
        <p className="font-bold">Error:</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-[#00a1e0]">
          Create Your Fantasy Team
        </CardTitle>
        <CardDescription>
          Select players, set a captain and vice captain
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Side - Player Selection */}
          <div className="md:col-span-2">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="search"
                    placeholder="Search players..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <Button variant="outline" size="sm" className="gap-1">
                  <Filter className="h-4 w-4" />
                  Filter
                </Button>
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                {["PROFESSIONAL", "ADVANCED", "INTERMEDIATE", "BEGINNER"].map(
                  (level) => (
                    <Badge
                      key={level}
                      variant={
                        filterSkillLevel === level ? "default" : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() =>
                        setFilterSkillLevel(
                          filterSkillLevel === level ? null : level
                        )
                      }
                    >
                      {level.toLowerCase()}
                    </Badge>
                  )
                )}
              </div>

              <div className="flex justify-between mb-4 text-sm">
                <button
                  className="flex items-center space-x-1 text-gray-700 hover:text-[#00a1e0]"
                  onClick={() => toggleSort("name")}
                >
                  <span>Name</span>
                  {sortCriteria === "name" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    ))}
                </button>

                <button
                  className="flex items-center space-x-1 text-gray-700 hover:text-[#00a1e0]"
                  onClick={() => toggleSort("price")}
                >
                  <span>Price</span>
                  {sortCriteria === "price" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    ))}
                </button>
              </div>
            </div>

            <div className="h-[60vh] overflow-y-auto pr-1 border rounded-md p-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredPlayers.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-gray-300"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{player.name}</p>
                      <div className="flex items-center mt-1 space-x-2">
                        {player.country && (
                          <span className="text-xs text-gray-500">
                            {player.country}
                          </span>
                        )}
                        {player.skillLevel && (
                          <Badge variant="secondary">
                            {player.skillLevel.toLowerCase()}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-medium">
                        ₹{player.price.toLocaleString()}
                      </p>
                      <Button
                        variant="default"
                        size="sm"
                        className="mt-1 bg-[#00a1e0] hover:bg-[#0072a3]"
                        onClick={() => handleSelectPlayer(player)}
                        disabled={
                          selectedPlayers.some((p) => p.id === player.id) ||
                          player.price > remainingBudget
                        }
                      >
                        {selectedPlayers.some((p) => p.id === player.id)
                          ? "Selected"
                          : "Select"}
                      </Button>
                    </div>
                  </div>
                ))}

                {filteredPlayers.length === 0 && (
                  <div className="col-span-2 text-center py-10 text-gray-500">
                    No players found matching your criteria.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Team Summary */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Your Team</CardTitle>
                <CardDescription>
                  {selectedPlayers.length}/{maxTeamSize} players selected
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="team-name">Team Name</Label>
                  <Input
                    id="team-name"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="flex justify-between text-sm">
                  <span>Wallet Size:</span>
                  <span className="font-medium">
                    ₹{walletSize.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span>Spent:</span>
                  <span className="font-medium">
                    ₹{(walletSize - remainingBudget).toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span>Remaining Budget:</span>
                  <span
                    className={`font-medium ${
                      remainingBudget < 10000
                        ? "text-red-500"
                        : "text-green-500"
                    }`}
                  >
                    ₹{remainingBudget.toLocaleString()}
                  </span>
                </div>

                <div className="border-t pt-4">
                  <Label className="block mb-2">Selected Players</Label>

                  {selectedPlayers.length === 0 ? (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No players selected yet
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                      {selectedPlayers.map((player) => (
                        <div
                          key={player.id}
                          className="flex items-center justify-between p-2 rounded-md border"
                        >
                          <div>
                            <p className="text-sm font-medium">{player.name}</p>
                            <p className="text-xs text-gray-500">
                              ₹{player.price.toLocaleString()}
                            </p>
                          </div>

                          <div className="flex items-center space-x-1">
                            <Button
                              variant={
                                captain === player.id ? "default" : "outline"
                              }
                              size="sm"
                              className={
                                captain === player.id
                                  ? "bg-[#00a1e0] hover:bg-[#0072a3]"
                                  : ""
                              }
                              onClick={() => handleSetCaptain(player.id)}
                              title="Set as Captain"
                            >
                              <Star className="h-4 w-4" />
                              <span className="sr-only">Captain</span>
                            </Button>

                            <Button
                              variant={
                                viceCaptain === player.id
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              className={
                                viceCaptain === player.id
                                  ? "bg-[#00a1e0] hover:bg-[#0072a3]"
                                  : ""
                              }
                              onClick={() => handleSetViceCaptain(player.id)}
                              title="Set as Vice Captain"
                            >
                              <StarOff className="h-4 w-4" />
                              <span className="sr-only">Vice Captain</span>
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleRemovePlayer(player.id)}
                              title="Remove Player"
                            >
                              ×
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Captain/Vice-Captain explanation */}
                  <div className="mt-4 bg-gray-50 p-3 rounded-md text-sm">
                    <div className="flex items-start">
                      <AlertCircle className="h-4 w-4 text-[#00a1e0] mt-1 mr-2 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Remember to select:</p>
                        <ul className="list-disc pl-5 mt-1 space-y-1">
                          <li>A Captain (2x points)</li>
                          <li>A Vice Captain (1.5x points)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-[#00a1e0] hover:bg-[#0072a3]"
                  onClick={handleCreateTeam}
                  disabled={
                    submitting ||
                    selectedPlayers.length !== maxTeamSize ||
                    captain === null ||
                    viceCaptain === null
                  }
                >
                  {submitting ? "Creating Team..." : "Create Team"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
