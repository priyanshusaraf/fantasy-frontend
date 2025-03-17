"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Trophy, 
  Users, 
  MapPin, 
  Clock, 
  Ticket, 
  ArrowRight, 
  Gamepad2, 
  Info, 
  Award,
  DollarSign,
  CircleDollarSign
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface TournamentDetailProps {
  params: {
    id: string;
  };
}

interface Tournament {
  id: number;
  name: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  status: "UPCOMING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  maxPlayers: number;
  registeredPlayers: number;
  totalContests: number;
  registrationFee: number;
  prizePool?: number;
  venue?: string;
  format?: string;
  organizer?: string;
  imageUrl?: string;
  rules?: string[];
  sponsors?: { name: string; logo?: string }[];
}

interface Match {
  id: number;
  round: string;
  court: string;
  startTime: string;
  player1: string;
  player2: string;
  player1Score?: number;
  player2Score?: number;
  isCompleted: boolean;
}

export default function TournamentDetailPage({ params }: TournamentDetailProps) {
  const tournamentId = parseInt(params.id);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [completedMatches, setCompletedMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchTournamentData = async () => {
      try {
        setLoading(true);
        
        // Fetch tournament details
        const tournamentResponse = await fetch(`/api/tournaments/${tournamentId}`);
        if (!tournamentResponse.ok) {
          throw new Error("Failed to fetch tournament");
        }
        const tournamentData = await tournamentResponse.json();
        setTournament(tournamentData);
        
        // Fetch matches
        if (tournamentData.status === "IN_PROGRESS" || tournamentData.status === "COMPLETED") {
          const matchesResponse = await fetch(`/api/tournaments/${tournamentId}/matches`);
          if (matchesResponse.ok) {
            const matchesData = await matchesResponse.json();
            
            // Split matches by completion status
            const upcoming = matchesData.matches.filter((match: Match) => !match.isCompleted);
            const completed = matchesData.matches.filter((match: Match) => match.isCompleted);
            
            setUpcomingMatches(upcoming);
            setCompletedMatches(completed);
          }
        }
      } catch (error) {
        console.error("Error fetching tournament data:", error);
        setError(error instanceof Error ? error.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchTournamentData();
  }, [tournamentId]);

  const handleRegister = () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/tournaments/${tournamentId}/register`);
      return;
    }
    
    router.push(`/tournaments/${tournamentId}/register`);
  };

  const handleViewContests = () => {
    router.push(`/tournaments/${tournamentId}/contests`);
  };

  // Get status badge with appropriate colors
  const getStatusBadge = (status: Tournament['status']) => {
    switch (status) {
      case 'UPCOMING':
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800/30">Upcoming</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800/30">In Progress</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-800/30 dark:text-gray-400 border-gray-200 dark:border-gray-800/30">Completed</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800/30">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading tournament details...</p>
        </div>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-6 rounded-lg border border-red-200 dark:border-red-800/30">
          <p className="font-bold text-lg mb-2">Error loading tournament</p>
          <p>{error || "Tournament not found"}</p>
          <Button className="mt-4" variant="outline" onClick={() => router.push('/tournaments')}>
            Back to Tournaments
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero section */}
      <div className="relative rounded-xl overflow-hidden mb-8 bg-gradient-to-r from-blue-500/10 to-teal-500/10 border border-blue-500/20">
        <div className="absolute inset-0 bg-pattern opacity-10"></div>
        <div className="relative p-8 md:p-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                {getStatusBadge(tournament.status)}
                {tournament.format && (
                  <Badge variant="outline" className="bg-background/50">
                    {tournament.format}
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-teal-500">
                {tournament.name}
              </h1>
              <p className="text-muted-foreground max-w-2xl mb-4">{tournament.description}</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{tournament.location}</span>
                </div>
                
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>
                    {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>
                    {tournament.registeredPlayers} / {tournament.maxPlayers} players registered
                  </span>
                </div>
                
                {tournament.venue && (
                  <div className="flex items-center">
                    <Info className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>Venue: {tournament.venue}</span>
                  </div>
                )}
                
                {tournament.organizer && (
                  <div className="flex items-center">
                    <Trophy className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>Organizer: {tournament.organizer}</span>
                  </div>
                )}
                
                {tournament.prizePool && (
                  <div className="flex items-center">
                    <CircleDollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>Prize Pool: ${tournament.prizePool.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
              {tournament.status === "UPCOMING" && (
                <Button
                  onClick={handleRegister}
                  className="bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600"
                >
                  <Ticket className="mr-2 h-4 w-4" />
                  Register Now
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={handleViewContests}
              >
                <Gamepad2 className="mr-2 h-4 w-4" />
                View Fantasy Contests
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column - stats cards */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview" className="mb-8">
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="matches">Matches</TabsTrigger>
              <TabsTrigger value="participants">Participants</TabsTrigger>
              <TabsTrigger value="rules">Rules</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tournament Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>{tournament.description}</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div>
                      <h4 className="font-medium mb-2">Details</h4>
                      <ul className="space-y-2">
                        <li className="flex justify-between">
                          <span className="text-muted-foreground">Registration Fee:</span>
                          <span className="font-medium">${tournament.registrationFee}</span>
                        </li>
                        {tournament.prizePool && (
                          <li className="flex justify-between">
                            <span className="text-muted-foreground">Prize Pool:</span>
                            <span className="font-medium">${tournament.prizePool.toLocaleString()}</span>
                          </li>
                        )}
                        <li className="flex justify-between">
                          <span className="text-muted-foreground">Format:</span>
                          <span className="font-medium">{tournament.format || "Standard"}</span>
                        </li>
                        <li className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <span className="font-medium">{tournament.status.replace('_', ' ')}</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Schedule</h4>
                      <ul className="space-y-2">
                        <li className="flex justify-between">
                          <span className="text-muted-foreground">Start Date:</span>
                          <span className="font-medium">{new Date(tournament.startDate).toLocaleDateString()}</span>
                        </li>
                        <li className="flex justify-between">
                          <span className="text-muted-foreground">End Date:</span>
                          <span className="font-medium">{new Date(tournament.endDate).toLocaleDateString()}</span>
                        </li>
                        <li className="flex justify-between">
                          <span className="text-muted-foreground">Duration:</span>
                          <span className="font-medium">
                            {Math.ceil((new Date(tournament.endDate).getTime() - new Date(tournament.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                          </span>
                        </li>
                        <li className="flex justify-between">
                          <span className="text-muted-foreground">Location:</span>
                          <span className="font-medium">{tournament.location}</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {upcomingMatches.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Upcoming Matches</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {upcomingMatches.slice(0, 3).map((match) => (
                        <div key={match.id} className="flex justify-between items-center p-3 rounded-md bg-muted/50">
                          <div>
                            <p className="font-medium">{match.player1} vs {match.player2}</p>
                            <p className="text-sm text-muted-foreground">
                              {match.round} • Court {match.court}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{new Date(match.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(match.startTime).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                      
                      {upcomingMatches.length > 3 && (
                        <Button variant="outline" className="w-full" onClick={() => document.querySelector('[data-value="matches"]')?.click()}>
                          View All Matches
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {tournament.sponsors && tournament.sponsors.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Sponsors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-4 items-center">
                      {tournament.sponsors.map((sponsor, index) => (
                        <div key={index} className="bg-muted/50 rounded-md p-3 flex items-center">
                          {sponsor.logo ? (
                            <img src={sponsor.logo} alt={sponsor.name} className="h-8 mr-2" />
                          ) : (
                            <Award className="h-6 w-6 mr-2 text-muted-foreground" />
                          )}
                          <span>{sponsor.name}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="matches">
              <Card>
                <CardHeader>
                  <CardTitle>Tournament Matches</CardTitle>
                </CardHeader>
                <CardContent>
                  {upcomingMatches.length === 0 && completedMatches.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">No matches available yet. Check back later.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {upcomingMatches.length > 0 && (
                        <div>
                          <h3 className="text-lg font-medium mb-3">Upcoming Matches</h3>
                          <div className="space-y-3">
                            {upcomingMatches.map((match) => (
                              <div key={match.id} className="flex justify-between items-center p-4 rounded-md bg-muted/50">
                                <div>
                                  <p className="font-medium">{match.player1} vs {match.player2}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {match.round} • Court {match.court}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium">{new Date(match.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(match.startTime).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {completedMatches.length > 0 && (
                        <div>
                          <h3 className="text-lg font-medium mb-3">Completed Matches</h3>
                          <div className="space-y-3">
                            {completedMatches.map((match) => (
                              <div key={match.id} className="flex justify-between items-center p-4 rounded-md bg-muted/50">
                                <div>
                                  <p className="font-medium">{match.player1} vs {match.player2}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {match.round} • Court {match.court}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium text-lg">
                                    {match.player1Score} - {match.player2Score}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Final Score
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="participants">
              <Card>
                <CardHeader>
                  <CardTitle>Participants</CardTitle>
                  <CardDescription>
                    Players registered for this tournament
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* This would be populated from API in a real implementation */}
                  <div className="text-center py-8">
                    <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">
                      {tournament.registeredPlayers > 0 
                        ? `${tournament.registeredPlayers} players registered` 
                        : "No players registered yet"}
                    </p>
                    {tournament.status === "UPCOMING" && (
                      <Button className="mt-4" variant="outline" onClick={handleRegister}>
                        Register for this Tournament
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="rules">
              <Card>
                <CardHeader>
                  <CardTitle>Tournament Rules</CardTitle>
                </CardHeader>
                <CardContent>
                  {tournament.rules && tournament.rules.length > 0 ? (
                    <ul className="space-y-3 list-disc pl-5">
                      {tournament.rules.map((rule, index) => (
                        <li key={index}>{rule}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center py-8">
                      <Info className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">
                        Detailed rules will be shared with registered participants.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Right column - actions and fantasy contests */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-blue-500/5 to-teal-500/5 border-blue-500/20">
            <CardHeader>
              <CardTitle>Fantasy Contests</CardTitle>
              <CardDescription>
                Join fantasy contests for this tournament
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Available Contests</p>
                    <p className="text-sm text-muted-foreground">Create or join fantasy teams</p>
                  </div>
                  <Badge>{tournament.totalContests}</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Entry Fees</p>
                    <p className="text-sm text-muted-foreground">Starting from</p>
                  </div>
                  <span className="font-bold text-primary">$5</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Prize Pools</p>
                    <p className="text-sm text-muted-foreground">Win real rewards</p>
                  </div>
                  <span className="font-bold text-primary">Up to $1,000</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600"
                onClick={handleViewContests}
              >
                <Gamepad2 className="mr-2 h-4 w-4" />
                Browse Contests
              </Button>
            </CardFooter>
          </Card>
          
          {tournament.status === "UPCOMING" && (
            <Card>
              <CardHeader>
                <CardTitle>Registration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Registration Fee</span>
                  <span className="font-bold">${tournament.registrationFee}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Registration Status</span>
                  <Badge variant="outline" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800/30">
                    Open
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Spots Remaining</span>
                  <span className="font-medium">
                    {tournament.maxPlayers - tournament.registeredPlayers} of {tournament.maxPlayers}
                  </span>
                </div>
                
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-primary h-full rounded-full" 
                    style={{ width: `${(tournament.registeredPlayers / tournament.maxPlayers) * 100}%` }}
                  ></div>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  {Math.round((tournament.registeredPlayers / tournament.maxPlayers) * 100)}% full
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full"
                  onClick={handleRegister}
                >
                  <Ticket className="mr-2 h-4 w-4" />
                  Register Now
                </Button>
              </CardFooter>
            </Card>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle>Tournament Venue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center text-center">
                <div className="w-full h-40 bg-muted rounded-md mb-4 flex items-center justify-center">
                  <MapPin className="h-10 w-10 text-muted-foreground" />
                </div>
                <p className="font-medium">{tournament.venue || tournament.location}</p>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  {tournament.location}
                </p>
                
                <Button variant="outline" className="w-full" onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(tournament.location)}`, '_blank')}>
                  View on Maps
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 