"use client";

import React, { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { RedoIcon, ChevronLeft, TrophyIcon, ActivityIcon } from "lucide-react";
import LiveMatchCard from "@/components/fantasy-pickleball/LiveMatchCard";
import RecentUpdatesCard from "@/components/fantasy-pickleball/RecentUpdatesCard";
import LeaderboardTable from "@/components/fantasy-pickleball/LeaderboardTable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface LiveMatch {
  id: number;
  contestId: number;
  teamA: {
    id: number;
    name: string;
    profileImage?: string;
    score: number;
    ownership?: number;
  };
  teamB: {
    id: number;
    name: string;
    profileImage?: string;
    score: number;
    ownership?: number;
  };
  status: "upcoming" | "live" | "completed";
  startTime: string;
  court?: string;
  round?: string;
  tournamentId: number;
  tournamentName: string;
}

interface UpdateEvent {
  id: string;
  timestamp: string;
  type: "score" | "point" | "match" | "contest";
  description: string;
  points?: number;
  player?: {
    id: number;
    name: string;
  };
  team?: {
    id: number;
    name: string;
  };
  matchId?: number;
  contestId?: number;
  isPositive?: boolean;
}

interface LeaderboardTeam {
  id: number;
  rank: number;
  previousRank?: number;
  name: string;
  ownerName: string;
  points: number;
  isUserTeam: boolean;
}

interface ContestData {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  status: "upcoming" | "active" | "completed";
  prizePool: number;
  entryFee: number;
  maxTeams: number;
  registeredTeams: number;
  tournaments: {
    id: number;
    name: string;
  }[];
}

