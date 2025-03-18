"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Calendar, Trophy, Users, Star, Award, TrendingUp, Filter } from "lucide-react";

interface FantasyTeam {
  id: number;
  name: string;
  contestName: string;
  contestId: number;
  tournamentName: string;
  points: number;
  rank: number;
  totalTeams: number;
  status: "UPCOMING" | "ACTIVE" | "COMPLETED";
  startDate: string;
  endDate: string;
  players: {
    id: number;
    name: string;
    position: string;
    points: number;
    imageUrl?: string;
  }[];
}

export default function FantasyTeamsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [teams, setTeams] = useState<FantasyTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<string | null>(null);

  // Check authentication
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?redirect=/fantasy/teams");
    }
  }, [status, router]);

  // Fetch user's fantasy teams
  useEffect(() => {
    const fetchTeams = async () => {
      if (session?.user) {
        try {
          setLoading(true);
          
          // Fetch user teams from the API
          const response = await fetch("/api/fantasy-pickleball/user/teams");
          
          if (!response.ok) {
            throw new Error("Failed to fetch teams");
          }
          
          const data = await response.json();
          
          // Transform API response to match the FantasyTeam interface
          const formattedTeams: FantasyTeam[] = data.teams.map((team: any) => {
            // Determine status
            let status: "UPCOMING" | "ACTIVE" | "COMPLETED";
            if (team.contest.status === "UPCOMING") {
              status = "UPCOMING";
            } else if (team.contest.status === "IN_PROGRESS") {
              status = "ACTIVE";
            } else {
              status = "COMPLETED";
            }
            
            return {
              id: team.id,
              name: team.name,
              contestName: team.contest.name,
              contestId: team.contest.id,
              tournamentName: team.contest.tournament.name,
              points: team.totalPoints || 0,
              rank: team.rank || 0,
              totalTeams: team.contest.currentEntries || 0,
              status: status,
              startDate: team.contest.startDate,
              endDate: team.contest.endDate,
              players: team.players.map((p: any) => ({
                id: p.player.id,
                name: p.player.name,
                position: p.player.primaryPosition || "Player",
                points: p.points || 0,
                imageUrl: p.player.imageUrl
              }))
            };
          });
          
          setTeams(formattedTeams);
        } catch (error) {
          console.error("Error fetching fantasy teams:", error);
          setTeams([]);
        } finally {
          setLoading(false);
        }
      }
    };

    if (session?.user) {
      fetchTeams();
    }
  }, [session]);

  // Filter teams based on search term and status filter
  const filteredTeams = teams.filter(team => {
    // Apply status filter
    if (filter && team.status !== filter) {
      return false;
    }
    
    // Apply search
    if (searchTerm && 
        !team.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !team.contestName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !team.tournamentName.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  // Group teams by status
  const upcomingTeams = filteredTeams.filter(team => team.status === "UPCOMING");
  const activeTeams = filteredTeams.filter(team => team.status === "ACTIVE");
  const completedTeams = filteredTeams.filter(team => team.status === "COMPLETED");

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading your fantasy teams...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Fantasy Teams</CardTitle>
            <CardDescription>Please sign in to view your fantasy teams</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/login?redirect=/fantasy/teams")}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-500">
          My Fantasy Teams
        </h1>
        <p className="text-muted-foreground max-w-3xl">
          Manage your fantasy pickleball teams and track your performance across all contests.
        </p>
      </div>
      
      {/* Search and filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search teams, contests, or tournaments..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant={filter === null ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(null)}
          >
            All
          </Button>
          <Button 
            variant={filter === "ACTIVE" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("ACTIVE")}
          >
            Active
          </Button>
          <Button 
            variant={filter === "UPCOMING" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("UPCOMING")}
          >
            Upcoming
          </Button>
          <Button 
            variant={filter === "COMPLETED" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("COMPLETED")}
          >
            Completed
          </Button>
        </div>
      </div>
      
      {/* No teams state */}
      {filteredTeams.length === 0 && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <Trophy className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-xl font-medium mb-2">No fantasy teams found</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {searchTerm || filter 
                  ? "No teams match your current filters. Try adjusting your search or filter criteria."
                  : "You haven't created any fantasy teams yet. Join a contest to get started!"}
              </p>
              <Link href="/fantasy/contests">
                <Button>Browse Available Contests</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Teams Tabs */}
      {filteredTeams.length > 0 && (
        <Tabs defaultValue={activeTeams.length > 0 ? "active" : (upcomingTeams.length > 0 ? "upcoming" : "completed")}>
          <TabsList className="mb-6">
            <TabsTrigger value="active" disabled={activeTeams.length === 0}>
              Active ({activeTeams.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming" disabled={upcomingTeams.length === 0}>
              Upcoming ({upcomingTeams.length})
            </TabsTrigger>
            <TabsTrigger value="completed" disabled={completedTeams.length === 0}>
              Completed ({completedTeams.length})
            </TabsTrigger>
          </TabsList>
          
          {/* Active Teams */}
          <TabsContent value="active" className="space-y-6">
            {activeTeams.map(team => (
              <TeamCard key={team.id} team={team} />
            ))}
            
            {activeTeams.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No active fantasy teams found.</p>
              </div>
            )}
          </TabsContent>
          
          {/* Upcoming Teams */}
          <TabsContent value="upcoming" className="space-y-6">
            {upcomingTeams.map(team => (
              <TeamCard key={team.id} team={team} />
            ))}
            
            {upcomingTeams.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No upcoming fantasy teams found.</p>
              </div>
            )}
          </TabsContent>
          
          {/* Completed Teams */}
          <TabsContent value="completed" className="space-y-6">
            {completedTeams.map(team => (
              <TeamCard key={team.id} team={team} />
            ))}
            
            {completedTeams.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No completed fantasy teams found.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
      
      {/* Contest Call-to-Action */}
      <div className="mt-10">
        <Card className="bg-gradient-to-r from-blue-500/10 to-teal-400/10">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="shrink-0">
                <Trophy className="h-16 w-16 text-blue-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">Ready for more fantasy action?</h3>
                <p className="text-muted-foreground mb-4">
                  Browse our upcoming contests and create new fantasy teams to compete for prizes and glory!
                </p>
                <Link href="/fantasy/contests">
                  <Button className="bg-gradient-to-r from-blue-500 to-teal-400 hover:from-blue-600 hover:to-teal-500 text-white">
                    Find Contests
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Team Card Component
function TeamCard({ team }: { team: FantasyTeam }) {
  return (
    <Card className="overflow-hidden">
      <div className="md:flex">
        {/* Team Info */}
        <div className="p-6 flex-1">
          <div className="flex justify-between items-start">
            {/* Team Name and Contest */}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-semibold">{team.name}</h3>
                {team.status === "ACTIVE" && (
                  <Badge className="bg-[#27D3C3] text-black">
                    Live
                  </Badge>
                )}
                {team.status === "UPCOMING" && (
                  <Badge variant="outline" className="border-blue-500 text-blue-500">
                    Upcoming
                  </Badge>
                )}
                {team.status === "COMPLETED" && (
                  <Badge className="bg-blue-500 text-white">
                    Completed
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground mt-1">
                {team.contestName} • {team.tournamentName}
              </p>
            </div>
            
            {/* Points and Rank */}
            {team.status !== "UPCOMING" && (
              <div className="text-right">
                <div className="mb-1">
                  <span className="text-sm text-muted-foreground">Points</span>
                  <p className="text-2xl font-bold">{team.points}</p>
                </div>
                {team.rank > 0 && (
                  <div className="flex items-center justify-end">
                    <Star className="h-4 w-4 text-yellow-500 mr-1" />
                    <span>Rank: #{team.rank} of {team.totalTeams}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Dates */}
          <div className="flex items-center mt-3 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 mr-1" />
            <span>
              {new Date(team.startDate).toLocaleDateString()} - {new Date(team.endDate).toLocaleDateString()}
            </span>
          </div>
          
          {/* Players Grid */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {team.players.map(player => (
              <div key={player.id} className="flex items-center p-2 bg-muted/50 rounded">
                <div className="w-8 h-8 bg-muted rounded-full mr-2 overflow-hidden">
                  {player.imageUrl ? (
                    <img src={player.imageUrl} alt={player.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/20 text-primary text-xs font-bold">
                      {player.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{player.name}</p>
                  <p className="text-xs text-muted-foreground">{player.position}</p>
                </div>
                {team.status !== "UPCOMING" && (
                  <div className="ml-2 text-sm font-medium">
                    {player.points} pts
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="bg-muted/30 p-6 flex flex-col justify-center space-y-3 md:w-56">
          <Link href={`/fantasy/teams/${team.id}`}>
            <Button variant="default" className="w-full">
              {team.status === "UPCOMING" ? "Edit Team" : "View Team"}
            </Button>
          </Link>
          
          <Link href={`/fantasy/contests/${team.contestId}`}>
            <Button variant="outline" className="w-full">
              Contest Details
            </Button>
          </Link>
          
          {team.status === "ACTIVE" && (
            <Link href="/fantasy/live-scores">
              <Button variant="outline" className="w-full">
                <TrendingUp className="mr-2 h-4 w-4" />
                Live Scores
              </Button>
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
} 