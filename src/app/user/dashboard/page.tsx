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
} from "lucide-react";

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

interface StatsItem {
  label: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
}

export default function UserDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [activeContests, setActiveContests] = useState<FantasyGame[]>([]);
  const [upcomingContests, setUpcomingContests] = useState<FantasyGame[]>([]);
  
  // Check if user has the correct role
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    
    if (status === "authenticated" && session?.user?.role !== "USER") {
      router.push("/dashboard");
      return;
    }
  }, [status, session, router]);

  // Fetch user data
  useEffect(() => {
    // This would be replaced with actual API calls in production
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
          tournamentName: contest.tournament.name,
          entryFee: contest.entryFee,
          totalPrize: contest.prizePool,
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

  const statsData: StatsItem[] = [
    {
      label: "Wallet Balance",
      value: "$425",
      change: 12.5,
      icon: <Wallet className="h-5 w-5" />,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Active Contests",
      value: activeContests.length,
      icon: <Trophy className="h-5 w-5" />,
      color: "text-teal-600 dark:text-teal-400",
    },
    {
      label: "Current Earnings",
      value: "$275",
      change: 8.3,
      icon: <DollarSign className="h-5 w-5" />,
      color: "text-green-600 dark:text-green-400",
    },
    {
      label: "Fantasy Tier",
      value: "Silver",
      icon: <Star className="h-5 w-5" />,
      color: "text-purple-600 dark:text-purple-400",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      {/* Top navigation bar */}
      <header className="border-b sticky top-0 z-10 bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-500">
            Fantasy Dashboard
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
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome section */}
        <section className="mb-8">
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-6 border border-blue-500/20">
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
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
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
            {statsData.map((stat, index) => (
              <Card key={index} className="bg-gradient-to-br from-slate-50/50 to-slate-100/50 dark:from-slate-950/20 dark:to-slate-900/20 border-slate-200/50 dark:border-slate-800/30">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                      <h3 className={`text-2xl font-bold ${stat.color} mt-1`}>{stat.value}</h3>
                      {stat.change !== undefined && (
                        <p className="text-xs flex items-center mt-1 text-green-600 dark:text-green-400">
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                          {stat.change}% from last month
                        </p>
                      )}
                    </div>
                    <div className={`bg-slate-100 dark:bg-slate-900/30 p-2 rounded-full ${stat.color}`}>
                      {stat.icon}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
                    className="text-sm gap-1"
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
                      className="mt-2"
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
                        className="p-4 rounded-lg border border-blue-200/40 dark:border-blue-800/30 hover:bg-blue-50/50 dark:hover:bg-blue-950/10 transition-colors cursor-pointer"
                        onClick={() => router.push(`/fantasy/contests/${contest.id}`)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium text-lg">{contest.name}</h4>
                            <p className="text-sm text-muted-foreground">{contest.tournamentName}</p>
                          </div>
                          <Badge variant={contest.status === "live" ? "default" : "outline"} className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
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
                            <p className="font-medium">{contest.myTeamRank} of {contest.totalParticipants}</p>
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
                <CardTitle>Fantasy Performance</CardTitle>
                <CardDescription>Your performance across all fantasy contests</CardDescription>
              </CardHeader>
              <CardContent>
                {/* This would be a real chart in production */}
                <div className="aspect-[16/9] bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/10 dark:to-purple-950/10 rounded-lg flex flex-col items-center justify-center p-6 border border-blue-200/30 dark:border-blue-800/20">
                  <BarChart className="h-16 w-16 text-blue-500/40 dark:text-blue-400/40 mb-4" />
                  <p className="text-center text-muted-foreground max-w-md">
                    Your fantasy performance chart would appear here, showing points earned over time and contest placement history.
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => router.push("/fantasy/stats")}
                  >
                    View Detailed Stats
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Live Scores & Upcoming Contests */}
          <div className="space-y-8">
            {/* Live Match Scores */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle>Live Scores</CardTitle>
                  <Button 
                    variant="link" 
                    className="text-sm gap-1"
                    onClick={() => router.push("/live-scores")}
                  >
                    View All
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>Current tournament matches</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg border border-blue-200/40 dark:border-blue-800/30 hover:bg-blue-50/50 dark:hover:bg-blue-950/10">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">Smith vs. Johnson</h4>
                      <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                        LIVE
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">Summer Grand Slam - Quarter Finals</p>
                    <div className="flex justify-between items-center font-medium">
                      <span>Smith</span>
                      <span className="text-xl">11-8, 9-11, 6-5</span>
                      <span>Johnson</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full mt-2"
                      onClick={() => router.push("/live-scores/match/1")}
                    >
                      <Tv className="h-4 w-4 mr-2" />
                      Watch Live
                    </Button>
                  </div>

                  <div className="p-4 rounded-lg border border-blue-200/40 dark:border-blue-800/30 hover:bg-blue-50/50 dark:hover:bg-blue-950/10">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">Garcia/Lopez vs. Kim/Park</h4>
                      <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                        LIVE
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">Masters Invitational - Doubles Semi-Finals</p>
                    <div className="flex justify-between items-center font-medium">
                      <span>Garcia/Lopez</span>
                      <span className="text-xl">11-7, 11-9</span>
                      <span>Kim/Park</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full mt-2"
                      onClick={() => router.push("/live-scores/match/2")}
                    >
                      <Tv className="h-4 w-4 mr-2" />
                      Watch Live
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Contests */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Contests</CardTitle>
                <CardDescription>Fantasy contests open for entry</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingContests.map((contest) => (
                    <div 
                      key={contest.id} 
                      className="p-4 rounded-lg border border-purple-200/40 dark:border-purple-800/30 hover:bg-purple-50/50 dark:hover:bg-purple-950/10 transition-colors cursor-pointer"
                      onClick={() => router.push(`/fantasy/contests/${contest.id}`)}
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">{contest.name}</h4>
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
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
              </CardContent>
              <CardFooter className="pt-0">
                <Button 
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
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