"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy,
  Calendar,
  Users,
  DollarSign,
  Info,
  Clock,
  Star,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ContestDetailPageProps {
  params: {
    id: string;
  };
}

interface Contest {
  id: number;
  name: string;
  entryFee: number;
  prizePool: number;
  maxEntries: number;
  currentEntries: number;
  startDate: string;
  endDate: string;
  status: "UPCOMING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  description?: string;
  tournament: {
    id: number;
    name: string;
    location: string;
    startDate: string;
    endDate: string;
  };
  isDynamicPrizePool?: boolean;
}

interface UserTeam {
  id: number;
  name: string;
  totalPoints: number;
  rank?: number;
}

export default function ContestDetailPage({ params }: ContestDetailPageProps) {
  const contestId = params.id;
  const [contest, setContest] = useState<Contest | null>(null);
  const [userTeam, setUserTeam] = useState<UserTeam | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    const fetchContestData = async () => {
      try {
        setLoading(true);
        
        // Fetch contest details
        const contestResponse = await fetch(`/api/fantasy-pickleball/contests/${contestId}`);
        
        if (!contestResponse.ok) {
          throw new Error("Failed to fetch contest details");
        }
        
        const contestData = await contestResponse.json();
        setContest(contestData.contest);
        
        // If user is authenticated, check if they have a team in this contest
        if (status === "authenticated") {
          try {
            const teamResponse = await fetch(`/api/fantasy-pickleball/contests/${contestId}/user-team`);
            
            if (teamResponse.ok) {
              const teamData = await teamResponse.json();
              if (teamData.team) {
                setUserTeam(teamData.team);
              }
            }
          } catch (teamError) {
            console.error("Error fetching user team:", teamError);
            // Don't set error state here, as the main contest data loaded successfully
          }
        }
      } catch (error) {
        console.error("Error fetching contest data:", error);
        setError(error instanceof Error ? error.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };
    
    fetchContestData();
  }, [contestId, status]);

  const handleJoinContest = () => {
    if (status !== "authenticated") {
      console.log("User not authenticated, redirecting to login");
      router.push("/auth/signin?callbackUrl=" + encodeURIComponent(`/fantasy/contests/${contestId}/join`));
      return;
    }
    
    console.log(`Navigating to join contest page: ${contestId}`);
    router.push(`/fantasy/contests/${contestId}/join`);
  };
  
  const handleViewTeam = () => {
    router.push(`/fantasy/contests/${contestId}/team`);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <h2 className="text-xl font-medium">Loading contest details...</h2>
      </div>
    );
  }

  if (error || !contest) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || "Contest not found"}</AlertDescription>
        </Alert>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => router.push("/fantasy/contests")}
        >
          Back to Contests
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold">{contest.name}</h1>
            <p className="text-muted-foreground mt-1">{contest.tournament.name}</p>
          </div>
          
          <Badge 
            className={
              contest.status === "UPCOMING" 
                ? "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-500/20" 
                : contest.status === "IN_PROGRESS"
                ? "bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20"
                : "bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 border-purple-500/20"
            }
          >
            {contest.status === "UPCOMING" && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>Upcoming</span>
              </div>
            )}
            {contest.status === "IN_PROGRESS" && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Live</span>
              </div>
            )}
            {contest.status === "COMPLETED" && (
              <div className="flex items-center gap-1">
                <Trophy className="w-3 h-3" />
                <span>Completed</span>
              </div>
            )}
          </Badge>
        </div>
        
        {contest.description && (
          <p className="text-muted-foreground mb-6">{contest.description}</p>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center">
              <DollarSign className="h-5 w-5 text-primary mr-3" />
              <div>
                <p className="text-xs text-muted-foreground">Entry Fee</p>
                <p className="font-medium">₹{contest.entryFee.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center">
              <Trophy className="h-5 w-5 text-primary mr-3" />
              <div>
                <p className="text-xs text-muted-foreground">Prize Pool</p>
                <div className="flex items-center gap-1">
                  <p className="font-medium">₹{contest.prizePool.toLocaleString()}</p>
                  {contest.isDynamicPrizePool && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs w-[220px]">Dynamic prize pool (77.64% of all entry fees) - increases with each entry!</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center">
              <Users className="h-5 w-5 text-primary mr-3" />
              <div>
                <p className="text-xs text-muted-foreground">Entries</p>
                <p className="font-medium">{contest.currentEntries}/{contest.maxEntries}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center">
              <Calendar className="h-5 w-5 text-primary mr-3" />
              <div>
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="font-medium">{formatDate(contest.startDate)} - {formatDate(contest.endDate)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="mb-8">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Contest Overview</CardTitle>
              <CardDescription>Details about this fantasy contest</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Tournament Information</h3>
                  <p className="text-sm text-muted-foreground">
                    This fantasy contest is based on the {contest.tournament.name} tournament, 
                    taking place from {formatDate(contest.tournament.startDate)} to {formatDate(contest.tournament.endDate)} 
                    at {contest.tournament.location}.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Contest Status</h3>
                  <p className="text-sm text-muted-foreground">
                    {contest.status === "UPCOMING" && (
                      <>This contest is upcoming and will start on {formatDate(contest.startDate)}.</>
                    )}
                    {contest.status === "IN_PROGRESS" && (
                      <>This contest is currently live and will end on {formatDate(contest.endDate)}.</>
                    )}
                    {contest.status === "COMPLETED" && (
                      <>This contest has ended. The winners have been determined.</>
                    )}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Prize Distribution</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {contest.isDynamicPrizePool 
                      ? "This contest features a dynamic prize pool that grows with each entry. 77.64% of all entry fees go directly to the prize pool." 
                      : "This contest has a fixed prize pool set by the tournament organizers."}
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span>1st Place</span>
                      <span>{contest.currentEntries < 5 ? "100%" : contest.currentEntries <= 8 ? "70%" : contest.currentEntries <= 15 ? "60%" : contest.currentEntries <= 25 ? "50%" : "40%"}</span>
                    </div>
                    {contest.currentEntries >= 5 && (
                      <div className="flex justify-between text-sm">
                        <span>2nd Place</span>
                        <span>{contest.currentEntries <= 8 ? "30%" : contest.currentEntries <= 15 ? "25%" : contest.currentEntries <= 25 ? "25%" : "20%"}</span>
                      </div>
                    )}
                    {contest.currentEntries >= 9 && (
                      <div className="flex justify-between text-sm">
                        <span>3rd Place</span>
                        <span>{contest.currentEntries <= 15 ? "15%" : contest.currentEntries <= 25 ? "15%" : "15%"}</span>
                      </div>
                    )}
                    {contest.currentEntries >= 16 && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span>4th Place</span>
                          <span>7%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>5th Place</span>
                          <span>{contest.currentEntries <= 25 ? "3%" : "5%"}</span>
                        </div>
                      </>
                    )}
                    {contest.currentEntries > 25 && (
                      <div className="flex justify-between text-sm">
                        <span>6th - 10th Place</span>
                        <span>13% (distributed)</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {userTeam && (
                  <div className="bg-primary/5 p-4 rounded-lg">
                    <h3 className="font-medium mb-2 flex items-center">
                      <Star className="h-4 w-4 text-yellow-500 mr-2" />
                      Your Team
                    </h3>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{userTeam.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Points: {userTeam.totalPoints}
                        </p>
                      </div>
                      {userTeam.rank && (
                        <Badge variant="outline" className="font-medium">
                          Rank: {userTeam.rank}/{contest.currentEntries}
                        </Badge>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3"
                      onClick={handleViewTeam}
                    >
                      View Team
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              {!userTeam && contest.status === "UPCOMING" && (
                <Button 
                  className="w-full"
                  onClick={handleJoinContest}
                >
                  Join Contest
                </Button>
              )}
              {userTeam && (
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={handleViewTeam}
                >
                  View Your Team
                </Button>
              )}
              {!userTeam && contest.status !== "UPCOMING" && (
                <Alert variant="default" className="w-full">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Contest has started</AlertTitle>
                  <AlertDescription>
                    This contest has already started and is no longer accepting new entries.
                  </AlertDescription>
                </Alert>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="leaderboard" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Leaderboard</CardTitle>
              <CardDescription>Current standings in this contest</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-8 text-muted-foreground">
                Leaderboard will be available once the contest starts.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="rules" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Contest Rules</CardTitle>
              <CardDescription>How points are calculated</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Team Creation</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                    <li>Select players within your budget</li>
                    <li>Choose a captain (2x points) and vice-captain (1.5x points)</li>
                    <li>Your team must include players from different skill levels</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Scoring System</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                    <li>Win a match: 30 points</li>
                    <li>Win a game: 10 points</li>
                    <li>Each point scored: 0.5 points</li>
                    <li>Win by 11-0: 15 bonus points</li>
                    <li>Win by less than 5 points: 10 bonus points</li>
                    <li>Knockout stages: Points are multiplied by 1.5x</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 