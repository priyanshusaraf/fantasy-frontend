"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import Image from "next/image";
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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Search,
  Trash2,
  Star,
  Award,
  Trophy,
  Users,
  DollarSign,
  Filter,
  Clock,
  Check,
  Info,
  AlertTriangle,
  Loader2,
  Plus,
} from "lucide-react";

// Interfaces for data types
interface Player {
  id: string;
  name: string;
  imageUrl?: string;
  position: string;
  skillLevel: string;
  price: number;
  stats: {
    wins: number;
    losses: number;
    aces: number;
    errors: number;
    killShots: number;
    dinks: number;
    returnsWon: number;
    avgPointsPerMatch: number;
  };
  tournamentId: string;
}

interface SelectedPlayer extends Player {
  isCaptain: boolean;
  isViceCaptain: boolean;
}

interface Contest {
  id: string;
  name: string;
  tournamentId: string;
  tournamentName: string;
  entryFee: number;
  prizePool: number;
  maxEntries: number;
  startDate: string;
  endDate: string;
  status: 'UPCOMING' | 'IN_PROGRESS';
  rules: {
    maxTeams: number;
    teamSize: number;
    maxBudget: number;
  };
}

interface PlayerCategory {
  name: string;
  count: number;
  active: boolean;
}

// Constants
const MAX_TEAM_SIZE = 6;

interface TeamCreationParams {
  params: {
    id: string;
  };
}

