"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { AlertCircle, Search, Info, Crown, Star, Trophy, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";

interface Player {
  id: number;
  name: string;
  imageUrl?: string;
  skillLevel: string;
  price: number;
  stats?: {
    tournamentWins: number;
    careerWinRate: number;
    recentForm?: string;
  };
}

interface Contest {
  id: number;
  name: string;
  entryFee: number;
  tournament: {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
  };
  prizePool: number;
  maxEntries: number;
  currentEntries: number;
  status: string;
}

interface SelectedPlayer {
  playerId: number;
  isCaptain: boolean;
  isViceCaptain: boolean;
}

interface PlayerCategory {
  tier: string;
  label: string;
  priceRange: string;
  color: string;
}

const playerCategories: PlayerCategory[] = [
  { tier: "A", label: "Elite", priceRange: "8000-10000", color: "bg-purple-500" },
  { tier: "B", label: "Premium", priceRange: "6000-7900", color: "bg-blue-500" },
  { tier: "C", label: "Standard", priceRange: "4000-5900", color: "bg-green-500" },
  { tier: "D", label: "Budget", priceRange: "2000-3900", color: "bg-yellow-500" },
  { tier: "E", label: "Value", priceRange: "1000-1900", color: "bg-orange-500" },
];

const MAX_TEAM_SIZE = 11;

