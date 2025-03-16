"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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
import {
  Calendar,
  Trophy,
  ChevronRight,
  User,
  Clock,
  MapPin,
  Medal,
  CheckCircle2,
  BarChart3,
  CalendarDays,
  Star,
  Zap,
  Users,
  Award,
  History,
  Search,
} from "lucide-react";

interface Tournament {
  id: number;
  name: string;
  date: string;
  location: string;
  type: string;
  status: "upcoming" | "active" | "completed";
}

interface Match {
  id: number;
  tournamentId: number;
  tournamentName: string;
  opponent: string;
  date: string;
  time: string;
  court: string;
  result?: string;
  status: "upcoming" | "completed";
}

interface PlayerStats {
  totalMatches: number;
  wins: number;
  losses: number;
  winPercentage: number;
  upcomingMatches: number;
  tournamentsPlayed: number;
  tournamentsWon: number;
  averagePointsPerMatch: number;
}

export default function PlayerDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    totalMatches: 0,
    wins: 0,
    losses: 0,
    winPercentage: 0,
    upcomingMatches: 0,
    tournamentsPlayed: 0,
    tournamentsWon: 0,
    averagePointsPerMatch: 0,
  });
  
  // Check if user has the correct role
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    
    if (status === "authenticated" && session?.user?.role !== "PLAYER") {
      router.push("/dashboard");
      return;
    }
  }, [status, session, router]);

  // Fetch player data
  useEffect(() => {
    // This would be replaced with actual API calls in production
    const fetchPlayerData = async () => {
      try {
        setLoading(true);
        
        // Mock data for demonstration
        const mockTournaments: Tournament[] = [
          { 
            id: 1, 
            name: "Summer Grand Slam", 
            date: "2023-10-15", 
            location: "Central Sports Complex", 
            type: "Singles/Doubles",
            status: "active" 
          },
          { 
            id: 2, 
            name: "City Championships", 
            date: "2023-11-05", 
            location: "Downtown Recreation Center", 
            type: "Singles",
            status: "upcoming" 
          },
          { 
            id: 3, 
            name: "Spring Open", 
            date: "2023-09-01", 
            location: "Community Center", 
            type: "Doubles",
            status: "completed" 
          },
        ];
        
        const mockMatches: Match[] = [
          { 
            id: 1, 
            tournamentId: 1,
            tournamentName: "Summer Grand Slam", 
            opponent: "John Smith", 
            date: "2023-10-16", 
            time: "10:30 AM", 
            court: "Court 3", 
            status: "upcoming" 
          },
          { 
            id: 2, 
            tournamentId: 1,
            tournamentName: "Summer Grand Slam", 
            opponent: "Sarah Johnson", 
            date: "2023-10-18", 
            time: "2:00 PM", 
            court: "Court 1", 
            status: "upcoming" 
          },
          { 
            id: 3, 
            tournamentId: 3,
            tournamentName: "Spring Open", 
            opponent: "Michael Williams", 
            date: "2023-09-02", 
            time: "11:45 AM", 
            court: "Court 2", 
            result: "Win (11-5, 11-7)",
            status: "completed" 
          },
          { 
            id: 4, 
            tournamentId: 3,
            tournamentName: "Spring Open", 
            opponent: "Robert Davis", 
            date: "2023-09-03", 
            time: "3:15 PM", 
            court: "Court 4", 
            result: "Loss (9-11, 8-11)",
            status: "completed" 
          },
        ];
        
        const mockStats: PlayerStats = {
          totalMatches: 24,
          wins: 18,
          losses: 6,
          winPercentage: 75,
          upcomingMatches: 2,
          tournamentsPlayed: 8,
          tournamentsWon: 2,
          averagePointsPerMatch: 16.3,
        };
        
        setTournaments(mockTournaments);
        setMatches(mockMatches);
        setPlayerStats(mockStats);
      } catch (error) {
        console.error("Error fetching player data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (status === "authenticated") {
      fetchPlayerData();
    }
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold">Loading your dashboard...</h2>
          <p>Please wait while we fetch your information</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      {/* Top navigation bar */}
      <header className="border-b sticky top-0 z-10 bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">
            Player Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => router.push("/player/tournaments")}
              className="hidden md:flex items-center gap-1"
            >
              <Trophy className="h-4 w-4" />
              Tournaments
            </Button>
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => router.push("/player/matches")}
              className="hidden md:flex items-center gap-1"
            >
              <CalendarDays className="h-4 w-4" />
              Matches
            </Button>
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => router.push("/player/profile")}
              className="flex items-center gap-1"
            >
              <User className="h-4 w-4" />
              Profile
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome section */}
        <section className="mb-8">
          <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-lg p-6 border border-green-500/20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold">
                  Welcome back, {session?.user?.name || "Player"}!
                </h2>
                <p className="text-muted-foreground mt-1">
                  Track your tournaments, view match schedules, and check your performance statistics.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.push("/player/matches")}
                  className="flex items-center gap-1"
                >
                  <History className="h-4 w-4" />
                  Match History
                </Button>
                <Button
                  onClick={() => router.push("/player/tournaments/browse")}
                  className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Find Tournaments
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Cards */}
        <section className="mb-8">
          <h3 className="text-lg font-medium mb-4">Your Performance</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-slate-50/50 to-slate-100/50 dark:from-slate-950/20 dark:to-slate-900/20 border-slate-200/50 dark:border-slate-800/30">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Win Rate</p>
                    <h3 className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{playerStats.winPercentage}%</h3>
                    <p className="text-xs mt-1 text-muted-foreground">
                      {playerStats.wins} wins, {playerStats.losses} losses
                    </p>
                  </div>
                  <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-50/50 to-slate-100/50 dark:from-slate-950/20 dark:to-slate-900/20 border-slate-200/50 dark:border-slate-800/30">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tournaments</p>
                    <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{playerStats.tournamentsPlayed}</h3>
                    <p className="text-xs mt-1 text-muted-foreground">
                      {playerStats.tournamentsWon} victories
                    </p>
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                    <Trophy className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-50/50 to-slate-100/50 dark:from-slate-950/20 dark:to-slate-900/20 border-slate-200/50 dark:border-slate-800/30">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Matches</p>
                    <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{playerStats.totalMatches}</h3>
                    <p className="text-xs mt-1 text-muted-foreground">
                      Lifetime matches
                    </p>
                  </div>
                  <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-full">
                    <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-50/50 to-slate-100/50 dark:from-slate-950/20 dark:to-slate-900/20 border-slate-200/50 dark:border-slate-800/30">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Upcoming</p>
                    <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{playerStats.upcomingMatches}</h3>
                    <p className="text-xs mt-1 text-muted-foreground">
                      Scheduled matches
                    </p>
                  </div>
                  <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-full">
                    <CalendarDays className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Match Schedule */}
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Upcoming Matches</CardTitle>
                  <Button 
                    variant="link" 
                    className="text-sm gap-1"
                    onClick={() => router.push("/player/matches")}
                  >
                    View All
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>Your scheduled matches</CardDescription>
              </CardHeader>
              <CardContent>
                {matches.filter(match => match.status === "upcoming").length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No upcoming matches found</p>
                    <Button 
                      variant="link" 
                      className="mt-2"
                      onClick={() => router.push("/player/tournaments/browse")}
                    >
                      Browse tournaments to participate
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {matches.filter(match => match.status === "upcoming").map((match) => (
                      <div 
                        key={match.id} 
                        className="p-4 rounded-lg border border-green-200/40 dark:border-green-800/30 hover:bg-green-50/50 dark:hover:bg-green-950/10 transition-colors cursor-pointer"
                        onClick={() => router.push(`/player/matches/${match.id}`)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium text-lg">vs. {match.opponent}</h4>
                            <p className="text-sm text-muted-foreground">{match.tournamentName}</p>
                          </div>
                          <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                            Upcoming
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 mt-4 text-sm">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-muted-foreground mr-1" />
                            <p>{new Date(match.date).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 text-muted-foreground mr-1" />
                            <p>{match.time}</p>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 text-muted-foreground mr-1" />
                            <p>{match.court}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Performance History</CardTitle>
                <CardDescription>Your match performance over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-[21/9] border border-border rounded-md bg-gradient-to-br from-background to-muted/30 flex flex-col items-center justify-center">
                  <BarChart3 className="h-16 w-16 text-muted-foreground/30 mb-2" />
                  <p className="text-center text-muted-foreground max-w-md">
                    Your performance chart would appear here, showing match results, points scored, and win/loss ratio over time.
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="p-4 rounded-lg border text-center">
                    <div className="font-medium text-sm text-muted-foreground mb-1">Avg. Points per Match</div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{playerStats.averagePointsPerMatch}</div>
                  </div>
                  <div className="p-4 rounded-lg border text-center">
                    <div className="font-medium text-sm text-muted-foreground mb-1">Match Completion Rate</div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">100%</div>
                  </div>
                </div>
                
                <Button 
                  variant="outline"
                  className="w-full mt-6"
                  onClick={() => router.push("/player/statistics")}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Detailed Statistics
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Tournaments & Achievements */}
          <div className="space-y-8">
            {/* Tournaments */}
            <Card>
              <CardHeader>
                <CardTitle>Your Tournaments</CardTitle>
                <CardDescription>Tournaments you're participating in</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tournaments.map((tournament) => (
                    <div 
                      key={tournament.id} 
                      className="p-4 rounded-lg border border-blue-200/40 dark:border-blue-800/30 hover:bg-blue-50/50 dark:hover:bg-blue-950/10 transition-colors cursor-pointer"
                      onClick={() => router.push(`/player/tournaments/${tournament.id}`)}
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">{tournament.name}</h4>
                        <Badge 
                          variant="outline" 
                          className={
                            tournament.status === "active" 
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                              : tournament.status === "upcoming"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                          }
                        >
                          {tournament.status === "active" 
                            ? "Active" 
                            : tournament.status === "upcoming" 
                              ? "Upcoming" 
                              : "Completed"}
                        </Badge>
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>{new Date(tournament.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span>{tournament.location}</span>
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <Users className="h-3 w-3 mr-1" />
                        <span>{tournament.type}</span>
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full mt-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/player/tournaments/${tournament.id}/matches`);
                        }}
                      >
                        View Schedule
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                  onClick={() => router.push("/player/tournaments/browse")}
                >
                  Browse Available Tournaments
                </Button>
              </CardFooter>
            </Card>

            {/* Achievements */}
            <Card>
              <CardHeader>
                <CardTitle>Achievements</CardTitle>
                <CardDescription>Your accomplishments and badges</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-full">
                      <Medal className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-base">Tournament Champion</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Won first place in a tournament
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                      <Star className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-base">Rising Star</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Won 5 consecutive matches
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-full">
                      <Award className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-base">Elite Player</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Maintained a 70%+ win rate
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
                      <Zap className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-base">Perfect Game</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Won a game without losing a point
                      </p>
                    </div>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full mt-6"
                  onClick={() => router.push("/player/achievements")}
                >
                  View All Achievements
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
} 