export default function LiveScoresPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const contestId = searchParams.get("contestId");
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [activeContests, setActiveContests] = useState<ContestData[]>([]);
  const [selectedContest, setSelectedContest] = useState<number | null>(contestId ? parseInt(contestId) : null);
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [updates, setUpdates] = useState<UpdateEvent[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardTeam[]>([]);
  
  // Fetch active contests
  useEffect(() => {
    async function fetchContests() {
      try {
        setLoading(true);
        const response = await fetch('/api/fantasy-pickleball/contests/active');
        if (response.ok) {
          const data = await response.json();
          setActiveContests(data.contests || []);
          
          // If no contest is selected and we have contests, select the first one
          if (!selectedContest && data.contests && data.contests.length > 0) {
            setSelectedContest(data.contests[0].id);
          } else if (data.contests && data.contests.length === 0) {
            // If there are no active contests, set loading to false
            setLoading(false);
          }
        } else {
          console.error("Failed to fetch active contests");
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching contests:", error);
        setLoading(false);
      }
    }
    
    fetchContests();
  }, []);
  
  // Fetch live data for selected contest
  useEffect(() => {
    if (!selectedContest) return;
    
    async function fetchLiveData() {
      setRefreshing(true);
      try {
        const response = await fetch(`/api/fantasy-pickleball/contests/${selectedContest}/live`);
        if (response.ok) {
          const data = await response.json();
          setLiveMatches(data.matches || []);
          setUpdates(data.updates || []);
          setLeaderboard(data.leaderboard || []);
          setLastUpdated(new Date());
        } else {
          console.error("Failed to fetch live data");
        }
      } catch (error) {
        console.error("Error fetching live data:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }
    
    fetchLiveData();
    
    // Set up polling interval (every 30 seconds)
    const interval = setInterval(fetchLiveData, 30000);
    
    return () => clearInterval(interval);
  }, [selectedContest]);
  
  // Handle contest change
  const handleContestChange = (contestId: number) => {
    setSelectedContest(contestId);
    router.push(`/fantasy/live-scores?contestId=${contestId}`);
  };
  
  // Handle manual refresh
  const handleRefresh = async () => {
    if (!selectedContest || refreshing) return;
    
    setRefreshing(true);
    try {
      const response = await fetch(`/api/fantasy-pickleball/contests/${selectedContest}/live`);
      if (response.ok) {
        const data = await response.json();
        setLiveMatches(data.matches || []);
        setUpdates(data.updates || []);
        setLeaderboard(data.leaderboard || []);
        setLastUpdated(new Date());
      } else {
        console.error("Failed to refresh live data");
      }
    } catch (error) {
      console.error("Error refreshing live data:", error);
    } finally {
      setRefreshing(false);
    }
  };
  
  // Get current contest name
  const getCurrentContestName = () => {
    if (!selectedContest) return "Live Scores";
    const contest = activeContests.find(c => c.id === selectedContest);
    return contest ? contest.name : "Live Scores";
  };
  
  return (
    <div className="container mx-auto py-6 max-w-7xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/fantasy/contests">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">{getCurrentContestName()}</h1>
          </div>
          <p className="text-gray-400 text-sm mt-1">
            Live match updates and fantasy points
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-400">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            {refreshing ? (
              <RedoIcon className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RedoIcon className="h-3.5 w-3.5" />
            )}
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Contest selector */}
      {activeContests.length > 0 && (
        <div className="mb-6">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex space-x-2 pb-2">
              {activeContests.map((contest) => (
                <Button
                  key={contest.id}
                  variant={selectedContest === contest.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleContestChange(contest.id)}
                  className={`transition-all ${selectedContest === contest.id ? 'bg-[#27D3C3] hover:bg-[#27D3C3]/90 text-black' : ''}`}
                >
                  {contest.name}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
      
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[500px]">
          <Card className="md:col-span-2 animate-pulse bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="h-7 bg-gray-700 rounded-md w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-700 rounded-md w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-40 bg-gray-700 rounded-md"></div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <div className="space-y-6">
            <Card className="animate-pulse bg-gray-800 border-gray-700 h-[250px]">
              <CardHeader>
                <div className="h-7 bg-gray-700 rounded-md w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-7 bg-gray-700 rounded-md"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card className="animate-pulse bg-gray-800 border-gray-700 h-[230px]">
              <CardHeader>
                <div className="h-7 bg-gray-700 rounded-md w-2/3"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-10 bg-gray-700 rounded-md"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : !selectedContest ? (
        <div className="flex flex-col items-center justify-center bg-gray-800 border border-gray-700 rounded-lg p-12 text-center">
          <ActivityIcon className="h-16 w-16 text-gray-500 mb-4" />
          <h3 className="text-xl font-medium mb-2">No Active Contests</h3>
          <p className="text-gray-400 mb-6 max-w-md">
            There are no active contests with live scoring available at the moment.
            Check back later or join an upcoming contest.
          </p>
          <Link href="/fantasy/contests">
            <Button className="bg-[#27D3C3] hover:bg-[#27D3C3]/90 text-black">Browse Contests</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tabs for mobile view */}
          <div className="md:hidden w-full">
            <Tabs defaultValue="matches" className="w-full">
              <TabsList className="w-full mb-4">
                <TabsTrigger value="matches" className="flex-1 data-[state=active]:bg-[#27D3C3] data-[state=active]:text-black">Matches</TabsTrigger>
                <TabsTrigger value="leaderboard" className="flex-1 data-[state=active]:bg-[#27D3C3] data-[state=active]:text-black">Leaderboard</TabsTrigger>
                <TabsTrigger value="updates" className="flex-1 data-[state=active]:bg-[#27D3C3] data-[state=active]:text-black">Updates</TabsTrigger>
              </TabsList>
              
              <TabsContent value="matches" className="mt-0">
                <div className="space-y-4">
                  {liveMatches.length > 0 ? (
                    liveMatches.map((match) => (
                      <LiveMatchCard 
                        key={match.id}
                        match={match}
                        contestId={selectedContest}
                      />
                    ))
                  ) : (
                    <Card className="bg-gray-800 border-gray-700">
                      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <TrophyIcon className="h-12 w-12 text-gray-500 mb-3" />
                        <h3 className="text-lg font-medium mb-1">No Live Matches</h3>
                        <p className="text-gray-400 text-sm">
                          There are no matches currently in progress for this contest.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="leaderboard" className="mt-0">
                <LeaderboardTable 
                  teams={leaderboard}
                  title="Contest Leaderboard"
                  description="Fantasy team standings"
                />
              </TabsContent>
              
              <TabsContent value="updates" className="mt-0">
                <RecentUpdatesCard 
                  updates={updates}
                  onRefresh={handleRefresh}
                  lastUpdated={lastUpdated}
                  description="Live point updates from matches"
                  refreshInterval={30000}
                />
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Desktop layout */}
          <div className="hidden md:block md:col-span-2 space-y-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl text-white">Live Matches</CardTitle>
                <CardDescription className="text-gray-400">
                  Real-time match scores and statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {liveMatches.length > 0 ? (
                    liveMatches.map((match) => (
                      <LiveMatchCard 
                        key={match.id}
                        match={match}
                        contestId={selectedContest}
                      />
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <TrophyIcon className="h-12 w-12 text-gray-500 mb-3" />
                      <h3 className="text-lg font-medium mb-1">No Live Matches</h3>
                      <p className="text-gray-400 text-sm">
                        There are no matches currently in progress for this contest.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="hidden md:flex md:flex-col space-y-6">
            <LeaderboardTable 
              teams={leaderboard}
              maxHeight="320px"
              title="Contest Leaderboard"
              description="Fantasy team standings"
            />
            
            <RecentUpdatesCard 
              updates={updates}
              onRefresh={handleRefresh}
              lastUpdated={lastUpdated}
              description="Live point updates from matches"
              refreshInterval={30000}
            />
          </div>
        </div>
      )}
    </div>
  );
} 