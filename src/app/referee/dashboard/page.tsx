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
} from "lucide-react";

interface Match {
  id: number;
  tournamentName: string;
  matchNumber: number;
  team1: string;
  team2: string;
  court: string;
  startTime: string;
  status: "upcoming" | "live" | "completed";
}

interface Assignment {
  id: number;
  tournamentName: string;
  tournamentId: number;
  assignedBy: string;
  date: string;
  matchCount: number;
  status: "pending" | "accepted" | "declined";
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
    // This would be replaced with actual API calls in production
    const fetchRefereeData = async () => {
      try {
        setLoading(true);
        
        // Mock data for demonstration
        const mockUpcomingMatches: Match[] = [
          { 
            id: 1, 
            tournamentName: "Summer Grand Slam", 
            matchNumber: 23, 
            team1: "Johnson/Smith", 
            team2: "Garcia/Rodriguez", 
            court: "Court 3", 
            startTime: "2023-10-15T15:30:00Z", 
            status: "upcoming" 
          },
          { 
            id: 2, 
            tournamentName: "Summer Grand Slam", 
            matchNumber: 24, 
            team1: "Williams/Davis", 
            team2: "Miller/Wilson", 
            court: "Court 4", 
            startTime: "2023-10-15T17:00:00Z", 
            status: "upcoming" 
          },
          { 
            id: 3, 
            tournamentName: "City Championships", 
            matchNumber: 12, 
            team1: "Brown/Jones", 
            team2: "Martinez/Lee", 
            court: "Court 1", 
            startTime: "2023-10-16T13:00:00Z", 
            status: "upcoming" 
          },
        ];
        
        const mockAssignments: Assignment[] = [
          { 
            id: 1, 
            tournamentName: "Summer Grand Slam", 
            tournamentId: 101, 
            assignedBy: "Sarah Johnson (TD)", 
            date: "2023-10-15", 
            matchCount: 8, 
            status: "accepted" 
          },
          { 
            id: 2, 
            tournamentName: "City Championships", 
            tournamentId: 102, 
            assignedBy: "Michael Davis (TD)", 
            date: "2023-10-16", 
            matchCount: 6, 
            status: "accepted" 
          },
          { 
            id: 3, 
            tournamentName: "Masters Invitational", 
            tournamentId: 103, 
            assignedBy: "Emma Wilson (TD)", 
            date: "2023-10-20", 
            matchCount: 12, 
            status: "pending" 
          },
        ];
        
        const mockStats: Stats = {
          totalMatches: 67,
          monthlyMatches: 22,
          averageMatchTime: "1hr 15min",
          tournamentCount: 8,
        };
        
        setUpcomingMatches(mockUpcomingMatches);
        setAssignments(mockAssignments);
        setRefereeStats(mockStats);
      } catch (error) {
        console.error("Error fetching referee data:", error);
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
      // This would be an actual API call in production
      console.log(`Accepting assignment: ${assignmentId}`);
      
      // Update UI optimistically
      setAssignments(prevAssignments => 
        prevAssignments.map(assignment => 
          assignment.id === assignmentId 
            ? { ...assignment, status: "accepted" } 
            : assignment
        )
      );
      
      // Show success message
      alert("Assignment accepted successfully");
    } catch (error) {
      console.error("Error accepting assignment:", error);
      alert("Failed to accept assignment. Please try again.");
    }
  };
  
