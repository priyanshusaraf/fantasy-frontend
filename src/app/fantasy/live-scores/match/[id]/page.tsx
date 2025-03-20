"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronLeft,
  Clock,
  MapPin,
  Trophy,
  UserIcon,
  PieChartIcon,
  BarChart3Icon,
  ActivityIcon,
  CheckIcon,
  XIcon,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import RecentUpdatesCard from "@/components/fantasy-pickleball/RecentUpdatesCard";

interface MatchTeam {
  id: number;
  name: string;
  profileImage?: string;
  score: number;
  ownership?: number;
  scoreHistory?: number[];
  fantasyPoints?: number;
}

interface MatchDetails {
  id: number;
  contestId: number;
  tournamentId: number;
  tournamentName: string;
  round: string;
  court: string;
  status: "upcoming" | "live" | "completed";
  startTime: string;
  teamA: MatchTeam;
  teamB: MatchTeam;
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

export default function MatchDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const matchId = params?.id ? parseInt(params.id as string) : null;
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [match, setMatch] = useState<MatchDetails | null>(null);
  const [updates, setUpdates] = useState<UpdateEvent[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Fetch match details
  useEffect(() => {
    async function fetchMatchDetails() {
      if (!matchId) return;
      
      setLoading(true);
      try {
        // In a real app, these would be separate API calls
        // For simplicity, we're combining them
        const response = await fetch(`/api/fantasy-pickleball/matches/${matchId}`);
        if (response.ok) {
          const data = await response.json();
          setMatch(data.match);
          setUpdates(data.updates || []);
          setLastUpdated(new Date());
        } else {
          console.error("Failed to fetch match details");
        }
      } catch (error) {
        console.error("Error fetching match details:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchMatchDetails();
    
    // Set up polling interval (every 15 seconds)
    const interval = setInterval(() => {
      if (!refreshing) {
        fetchMatchDetails();
      }
    }, 15000);
    
    return () => clearInterval(interval);
  }, [matchId, refreshing]);
  
  // Handle manual refresh
  const handleRefresh = async () => {
    if (!matchId || refreshing) return;
    
    setRefreshing(true);
    try {
      const response = await fetch(`/api/fantasy-pickleball/matches/${matchId}`);
      if (response.ok) {
        const data = await response.json();
        setMatch(data.match);
        setUpdates(data.updates || []);
        setLastUpdated(new Date());
      } else {
        console.error("Failed to refresh match details");
      }
    } catch (error) {
      console.error("Error refreshing match details:", error);
    } finally {
      setRefreshing(false);
    }
  };
  
  // Format match time and date
  const formatMatchTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    };
  };
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "live":
        return <Badge className="bg-green-600 text-white">Live</Badge>;
      case "upcoming":
        return <Badge className="bg-blue-600 text-white">Upcoming</Badge>;
      case "completed":
        return <Badge className="bg-gray-600 text-white">Completed</Badge>;
      default:
        return null;
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto py-6 max-w-7xl">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-gray-700 rounded-full"></div>
            <div className="h-8 bg-gray-700 rounded-md w-1/3"></div>
          </div>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="h-6 bg-gray-700 rounded-md w-1/4 mb-2"></div>
              <div className="h-4 bg-gray-700 rounded-md w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="h-40 bg-gray-700 rounded-md"></div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card className="bg-gray-800 border-gray-700 h-60">
                <CardHeader>
                  <div className="h-6 bg-gray-700 rounded-md w-1/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="h-6 bg-gray-700 rounded-md w-full"></div>
                    <div className="h-6 bg-gray-700 rounded-md w-3/4"></div>
                    <div className="h-6 bg-gray-700 rounded-md w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-1">
              <Card className="bg-gray-800 border-gray-700 h-60">
                <CardHeader>
                  <div className="h-6 bg-gray-700 rounded-md w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="h-6 bg-gray-700 rounded-md w-full"></div>
                    <div className="h-6 bg-gray-700 rounded-md w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!match) {
    return (
      <div className="container mx-auto py-6 max-w-7xl">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/fantasy/live-scores">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Match Details</h1>
        </div>
        
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ActivityIcon className="h-12 w-12 text-gray-500 mb-4" />
            <h2 className="text-xl font-medium mb-2">Match Not Found</h2>
            <p className="text-gray-400 mb-6 max-w-md">
              The match you're looking for doesn't exist or has been removed.
            </p>
            <Link href="/fantasy/live-scores">
              <Button>Return to Live Scores</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const { date, time } = formatMatchTime(match.startTime);
  const scoreA = match.teamA.score;
  const scoreB = match.teamB.score;
  const isTeamAWinning = scoreA > scoreB;
  const isTeamBWinning = scoreB > scoreA;
  const isTied = scoreA === scoreB;
  
  return (
    <div className="container mx-auto py-6 max-w-7xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Link href={`/fantasy/live-scores?contestId=${match.contestId}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Match Details</h1>
            <p className="text-gray-400 text-sm">
              {match.tournamentName} - {match.round}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {getStatusBadge(match.status)}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            {refreshing ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Match Card */}
      <Card className="bg-gray-800 border-gray-700 mb-6">
        <CardContent className="py-6">
          <div className="grid grid-cols-7 items-center">
            {/* Team A */}
            <div className="col-span-3 text-center md:text-right pr-4">
              <div className="text-xl md:text-2xl font-semibold mb-1">{match.teamA.name}</div>
              {match.teamA.ownership !== undefined && (
                <Badge variant="outline" className="bg-gray-700/50 text-gray-300">
                  <UserIcon className="h-3 w-3 mr-1" />
                  {match.teamA.ownership}% ownership
                </Badge>
              )}
              {match.teamA.fantasyPoints !== undefined && (
                <div className="text-indigo-400 text-sm mt-1">
                  <Trophy className="h-3 w-3 inline mr-1" />
                  {match.teamA.fantasyPoints.toFixed(1)} fantasy pts
                </div>
              )}
            </div>
            
            {/* Score */}
            <div className="col-span-1 flex flex-col items-center justify-center">
              <div className="flex items-center bg-gray-700 rounded-lg py-2 px-4 mb-2">
                <span className={`text-2xl md:text-3xl font-bold ${isTeamAWinning ? 'text-green-400' : 'text-white'}`}>
                  {scoreA}
                </span>
                <span className="text-gray-400 mx-2">-</span>
                <span className={`text-2xl md:text-3xl font-bold ${isTeamBWinning ? 'text-green-400' : 'text-white'}`}>
                  {scoreB}
                </span>
              </div>
              
              <div className="flex flex-col items-center">
                {match.status === "live" && (
                  <Badge className="bg-green-600/20 text-green-400 mb-1 animate-pulse">
                    LIVE
                  </Badge>
                )}
                <div className="flex items-center text-xs text-gray-400">
                  <Clock className="h-3 w-3 mr-1" />
                  {time}
                </div>
                <div className="text-xs text-gray-500">{date}</div>
              </div>
            </div>
            
            {/* Team B */}
            <div className="col-span-3 text-center md:text-left pl-4">
              <div className="text-xl md:text-2xl font-semibold mb-1">{match.teamB.name}</div>
              {match.teamB.ownership !== undefined && (
                <Badge variant="outline" className="bg-gray-700/50 text-gray-300">
                  <UserIcon className="h-3 w-3 mr-1" />
                  {match.teamB.ownership}% ownership
                </Badge>
              )}
              {match.teamB.fantasyPoints !== undefined && (
                <div className="text-indigo-400 text-sm mt-1">
                  <Trophy className="h-3 w-3 inline mr-1" />
                  {match.teamB.fantasyPoints.toFixed(1)} fantasy pts
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-center mt-4 text-sm text-gray-400">
            <MapPin className="h-3.5 w-3.5 mr-1" />
            {match.court}
          </div>
        </CardContent>
      </Card>
      
      {/* Content Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Tabs defaultValue="stats" className="w-full">
            <TabsList className="w-full mb-4 bg-gray-800">
              <TabsTrigger value="stats" className="flex-1">
                <BarChart3Icon className="h-4 w-4 mr-2" />
                Statistics
              </TabsTrigger>
              <TabsTrigger value="progress" className="flex-1">
                <ActivityIcon className="h-4 w-4 mr-2" />
                Match Progress
              </TabsTrigger>
              <TabsTrigger value="fantasy" className="flex-1">
                <PieChartIcon className="h-4 w-4 mr-2" />
                Fantasy Impact
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="stats" className="mt-0">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>Match Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* In a real app, we would display actual match statistics */}
                    {/* For now, showing placeholder stats */}
                    {["Points Won", "Errors", "Winners", "Dinks", "Lobs"].map((stat, index) => (
                      <div key={index} className="grid grid-cols-9 items-center">
                        <div className="col-span-4 text-right pr-2">
                          <div className="flex justify-end items-center">
                            <span className="font-medium">{Math.floor(Math.random() * 20) + 5}</span>
                            <div 
                              className="ml-2 h-2 bg-blue-500 rounded-sm" 
                              style={{ width: `${Math.floor(Math.random() * 60) + 20}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="col-span-1 text-center text-xs text-gray-400">
                          {stat}
                        </div>
                        <div className="col-span-4 text-left pl-2">
                          <div className="flex items-center">
                            <div 
                              className="mr-2 h-2 bg-purple-500 rounded-sm" 
                              style={{ width: `${Math.floor(Math.random() * 60) + 20}%` }}
                            ></div>
                            <span className="font-medium">{Math.floor(Math.random() * 20) + 5}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-gray-400">Team A Highlights</h3>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <CheckIcon className="h-3 w-3 text-green-400 mr-2" />
                          Strong serving performance
                        </div>
                        <div className="flex items-center text-sm">
                          <CheckIcon className="h-3 w-3 text-green-400 mr-2" />
                          Effective third shot drops
                        </div>
                        <div className="flex items-center text-sm">
                          <XIcon className="h-3 w-3 text-red-400 mr-2" />
                          Struggling with lob defense
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-gray-400">Team B Highlights</h3>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <CheckIcon className="h-3 w-3 text-green-400 mr-2" />
                          Excellent dink game
                        </div>
                        <div className="flex items-center text-sm">
                          <CheckIcon className="h-3 w-3 text-green-400 mr-2" />
                          Consistent volley winners
                        </div>
                        <div className="flex items-center text-sm">
                          <XIcon className="h-3 w-3 text-red-400 mr-2" />
                          High unforced error count
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="progress" className="mt-0">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>Match Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-40 w-full bg-gray-900 rounded-md p-3 flex items-end mb-4">
                    {/* Mock score chart - in a real app, we would use a proper chart library */}
                    <div className="flex-1 h-full flex items-end justify-around">
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((_, index) => {
                        const aHeight = 10 + Math.floor(Math.random() * 70);
                        const bHeight = 10 + Math.floor(Math.random() * 70);
                        
                        return (
                          <div key={index} className="flex items-end space-x-1">
                            <div 
                              className="w-3 bg-blue-600 rounded-t"
                              style={{ height: `${aHeight}%` }}
                            ></div>
                            <div 
                              className="w-3 bg-purple-600 rounded-t"
                              style={{ height: `${bHeight}%` }}
                            ></div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="flex justify-center items-center mb-4">
                    <div className="flex items-center mr-4">
                      <div className="h-3 w-3 rounded-full bg-blue-600 mr-2"></div>
                      <span className="text-sm">{match.teamA.name}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="h-3 w-3 rounded-full bg-purple-600 mr-2"></div>
                      <span className="text-sm">{match.teamB.name}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mt-6">
                    <h3 className="text-sm font-medium text-gray-400">Key Moments</h3>
                    {[1, 2, 3].map((moment) => (
                      <div key={moment} className="py-2 px-3 bg-gray-700/50 rounded-md">
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-400">
                            {Math.floor(Math.random() * 20) + 1} min ago
                          </span>
                          <Badge 
                            className={
                              moment % 3 === 0 
                                ? "bg-yellow-600/30 text-yellow-300" 
                                : moment % 2 === 0 
                                  ? "bg-blue-600/30 text-blue-300" 
                                  : "bg-purple-600/30 text-purple-300"
                            }
                          >
                            {moment % 3 === 0 
                              ? "Key Moment" 
                              : moment % 2 === 0 
                                ? "Team A" 
                                : "Team B"
                            }
                          </Badge>
                        </div>
                        <p className="text-sm mt-1">
                          {moment % 3 === 0 
                            ? "Crucial break point converted after a long rally." 
                            : moment % 2 === 0 
                              ? `${match.teamA.name} took the lead with a spectacular winner.` 
                              : `${match.teamB.name} saved three consecutive points with great defense.`
                          }
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="fantasy" className="mt-0">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>Fantasy Impact</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-gray-400">
                        {match.teamA.name}
                      </h3>
                      <div className="flex justify-between items-center py-2 px-3 bg-gray-700/50 rounded-md">
                        <span>Fantasy Points</span>
                        <span className="text-indigo-400 font-medium">
                          {match.teamA.fantasyPoints?.toFixed(1) || "0.0"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 px-3 bg-gray-700/50 rounded-md">
                        <span>Ownership</span>
                        <span>
                          {match.teamA.ownership || 0}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 px-3 bg-gray-700/50 rounded-md">
                        <span>Form</span>
                        <Badge className="bg-green-600/30 text-green-300">
                          Good
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-gray-400">
                        {match.teamB.name}
                      </h3>
                      <div className="flex justify-between items-center py-2 px-3 bg-gray-700/50 rounded-md">
                        <span>Fantasy Points</span>
                        <span className="text-indigo-400 font-medium">
                          {match.teamB.fantasyPoints?.toFixed(1) || "0.0"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 px-3 bg-gray-700/50 rounded-md">
                        <span>Ownership</span>
                        <span>
                          {match.teamB.ownership || 0}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 px-3 bg-gray-700/50 rounded-md">
                        <span>Form</span>
                        <Badge className="bg-yellow-600/30 text-yellow-300">
                          Average
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-400">Fantasy Team Impact</h3>
                    <p className="text-sm text-gray-400">
                      {isTeamAWinning ? match.teamA.name : isTeamBWinning ? match.teamB.name : "Both teams"} 
                      {isTied ? " are" : " is"} currently providing better fantasy value. 
                      {isTied 
                        ? " The match is tied and both teams are scoring points." 
                        : isTeamAWinning 
                          ? ` ${match.teamA.name} has a lead of ${scoreA - scoreB} points.` 
                          : ` ${match.teamB.name} has a lead of ${scoreB - scoreA} points.`
                      }
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      Captaining {match.teamA.ownership! > match.teamB.ownership! ? match.teamA.name : match.teamB.name} 
                      could be more valuable due to {match.teamA.ownership! > match.teamB.ownership! ? "higher" : "lower"} ownership percentage 
                      ({match.teamA.ownership! > match.teamB.ownership! ? match.teamA.ownership : match.teamB.ownership}%).
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="md:col-span-1">
          <RecentUpdatesCard 
            updates={updates}
            onRefresh={handleRefresh}
            lastUpdated={lastUpdated}
            description="Match updates and points"
            refreshInterval={15000}
          />
        </div>
      </div>
    </div>
  );
} 