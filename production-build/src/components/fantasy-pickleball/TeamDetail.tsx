"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { FantasyPointsCard } from './FantasyPointsCard';
import {
  Trophy,
  Star,
  Calendar,
  XCircle,
  ChevronLeft,
  Edit,
  Users,
  ArrowUpRight,
  Share2,
} from "lucide-react";

// Updated Player interface to match the FantasyPointsCard requirements
interface Player {
  id: number;
  name: string;
  position: string;
  skillLevel: string;
  price: number;
  isCaptain: boolean;
  isViceCaptain: boolean;
  stats: {
    wins: number;
    losses: number;
    aces: number;
    errors: number;
    points: number;
    killShots: number;
    dinks: number;
    returnsWon: number;
  };
  totalPoints: number;
  matchesPlayed: number;
  ownership: number;
}

interface FantasyTeam {
  id: string;
  name: string;
  ownerName: string;
  ownerAvatar?: string;
  contestId: string;
  contestName: string;
  tournamentId: string;
  tournamentName: string;
  rank: number;
  previousRank?: number;
  totalPoints: number;
  players: Player[];
  createdAt: string;
  updatedAt: string;
}

interface TeamDetailProps {
  teamId: string;
  isOwner?: boolean;
  isLive?: boolean;
  onShare?: (teamId: string) => void;
}

