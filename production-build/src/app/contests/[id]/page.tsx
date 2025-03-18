"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Trophy, Users, Calendar, Clock, ChevronRight, 
  Medal, Award, TrendingUp, Info, ArrowUpRight,
  GanttChart, Sparkles, Loader2, Share2
} from "lucide-react";

// Interfaces for our data
interface Contest {
  id: string;
  name: string;
  description: string;
  entryFee: number;
  prizePool: number;
  maxEntries: number;
  currentEntries: number;
  startDate: string;
  endDate: string;
  status: 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  tournamentId: string;
  tournamentName: string;
  skillLevel: string;
  isGuaranteed: boolean;
  rules: {
    maxTeams: number;
    teamSize: number;
    pointSystem: string;
    maxBudget: number;
  };
  prizes: {
    rank: number;
    amount: number;
    percentageOfPool?: number;
  }[];
}

interface TeamEntry {
  id: string;
  rank: number;
  teamName: string;
  ownerName: string;
  points: number;
  captainName: string;
  viceCaptainName: string;
}

interface ContestParams {
  params: {
    id: string;
  };
}

export default function ContestDetailPage({ params }: ContestParams) {
  const router = useRouter();
  const [contest, setContest] = useState<Contest | null>(null);
  const [userTeams, setUserTeams] = useState<TeamEntry[]>([]);
  const [leaderboard, setLeaderboard] = useState<TeamEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Fetch contest details
  useEffect(() => {
    const fetchContestDetails = async () => {
      try {
        setLoading(true);
        
        // In a real application, fetch the contest details from your API
        // const response = await fetch(`/api/contests/${params.id}`);
        // if (!response.ok) throw new Error('Failed to fetch contest details');
        // const data = await response.json();
        
        // Mock data for demonstration
        // This would be replaced with actual API data
        const mockContest: Contest = {
          id: params.id,
          name: 'Summer Slam Fantasy Challenge',
          description: 'Join the ultimate pickleball fantasy contest of the summer! Create your dream team of pro players and win big prizes based on their performance in the Summer Slam Championship tournament.',
          entryFee: 25,
          prizePool: 5000,
          maxEntries: 500,
          currentEntries: 320,
          startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'UPCOMING',
          tournamentId: 'tournament-1',
          tournamentName: 'Summer Slam Championship',
          skillLevel: 'Pro',
          isGuaranteed: true,
          rules: {
            maxTeams: 3,
            teamSize: 6,
            pointSystem: 'Standard Fantasy Points',
            maxBudget: 100,
          },
          prizes: [
            { rank: 1, amount: 1500, percentageOfPool: 30 },
            { rank: 2, amount: 1000, percentageOfPool: 20 },
            { rank: 3, amount: 500, percentageOfPool: 10 },
            { rank: 4, amount: 300, percentageOfPool: 6 },
            { rank: 5, amount: 200, percentageOfPool: 4 },
          ],
        };
        
        // Mock leaderboard data
        const mockLeaderboard: TeamEntry[] = Array.from({ length: 50 }, (_, i) => ({
          id: `team-${i+1}`,
          rank: i + 1,
          teamName: `Pickle Power ${i+1}`,
          ownerName: `User${i+1}`,
          points: 1000 - (i * 15) + Math.floor(Math.random() * 10),
          captainName: `Player Captain ${i+1}`,
          viceCaptainName: `Player VC ${i+1}`,
        }));
        
        // Mock user's teams (if the user has any)
        const mockUserTeams: TeamEntry[] = [
          {
            id: 'user-team-1',
            rank: 12,
            teamName: 'My Awesome Team',
            ownerName: 'CurrentUser',
            points: 850,
            captainName: 'Ben Johns',
            viceCaptainName: 'Anna Leigh Waters',
          }
        ];
        
        setContest(mockContest);
        setLeaderboard(mockLeaderboard);
        setUserTeams(mockUserTeams);
      } catch (err) {
        console.error('Error fetching contest details:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        toast.error('Failed to load contest details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchContestDetails();
  }, [params.id]);
  
  // Format date nicely
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
    });
  };
  
  // Calculate fill percentage for contest
  const calculateFillPercentage = (current: number, max: number) => {
    return Math.min(100, Math.round((current / max) * 100));
  };
  
  // Get appropriate badge color for contest status
  const getStatusBadgeVariant = (status: Contest['status']) => {
    switch (status) {
      case 'UPCOMING':
        return 'secondary';
      case 'IN_PROGRESS':
        return 'default';
      case 'COMPLETED':
        return 'outline';
      case 'CANCELLED':
        return 'destructive';
      default:
        return 'outline';
    }
  };
  
  // Share contest with friends
  const handleShareContest = () => {
    if (navigator.share) {
      navigator.share({
        title: contest?.name || 'Fantasy Pickleball Contest',
        text: contest?.description || 'Join this fantasy pickleball contest!',
        url: window.location.href,
      })
      .then(() => toast.success('Shared successfully'))
      .catch((error) => toast.error('Error sharing: ' + error));
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(window.location.href)
        .then(() => toast.success('Contest link copied to clipboard'))
        .catch(() => toast.error('Failed to copy link'));
    }
  };
  
  // Navigate to create team
  const handleCreateTeam = () => {
    router.push(`/contests/${params.id}/create-team`);
  };
  
  // Navigate to view team
  const handleViewTeam = (teamId: string) => {
    router.push(`/teams/${teamId}`);
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
          <p className="text-red-500 mb-4">{error || 'Contest not found'}</p>
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
        onClick={() => router.push('/contests')}
      >
        <ChevronRight className="h-4 w-4 mr-1 rotate-180" />
        Back to Contests
      </Button>
      
      <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={getStatusBadgeVariant(contest.status)}>
              {contest.status.replace('_', ' ')}
            </Badge>
            {contest.isGuaranteed && (
              <Badge variant="outline" className="bg-green-50 text-green-700">
                Guaranteed
              </Badge>
            )}
          </div>
          
          <h1 className="text-3xl font-bold tracking-tight mb-2">{contest.name}</h1>
          <p className="text-muted-foreground mb-4 max-w-2xl">
            {contest.description}
          </p>
          
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>
                {formatDate(contest.startDate)} - {formatDate(contest.endDate)}
              </span>
            </div>
            
            <div className="flex items-center">
              <Trophy className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>{contest.tournamentName}</span>
            </div>
            
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>{contest.currentEntries}/{contest.maxEntries} teams</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col gap-3 md:text-right w-full md:w-auto">
          <div className="bg-muted/50 rounded-lg p-4 flex flex-col items-center md:items-end">
            <span className="text-sm text-muted-foreground mb-1">Prize Pool</span>
            <span className="text-3xl font-bold">${contest.prizePool.toLocaleString()}</span>
            <span className="text-sm font-medium mt-1">${contest.entryFee} Entry</span>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={handleShareContest}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            
            <Button 
              className="flex-1"
              disabled={contest.status !== 'UPCOMING' && contest.status !== 'IN_PROGRESS'}
              onClick={handleCreateTeam}
            >
              {userTeams.length > 0 ? 'Create Another Team' : 'Join Contest'}
            </Button>
          </div>
        </div>
      </div>
      
      <div className="w-full bg-muted/30 rounded-lg p-1 mb-6">
        <div 
          className="h-2 bg-primary rounded-full" 
          style={{ width: `${calculateFillPercentage(contest.currentEntries, contest.maxEntries)}%` }}
        ></div>
        <div className="flex justify-between text-xs text-muted-foreground pt-1 px-1">
          <span>{calculateFillPercentage(contest.currentEntries, contest.maxEntries)}% Full</span>
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {new Date(contest.startDate) > new Date() 
              ? `Starts in ${Math.ceil((new Date(contest.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days`
              : contest.status === 'IN_PROGRESS' 
                ? `Ends in ${Math.ceil((new Date(contest.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days`
                : 'Contest ended'}
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="overview" onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="my-teams">My Teams</TabsTrigger>
          <TabsTrigger value="prizes">Prizes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Info className="h-5 w-5 mr-2" />
                  Contest Rules
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Teams Per User</span>
                  <span className="font-medium">{contest.rules.maxTeams}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Team Size</span>
                  <span className="font-medium">{contest.rules.teamSize} players</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Points System</span>
                  <span className="font-medium">{contest.rules.pointSystem}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Budget</span>
                  <span className="font-medium">${contest.rules.maxBudget}M</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="h-5 w-5 mr-2" />
                  Prize Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {contest.prizes.slice(0, 5).map((prize) => (
                  <div key={prize.rank} className="flex items-center">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-muted mr-3">
                      {prize.rank === 1 ? (
                        <Trophy className="h-4 w-4 text-yellow-500" />
                      ) : prize.rank === 2 ? (
                        <Medal className="h-4 w-4 text-gray-400" />
                      ) : prize.rank === 3 ? (
                        <Award className="h-4 w-4 text-amber-700" />
                      ) : (
                        <span className="text-sm font-medium">{prize.rank}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm">Rank {prize.rank}</div>
                      <div className="text-xs text-muted-foreground">
                        {prize.percentageOfPool}% of pool
                      </div>
                    </div>
                    <div className="font-bold">${prize.amount.toLocaleString()}</div>
                  </div>
                ))}
                {contest.prizes.length > 5 && (
                  <Button variant="ghost" className="w-full text-xs mt-2">
                    View all prize places
                  </Button>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <GanttChart className="h-5 w-5 mr-2" />
                  Tournament Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-3"></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">Tournament Start</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(contest.startDate)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-1.5 border-l-2 border-dashed border-muted h-10"></div>
                  
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-500 mr-3"></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">Quarterfinals</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(new Date(new Date(contest.startDate).getTime() + 3 * 24 * 60 * 60 * 1000).toISOString())}
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-1.5 border-l-2 border-dashed border-muted h-10"></div>
                  
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-purple-500 mr-3"></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">Semifinals</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(new Date(new Date(contest.startDate).getTime() + 5 * 24 * 60 * 60 * 1000).toISOString())}
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-1.5 border-l-2 border-dashed border-muted h-10"></div>
                  
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-red-500 mr-3"></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">Finals</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(contest.endDate)}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="leaderboard">
          <Card>
            <CardHeader>
              <CardTitle>Leaderboard</CardTitle>
              <CardDescription>
                Current standings of all teams in this contest
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="grid grid-cols-12 bg-muted/50 p-3 text-sm font-medium">
                  <div className="col-span-1">Rank</div>
                  <div className="col-span-4">Team</div>
                  <div className="col-span-3">Owner</div>
                  <div className="col-span-3">Captain/VC</div>
                  <div className="col-span-1 text-right">Points</div>
                </div>
                
                <div className="divide-y">
                  {leaderboard.slice(0, 10).map((team) => (
                    <div 
                      key={team.id} 
                      className={`grid grid-cols-12 p-3 text-sm hover:bg-muted/30 cursor-pointer ${
                        userTeams.some(t => t.id === team.id) ? 'bg-blue-50 dark:bg-blue-950/20' : ''
                      }`}
                      onClick={() => handleViewTeam(team.id)}
                    >
                      <div className="col-span-1 font-medium">
                        {team.rank <= 3 ? (
                          <div className="w-6 h-6 rounded-full flex items-center justify-center">
                            {team.rank === 1 ? (
                              <Trophy className="h-4 w-4 text-yellow-500" />
                            ) : team.rank === 2 ? (
                              <Medal className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Award className="h-4 w-4 text-amber-700" />
                            )}
                          </div>
                        ) : (
                          team.rank
                        )}
                      </div>
                      <div className="col-span-4 font-medium flex items-center">
                        {team.teamName}
                        {userTeams.some(t => t.id === team.id) && (
                          <Badge variant="outline" className="ml-2 text-xs">Your Team</Badge>
                        )}
                      </div>
                      <div className="col-span-3">{team.ownerName}</div>
                      <div className="col-span-3 text-xs">
                        <div className="flex flex-col">
                          <span>C: {team.captainName}</span>
                          <span>VC: {team.viceCaptainName}</span>
                        </div>
                      </div>
                      <div className="col-span-1 text-right font-bold">{team.points}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              {leaderboard.length > 10 && (
                <Button variant="outline" className="w-full mt-4">
                  View Full Leaderboard
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="my-teams">
          {userTeams.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>My Teams</CardTitle>
                <CardDescription>
                  Your teams in this contest
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userTeams.map((team) => (
                    <Card key={team.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between">
                          <CardTitle className="text-lg">{team.teamName}</CardTitle>
                          <Badge variant="outline" className="h-6">
                            Rank #{team.rank}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="flex flex-col p-2 rounded-lg bg-muted/50">
                            <span className="text-xs text-muted-foreground">Captain</span>
                            <span className="font-medium">{team.captainName}</span>
                          </div>
                          
                          <div className="flex flex-col p-2 rounded-lg bg-muted/50">
                            <span className="text-xs text-muted-foreground">Vice Captain</span>
                            <span className="font-medium">{team.viceCaptainName}</span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="text-xs text-muted-foreground">Team Points</div>
                            <div className="text-xl font-bold">{team.points}</div>
                          </div>
                          <Button 
                            variant="ghost" 
                            className="text-primary"
                            onClick={() => handleViewTeam(team.id)}
                          >
                            View Team <ArrowUpRight className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {userTeams.length < contest.rules.maxTeams && contest.status !== 'COMPLETED' && (
                  <Button 
                    className="w-full mt-6" 
                    onClick={handleCreateTeam}
                  >
                    Create Another Team
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 bg-muted/30 rounded-lg">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-medium mb-2">No Teams Yet</h3>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                You haven't created a team for this contest yet. Create your fantasy team to compete for prizes!
              </p>
              <Button onClick={handleCreateTeam}>Create Your First Team</Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="prizes">
          <Card>
            <CardHeader>
              <CardTitle>Prize Structure</CardTitle>
              <CardDescription>
                How the prize pool of ${contest.prizePool.toLocaleString()} will be distributed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border mb-6">
                <div className="grid grid-cols-8 bg-muted/50 p-3 text-sm font-medium">
                  <div className="col-span-1">Rank</div>
                  <div className="col-span-3">Prize</div>
                  <div className="col-span-2">Amount</div>
                  <div className="col-span-2">Percentage</div>
                </div>
                
                <div className="divide-y">
                  {contest.prizes.map((prize) => (
                    <div key={prize.rank} className="grid grid-cols-8 p-3 text-sm">
                      <div className="col-span-1 font-medium">
                        {prize.rank <= 3 ? (
                          <div className="w-6 h-6 rounded-full flex items-center justify-center">
                            {prize.rank === 1 ? (
                              <Trophy className="h-4 w-4 text-yellow-500" />
                            ) : prize.rank === 2 ? (
                              <Medal className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Award className="h-4 w-4 text-amber-700" />
                            )}
                          </div>
                        ) : (
                          prize.rank
                        )}
                      </div>
                      <div className="col-span-3 font-medium flex items-center">
                        {prize.rank === 1 ? (
                          "First Prize"
                        ) : prize.rank === 2 ? (
                          "Second Prize"
                        ) : prize.rank === 3 ? (
                          "Third Prize"
                        ) : (
                          `${prize.rank}th Place`
                        )}
                      </div>
                      <div className="col-span-2 font-bold">
                        ${prize.amount.toLocaleString()}
                      </div>
                      <div className="col-span-2">
                        {prize.percentageOfPool}% of pool
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <Info className="h-5 w-5 mr-2 text-muted-foreground" />
                  <h3 className="font-medium">Prize Distribution Information</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Prizes are guaranteed if the contest is marked as "Guaranteed" regardless of how many entries are received.
                  Otherwise, prizes are calculated based on the actual number of entries and may be adjusted proportionally.
                </p>
                <p className="text-sm text-muted-foreground">
                  Prize money will be credited to your account within 24 hours after the contest ends and results are verified.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 