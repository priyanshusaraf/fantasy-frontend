"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock, CheckCircle, AlertCircle, Users, Trophy } from "lucide-react";

interface TournamentAssignment {
  id: number;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  status: "UPCOMING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  assignedMatches: number;
  completedMatches: number;
  assignmentStatus: "PENDING" | "ACCEPTED" | "DECLINED";
  assignedBy: string;
  assignmentDate: string;
  role: "LEAD" | "ASSISTANT" | "LINE_JUDGE";
}

export default function RefereeAssignmentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [assignments, setAssignments] = useState<TournamentAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Check authentication
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?redirect=/referee/assignments");
    } else if (session?.user && (session.user.role !== "REFEREE" && session.user.role !== "ADMIN")) {
      router.push("/unauthorized");
    }
  }, [status, session, router]);

  // Fetch referee assignments
  useEffect(() => {
    const fetchAssignments = async () => {
      if (session?.user) {
        try {
          setLoading(true);
          
          // For now, use mock data
          // In a real app, this would fetch from an API endpoint
          // const response = await fetch("/api/referee/assignments");
          // const data = await response.json();
          
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 800));
          
          const mockAssignments: TournamentAssignment[] = [
            {
              id: 1,
              name: "Summer Grand Slam",
              location: "Central Sports Arena, New York",
              startDate: "2023-10-15",
              endDate: "2023-10-20",
              status: "UPCOMING",
              assignedMatches: 8,
              completedMatches: 0,
              assignmentStatus: "ACCEPTED",
              assignedBy: "Sarah Johnson (TD)",
              assignmentDate: "2023-09-25",
              role: "ASSISTANT"
            },
            {
              id: 2,
              name: "City Championships",
              location: "City Sports Complex, Chicago",
              startDate: "2023-10-16",
              endDate: "2023-10-23",
              status: "UPCOMING",
              assignedMatches: 6,
              completedMatches: 0,
              assignmentStatus: "ACCEPTED",
              assignedBy: "Michael Davis (TD)",
              assignmentDate: "2023-09-28",
              role: "ASSISTANT"
            },
            {
              id: 3,
              name: "Masters Invitational",
              location: "Desert Resort Center, Las Vegas",
              startDate: "2023-10-20",
              endDate: "2023-10-25",
              status: "UPCOMING",
              assignedMatches: 12,
              completedMatches: 0,
              assignmentStatus: "PENDING",
              assignedBy: "Emma Wilson (TD)",
              assignmentDate: "2023-10-01",
              role: "LEAD"
            },
            {
              id: 4,
              name: "Regional Tournament",
              location: "Sports Complex, Miami",
              startDate: "2023-09-05",
              endDate: "2023-09-10",
              status: "COMPLETED",
              assignedMatches: 10,
              completedMatches: 10,
              assignmentStatus: "ACCEPTED",
              assignedBy: "Robert Thompson (TD)",
              assignmentDate: "2023-08-10",
              role: "ASSISTANT"
            }
          ];
          
          setAssignments(mockAssignments);
        } catch (error) {
          console.error("Error fetching assignments:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    if (session?.user) {
      fetchAssignments();
    }
  }, [session]);

  // Group assignments by status
  const upcomingAssignments = assignments.filter(a => a.status === "UPCOMING" || a.status === "ACTIVE");
  const pastAssignments = assignments.filter(a => a.status === "COMPLETED" || a.status === "CANCELLED");
  const pendingAssignments = assignments.filter(a => a.assignmentStatus === "PENDING");

  // Handle accepting or declining an assignment
  const handleAssignmentResponse = async (assignmentId: number, response: "ACCEPTED" | "DECLINED") => {
    // In a real app, send API request to update assignment status
    console.log(`Assignment ${assignmentId} ${response.toLowerCase()}`);
    
    // Update local state for demonstration
    setAssignments(prev => 
      prev.map(assignment => 
        assignment.id === assignmentId 
          ? { ...assignment, assignmentStatus: response } 
          : assignment
      )
    );
  };

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading assignments...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Tournament Assignments</CardTitle>
            <CardDescription>Please sign in to view your tournament assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/login?redirect=/referee/assignments")}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
          Tournament Assignments
        </h1>
        <p className="text-muted-foreground max-w-3xl">
          View and manage your tournament officiating assignments.
        </p>
      </div>

      {/* Pending Assignments Section */}
      {pendingAssignments.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-yellow-500" />
            Pending Assignments
          </h2>
          <div className="space-y-6">
            {pendingAssignments.map(assignment => (
              <Card key={assignment.id} className="overflow-hidden border-yellow-200 dark:border-yellow-800/50">
                <CardContent className="p-0">
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 border-b">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold">{assignment.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Assignment request from {assignment.assignedBy}
                        </p>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                        Awaiting Response
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">Location</span>
                        <span className="font-medium flex items-center mt-1">
                          <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                          {assignment.location}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">Dates</span>
                        <span className="font-medium flex items-center mt-1">
                          <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                          {new Date(assignment.startDate).toLocaleDateString()} - {new Date(assignment.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">Role</span>
                        <span className="font-medium flex items-center mt-1">
                          <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                          {assignment.role === "LEAD" ? "Lead Referee" : 
                            assignment.role === "ASSISTANT" ? "Assistant Referee" : "Line Judge"}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-4 mt-6">
                      <div className="flex-1">
                        <p className="text-sm mb-2">
                          You have been assigned to officiate {assignment.assignedMatches} matches at this tournament.
                        </p>
                      </div>
                      
                      <div className="flex gap-3">
                        <Button 
                          onClick={() => handleAssignmentResponse(assignment.id, "DECLINED")}
                          variant="outline" 
                          className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800/50 dark:text-red-400 dark:hover:bg-red-900/20"
                        >
                          Decline
                        </Button>
                        <Button 
                          onClick={() => handleAssignmentResponse(assignment.id, "ACCEPTED")}
                          className="bg-green-600 hover:bg-green-700 text-white dark:bg-green-700 dark:hover:bg-green-600"
                        >
                          Accept Assignment
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      {/* Upcoming Assignments Section */}
      <div className="mb-10">
        <h2 className="text-xl font-bold mb-4">Upcoming Assignments</h2>
        
        {upcomingAssignments.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
                <h3 className="text-lg font-medium mb-2">No upcoming assignments</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  You don't have any upcoming tournament assignments at the moment.
                </p>
                <Link href="/referee/tournaments">
                  <Button variant="outline">
                    Browse Tournaments
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {upcomingAssignments.map(assignment => (
              <Card key={assignment.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="bg-muted/30 p-4 border-b">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold">{assignment.name}</h3>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <CheckCircle className="h-3.5 w-3.5 mr-1 text-green-500" />
                          Assignment Accepted
                        </div>
                      </div>
                      {assignment.status === "UPCOMING" ? (
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          Upcoming
                        </Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          Active
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">Location</span>
                        <span className="font-medium flex items-center mt-1">
                          <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                          {assignment.location}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">Dates</span>
                        <span className="font-medium flex items-center mt-1">
                          <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                          {new Date(assignment.startDate).toLocaleDateString()} - {new Date(assignment.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">Role</span>
                        <span className="font-medium flex items-center mt-1">
                          <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                          {assignment.role === "LEAD" ? "Lead Referee" : 
                            assignment.role === "ASSISTANT" ? "Assistant Referee" : "Line Judge"}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-4 mt-6">
                      <div className="flex-1">
                        <div className="bg-muted/20 rounded-md p-4">
                          <div className="flex gap-6">
                            <div>
                              <p className="text-sm text-muted-foreground">Assigned Matches</p>
                              <p className="text-2xl font-bold">{assignment.assignedMatches}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Completed</p>
                              <p className="text-2xl font-bold">{assignment.completedMatches}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <Link href={`/referee/tournaments/${assignment.id}`}>
                          <Button variant="outline">
                            Tournament Details
                          </Button>
                        </Link>
                        <Link href={`/referee/matches?tournamentId=${assignment.id}`}>
                          <Button>
                            View Matches
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* Past Assignments Section */}
      <div className="mb-10">
        <h2 className="text-xl font-bold mb-4">Past Assignments</h2>
        
        {pastAssignments.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
                <h3 className="text-lg font-medium mb-2">No past assignments</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  You haven't officiated any tournaments yet.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {pastAssignments.map(assignment => (
              <Card key={assignment.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="bg-muted/30 p-4 border-b">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold">{assignment.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {assignment.role === "LEAD" ? "Lead Referee" : 
                            assignment.role === "ASSISTANT" ? "Assistant Referee" : "Line Judge"}
                        </p>
                      </div>
                      {assignment.status === "COMPLETED" ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          Completed
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                          Cancelled
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">Location</span>
                        <span className="font-medium flex items-center mt-1">
                          <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                          {assignment.location}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">Dates</span>
                        <span className="font-medium flex items-center mt-1">
                          <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                          {new Date(assignment.startDate).toLocaleDateString()} - {new Date(assignment.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">Statistics</span>
                        <span className="font-medium mt-1">
                          {assignment.completedMatches} of {assignment.assignedMatches} matches completed
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex justify-end mt-4">
                      <Link href={`/referee/history?tournamentId=${assignment.id}`}>
                        <Button variant="outline">
                          View Match History
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* Tournaments CTA */}
      <div className="mt-10">
        <Card className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="shrink-0">
                <Trophy className="h-16 w-16 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">Ready to referee more tournaments?</h3>
                <p className="text-muted-foreground mb-4">
                  Browse available tournaments and apply to officiate.
                </p>
                <Link href="/referee/tournaments">
                  <Button>
                    Browse Tournaments
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 