export function TeamDetail({
  teamId,
  isOwner = false,
  isLive = false,
  onShare,
}: TeamDetailProps) {
  const router = useRouter();
  const [team, setTeam] = useState<FantasyTeam | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchTeamDetails = async () => {
      try {
        setLoading(true);
        
        // This would be an API call in a real application
        // Simulating API response with mock data
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data for demonstration with updated player structure
        const mockTeam: FantasyTeam = {
          id: teamId,
          name: "Pickleball Wizards",
          ownerName: "John Smith",
          ownerAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
          contestId: "contest-123",
          contestName: "Summer Slam Fantasy Contest",
          tournamentId: "tournament-456",
          tournamentName: "Summer Slam Open",
          rank: 3,
          previousRank: 5,
          totalPoints: 342,
          players: [
            {
              id: 1,
              name: "Alex Johnson",
              position: "Singles Specialist",
              skillLevel: "Pro",
              price: 12.5,
              isCaptain: true,
              isViceCaptain: false,
              matchesPlayed: 10,
              totalPoints: 120,
              ownership: 45,
              stats: {
                points: 60,
                wins: 8,
                losses: 2,
                aces: 15,
                errors: 6,
                killShots: 25,
                dinks: 40,
                returnsWon: 30
              }
            },
            {
              id: 2,
              name: "Sarah Williams",
              position: "Doubles Player",
              skillLevel: "Advanced",
              price: 10.0,
              isCaptain: false,
              isViceCaptain: true,
              matchesPlayed: 10,
              totalPoints: 95,
              ownership: 38,
              stats: {
                points: 63,
                wins: 7,
                losses: 3,
                aces: 12,
                errors: 8,
                killShots: 18,
                dinks: 35,
                returnsWon: 25
              }
            },
            {
              id: 3,
              name: "Mike Thompson",
              position: "Mixed Doubles Expert",
              skillLevel: "Advanced",
              price: 9.5,
              isCaptain: false,
              isViceCaptain: false,
              matchesPlayed: 10,
              totalPoints: 82,
              ownership: 30,
              stats: {
                points: 82,
                wins: 6,
                losses: 4,
                aces: 10,
                errors: 7,
                killShots: 20,
                dinks: 28,
                returnsWon: 22
              }
            },
            {
              id: 4,
              name: "Emily Davis",
              position: "All-Around Player",
              skillLevel: "Intermediate",
              price: 8.0,
              isCaptain: false,
              isViceCaptain: false,
              matchesPlayed: 10,
              totalPoints: 45,
              ownership: 25,
              stats: {
                points: 45,
                wins: 4,
                losses: 6,
                aces: 8,
                errors: 10,
                killShots: 12,
                dinks: 20,
                returnsWon: 15
              }
            }
          ],
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        setTeam(mockTeam);
      } catch (err) {
        console.error("Error fetching team details:", err);
        setError("Failed to load team details. Please try again.");
        toast.error("Failed to load team details");
      } finally {
        setLoading(false);
      }
    };
    
    fetchTeamDetails();
  }, [teamId]);
  
  const handleShare = () => {
    if (onShare && team) {
      onShare(team.id);
    } else {
      // Fallback if no share handler is provided
      navigator.clipboard.writeText(window.location.href);
      toast.success("Team link copied to clipboard");
    }
  };
  
  const handleViewContest = () => {
    if (team) {
      router.push(`/tournaments/${team.tournamentId}/contests/${team.contestId}`);
    }
  };
  
  const handleViewLeaderboard = () => {
    if (team) {
      router.push(`/tournaments/${team.tournamentId}/contests/${team.contestId}/leaderboard`);
    }
  };
  
  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
            <p className="mt-4 text-sm text-muted-foreground">Loading team details...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error || !team) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-red-500">{error || "Team not found"}</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => router.back()}
            >
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-2xl">{team.name}</CardTitle>
            <CardDescription>
              Created by {team.ownerName} • Rank: {team.rank}
              {team.previousRank && team.previousRank > team.rank && (
                <Badge variant="outline" className="ml-2 bg-green-50 text-green-700">
                  ↑{team.previousRank - team.rank}
                </Badge>
              )}
              {team.previousRank && team.previousRank < team.rank && (
                <Badge variant="outline" className="ml-2 bg-red-50 text-red-700">
                  ↓{team.rank - team.previousRank}
                </Badge>
              )}
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            {isLive && (
              <Badge variant="outline" className="bg-red-50 text-red-700">
                LIVE
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
            {isOwner && (
              <Button variant="outline" size="sm" onClick={() => router.push(`/fantasy/teams/${teamId}/edit`)}>
                Edit Team
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <Trophy className="h-8 w-8 text-primary mb-2" />
                <h3 className="text-xl font-bold">{team.totalPoints}</h3>
                <p className="text-sm text-muted-foreground">Total Points</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <Users className="h-8 w-8 text-primary mb-2" />
                <h3 className="text-xl font-bold">{team.players.length}</h3>
                <p className="text-sm text-muted-foreground">Players</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <Calendar className="h-8 w-8 text-primary mb-2" />
                <h3 className="text-xl font-bold">{new Date(team.createdAt).toLocaleDateString()}</h3>
                <p className="text-sm text-muted-foreground">Created</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="players" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="players">Players</TabsTrigger>
            <TabsTrigger value="stats">Team Stats</TabsTrigger>
          </TabsList>
          
          <TabsContent value="players" className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {team.players.map(player => (
                <FantasyPointsCard
                  key={player.id}
                  playerName={player.name}
                  playerPosition={player.position}
                  skillLevel={player.skillLevel}
                  price={player.price}
                  isCaptain={player.isCaptain}
                  isViceCaptain={player.isViceCaptain}
                  stats={player.stats}
                  totalPoints={player.totalPoints}
                  matchesPlayed={player.matchesPlayed}
                  ownership={player.ownership}
                />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="stats" className="pt-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Team Performance</h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Captain Contribution</span>
                      <span className="text-sm text-muted-foreground">
                        {Math.round((team.players.find(p => p.isCaptain)?.totalPoints || 0) / team.totalPoints * 100)}%
                      </span>
                    </div>
                    <Progress 
                      value={(team.players.find(p => p.isCaptain)?.totalPoints || 0) / team.totalPoints * 100} 
                      className="h-2" 
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Vice-Captain Contribution</span>
                      <span className="text-sm text-muted-foreground">
                        {Math.round((team.players.find(p => p.isViceCaptain)?.totalPoints || 0) / team.totalPoints * 100)}%
                      </span>
                    </div>
                    <Progress 
                      value={(team.players.find(p => p.isViceCaptain)?.totalPoints || 0) / team.totalPoints * 100} 
                      className="h-2" 
                    />
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Player Skill Distribution</h4>
                      <div className="space-y-2">
                        {['Pro', 'Advanced', 'Intermediate', 'Beginner'].map(level => {
                          const count = team.players.filter(p => p.skillLevel === level).length;
                          return (
                            <div key={level} className="flex justify-between items-center">
                              <span className="text-xs">{level}</span>
                              <div className="flex items-center gap-2">
                                <Progress 
                                  value={count / team.players.length * 100} 
                                  className="h-2 w-24" 
                                />
                                <span className="text-xs text-muted-foreground">{count}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Budget Allocation</h4>
                      <div className="text-sm">
                        <div className="flex justify-between">
                          <span>Total Spent:</span>
                          <span>${team.players.reduce((sum, p) => sum + p.price, 0).toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Avg. per Player:</span>
                          <span>${(team.players.reduce((sum, p) => sum + p.price, 0) / team.players.length).toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Most Expensive:</span>
                          <span>${Math.max(...team.players.map(p => p.price)).toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex flex-col sm:flex-row gap-2 justify-between">
        <Button variant="outline" onClick={handleViewContest}>
          View Contest
        </Button>
        <Button onClick={handleViewLeaderboard}>
          View Leaderboard
          <ArrowUpRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
