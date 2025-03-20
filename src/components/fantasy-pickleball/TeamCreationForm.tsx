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
  Loader2,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Player {
  id: number;
  name: string;
  imageUrl?: string;
  skillLevel?: string;
  country?: string;
  price: number;
}

interface TeamCreationFormProps {
  contestId: string;
}

export default function TeamCreationForm({ contestId }: TeamCreationFormProps) {
  const router = useRouter();
  const { toast } = useToast();
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
    const fetchPlayers = async () => {
      setLoading(true);
      setError("");
      
      try {
        console.log(`Fetching players for contest ID: ${contestId}`);
        const response = await fetch(`/api/fantasy-pickleball/contests/${contestId}/players`);
        
        console.log("Player API response status:", response.status);
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Failed to fetch players:", errorText);
          throw new Error(`Failed to fetch players: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`Fetched ${data.players?.length || 0} players with walletSize: ${data.walletSize}, maxTeamSize: ${data.maxTeamSize}`);
        
        // Check if player data is valid
        if (!data.players || !Array.isArray(data.players) || data.players.length === 0) {
          setError("No players available for this contest");
          setAvailablePlayers([]);
          setWalletSize(data.walletSize || 100000);
          setMaxTeamSize(data.maxTeamSize || 7);
          setError(null);
          setLoading(false);
          return;
        }
        
        setAvailablePlayers(data.players);
        setWalletSize(data.walletSize || 100000);
        setMaxTeamSize(data.maxTeamSize || 7);
      } catch (error) {
        console.error("Error fetching players:", error);
        setError("Failed to load players. Please try again later.");
        setAvailablePlayers([]);
      } finally {
        setLoading(false);
      }
    };

    if (contestId) {
      fetchPlayers();
    }
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
      toast({
        title: "Team Full",
        description: `You can select a maximum of ${maxTeamSize} players`,
        variant: "destructive"
      });
      return;
    }

    if (player.price > remainingBudget) {
      toast({
        title: "Insufficient Budget",
        description: "You don't have enough budget to add this player",
        variant: "destructive"
      });
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

  const logApiDetails = (method: string, url: string, data?: any, response?: Response) => {
    const timestamp = new Date().toISOString();
    console.group(`[${timestamp}] API ${method} Request to ${url}`);
    
    if (data) {
      console.log('Request Payload:', data);
    }
    
    if (response) {
      console.log('Response Status:', response.status, response.statusText);
      console.log('Response Headers:', Object.fromEntries([...response.headers.entries()]));
    }
    
    console.groupEnd();
  };

  // Calculate player price based on skill level
  const getPlayerPrice = (skillLevel: string) => {
    switch (skillLevel) {
      case 'A+':
        return 12000;
      case 'A':
        return 11500;
      case 'A-':
        return 11000;
      case 'B+':
        return 10500;
      case 'B':
        return 10000;
      case 'B-':
        return 9500;
      case 'C':
        return 9000;
      case 'D':
        return 9000;
      default:
        return 9000;
    }
  };

  const handleCreateTeam = async () => {
    // Check if players have been loaded
    if (availablePlayers.length === 0) {
      toast({
        title: "No Players Available",
        description: "Cannot create a team because no players are available for this contest",
        variant: "destructive"
      });
      return;
    }
    
    if (selectedPlayers.length < maxTeamSize) {
      toast({
        title: "Team Incomplete",
        description: `Please select ${maxTeamSize} players to create your team`,
        variant: "destructive"
      });
      return;
    }

    if (captain === null) {
      toast({
        title: "Captain Required",
        description: "Please select a captain for your team",
        variant: "destructive"
      });
      return;
    }

    if (viceCaptain === null) {
      toast({
        title: "Vice Captain Required",
        description: "Please select a vice captain for your team",
        variant: "destructive"
      });
      return;
    }

    if (captain === viceCaptain) {
      toast({
        title: "Invalid Selection",
        description: "Captain and vice captain must be different players",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      // Check if team name is provided
      if (!teamName.trim()) {
        toast({
          title: "Team Name Required",
          description: "Please provide a name for your team",
          variant: "destructive"
        });
        setSubmitting(false);
        return;
      }

      const requestPayload = {
        name: teamName,
        players: selectedPlayers.map((p) => p.id),
        captain,
        viceCaptain,
      };
      
      console.log("Submitting team creation request:", {
        contestId,
        teamName,
        playerCount: selectedPlayers.length,
        hasCaptain: captain !== null,
        hasViceCaptain: viceCaptain !== null,
        playerIds: selectedPlayers.map(p => p.id),
        captainId: captain,
        viceCaptainId: viceCaptain
      });
      
      const apiUrl = `/api/fantasy-pickleball/contests/${contestId}/join`;
      logApiDetails('POST', apiUrl, requestPayload);
      console.log(`Sending team creation POST request to: ${apiUrl}`);
      
      try {
        const response = await fetch(
          apiUrl,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestPayload),
            credentials: "include"
          }
        );

        logApiDetails('POST', apiUrl, requestPayload, response);
        
        // Try to parse response regardless of status
        let responseData;
        let responseText = "";
        try {
          responseText = await response.text();
          console.log("Raw API response:", responseText);
          responseData = responseText ? JSON.parse(responseText) : {};
        } catch (parseError) {
          console.error("Error parsing response:", parseError);
          console.error("Raw response text:", responseText);
          responseData = { message: "Failed to parse server response" };
        }
        
        console.log("API Response Data:", responseData);
        
        if (!response.ok) {
          // Get detailed error message
          const errorDetails = responseData?.details ? 
            JSON.stringify(responseData.details) : 
            JSON.stringify(responseData);
            
          console.error("Team creation failed:", {
            status: response.status,
            statusText: response.statusText,
            data: responseData,
            details: errorDetails,
            headers: Object.fromEntries([...response.headers.entries()])
          });
          
          // Display a more specific error message
          let errorMessage = "Failed to create team";
          
          if (responseData?.message) {
            errorMessage = responseData.message;
          } else if (responseData?.error) {
            errorMessage = responseData.error;
          } else if (response.status === 401) {
            errorMessage = "Authentication error. Please log in again.";
          } else if (response.status === 400) {
            errorMessage = "Invalid request. Please check your team selection.";
          } else if (response.status === 500) {
            errorMessage = "Server error. Please try again later.";
          } else {
            errorMessage = `Error (${response.status}): Failed to create team`;
          }
            
          toast({
            title: "Team Creation Failed",
            description: errorMessage,
            variant: "destructive"
          });
          
          setError(errorMessage);
          setSubmitting(false);
          throw new Error(`Team Creation Failed: ${errorMessage}`);
        }

        // Success case
        console.log("Team created successfully:", responseData);
        setError("");
        
        toast({
          title: "Success",
          description: "Your fantasy team has been created successfully!",
          variant: "default"
        });
        
        // Add a delay before redirecting to ensure toast is seen
        setTimeout(() => {
          router.push(`/fantasy/contests/${contestId}`);
        }, 2000);
      } catch (fetchError) {
        console.error("Fetch error:", fetchError);
        throw fetchError;
      }
    } catch (error) {
      console.error("Error creating team:", error);
      setSubmitting(false);
      
      // Only show a toast if it hasn't already been shown (for cases where we explicitly threw an error above)
      if (!(error instanceof Error && error.message.includes("Team Creation Failed"))) {
        const errorMessage = error instanceof Error ? error.message : "Failed to create team";
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        });
        setError(errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-white">Loading contest details...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-900/30 text-red-300 rounded-md border border-red-800">
        <p className="font-bold">Error:</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-6xl mx-auto bg-gray-800 border-gray-700 text-white">
      <CardHeader>
        <CardTitle className="text-2xl text-indigo-400">
          Create Your Fantasy Team
        </CardTitle>
        <CardDescription className="text-gray-400">
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
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Search players..."
                    className="pl-8 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <Button variant="outline" size="sm" className="gap-1 border-gray-700 text-gray-300 hover:bg-gray-700">
                  <Filter className="h-4 w-4" />
                  Filter
                </Button>
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                {["A+", "A", "A-", "B+", "B", "B-", "C", "D"].map(
                  (level) => (
                    <Badge
                      key={level}
                      variant={
                        filterSkillLevel === level ? "default" : "outline"
                      }
                      className={`cursor-pointer ${
                        filterSkillLevel === level 
                          ? "bg-indigo-600 hover:bg-indigo-700 text-white" 
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600 border-gray-600"
                      }`}
                      onClick={() =>
                        setFilterSkillLevel(
                          filterSkillLevel === level ? null : level
                        )
                      }
                    >
                      {level}
                    </Badge>
                  )
                )}
              </div>

              <div className="flex justify-between mb-4 text-sm">
                <button
                  className="flex items-center space-x-1 text-gray-400 hover:text-indigo-400"
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
                  className="flex items-center space-x-1 text-gray-400 hover:text-indigo-400"
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

            <div className="h-[60vh] overflow-y-auto pr-1 border border-gray-700 rounded-md p-2 bg-gray-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredPlayers.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center p-3 rounded-lg border border-gray-700 hover:border-indigo-500 bg-gray-800"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{player.name}</p>
                      <div className="flex items-center mt-1 space-x-2">
                        {player.country && (
                          <span className="text-xs text-gray-400">
                            {player.country}
                          </span>
                        )}
                        {player.skillLevel && (
                          <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                            {player.skillLevel}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-medium text-indigo-400">
                        ₹{player.price.toLocaleString()}
                      </p>
                      <Button
                        variant="default"
                        size="sm"
                        className="mt-1 bg-indigo-600 hover:bg-indigo-700 text-white"
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
                  <div className="col-span-2 text-center py-10 text-gray-400">
                    No players found matching your criteria.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Team Summary */}
          <div className="md:col-span-1">
            <Card className="bg-gray-800 border-gray-700 text-white">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-white">Your Team</CardTitle>
                <CardDescription className="text-gray-400">
                  {selectedPlayers.length}/{maxTeamSize} players selected
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="team-name" className="text-white">Team Name</Label>
                  <Input
                    id="team-name"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="mt-1 bg-gray-700 border-gray-600 text-white"
                  />
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Wallet Size:</span>
                  <span className="font-medium text-white">
                    ₹{walletSize.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Spent:</span>
                  <span className="font-medium text-white">
                    ₹{(walletSize - remainingBudget).toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Remaining Budget:</span>
                  <span
                    className={`font-medium ${
                      remainingBudget < 10000
                        ? "text-red-400"
                        : "text-green-400"
                    }`}
                  >
                    ₹{remainingBudget.toLocaleString()}
                  </span>
                </div>

                <div className="border-t border-gray-700 pt-4">
                  <Label className="block mb-2 text-white">Selected Players</Label>

                  {selectedPlayers.length === 0 ? (
                    <div className="text-center py-4 text-gray-400 text-sm">
                      No players selected yet
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                      {selectedPlayers.map((player) => (
                        <div
                          key={player.id}
                          className="flex items-center justify-between p-2 rounded-md border border-gray-700 bg-gray-800"
                        >
                          <div>
                            <p className="text-sm font-medium text-white">{player.name}</p>
                            <p className="text-xs text-gray-400">
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
                                  ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                                  : "border-gray-700 text-gray-300 hover:bg-gray-700"
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
                                  ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                                  : "border-gray-700 text-gray-300 hover:bg-gray-700"
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
                              className="text-red-400 hover:text-red-300 hover:bg-red-900/30 border-gray-700"
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
                  <div className="mt-4 bg-gray-700 p-3 rounded-md text-sm">
                    <div className="flex items-start">
                      <AlertCircle className="h-4 w-4 text-indigo-400 mt-1 mr-2 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-white">Remember to select:</p>
                        <ul className="list-disc pl-5 mt-1 space-y-1 text-gray-300">
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
                  onClick={handleCreateTeam}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                  disabled={submitting || selectedPlayers.length !== maxTeamSize || captain === null || viceCaptain === null}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Team...
                    </>
                  ) : (
                    "Create Team"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