export default function TeamCreationPage({ params }: TeamCreationParams) {
  const router = useRouter();
  const [contest, setContest] = useState<Contest | null>(null);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<SelectedPlayer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState<PlayerCategory[]>([
    { name: "All", count: 0, active: true },
    { name: "Pro", count: 0, active: false },
    { name: "Advanced", count: 0, active: false },
    { name: "Intermediate", count: 0, active: false },
    { name: "Beginner", count: 0, active: false },
  ]);
  const [teamName, setTeamName] = useState("");
  const [budgetRemaining, setBudgetRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch contest details and players
  useEffect(() => {
    const fetchContestAndPlayers = async () => {
      try {
        setLoading(true);
        
        // This would be API calls in a real application
        // Mock data for demonstration
        const mockContest: Contest = {
          id: params.id,
          name: "Summer Slam Fantasy Challenge",
          tournamentId: "tournament-1",
          tournamentName: "Summer Slam Championship",
          entryFee: 25,
          prizePool: 5000,
          maxEntries: 500,
          startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'UPCOMING',
          rules: {
            maxTeams: 3,
            teamSize: 6,
            maxBudget: 100,
          },
        };
        
        // Create mock player data with different skill levels
        const generateMockPlayers = () => {
          const positions = ["Singles Specialist", "Doubles Player", "Mixed Doubles Expert", "All-Around Player"];
          const skillLevels = ["Pro", "Advanced", "Intermediate", "Beginner"];
          
          return Array.from({ length: 40 }, (_, i) => {
            const skillLevel = skillLevels[Math.floor(i / 10)]; // Distribute skill levels
            const price = 
              skillLevel === "Pro" ? 12 + (Math.random() * 5) : 
              skillLevel === "Advanced" ? 8 + (Math.random() * 4) : 
              skillLevel === "Intermediate" ? 5 + (Math.random() * 3) : 
              2 + (Math.random() * 3);
            
            return {
              id: `player-${i + 1}`,
              name: `Player ${i + 1}`,
              position: positions[i % positions.length],
              skillLevel,
              price: parseFloat(price.toFixed(1)),
              imageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=player${i}`,
              stats: {
                wins: Math.floor(Math.random() * 10) + 1,
                losses: Math.floor(Math.random() * 5),
                aces: Math.floor(Math.random() * 20),
                errors: Math.floor(Math.random() * 10),
                killShots: Math.floor(Math.random() * 30),
                dinks: Math.floor(Math.random() * 50),
                returnsWon: Math.floor(Math.random() * 40),
                avgPointsPerMatch: Math.floor(Math.random() * 50) + 30,
              },
              tournamentId: mockContest.tournamentId,
            };
          });
        };
        
        const mockPlayers = generateMockPlayers();
        
        // Update categories count
        const categoryCounts = categories.map(category => {
          if (category.name === "All") {
            return { ...category, count: mockPlayers.length };
          } else {
            return {
              ...category,
              count: mockPlayers.filter(p => p.skillLevel === category.name).length
            };
          }
        });
        
        setCategories(categoryCounts);
        setContest(mockContest);
        setAvailablePlayers(mockPlayers);
        setBudgetRemaining(mockContest.rules.maxBudget);
      } catch (err) {
        console.error("Error fetching contest details:", err);
        setError("Failed to load contest details. Please try again.");
        toast.error("Failed to load contest details");
      } finally {
        setLoading(false);
      }
    };
    
    fetchContestAndPlayers();
  }, [params.id]);
  
  // Filter players based on search and category
  const filteredPlayers = availablePlayers.filter(player => {
    // Filter out already selected players
    if (selectedPlayers.some(p => p.id === player.id)) {
      return false;
    }
    
    // Apply search filter
    if (searchTerm && !player.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Apply category filter
    const activeCategory = categories.find(c => c.active);
    if (activeCategory && activeCategory.name !== "All" && player.skillLevel !== activeCategory.name) {
      return false;
    }
    
    return true;
  });
  
  // Handler for adding a player to the team
  const handleAddPlayer = (player: Player) => {
    if (selectedPlayers.length >= MAX_TEAM_SIZE) {
      toast.error(`You can only select up to ${MAX_TEAM_SIZE} players`);
      return;
    }
    
    if (budgetRemaining < player.price) {
      toast.error("Not enough budget to add this player");
      return;
    }
    
    const selectedPlayer: SelectedPlayer = {
      ...player,
      isCaptain: false,
      isViceCaptain: false,
    };
    
    setSelectedPlayers([...selectedPlayers, selectedPlayer]);
    setBudgetRemaining(prev => parseFloat((prev - player.price).toFixed(1)));
  };
  
  // Handler for removing a player from the team
  const handleRemovePlayer = (playerId: string) => {
    const player = selectedPlayers.find(p => p.id === playerId);
    if (!player) return;
    
    const updatedPlayers = selectedPlayers.filter(p => p.id !== playerId);
    setSelectedPlayers(updatedPlayers);
    setBudgetRemaining(prev => parseFloat((prev + player.price).toFixed(1)));
  };
  
  // Handler for setting captain
  const handleSetCaptain = (playerId: string) => {
    const updatedPlayers = selectedPlayers.map(player => {
      if (player.id === playerId) {
        return { ...player, isCaptain: true, isViceCaptain: false };
      } else {
        return { ...player, isCaptain: false };
      }
    });
    
    setSelectedPlayers(updatedPlayers);
  };
  
  // Handler for setting vice-captain
  const handleSetViceCaptain = (playerId: string) => {
    const updatedPlayers = selectedPlayers.map(player => {
      if (player.id === playerId) {
        return { ...player, isViceCaptain: true, isCaptain: false };
      } else {
        return { ...player, isViceCaptain: false };
      }
    });
    
    setSelectedPlayers(updatedPlayers);
  };
  
  // Handler for selecting a category
  const handleCategorySelect = (categoryName: string) => {
    const updatedCategories = categories.map(category => ({
      ...category,
      active: category.name === categoryName,
    }));
    
    setCategories(updatedCategories);
  };
  
  // Validate team before submission
  const validateTeam = () => {
    if (!teamName.trim()) {
      toast.error("Please enter a team name");
      return false;
    }
    
    if (selectedPlayers.length !== MAX_TEAM_SIZE) {
      toast.error(`Your team must have exactly ${MAX_TEAM_SIZE} players`);
      return false;
    }
    
    if (!selectedPlayers.some(p => p.isCaptain)) {
      toast.error("You must select a captain");
      return false;
    }
    
    if (!selectedPlayers.some(p => p.isViceCaptain)) {
      toast.error("You must select a vice-captain");
      return false;
    }
    
    return true;
  };
  
  // Handle team submission
  const handleSubmitTeam = async () => {
    if (!validateTeam()) return;
    
    try {
      setSubmitting(true);
      
      // This would be an API call in a real application
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success("Team created successfully!");
      router.push(`/contests/${params.id}`);
    } catch (err) {
      console.error("Error creating team:", err);
      toast.error("Failed to create team. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };
  
  // Format date nicely
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
    });
  };
  
  if (loading) {
    return (
      <div className="container py-10">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading contest details...</p>
        </div>
      </div>
    );
  }
  
  if (error || !contest) {
    return (
      <div className="container py-10">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <p className="text-red-500 mb-4">{error || "Contest not found"}</p>
          <Button variant="outline" onClick={() => router.push('/contests')}>
            Back to Contests
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-10">
      <Button 
        variant="ghost" 
        className="mb-6 -ml-3 text-muted-foreground" 
        onClick={() => router.push(`/contests/${params.id}`)}
      >
        Back to Contest
      </Button>
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left side - Contest info and selected players */}
        <div className="w-full md:w-2/5 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create Your Fantasy Team</CardTitle>
              <CardDescription>
                {contest.name} - {formatDate(contest.startDate)}
              </CardDescription>
              
              <div className="mt-4">
                <Input
                  placeholder="Enter your team name"
                  value={teamName}
                  onChange={e => setTeamName(e.target.value)}
                  className="mb-1"
                />
                <p className="text-xs text-muted-foreground">
                  Give your team a creative name!
                </p>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="flex justify-between mb-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Budget Remaining:</span>
                </div>
                <span className={`font-bold ${budgetRemaining < 10 ? 'text-amber-500' : 'text-green-500'}`}>
                  ${budgetRemaining.toFixed(1)}M
                </span>
              </div>
              <Progress value={(budgetRemaining / contest.rules.maxBudget) * 100} className="h-2 mb-4" />
              
              <div className="flex justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Players:</span>
                </div>
                <span className="font-bold">
                  {selectedPlayers.length}/{MAX_TEAM_SIZE}
                </span>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-3 mb-6 text-sm">
                <h3 className="font-medium flex items-center mb-2">
                  <Info className="h-4 w-4 mr-2 text-muted-foreground" />
                  Team Requirements
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>Select {MAX_TEAM_SIZE} players</li>
                  <li>Stay within ${contest.rules.maxBudget}M budget</li>
                  <li>Pick 1 Captain (2x points)</li>
                  <li>Pick 1 Vice-Captain (1.5x points)</li>
                </ul>
              </div>
              
              <Separator className="my-4" />
              
              <h3 className="font-medium mb-3">Your Team</h3>
              
              {selectedPlayers.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                  <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">
                    No players selected yet
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Select players from the list on the right
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedPlayers.map(player => (
                    <div 
                      key={player.id} 
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {player.imageUrl && (
                          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-muted">
                            <Image
                              src={player.imageUrl}
                              alt={player.name}
                              width={40}
                              height={40}
                            />
                          </div>
                        )}
                        
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{player.name}</span>
                            {player.isCaptain && (
                              <Badge className="bg-yellow-500/90">C</Badge>
                            )}
                            {player.isViceCaptain && (
                              <Badge className="bg-blue-500/90">VC</Badge>
                            )}
                          </div>
                          <div className="flex gap-2 items-center text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-xs">{player.skillLevel}</Badge>
                            <span>${player.price.toFixed(1)}M</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleSetCaptain(player.id)}
                          disabled={player.isCaptain}
                          title="Set as Captain"
                        >
                          <Star 
                            className={`h-4 w-4 ${player.isCaptain ? 'text-yellow-500' : 'text-muted-foreground'}`} 
                          />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleSetViceCaptain(player.id)}
                          disabled={player.isViceCaptain}
                          title="Set as Vice-Captain"
                        >
                          <Award 
                            className={`h-4 w-4 ${player.isViceCaptain ? 'text-blue-500' : 'text-muted-foreground'}`}
                          />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500"
                          onClick={() => handleRemovePlayer(player.id)}
                          title="Remove player"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={handleSubmitTeam}
                disabled={submitting || selectedPlayers.length !== MAX_TEAM_SIZE}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Team...
                  </>
                ) : (
                  <>Create Team</>
                )}
              </Button>
            </CardFooter>
          </Card>
          
          {/* Contest details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contest Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Entry Fee</span>
                <span className="font-medium">${contest.entryFee}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Prize Pool</span>
                <span className="font-medium">${contest.prizePool.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Start Date</span>
                <span className="font-medium">{formatDate(contest.startDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Max Teams</span>
                <span className="font-medium">{contest.rules.maxTeams}</span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right side - Available players */}
        <div className="w-full md:w-3/5">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Available Players</CardTitle>
              <CardDescription>
                Select players to build your team
              </CardDescription>
              
              <div className="mt-3">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search players..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            
            <div className="px-6 mb-2">
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <Badge
                    key={category.name}
                    variant={category.active ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleCategorySelect(category.name)}
                  >
                    {category.name} ({category.count})
                  </Badge>
                ))}
              </div>
            </div>
            
            <CardContent>
              {filteredPlayers.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                  <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    No players found matching your filters
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                  {filteredPlayers.map(player => (
                    <div 
                      key={player.id} 
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleAddPlayer(player)}
                    >
                      <div className="flex items-center gap-3">
                        {player.imageUrl && (
                          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-muted">
                            <Image
                              src={player.imageUrl}
                              alt={player.name}
                              width={40}
                              height={40}
                            />
                          </div>
                        )}
                        
                        <div>
                          <div className="font-medium">
                            {player.name}
                          </div>
                          <div className="flex gap-2 items-center text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-xs">{player.skillLevel}</Badge>
                            <span>{player.position}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm"><span className="font-medium">{player.stats.avgPointsPerMatch}</span> PPM</div>
                          <div className="text-sm">{player.stats.wins}W / {player.stats.losses}L</div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-lg font-bold">${player.price.toFixed(1)}M</div>
                          <div className="flex justify-end">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 py-0 px-2 text-xs"
                              disabled={selectedPlayers.length >= MAX_TEAM_SIZE || budgetRemaining < player.price}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 