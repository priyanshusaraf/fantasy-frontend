"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
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
  Clock,
  MapPin,
  Users,
  ChevronRight,
  User,
  ClipboardCheck,
  Flag,
  AlertCircle,
  Award,
  Timer,
  CheckSquare,
  History,
  ShieldAlert,
  Bell as Whistle,
  Play,
  PlusCircle,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";

interface Match {
  id: number;
  tournamentName: string;
  tournamentId: number;
  matchNumber: number;
  team1: string;
  team2: string;
  court: string;
  startTime: string;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
}

interface Assignment {
  id: number;
  tournamentName: string;
  tournamentId: number;
  assignedBy: string;
  date: string;
  matchCount: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

interface Tournament {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  location: string;
  status: string;
  matchCount: number;
  liveMatchCount: number;
}

interface Stats {
  totalMatches: number;
  monthlyMatches: number;
  averageMatchTime: string;
  tournamentCount: number;
}

export default function RefereeDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [refereeStats, setRefereeStats] = useState<Stats>({
    totalMatches: 0,
    monthlyMatches: 0,
    averageMatchTime: "",
    tournamentCount: 0,
  });
  
  // Check if user has the correct role
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    
    if (status === "authenticated" && session?.user?.role !== "REFEREE") {
      router.push("/dashboard");
      return;
    }
  }, [status, session, router]);

  // Fetch referee data
  useEffect(() => {
    const fetchRefereeData = async () => {
      try {
        setLoading(true);
        
        // Real API calls
        const [matchesResponse, assignmentsResponse, statsResponse, tournamentsResponse] = await Promise.all([
          fetch('/api/referee/matches?status=SCHEDULED'),
          fetch('/api/referee/assignments'),
          fetch('/api/referee/stats'),
          fetch('/api/referee/tournaments')
        ]);
        
        if (!matchesResponse.ok) throw new Error('Failed to fetch matches');
        if (!assignmentsResponse.ok) throw new Error('Failed to fetch assignments');
        if (!statsResponse.ok) throw new Error('Failed to fetch stats');
        if (!tournamentsResponse.ok) throw new Error('Failed to fetch tournaments');
        
        const matchesData = await matchesResponse.json();
        const assignmentsData = await assignmentsResponse.json();
        const statsData = await statsResponse.json();
        const tournamentsData = await tournamentsResponse.json();
        
        setUpcomingMatches(matchesData.matches || []);
        setAssignments(assignmentsData.assignments || []);
        setRefereeStats(statsData || {
          totalMatches: 0,
          monthlyMatches: 0,
          averageMatchTime: "0hr 0min",
          tournamentCount: 0,
        });
        setTournaments(tournamentsData.tournaments || []);
      } catch (error) {
        console.error("Error fetching referee data:", error);
        toast("Failed to load referee data");
      } finally {
        setLoading(false);
      }
    };
    
    if (status === "authenticated") {
      fetchRefereeData();
    }
  }, [status]);

  const handleAcceptAssignment = async (assignmentId: number) => {
    try {
      const response = await fetch(`/api/referee/assignments/${assignmentId}/accept`, {
        method: 'POST',
      });
      
      if (!response.ok) throw new Error('Failed to accept assignment');
      
      // Update UI optimistically with the new status mapping
      setAssignments(prevAssignments => 
        prevAssignments.map(assignment => 
          assignment.id === assignmentId 
            ? { ...assignment, status: "APPROVED" }
            : assignment
        )
      );
      
      // Also update tournaments list
      const updatedAssignment = assignments.find(a => a.id === assignmentId);
      if (updatedAssignment) {
        fetchTournamentData();
      }
      
      toast("Assignment accepted successfully");
    } catch (error) {
      console.error("Error accepting assignment:", error);
      toast("Failed to accept assignment");
    }
  };
  
  const handleDeclineAssignment = async (assignmentId: number) => {
    try {
      const response = await fetch(`/api/referee/assignments/${assignmentId}/decline`, {
        method: 'POST',
      });
      
      if (!response.ok) throw new Error('Failed to decline assignment');
      
      // Update UI optimistically with the new status mapping
      setAssignments(prevAssignments => 
        prevAssignments.map(assignment => 
          assignment.id === assignmentId 
            ? { ...assignment, status: "REJECTED" }
            : assignment
        )
      );
      
      toast("Assignment declined successfully");
    } catch (error) {
      console.error("Error declining assignment:", error);
      toast("Failed to decline assignment");
    }
  };

  // Fetch tournament data after accepting assignment
  const fetchTournamentData = async () => {
    try {
      const response = await fetch('/api/referee/tournaments');
      if (!response.ok) throw new Error('Failed to fetch tournaments');
      
      const data = await response.json();
      setTournaments(data.tournaments || []);
    } catch (error) {
      console.error("Error fetching tournaments:", error);
    }
  };

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
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-500">
            Referee Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => router.push("/referee/matches")}
              className="hidden md:flex items-center gap-1"
            >
              <ClipboardCheck className="h-4 w-4" />
              Matches
            </Button>
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => router.push("/referee/tournaments")}
              className="hidden md:flex items-center gap-1"
            >
              <Award className="h-4 w-4" />
              Tournaments
            </Button>
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => router.push("/referee/profile")}
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
          <div className="bg-gradient-to-r from-teal-500/10 to-blue-500/10 rounded-lg p-6 border border-teal-500/20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold">
                  Welcome back, {session?.user?.name || "Referee"}!
                </h2>
                <p className="text-muted-foreground mt-1">
                  Manage your match schedule, score matches, and view your assignments.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.push("/referee/history")}
                  className="flex items-center gap-1"
                >
                  <History className="h-4 w-4" />
                  <span className="hidden sm:inline">Match History</span>
                </Button>
                <Button
                  onClick={() => router.push("/referee/create-match")}
                  className="bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Create Match</span>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Main dashboard content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Tournaments & Assignments */}
          <div className="space-y-6 lg:col-span-2">
            {/* Assigned Tournaments */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Award className="h-5 w-5 text-teal-500" />
                    Your Tournaments
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs flex items-center"
                    onClick={() => router.push("/referee/tournaments")}
                  >
                    View All
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>
                  Tournaments you are assigned to referee
                </CardDescription>
              </CardHeader>
              <CardContent>
                {tournaments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Award className="h-12 w-12 text-gray-300 mb-3" />
                    <h3 className="text-lg font-medium">No tournaments assigned</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mt-1">
                      You don't have any tournaments assigned yet. Tournament admins will assign you to tournaments.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {tournaments.slice(0, 3).map((tournament) => (
                      <Card key={tournament.id} className="overflow-hidden">
                        <CardContent className="p-0">
                          <div className="flex flex-col sm:flex-row">
                            <div className="p-4 sm:w-2/3">
                              <h3 className="font-semibold text-lg">{tournament.name}</h3>
                              <div className="mt-2 space-y-1 text-sm">
                                <div className="flex items-center text-muted-foreground">
                                  <Calendar className="h-3.5 w-3.5 mr-2" />
                                  <span>
                                    {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex items-center text-muted-foreground">
                                  <MapPin className="h-3.5 w-3.5 mr-2" />
                                  <span>{tournament.location}</span>
                                </div>
                              </div>
                            </div>
                            <div className="p-4 bg-muted/30 flex flex-col justify-between space-y-4 sm:w-1/3">
                              <div>
                                <div className="text-sm flex items-center justify-between">
                                  <span className="text-muted-foreground">Status:</span>
                                  <Badge 
                                    variant={tournament.status === 'IN_PROGRESS' ? 'default' : 'outline'}
                                    className="ml-2"
                                  >
                                    {tournament.status.replace('_', ' ')}
                                  </Badge>
                                </div>
                                <div className="text-sm flex items-center justify-between mt-1">
                                  <span className="text-muted-foreground">Live Matches:</span>
                                  <Badge variant="outline" className={tournament.liveMatchCount > 0 ? "bg-green-500/10 text-green-600" : ""}>
                                    {tournament.liveMatchCount}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex flex-col sm:flex-row gap-2">
                                <Button 
                                  size="sm" 
                                  className="w-full"
                                  onClick={() => router.push(`/referee/tournaments/${tournament.id}/create-match`)}
                                >
                                  <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
                                  Add Match
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="w-full"
                                  onClick={() => router.push(`/referee/tournaments/${tournament.id}`)}
                                >
                                  <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
              {tournaments.length > 3 && (
                <CardFooter className="pt-0">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => router.push("/referee/tournaments")}
                  >
                    View All Tournaments
                  </Button>
                </CardFooter>
              )}
            </Card>

            {/* Upcoming Matches */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-teal-500" />
                    Upcoming Matches
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => router.push("/referee/matches")}
                  >
                    View All
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>
                  Your upcoming scheduled matches to referee
                </CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingMatches.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Calendar className="h-12 w-12 text-gray-300 mb-3" />
                    <h3 className="text-lg font-medium">No upcoming matches</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mt-1">
                      You don't have any upcoming matches scheduled. Create a match or check back later.
                    </p>
                    <Button 
                      className="mt-4"
                      onClick={() => router.push("/referee/create-match")}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Create Match
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingMatches.map((match) => (
                      <div
                        key={match.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="mb-2 sm:mb-0">
                          <div className="flex items-center">
                            <Badge className="mr-2 capitalize">
                              {match.status.toLowerCase()}
                            </Badge>
                            <h3 className="font-medium">
                              {match.team1} vs {match.team2}
                            </h3>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1 flex flex-wrap items-center gap-x-4">
                            <span className="flex items-center">
                              <Award className="h-3.5 w-3.5 mr-1.5" />
                              {match.tournamentName}
                            </span>
                            <span className="flex items-center">
                              <MapPin className="h-3.5 w-3.5 mr-1.5" />
                              {match.court}
                            </span>
                            <span className="flex items-center">
                              <Clock className="h-3.5 w-3.5 mr-1.5" />
                              {new Date(match.startTime).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          {match.status === "IN_PROGRESS" ? (
                            <Button
                              className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                              size="sm"
                              onClick={() => router.push(`/referee/live-scoring/${match.id}`)}
                            >
                              <Play className="h-4 w-4 mr-1.5" />
                              Score Match
                            </Button>
                          ) : (
                            <Button
                              className="w-full sm:w-auto"
                              size="sm" 
                              variant="outline"
                              onClick={() => router.push(`/referee/matches/${match.id}`)}
                            >
                              View Match
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column: Stats and pending assignments */}
          <div className="space-y-6">
            {/* Referee Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-teal-500" />
                  Your Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Total Matches
                    </h3>
                    <div className="mt-2 flex items-center">
                      <Whistle className="h-5 w-5 text-teal-500 mr-2" />
                      <span className="text-2xl font-semibold">
                        {refereeStats.totalMatches}
                      </span>
                    </div>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      This Month
                    </h3>
                    <div className="mt-2 flex items-center">
                      <Calendar className="h-5 w-5 text-teal-500 mr-2" />
                      <span className="text-2xl font-semibold">
                        {refereeStats.monthlyMatches}
                      </span>
                    </div>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Avg. Match Time
                    </h3>
                    <div className="mt-2 flex items-center">
                      <Timer className="h-5 w-5 text-teal-500 mr-2" />
                      <span className="text-2xl font-semibold">
                        {refereeStats.averageMatchTime}
                      </span>
                    </div>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Tournaments
                    </h3>
                    <div className="mt-2 flex items-center">
                      <Trophy className="h-5 w-5 text-teal-500 mr-2" />
                      <span className="text-2xl font-semibold">
                        {refereeStats.tournamentCount}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pending Assignments */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-teal-500" />
                  Tournament Assignments
                </CardTitle>
                <CardDescription>
                  Requests to referee tournaments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {assignments.filter(a => a.status === "PENDING").length === 0 ? (
                  <div className="text-center py-6">
                    <CheckSquare className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                    <p className="text-muted-foreground">
                      No pending assignments
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {assignments
                      .filter(a => a.status === "PENDING")
                      .map((assignment) => (
                        <div
                          key={assignment.id}
                          className="p-4 border rounded-lg"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">
                                {assignment.tournamentName}
                              </h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                Assigned by: {assignment.assignedBy}
                              </p>
                              <div className="flex items-center text-sm text-muted-foreground mt-1">
                                <Calendar className="h-3.5 w-3.5 mr-1.5" />
                                <span>{assignment.date}</span>
                              </div>
                            </div>
                            <Badge variant="outline">Pending</Badge>
                          </div>
                          <div className="flex gap-2 mt-4">
                            <Button
                              size="sm"
                              className="w-full bg-green-600 hover:bg-green-700"
                              onClick={() => handleAcceptAssignment(assignment.id)}
                            >
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full"
                              onClick={() => handleDeclineAssignment(assignment.id)}
                            >
                              Decline
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
} 