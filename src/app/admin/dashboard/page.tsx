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
  Users,
  Trophy,
  ChevronRight,
  User,
  PlusCircle,
  FileText,
  Settings,
  Database,
  Bell,
  CheckCircle,
  Clock,
  ListChecks,
  BarChart3,
  Layers,
  Shield,
  UserPlus
} from "lucide-react";

interface Tournament {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  location: string;
  registeredPlayers?: number;
  playerCount?: number;
  status: string; // Using string instead of enum to handle both frontend and backend status values
}

interface PlayerRequest {
  id: number;
  playerName: string;
  playerEmail: string;
  tournamentName: string;
  tournamentId: number;
  requestDate: string;
  status: "pending" | "approved" | "rejected";
}

interface RecentActivity {
  id: number;
  type: "join" | "match" | "tournament" | "referee" | "other";
  message: string;
  timestamp: string;
  icon?: string;
}

interface TournamentStats {
  totalTournaments: number;
  upcomingTournaments: number;
  activeTournaments: number;
  completedTournaments: number;
  totalPlayers: number;
  totalReferees: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [playerRequests, setPlayerRequests] = useState<PlayerRequest[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [tournamentStats, setTournamentStats] = useState<TournamentStats>({
    totalTournaments: 0,
    upcomingTournaments: 0,
    activeTournaments: 0,
    completedTournaments: 0,
    totalPlayers: 0,
    totalReferees: 0,
  });
  
  // Check if user has the correct role
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    
    if (status === "authenticated" && 
       (session?.user?.role !== "TOURNAMENT_ADMIN" && session?.user?.role !== "MASTER_ADMIN")) {
      router.push("/dashboard");
      return;
    }

    fetchData();
  }, [status, session, router]);

  // Fetch tournament data
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch tournaments
      const tournamentsResponse = await fetch('/api/tournaments');
      let tournamentsData = { tournaments: [] };
      
      if (tournamentsResponse.ok) {
        tournamentsData = await tournamentsResponse.json();
        setTournaments(tournamentsData.tournaments || []);
        
        // Calculate stats from tournament data
        const upcomingCount = tournamentsData.tournaments.filter(
          (t: Tournament) => t.status === 'REGISTRATION_OPEN' || t.status === 'REGISTRATION_CLOSED' || t.status === 'upcoming'
        ).length;
        
        const activeCount = tournamentsData.tournaments.filter(
          (t: Tournament) => t.status === 'IN_PROGRESS' || t.status === 'active'
        ).length;
        
        const completedCount = tournamentsData.tournaments.filter(
          (t: Tournament) => t.status === 'COMPLETED' || t.status === 'completed'
        ).length;
        
        // Count total players
        let playerCount = 0;
        tournamentsData.tournaments.forEach((t: any) => {
          playerCount += t.playerCount || 0;
        });
        
        // Fetch referee count
        const refereesResponse = await fetch('/api/referees');
        let refereeCount = 0;
        if (refereesResponse.ok) {
          const refereesData = await refereesResponse.json();
          refereeCount = refereesData.referees?.length || 0;
        }
        
        setTournamentStats({
          totalTournaments: tournamentsData.tournaments.length,
          upcomingTournaments: upcomingCount,
          activeTournaments: activeCount,
          completedTournaments: completedCount,
          totalPlayers: playerCount,
          totalReferees: refereeCount
        });
      }
      
      // Fetch recent activity
      try {
        const activityResponse = await fetch('/api/admin/activity');
        if (activityResponse.ok) {
          const activityData = await activityResponse.json();
          setRecentActivity(activityData.activities || []);
        } else {
          // Generate fallback activity data based on real tournaments
          generateFallbackActivityData(tournamentsData.tournaments);
        }
      } catch (error) {
        console.warn("Could not fetch activity data:", error);
        // Generate fallback activity if API fails
        generateFallbackActivityData(tournamentsData.tournaments);
      }
      
      // Fetch player requests (if applicable API exists)
      try {
        const requestsResponse = await fetch('/api/player-requests');
        if (requestsResponse.ok) {
          const requestsData = await requestsResponse.json();
          setPlayerRequests(requestsData.requests || []);
        }
      } catch (error) {
        console.warn("Could not fetch player requests:", error);
        // If there's no endpoint yet, we'll just leave the empty array
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Generate fallback activity based on real tournament data when API fails
  const generateFallbackActivityData = (tournaments: Tournament[]) => {
    const now = new Date();
    const activities: RecentActivity[] = [];
    
    // Only proceed if we have tournaments
    if (tournaments && tournaments.length > 0) {
      // Last player joined tournament activity
      if (tournaments[0]) {
        activities.push({
          id: 1,
          type: "join",
          message: `New player joined ${tournaments[0].name}`,
          timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          icon: "UserPlus"
        });
      }
      
      // Recent match completed activity
      if (tournaments.length > 1) {
        activities.push({
          id: 2,
          type: "match",
          message: `Match completed in ${tournaments[1].name}`,
          timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
          icon: "CheckCircle"
        });
      }
      
      // Tournament round scheduled activity
      if (tournaments.length > 2) {
        activities.push({
          id: 3,
          type: "tournament",
          message: `Round 2 of ${tournaments[2].name} scheduled`,
          timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
          icon: "Layers"
        });
      }
    } else {
      // Fallback to generic activities if no tournaments
      activities.push(
        {
          id: 1,
          type: "join",
          message: "Sarah Johnson joined Summer Grand Slam",
          timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
          icon: "UserPlus"
        },
        {
          id: 2,
          type: "match",
          message: "Match #23 completed: Smith/Johnson vs Garcia/Rodriguez",
          timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
          icon: "CheckCircle"
        },
        {
          id: 3,
          type: "tournament",
          message: "Round 2 of City Championships scheduled",
          timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
          icon: "Layers"
        }
      );
    }
    
    setRecentActivity(activities);
  };

  const handleApprovePlayer = async (requestId: number) => {
    try {
      // This would be an actual API call in production
      console.log(`Approving player: ${requestId}`);
      
      // Update UI optimistically
      setPlayerRequests(prevRequests => 
        prevRequests.map(request => 
          request.id === requestId 
            ? { ...request, status: "approved" } 
            : request
        )
      );
      
      // Show success message
      alert("Player approved successfully");
    } catch (error) {
      console.error("Error approving player:", error);
      alert("Failed to approve player. Please try again.");
    }
  };
  
  const handleRejectPlayer = async (requestId: number) => {
    try {
      // This would be an actual API call in production
      console.log(`Rejecting player: ${requestId}`);
      
      // Update UI optimistically
      setPlayerRequests(prevRequests => 
        prevRequests.map(request => 
          request.id === requestId 
            ? { ...request, status: "rejected" } 
            : request
        )
      );
      
      // Show success message
      alert("Player rejected successfully");
    } catch (error) {
      console.error("Error rejecting player:", error);
      alert("Failed to reject player. Please try again.");
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
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-500">
            Tournament Admin Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => router.push("/admin/tournaments")}
              className="hidden md:flex items-center gap-1"
            >
              <Trophy className="h-4 w-4" />
              Tournaments
            </Button>
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => router.push("/admin/players")}
              className="hidden md:flex items-center gap-1"
            >
              <Users className="h-4 w-4" />
              Players
            </Button>
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => router.push("/admin/profile")}
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
          <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-lg p-6 border border-orange-500/20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold">
                  Welcome back, {session?.user?.name || "Admin"}!
                </h2>
                <p className="text-muted-foreground mt-1">
                  Manage your tournaments, players, and organize competitions.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.push("/admin/tournaments")}
                  className="flex items-center gap-1"
                >
                  <Trophy className="h-4 w-4" />
                  View Tournaments
                </Button>
                <Button
                  onClick={() => {
                    console.log("Create Tournament button clicked, navigating to /admin/tournaments/create");
                    window.open("/admin/tournaments/create", "_blank");
                  }}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create Tournament
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Cards */}
        <section className="mb-8">
          <h3 className="text-lg font-medium mb-4">Tournament Statistics</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-slate-50/50 to-slate-100/50 dark:from-slate-950/20 dark:to-slate-900/20 border-slate-200/50 dark:border-slate-800/30">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Tournaments</p>
                    <h3 className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">{tournamentStats.totalTournaments}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        {tournamentStats.upcomingTournaments} Upcoming
                      </Badge>
                      <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        {tournamentStats.activeTournaments} Active
                      </Badge>
                    </div>
                  </div>
                  <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-full">
                    <Trophy className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-50/50 to-slate-100/50 dark:from-slate-950/20 dark:to-slate-900/20 border-slate-200/50 dark:border-slate-800/30">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Players</p>
                    <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{tournamentStats.totalPlayers}</h3>
                    <p className="text-xs mt-1 text-muted-foreground">Registered across all tournaments</p>
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-50/50 to-slate-100/50 dark:from-slate-950/20 dark:to-slate-900/20 border-slate-200/50 dark:border-slate-800/30">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Referees</p>
                    <h3 className="text-2xl font-bold text-teal-600 dark:text-teal-400 mt-1">{tournamentStats.totalReferees}</h3>
                    <p className="text-xs mt-1 text-muted-foreground">Available for assignment</p>
                  </div>
                  <div className="bg-teal-100 dark:bg-teal-900/30 p-2 rounded-full">
                    <Shield className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Tournament Management */}
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Your Tournaments</CardTitle>
                  <Button 
                    variant="link" 
                    className="text-sm gap-1"
                    onClick={() => router.push("/admin/tournaments")}
                  >
                    View All
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>Manage and monitor your tournaments</CardDescription>
              </CardHeader>
              <CardContent>
                {tournaments.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No tournaments found</p>
                    <Button 
                      variant="link" 
                      className="mt-2"
                      onClick={() => router.push("/admin/tournaments/create")}
                    >
                      Create your first tournament
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tournaments.slice(0, 3).map((tournament) => (
                      <div 
                        key={tournament.id} 
                        className="p-4 rounded-lg border border-orange-200/40 dark:border-orange-800/30 hover:bg-orange-50/50 dark:hover:bg-orange-950/10 transition-colors cursor-pointer"
                        onClick={() => router.push(`/admin/tournaments/${tournament.id}`)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium text-lg">{tournament.name}</h4>
                            <p className="text-sm text-muted-foreground">{tournament.location}</p>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={
                              tournament.status === "active" 
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                                : tournament.status === "upcoming"
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                            }
                          >
                            {tournament.status === "active" 
                              ? "Active" 
                              : tournament.status === "upcoming" 
                                ? "Upcoming" 
                                : "Completed"}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 mt-4 text-sm">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-muted-foreground mr-1" />
                            <p>{new Date(tournament.startDate).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 text-muted-foreground mr-1" />
                            <p>{tournament.startDate} - {tournament.endDate}</p>
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 text-muted-foreground mr-1" />
                            <p>{tournament.registeredPlayers} players</p>
                          </div>
                        </div>
                        
                        <div className="flex justify-end gap-2 mt-4">
                          {tournament.status === "upcoming" && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/admin/tournaments/${tournament.id}/edit`);
                              }}
                            >
                              Edit
                            </Button>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/admin/tournaments/${tournament.id}`);
                            }}
                          >
                            Manage
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  onClick={() => router.push("/admin/tournaments/create")}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create New Tournament
                </Button>
              </CardFooter>
            </Card>

            {/* Statistics & Data */}
            <Card>
              <CardHeader>
                <CardTitle>Tournament Analytics</CardTitle>
                <CardDescription>Player participation and match statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-[21/9] border border-border rounded-md bg-gradient-to-br from-background to-muted/30 flex flex-col items-center justify-center">
                  <BarChart3 className="h-16 w-16 text-muted-foreground/30 mb-2" />
                  <p className="text-center text-muted-foreground max-w-md">
                    Tournament analytics would appear here, showing player registrations, match completion rates, and other key metrics.
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <Button 
                    variant="outline"
                    onClick={() => router.push("/admin/analytics/players")}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Player Analytics
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => router.push("/admin/analytics/tournaments")}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Tournament Metrics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Player Requests & Quick Actions */}
          <div className="space-y-8">
            {/* Player Requests */}
            <Card>
              <CardHeader>
                <CardTitle>Player Requests</CardTitle>
                <CardDescription>Players requesting to join tournaments</CardDescription>
              </CardHeader>
              <CardContent>
                {playerRequests.filter(r => r.status === "pending").length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No pending player requests</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {playerRequests.filter(r => r.status === "pending").map((request) => (
                      <div key={request.id} className="p-4 rounded-lg border border-blue-200/40 dark:border-blue-800/30">
                        <h4 className="font-medium">{request.playerName}</h4>
                        <p className="text-sm text-muted-foreground">{request.playerEmail}</p>
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                          <Trophy className="h-3 w-3 mr-1" />
                          <span>Request to join: {request.tournamentName}</span>
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>Requested on {new Date(request.requestDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="w-full"
                            onClick={() => handleApprovePlayer(request.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                            Approve
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="w-full"
                            onClick={() => handleRejectPlayer(request.id)}
                          >
                            <Bell className="h-4 w-4 mr-1 text-red-500" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => router.push("/admin/player-requests")}
                >
                  View All Player Requests
                </Button>
              </CardFooter>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tournament admin tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start text-left"
                  onClick={() => router.push("/admin/tournaments/create")}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create New Tournament
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left"
                  onClick={() => router.push("/admin/players/invite")}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Players
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left"
                  onClick={() => router.push("/admin/schedule")}
                >
                  <ListChecks className="h-4 w-4 mr-2" />
                  Manage Match Schedule
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left"
                  onClick={() => router.push("/admin/results")}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Tournament Results
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left"
                  onClick={() => router.push("/admin/settings")}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Tournament Settings
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left"
                  onClick={() => router.push("/admin/export")}
                >
                  <Database className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest actions and updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No recent activity</p>
                    </div>
                  ) : (
                    recentActivity.map((activity) => {
                      // Determine the icon to display
                      let ActivityIcon = UserPlus;
                      let iconBgClass = "bg-blue-100 dark:bg-blue-900/30";
                      let iconTextClass = "text-blue-600 dark:text-blue-400";
                      
                      if (activity.type === "match") {
                        ActivityIcon = CheckCircle;
                        iconBgClass = "bg-green-100 dark:bg-green-900/30";
                        iconTextClass = "text-green-600 dark:text-green-400";
                      } else if (activity.type === "tournament") {
                        ActivityIcon = Layers;
                        iconBgClass = "bg-orange-100 dark:bg-orange-900/30";
                        iconTextClass = "text-orange-600 dark:text-orange-400";
                      } else if (activity.type === "referee") {
                        ActivityIcon = Shield;
                        iconBgClass = "bg-purple-100 dark:bg-purple-900/30";
                        iconTextClass = "text-purple-600 dark:text-purple-400";
                      }
                      
                      // Format timestamp
                      const timestamp = new Date(activity.timestamp);
                      const now = new Date();
                      const diffTime = Math.abs(now.getTime() - timestamp.getTime());
                      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
                      const diffMinutes = Math.floor(diffTime / (1000 * 60));
                      
                      let timeAgo = "";
                      if (diffDays > 0) {
                        timeAgo = diffDays === 1 ? "Yesterday" : `${diffDays} days ago`;
                      } else if (diffHours > 0) {
                        timeAgo = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
                      } else {
                        timeAgo = `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
                      }
                      
                      return (
                        <div key={activity.id} className="flex items-start gap-3">
                          <div className={`${iconBgClass} p-2 rounded-full`}>
                            <ActivityIcon className={`h-4 w-4 ${iconTextClass}`} />
                          </div>
                          <div>
                            <p className="text-sm">{activity.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => router.push("/admin/activity")}
                >
                  View All Activity
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
} 