export default function TeamCreation({ contestId }: { contestId: number }) {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [contest, setContest] = useState<Contest | null>(null);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<SelectedPlayer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [teamName, setTeamName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [budget, setBudget] = useState(100000);
  const [remainingBudget, setRemainingBudget] = useState(100000);
  const [teamComplete, setTeamComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamValid, setTeamValid] = useState(false);
  const [activeTab, setActiveTab] = useState("selection");

  // Fantasy rules modal
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    const fetchContestDetails = async () => {
      try {
        // Fetch contest details
        const contestResponse = await fetch(`/api/fantasy-pickleball/contests/${contestId}`);
        if (!contestResponse.ok) {
          throw new Error("Failed to fetch contest details");
        }
        const contestData = await contestResponse.json();
        setContest(contestData);
        
        // Also set the budget from the contest configuration
        setBudget(contestData.budget || 100000);
        setRemainingBudget(contestData.budget || 100000);

        // Fetch available players for the tournament
        const playersResponse = await fetch(`/api/tournaments/${contestData.tournament.id}/players`);
        if (!playersResponse.ok) {
          throw new Error("Failed to fetch available players");
        }
        
        const playersData = await playersResponse.json();
        
        // Assign prices based on skill level if not already set
        const playersWithPrices = playersData.players.map((player: any) => {
          // Price based on skill level if not already set
          let basePrice = 5000; // Default price
          
          switch(player.skillLevel) {
            case "PROFESSIONAL":
              basePrice = 9000 + Math.floor(Math.random() * 1000);
              break;
            case "ADVANCED":
              basePrice = 7000 + Math.floor(Math.random() * 1000);
              break;
            case "INTERMEDIATE":
              basePrice = 5000 + Math.floor(Math.random() * 1000);
              break;
            case "BEGINNER":
              basePrice = 3000 + Math.floor(Math.random() * 1000);
              break;
            default:
              basePrice = 5000 + Math.floor(Math.random() * 1000);
          }
          
          return {
            ...player,
            price: player.price || basePrice
          };
        });
        
        setAvailablePlayers(playersWithPrices);
        setFilteredPlayers(playersWithPrices);
      } catch (error) {
        setError(error instanceof Error ? error.message : "An error occurred");
        toast.error("Failed to load contest data");
      } finally {
        setLoading(false);
      }
    };

    if (contestId) {
      fetchContestDetails();
    }
  }, [contestId]);

  // Filter players based on search term and selected category
  useEffect(() => {
    let filtered = availablePlayers;
    
    if (searchTerm) {
      filtered = filtered.filter((player) =>
        player.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedCategory) {
      filtered = filtered.filter((player) => {
        const price = player.price;
        const category = playerCategories.find(cat => cat.tier === selectedCategory);
        
        if (category) {
          const [min, max] = category.priceRange.split('-').map(Number);
          return price >= min && price <= max;
        }
        
        return true;
      });
    }
    
    // Exclude already selected players
    filtered = filtered.filter(
      (player) => !selectedPlayers.some((sp) => sp.playerId === player.id)
    );
    
    setFilteredPlayers(filtered);
  }, [availablePlayers, searchTerm, selectedCategory, selectedPlayers]);

  // Validate team composition and set team status
  useEffect(() => {
    const totalPrice = selectedPlayers.reduce((sum, sp) => {
      const player = availablePlayers.find(p => p.id === sp.playerId);
      return sum + (player?.price || 0);
    }, 0);
    
    const remaining = budget - totalPrice;
    setRemainingBudget(remaining);
    
    // Check if team is complete
    const isComplete = selectedPlayers.length === MAX_TEAM_SIZE;
    setTeamComplete(isComplete);
    
    // Check if team is valid (has captain and vice-captain)
    const hasCaptain = selectedPlayers.some(p => p.isCaptain);
    const hasViceCaptain = selectedPlayers.some(p => p.isViceCaptain);
    
    setTeamValid(isComplete && hasCaptain && hasViceCaptain && teamName.trim().length > 0);
  }, [selectedPlayers, budget, availablePlayers, teamName]);

  const handleAddPlayer = (playerId: number) => {
    const player = availablePlayers.find(p => p.id === playerId);
    
    if (!player) return;
    
    // Check if adding this player would exceed the budget
    const totalPrice = selectedPlayers.reduce((sum, sp) => {
      const p = availablePlayers.find(p => p.id === sp.playerId);
      return sum + (p?.price || 0);
    }, 0);
    
    if (totalPrice + player.price > budget) {
      toast.error("Adding this player would exceed your budget");
      return;
    }
    
    // Check if team is already full
    if (selectedPlayers.length >= MAX_TEAM_SIZE) {
      toast.error(`You can only select up to ${MAX_TEAM_SIZE} players`);
      return;
    }
    
    // Add player to selected players
    setSelectedPlayers([
      ...selectedPlayers,
      { playerId, isCaptain: false, isViceCaptain: false }
    ]);
    
    toast.success(`${player.name} added to your team`);
  };

  const handleRemovePlayer = (playerId: number) => {
    setSelectedPlayers(selectedPlayers.filter(p => p.playerId !== playerId));
    
    const player = availablePlayers.find(p => p.id === playerId);
    if (player) {
      toast.info(`${player.name} removed from your team`);
    }
  };

  const handleCaptainSelection = (playerId: number, role: 'captain' | 'viceCaptain') => {
    setSelectedPlayers(selectedPlayers.map(player => {
      // If setting as captain, remove any existing captains
      if (role === 'captain') {
        if (player.playerId === playerId) {
          return { ...player, isCaptain: true, isViceCaptain: false };
        }
        // Remove captain role from other players
        return { ...player, isCaptain: false };
      } 
      // If setting as vice captain, remove any existing vice captains
      else if (role === 'viceCaptain') {
        if (player.playerId === playerId) {
          return { ...player, isViceCaptain: true, isCaptain: false };
        }
        // Remove vice captain role from other players
        return { ...player, isViceCaptain: false };
      }
      return player;
    }));
  };

  const handleCategorySelect = (tier: string) => {
    if (selectedCategory === tier) {
      setSelectedCategory(null); // Toggle off if already selected
    } else {
      setSelectedCategory(tier);
    }
  };

  const handleCreateTeam = async () => {
    if (!teamValid) {
      toast.error("Please complete your team before submitting");
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Prepare team data for submission
      const teamData = {
        name: teamName,
        contestId,
        players: selectedPlayers.map(player => ({
          playerId: player.playerId,
          isCaptain: player.isCaptain,
          isViceCaptain: player.isViceCaptain
        }))
      };
      
      // Submit team data to API
      const response = await fetch('/api/fantasy-pickleball/create-team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teamData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create team");
      }

      const result = await response.json();
      
      toast.success("Fantasy team created successfully!");
      
      // Redirect to team view
      router.push(`/fantasy/team/${result.id}`);
    } catch (error) {
      console.error("Error creating team:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
      toast.error(error instanceof Error ? error.message : "Failed to create team");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin h-10 w-10 text-primary" />
        <span className="ml-2">Loading contest data...</span>
      </div>
    );
    }

  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!contest) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Contest Not Found</AlertTitle>
        <AlertDescription>The requested contest could not be found.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{contest.name}</h1>
        <p className="text-muted-foreground">
          Part of {contest.tournament.name} • Entry Fee: ₹{contest.entryFee}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs 
            defaultValue="selection" 
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="w-full">
              <TabsTrigger value="selection" className="w-full">Player Selection</TabsTrigger>
              <TabsTrigger value="rules" className="w-full">Rules & Scoring</TabsTrigger>
            </TabsList>
            
            <TabsContent value="selection">
        <Card>
          <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Available Players</span>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => setActiveTab("rules")}>
                        <Info className="h-4 w-4 mr-1" />
                        Scoring Rules
                      </Button>
                    </div>
                  </CardTitle>
            <CardDescription>
                    Select {MAX_TEAM_SIZE} players to build your fantasy team within the budget.
            </CardDescription>
                  <div className="relative mt-2">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                      placeholder="Search players..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
              </div>
                </CardHeader>
                
          <CardContent>
                  <div className="mb-4">
                    <Label>Filter by category:</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {playerCategories.map((category) => (
                        <Badge
                          key={category.tier}
                          variant={selectedCategory === category.tier ? "default" : "outline"}
                          className="cursor-pointer py-1 px-3"
                          onClick={() => handleCategorySelect(category.tier)}
                        >
                          {category.tier}: {category.label} (₹{category.priceRange})
                        </Badge>
                      ))}
              </div>
            </div>

                  <div className="h-[400px] overflow-y-auto border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Player</TableHead>
                          <TableHead>Skill Level</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPlayers.length > 0 ? (
                          filteredPlayers.map((player) => (
                            <TableRow key={player.id}>
                              <TableCell className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={player.imageUrl} alt={player.name} />
                                  <AvatarFallback>
                                    {player.name.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{player.name}</span>
                              </TableCell>
                              <TableCell>{player.skillLevel}</TableCell>
                              <TableCell>₹{player.price.toLocaleString()}</TableCell>
                              <TableCell className="text-right">
                      <Button
                                  size="sm"
                                  onClick={() => handleAddPlayer(player.id)}
                                  disabled={remainingBudget < player.price || selectedPlayers.length >= MAX_TEAM_SIZE}
                                >
                                  Add
                      </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                              No players match your search or filter criteria
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
            </div>
          </CardContent>
        </Card>
            </TabsContent>

            <TabsContent value="rules">
        <Card>
          <CardHeader>
                  <CardTitle>Fantasy Scoring Rules</CardTitle>
            <CardDescription>
                    Understand how points are calculated in this fantasy contest
            </CardDescription>
          </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Basic Scoring</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Each player receives 1 point for each point they score in a match</li>
                      <li>Winning a game awards 11 points to each player on the winning team/side</li>
                      <li>Losing a game awards 10 points to each player on the losing team/side</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Bonus Points</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>If a player wins a game by 11-0, they get 15 points extra</li>
                      <li>If a player wins under 5 (e.g., 11-5 or better), they get 10 points extra</li>
                      <li>In case of a deuce win (12-10, 13-11, etc.), only the standard 11 points are awarded</li>
                      <li>MVP of Tournament receives 50 points extra (only if you had that player from day 1)</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Knockout Stages</h3>
                    <p>Points earned in knockout stages are multiplied by 1.5x</p>
              </div>

                      <div>
                    <h3 className="text-lg font-semibold mb-2">Captain & Vice-Captain</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Captain: Points multiplied by 2x</li>
                      <li>Vice-Captain: Points multiplied by 1.5x</li>
                    </ul>
                      </div>
                    </CardContent>
                  </Card>
            </TabsContent>
          </Tabs>
              </div>

        <div>
        <Card>
          <CardHeader>
              <CardTitle>Your Fantasy Team</CardTitle>
            <CardDescription>
                {selectedPlayers.length}/{MAX_TEAM_SIZE} players selected
            </CardDescription>
              <div className="mt-2">
                <Label htmlFor="team-name">Team Name</Label>
                <Input
                  id="team-name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Enter team name"
                  className="mt-1"
                />
              </div>
          </CardHeader>
            
          <CardContent>
              <div className="flex justify-between mb-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Budget</Label>
                  <p className="font-semibold">₹{budget.toLocaleString()}</p>
                </div>
              <div>
                  <Label className="text-sm text-muted-foreground">Remaining</Label>
                  <p className={`font-semibold ${remainingBudget < 0 ? 'text-red-500' : ''}`}>
                    ₹{remainingBudget.toLocaleString()}
                  </p>
                </div>
              </div>

              <Separator className="my-4" />
              
              {selectedPlayers.length > 0 ? (
                <div className="space-y-4">
                  {selectedPlayers.map((selectedPlayer) => {
                    const player = availablePlayers.find(p => p.id === selectedPlayer.playerId);
                    if (!player) return null;
                    
                    return (
                      <div key={player.id} className="flex items-center justify-between border rounded-md p-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={player.imageUrl} alt={player.name} />
                            <AvatarFallback>
                              {player.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
              <div>
                            <div className="flex items-center">
                              <span className="font-medium">{player.name}</span>
                              {selectedPlayer.isCaptain && (
                                <Badge variant="default" className="ml-2">C</Badge>
                              )}
                              {selectedPlayer.isViceCaptain && (
                                <Badge variant="secondary" className="ml-2">VC</Badge>
                              )}
                      </div>
                            <p className="text-sm text-muted-foreground">₹{player.price.toLocaleString()}</p>
                      </div>
                    </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            className={selectedPlayer.isCaptain ? 'text-primary' : ''}
                            onClick={() => handleCaptainSelection(player.id, 'captain')}
                            title="Set as Captain"
                          >
                            <Crown className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className={selectedPlayer.isViceCaptain ? 'text-primary' : ''}
                            onClick={() => handleCaptainSelection(player.id, 'viceCaptain')}
                            title="Set as Vice Captain"
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                  <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleRemovePlayer(player.id)}
                            title="Remove Player"
                          >
                            <AlertCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
                    );
                  })}
            </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Your team is empty</p>
                  <p className="text-sm">Add players from the selection panel</p>
                </div>
              )}
              
              {selectedPlayers.length > 0 && (
                <>
                  <Separator className="my-4" />
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Captain selected:</span>
                      <span>{selectedPlayers.some(p => p.isCaptain) ? '✅' : '❌'}</span>
                  </div>
                    <div className="flex justify-between text-sm">
                      <span>Vice-Captain selected:</span>
                      <span>{selectedPlayers.some(p => p.isViceCaptain) ? '✅' : '❌'}</span>
                      </div>
                    <div className="flex justify-between text-sm">
                      <span>Team complete:</span>
                      <span>{teamComplete ? '✅' : '❌'}</span>
                    </div>
                  </div>
                </>
              )}
          </CardContent>
            
            <CardFooter>
              <Button
                className="w-full"
                size="lg"
                disabled={!teamValid || submitting}
                onClick={handleCreateTeam}
                      >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Team...
                  </>
                ) : (
                  <>Create Fantasy Team</>
                )}
            </Button>
          </CardFooter>
        </Card>
          
          {contest.entryFee > 0 && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Entry Fee Required</AlertTitle>
              <AlertDescription>
                Creating this team will deduct ₹{contest.entryFee} from your wallet.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}