  const handleDeclineAssignment = async (assignmentId: number) => {
    try {
      // This would be an actual API call in production
      console.log(`Declining assignment: ${assignmentId}`);
      
      // Update UI optimistically
      setAssignments(prevAssignments => 
        prevAssignments.map(assignment => 
          assignment.id === assignmentId 
            ? { ...assignment, status: "declined" } 
            : assignment
        )
      );
      
      // Show success message
      alert("Assignment declined successfully");
    } catch (error) {
      console.error("Error declining assignment:", error);
      alert("Failed to decline assignment. Please try again.");
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
                  Match History
                </Button>
                <Button
                  onClick={() => router.push("/referee/live-scoring")}
                  className="bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600"
                >
                  <Flag className="h-4 w-4 mr-2" />
                  Start Scoring
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Cards */}
        <section className="mb-8">
          <h3 className="text-lg font-medium mb-4">Your Stats</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-slate-50/50 to-slate-100/50 dark:from-slate-950/20 dark:to-slate-900/20 border-slate-200/50 dark:border-slate-800/30">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Matches</p>
                    <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{refereeStats.totalMatches}</h3>
                    <p className="text-xs mt-1 text-muted-foreground">Lifetime total</p>
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                    <ClipboardCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-50/50 to-slate-100/50 dark:from-slate-950/20 dark:to-slate-900/20 border-slate-200/50 dark:border-slate-800/30">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Monthly Matches</p>
                    <h3 className="text-2xl font-bold text-teal-600 dark:text-teal-400 mt-1">{refereeStats.monthlyMatches}</h3>
                    <p className="text-xs mt-1 text-muted-foreground">Current month</p>
                  </div>
                  <div className="bg-teal-100 dark:bg-teal-900/30 p-2 rounded-full">
                    <Calendar className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-50/50 to-slate-100/50 dark:from-slate-950/20 dark:to-slate-900/20 border-slate-200/50 dark:border-slate-800/30">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg. Match Time</p>
                    <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{refereeStats.averageMatchTime}</h3>
                    <p className="text-xs mt-1 text-muted-foreground">Per match</p>
                  </div>
                  <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-full">
                    <Timer className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-50/50 to-slate-100/50 dark:from-slate-950/20 dark:to-slate-900/20 border-slate-200/50 dark:border-slate-800/30">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tournaments</p>
                    <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{refereeStats.tournamentCount}</h3>
                    <p className="text-xs mt-1 text-muted-foreground">Officiated</p>
                  </div>
                  <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-full">
                    <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Upcoming Matches */}
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Upcoming Matches</CardTitle>
                  <Button 
                    variant="link" 
                    className="text-sm gap-1"
                    onClick={() => router.push("/referee/matches")}
                  >
                    View All
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>Matches you are scheduled to officiate</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingMatches.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <ClipboardCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No upcoming matches found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingMatches.map((match) => (
                      <div 
                        key={match.id} 
                        className="p-4 rounded-lg border border-teal-200/40 dark:border-teal-800/30 hover:bg-teal-50/50 dark:hover:bg-teal-950/10 transition-colors cursor-pointer"
                        onClick={() => router.push(`/referee/matches/${match.id}`)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium text-lg">Match #{match.matchNumber}</h4>
                            <p className="text-sm text-muted-foreground">{match.tournamentName}</p>
                          </div>
                          <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                            Upcoming
                          </Badge>
                        </div>
                        
                        <div className="my-3">
                          <h5 className="text-center font-medium mb-1">
                            {match.team1} vs. {match.team2}
                          </h5>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 mt-4 text-sm">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 text-muted-foreground mr-1" />
                            <p>{new Date(match.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-muted-foreground mr-1" />
                            <p>{new Date(match.startTime).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 text-muted-foreground mr-1" />
                            <p>{match.court}</p>
                          </div>
                        </div>
                        
                        <div className="flex justify-end mt-4">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/referee/live-scoring/match/${match.id}`);
                            }}
                          >
                            <Flag className="h-4 w-4 mr-1" />
                            Score Match
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Rules and Guidelines Card */}
            <Card>
              <CardHeader>
                <CardTitle>Referee Guidelines</CardTitle>
                <CardDescription>Important rules and guidelines for officiating</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                      <CheckSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-base">Match Preparation</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Arrive 15 minutes before scheduled match time. Verify player IDs and equipment.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="bg-teal-100 dark:bg-teal-900/30 p-2 rounded-full">
                      <Whistle className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-base">Scoring Protocol</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Announce scores clearly after each point. First server, then receiver's score.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-full">
                      <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-base">Conflict Resolution</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        For disputes, make firm decisions based on rules. Consult tournament director if needed.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-full">
                      <ShieldAlert className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-base">Code of Conduct</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Issue warnings for unsportsmanlike conduct. Two warnings result in point penalty.
                      </p>
                    </div>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full mt-6"
                  onClick={() => router.push("/referee/guidelines")}
                >
                  View Complete Referee Handbook
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Tournament Assignments */}
          <div className="space-y-8">
            {/* Tournament Assignments */}
            <Card>
              <CardHeader>
                <CardTitle>Tournament Assignments</CardTitle>
                <CardDescription>Your assigned tournaments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assignments.map((assignment) => (
                    <div key={assignment.id} className="p-4 rounded-lg border border-blue-200/40 dark:border-blue-800/30">
                      <h4 className="font-medium">{assignment.tournamentName}</h4>
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>{new Date(assignment.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <Users className="h-3 w-3 mr-1" />
                        <span>Assigned by: {assignment.assignedBy}</span>
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <ClipboardCheck className="h-3 w-3 mr-1" />
                        <span>{assignment.matchCount} matches to officiate</span>
                      </div>
                      
                      {assignment.status === "pending" ? (
                        <div className="flex gap-2 mt-4">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="w-full"
                            onClick={() => handleAcceptAssignment(assignment.id)}
                          >
                            Accept
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="w-full"
                            onClick={() => handleDeclineAssignment(assignment.id)}
                          >
                            Decline
                          </Button>
                        </div>
                      ) : (
                        <div className="mt-4">
                          <Badge 
                            className={
                              assignment.status === "accepted" 
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            }
                          >
                            {assignment.status === "accepted" ? "Accepted" : "Declined"}
                          </Badge>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="ml-2"
                            onClick={() => router.push(`/referee/tournaments/${assignment.tournamentId}`)}
                          >
                            View Details
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => router.push("/referee/assignments")}
                >
                  Manage All Assignments
                </Button>
              </CardFooter>
            </Card>

            {/* Quick Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common referee tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start text-left"
                  onClick={() => router.push("/referee/live-scoring")}
                >
                  <Flag className="h-4 w-4 mr-2" />
                  Start Scoring a Match
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left"
                  onClick={() => router.push("/referee/tournaments/available")}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Find Tournaments
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left"
                  onClick={() => router.push("/referee/incidents")}
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Report an Incident
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left"
                  onClick={() => router.push("/referee/settings")}
                >
                  <User className="h-4 w-4 mr-2" />
                  Referee Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
} 