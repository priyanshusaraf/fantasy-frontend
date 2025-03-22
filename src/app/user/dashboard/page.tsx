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
  Star,
  ChevronRight,
  BarChart3,
  Tv,
  CircleDollarSign,
  Trophy,
  Users,
  Calendar,
  User,
  Wallet,
  ArrowUpRight,
  BarChart,
  DollarSign,
  ActivityIcon,
  Sun,
  Moon,
  RefreshCw,
} from "lucide-react";
import { useTheme } from "next-themes";
import LeaderboardTabs from "@/components/leaderboard/LeaderboardTabs";
import { env } from "@/env.mjs";

interface FantasyGame {
  id: number;
  name: string;
  tournamentName: string;
  entryFee: number;
  totalPrize: number;
  myTeamRank?: number;
  totalParticipants: number;
  status: "upcoming" | "live" | "completed";
  startDate: string;
  endDate: string;
}

interface LiveMatch {
  id: number;
  teamA: {
    name: string;
    score: number;
  };
  teamB: {
    name: string;
    score: number;
  };
  status: "upcoming" | "live" | "completed";
  tournamentName: string;
  round: string;
}

export default function UserDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [activeContests, setActiveContests] = useState<FantasyGame[]>([]);
  const [upcomingContests, setUpcomingContests] = useState<FantasyGame[]>([]);
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [earnings, setEarnings] = useState(0);
  const [fantasyTier, setFantasyTier] = useState("Bronze");
  const [mounted, setMounted] = useState(false);
  const [lastScoreUpdate, setLastScoreUpdate] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Wait for theme to mount
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Check if user has the correct role
  useEffect(() => {
    // Skip checks if status is still loading
    if (status === "loading") {
      return;
    }
    
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    
    // Only redirect if we're sure the session is fully established
    // and the role is definitely not USER
    if (status === "authenticated" && 
        session?.user && 
        'role' in session.user && 
        session.user.role !== "USER") {
      console.log("User role mismatch, redirecting from user dashboard", {
        role: session.user.role
      });
      router.push("/dashboard");
      return;
    }
  }, [status, session, router]);

  // Fetch user data
  useEffect(() => {
    // Fetch all required data
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Fetch active contests
        const activeResponse = await fetch('/api/fantasy-pickleball/contests?status=IN_PROGRESS&limit=2');
        const upcomingResponse = await fetch('/api/fantasy-pickleball/contests?status=UPCOMING&limit=2');
        
        if (!activeResponse.ok || !upcomingResponse.ok) {
          throw new Error("Failed to fetch contests");
        }
        
        const activeData = await activeResponse.json();
        const upcomingData = await upcomingResponse.json();
        
        // Transform to match the FantasyGame interface
        const mapContestToFantasyGame = (contest: any): FantasyGame => ({
          id: contest.id,
          name: contest.name,
          tournamentName: contest.tournament?.name || "Tournament",
          entryFee: contest.entryFee || 0,
          totalPrize: contest.prizePool || 0,
          myTeamRank: contest.myRank || undefined,
          totalParticipants: contest.currentEntries || 0,
          status: contest.status === "IN_PROGRESS" ? "live" : 
                 contest.status === "COMPLETED" ? "completed" : "upcoming",
          startDate: contest.startDate,
          endDate: contest.endDate
        });
        
        const activeContests = (activeData.contests || []).map(mapContestToFantasyGame);
        const upcomingContests = (upcomingData.contests || []).map(mapContestToFantasyGame);
        
        setActiveContests(activeContests);
        setUpcomingContests(upcomingContests);

        // For a real app, fetch the user's wallet, earnings, and tier from an API
        // For now, we'll set them to 0 instead of using mock data
        setWalletBalance(0);
        setEarnings(0);
        setFantasyTier("Bronze");
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (status === "authenticated") {
      fetchUserData();
    }
  }, [status]);

  // Live match polling
  useEffect(() => {
    if (status !== "authenticated") return;

    const pollingIntervalMs = Number(env.NEXT_PUBLIC_POLLING_INTERVAL_MS);
    console.log('[DEBUG] Setting up polling for live matches every', pollingIntervalMs, 'ms');
    
    const fetchLiveMatches = async () => {
      try {
        // Add timestamp to prevent caching
        const timestamp = new Date().getTime();
        console.log(`[DEBUG] Fetching live matches at ${new Date().toISOString()}`);
        
        const response = await fetch(`/api/matches/live?t=${timestamp}`, {
          method: 'GET',
          cache: 'no-store',
          next: { revalidate: 0 },
          headers: {
            'Pragma': 'no-cache',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'X-Requested-With': 'XMLHttpRequest'
          }
        });
        
        if (!response.ok) {
          console.error(`[DEBUG] Error response: ${response.status} ${response.statusText}`);
          throw new Error(`Failed to fetch live matches: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('[DEBUG] Polling: Fetched live matches:', JSON.stringify(data.matches));
        
        // Log current vs new scores to see if there's a change
        if (liveMatches.length > 0 && data.matches.length > 0) {
          liveMatches.forEach(oldMatch => {
            const newMatch = data.matches.find(m => m.id === oldMatch.id);
            if (newMatch) {
              console.log(`[DEBUG] Match ${oldMatch.id} score change: ${oldMatch.teamA.score}-${oldMatch.teamB.score} -> ${newMatch.teamA.score}-${newMatch.teamB.score}`);
            }
          });
        }
        
        setLiveMatches(data.matches || []);
        setLastScoreUpdate(new Date());
      } catch (error) {
        console.error("[DEBUG] Error polling live matches:", error);
      }
    };
    
    // Fetch immediately on mount
    fetchLiveMatches();
    
    // Set up polling interval
    const intervalId = setInterval(fetchLiveMatches, pollingIntervalMs);
    
    // Clean up on unmount
    return () => {
      console.log('[DEBUG] Clearing live matches polling interval');
      clearInterval(intervalId);
    };
  }, [status, liveMatches]);

  // Handle manual refresh of matches
  const handleRefreshScores = async () => {
    try {
      setRefreshing(true);
      
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/matches/live?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch live matches");
      }
      
      const data = await response.json();
      console.log('Manual refresh: Fetched live matches:', data.matches);
      setLiveMatches(data.matches || []);
      setLastScoreUpdate(new Date());
    } catch (error) {
      console.error("Error refreshing live matches:", error);
    } finally {
      setRefreshing(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
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
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-500">
            MatchUp
          </h1>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => router.push("/fantasy/contests")}
              className="hidden md:flex items-center gap-1"
            >
              <Trophy className="h-4 w-4" />
              Contests
            </Button>
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => router.push("/tournaments")}
              className="hidden md:flex items-center gap-1"
            >
              <Calendar className="h-4 w-4" />
              Tournaments
            </Button>
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => router.push("/user/profile")}
              className="flex items-center gap-1"
            >
              <User className="h-4 w-4" />
              Profile
            </Button>
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="h-[1.2rem] w-[1.2rem]" />
                ) : (
                  <Moon className="h-[1.2rem] w-[1.2rem]" />
                )}
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome section */}
        <section className="mb-8">
          <div className="bg-gradient-to-r from-blue-500/10 to-teal-400/10 rounded-lg p-6 border border-blue-500/20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold">
                  Welcome back, {session?.user?.name || "User"}!
                </h2>
                <p className="text-muted-foreground mt-1">
                  Manage your fantasy games and track your performance across tournaments.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.push("/fantasy/teams")}
                  className="flex items-center gap-1"
                >
                  <Users className="h-4 w-4" />
                  My Teams
                </Button>
                <Button
                  onClick={() => router.push("/fantasy/contests")}
                  className="bg-gradient-to-r from-blue-500 to-teal-400 hover:from-blue-600 hover:to-teal-500 text-white"
                >
                  <Star className="h-4 w-4 mr-2" />
                  Join Contest
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats section */}
        <section className="mb-8">
          <h3 className="text-lg font-medium mb-4">Your Stats</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Wallet Balance</p>
                    <h3 className="text-2xl font-bold text-blue-500 mt-1">${walletBalance}</h3>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-900/30 p-2 rounded-full text-blue-500">
                    <Wallet className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Contests</p>
                    <h3 className="text-2xl font-bold text-[#27D3C3] mt-1">{activeContests.length}</h3>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-900/30 p-2 rounded-full text-[#27D3C3]">
                    <Trophy className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Current Earnings</p>
                    <h3 className="text-2xl font-bold text-blue-500 mt-1">${earnings}</h3>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-900/30 p-2 rounded-full text-blue-500">
                    <DollarSign className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Fantasy Tier</p>
                    <h3 className="text-2xl font-bold text-[#27D3C3] mt-1">{fantasyTier}</h3>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-900/30 p-2 rounded-full text-[#27D3C3]">
                    <Star className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Active Contests */}
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Active Fantasy Contests</CardTitle>
                  <Button 
                    variant="link" 
                    className="text-sm gap-1 text-blue-500"
                    onClick={() => router.push("/fantasy/contests")}
                  >
                    View All
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>Your ongoing fantasy contests</CardDescription>
              </CardHeader>
              <CardContent>
                {activeContests.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No active contests found</p>
                    <Button 
                      variant="link" 
                      className="mt-2 text-blue-500"
                      onClick={() => router.push("/fantasy/contests")}
                    >
                      Join a fantasy contest
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeContests.map((contest) => (
                      <div 
                        key={contest.id} 
                        className="p-4 rounded-lg border border-blue-500/20 hover:bg-blue-500/5 transition-colors cursor-pointer"
                        onClick={() => router.push(`/fantasy/contests/${contest.id}`)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium text-lg">{contest.name}</h4>
                            <p className="text-sm text-muted-foreground">{contest.tournamentName}</p>
                          </div>
                          <Badge className="bg-[#27D3C3] text-black">
                            LIVE
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 mt-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Entry Fee</p>
                            <p className="font-medium">${contest.entryFee}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Prize Pool</p>
                            <p className="font-medium">${contest.totalPrize.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Your Rank</p>
                            <p className="font-medium">{contest.myTeamRank || '-'} of {contest.totalParticipants}</p>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center mt-4">
                          <p className="text-xs text-muted-foreground">
                            {new Date(contest.startDate).toLocaleDateString()} - {new Date(contest.endDate).toLocaleDateString()}
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/fantasy/contests/${contest.id}/team`);
                            }}
                          >
                            Manage Team
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Fantasy Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart className="h-5 w-5 mr-2 text-blue-500" />
                  Fantasy Performance
                </CardTitle>
                <CardDescription>Your performance across all fantasy contests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center p-12 border border-dashed border-gray-700 rounded-md">
                  <div className="text-center">
                    <p className="text-gray-400 mb-2">No performance data yet</p>
                    <p className="text-sm text-gray-500">
                      Join a fantasy contest to start tracking your performance
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Live Scores & Upcoming Contests */}
          <div className="space-y-8">
            {/* User Leaderboard Section */}
            <LeaderboardTabs />

            {/* Live Match Scores */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center">
                    <ActivityIcon className="h-5 w-5 mr-2 text-[#27D3C3]" />
                    Live Scores
                  </CardTitle>
                  <Button 
                    variant="link" 
                    className="text-sm gap-1 text-[#27D3C3]"
                    onClick={() => router.push("/fantasy/live-scores")}
                  >
                    View All
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>
                  Current tournament matches
                  {lastScoreUpdate && (
                    <span className="text-xs ml-2 text-muted-foreground">
                      Last updated: {lastScoreUpdate.toLocaleTimeString()}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {liveMatches.length > 0 ? (
                  <div className="space-y-4">
                    {liveMatches.map((match) => (
                      <div 
                        key={match.id} 
                        className="p-4 rounded-lg border border-[#27D3C3]/20 hover:bg-[#27D3C3]/5"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{match.teamA.name} vs. {match.teamB.name}</h4>
                          <Badge className="bg-[#27D3C3] text-black">
                            LIVE
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{match.tournamentName} - {match.round}</p>
                        <div className="flex justify-between items-center font-medium">
                          <span>{match.teamA.name}</span>
                          <span className="text-xl">{match.teamA.score} - {match.teamB.score}</span>
                          <span>{match.teamB.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <ActivityIcon className="h-10 w-10 text-gray-500 mx-auto mb-2" />
                    <p className="text-gray-300 font-medium">No live matches</p>
                    <p className="text-gray-400 text-sm mt-1">Check back later for live scores</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-0">
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={handleRefreshScores}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Scores
                </Button>
              </CardFooter>
            </Card>

            {/* Upcoming Contests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-blue-500" />
                  Upcoming Contests
                </CardTitle>
                <CardDescription>Fantasy contests open for entry</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingContests.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingContests.map((contest) => (
                      <div 
                        key={contest.id} 
                        className="p-4 rounded-lg border border-blue-500/20 hover:bg-blue-500/5 transition-colors cursor-pointer"
                        onClick={() => router.push(`/fantasy/contests/${contest.id}`)}
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium">{contest.name}</h4>
                          <Badge variant="outline" className="border-blue-500 text-blue-500">
                            Upcoming
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 mb-3">{contest.tournamentName}</p>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                          <div>
                            <p className="text-muted-foreground">Entry Fee</p>
                            <p className="font-medium">${contest.entryFee}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Prize Pool</p>
                            <p className="font-medium">${contest.totalPrize.toLocaleString()}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {new Date(contest.startDate).toLocaleDateString()} - {new Date(contest.endDate).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/fantasy/contests/${contest.id}/join`);
                          }}
                        >
                          Join Contest
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Calendar className="h-10 w-10 text-gray-500 mx-auto mb-2" />
                    <p className="text-gray-300 font-medium">No upcoming contests</p>
                    <p className="text-gray-400 text-sm mt-1">Check back later for new contests</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-0">
                <Button 
                  className="w-full bg-gradient-to-r from-blue-500 to-teal-400 hover:from-blue-600 hover:to-teal-500 text-white"
                  onClick={() => router.push("/fantasy/contests")}
                >
                  Browse All Contests
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}