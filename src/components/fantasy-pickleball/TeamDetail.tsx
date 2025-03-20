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
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

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
  teamId?: number;
  teamName?: string;
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
        
        const response = await fetch(`/api/fantasy/teams/${teamId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch team details");
        }
        
        const data = await response.json();
        setTeam(data);
      } catch (error) {
        console.error("Error fetching team details:", error);
        setError("Failed to load team details. Please try again.");
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
                  teamName={player.teamName}
                />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="stats" className="pt-4">
            <div className="grid grid-cols-1 gap-6">
              <TopPerformersCard players={team.players} />
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Points Breakdown</CardTitle>
                  <CardDescription>Team points by player contribution</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={team.players.map(p => ({ 
                        name: p.name, 
                        points: p.totalPoints,
                        role: p.isCaptain ? 'Captain' : p.isViceCaptain ? 'Vice-Captain' : 'Player'
                      }))}
                      margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                    >
                      <XAxis 
                        dataKey="name" 
                        angle={-45} 
                        textAnchor="end" 
                        height={70} 
                        tick={{ fontSize: 12 }} 
                      />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number, name: string, props: any) => {
                          return [`${value} pts`, props.payload.role];
                        }}
                      />
                      <Bar 
                        dataKey="points" 
                        fill="hsl(var(--primary))" 
                        radius={[4, 4, 0, 0]} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Team Performance</CardTitle>
                  <CardDescription>Overall statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Wins Distribution</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                          <span className="text-3xl font-bold">
                            {team.players.reduce((acc, p) => acc + p.stats.wins, 0)}
                          </span>
                          <span className="text-sm text-muted-foreground">Total Wins</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-3xl font-bold">
                            {Math.round(team.players.reduce((acc, p) => acc + p.stats.wins, 0) / team.players.length)}
                          </span>
                          <span className="text-sm text-muted-foreground">Avg Wins per Player</span>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Points Distribution</h4>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="flex flex-col p-2 bg-muted rounded">
                          <span className="text-sm text-muted-foreground">Avg Pts</span>
                          <span className="font-medium">{(team.totalPoints / team.players.length).toFixed(1)}</span>
                        </div>
                        <div className="flex flex-col p-2 bg-muted rounded">
                          <span className="text-sm text-muted-foreground">Max Pts</span>
                          <span className="font-medium">{Math.max(...team.players.map(p => p.totalPoints))}</span>
                        </div>
                        <div className="flex flex-col p-2 bg-muted rounded">
                          <span className="text-sm text-muted-foreground">Min Pts</span>
                          <span className="font-medium">{Math.min(...team.players.map(p => p.totalPoints))}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
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

function TopPerformersCard({ players }: { players: Player[] }) {
  // Sort players by points in descending order and take the top 3
  const topPlayers = [...players]
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .slice(0, 3);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Top Performers</CardTitle>
        <CardDescription>Players contributing the most points</CardDescription>
      </CardHeader>
      <CardContent>
        {topPlayers.map((player, index) => (
          <div key={player.id} className="mb-4 last:mb-0">
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center">
                <Badge variant="outline" className="mr-2">
                  {index + 1}
                </Badge>
                <div>
                  <div className="font-medium">{player.name}</div>
                  <div className="text-xs text-muted-foreground">{player.position}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-primary">{player.totalPoints} pts</div>
                <div className="text-xs text-muted-foreground">
                  {player.isCaptain ? 'Captain (2x)' : player.isViceCaptain ? 'Vice-Captain (1.5x)' : 'Player'}
                </div>
              </div>
            </div>
            <Progress value={(player.totalPoints / (topPlayers[0]?.totalPoints || 1)) * 100} className="h-2" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
