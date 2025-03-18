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
  DollarSign,
  Users,
  ShieldCheck,
  TrendingUp,
  ChevronRight,
  CheckCircle,
  XCircle,
  BarChart3,
  Activity,
  Settings,
  Building2,
  UserCog,
  LineChart,
  PieChart,
  Server,
  Calendar,
} from "lucide-react";

interface PendingAdmin {
  id: number;
  name: string;
  email: string;
  requestDate: string;
  tournamentName?: string;
}

interface RevenueStats {
  total: number;
  fantasyGames: number;
  tournaments: number;
  monthlyChange: number;
  yearlyProjection: number;
}

interface UserStats {
  total: number;
  players: number;
  referees: number;
  admins: number;
  newSignups: number;
}

interface ActivityItem {
  id: number;
  type: "signup" | "tournament" | "fantasy" | "payment";
  user: string;
  action: string;
  timestamp: string;
}

export default function MasterAdminDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [pendingAdmins, setPendingAdmins] = useState<PendingAdmin[]>([]);
  const [revenueStats, setRevenueStats] = useState<RevenueStats>({
    total: 0,
    fantasyGames: 0,
    tournaments: 0,
    monthlyChange: 0,
    yearlyProjection: 0,
  });
  const [userStats, setUserStats] = useState<UserStats>({
    total: 0,
    players: 0,
    referees: 0,
    admins: 0,
    newSignups: 0,
  });
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  
  // Check if user has the correct role
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    
    if (status === "authenticated" && session?.user?.role !== "MASTER_ADMIN") {
      router.push("/dashboard");
      return;
    }
  }, [status, session, router]);

  // Fetch admin data
  useEffect(() => {
    // This would be replaced with actual API calls in production
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        
        // Mock data for demonstration
        const mockPendingAdmins: PendingAdmin[] = [
          { 
            id: 1, 
            name: "John Davis", 
            email: "john.davis@example.com", 
            requestDate: "2023-10-05",
            tournamentName: "Summer Grand Slam" 
          },
          { 
            id: 2, 
            name: "Sarah Wilson", 
            email: "sarah.wilson@example.com", 
            requestDate: "2023-10-08",
            tournamentName: "City Championship" 
          },
          { 
            id: 3, 
            name: "Michael Brown", 
            email: "michael.brown@example.com", 
            requestDate: "2023-10-10",
            tournamentName: "Masters Invitational" 
          },
        ];
        
        const mockRevenueStats: RevenueStats = {
          total: 75250,
          fantasyGames: 52500,
          tournaments: 22750,
          monthlyChange: 15.3,
          yearlyProjection: 950000,
        };
        
        const mockUserStats: UserStats = {
          total: 8750,
          players: 7200,
          referees: 350,
          admins: 45,
          newSignups: 125,
        };
        
        const mockRecentActivity: ActivityItem[] = [
          {
            id: 1,
            type: "tournament",
            user: "Sarah Wilson",
            action: "Created new tournament: Regional Open",
            timestamp: "2023-10-15T13:45:00Z",
          },
          {
            id: 2,
            type: "fantasy",
            user: "System",
            action: "Fantasy contest 'Summer Slam Fantasy' started",
            timestamp: "2023-10-15T12:30:00Z",
          },
          {
            id: 3,
            type: "payment",
            user: "Finance System",
            action: "Payout of $12,500 processed for Masters Tournament",
            timestamp: "2023-10-15T10:15:00Z",
          },
          {
            id: 4,
            type: "signup",
            user: "Robert Johnson",
            action: "New REFEREE account created",
            timestamp: "2023-10-15T09:22:00Z",
          },
          {
            id: 5,
            type: "payment",
            user: "Finance System",
            action: "Received $5,750 from fantasy contest entries",
            timestamp: "2023-10-14T23:10:00Z",
          },
        ];
        
        setPendingAdmins(mockPendingAdmins);
        setRevenueStats(mockRevenueStats);
        setUserStats(mockUserStats);
        setRecentActivity(mockRecentActivity);
      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (status === "authenticated") {
      fetchAdminData();
    }
  }, [status]);

  const handleApproveAdmin = async (adminId: number) => {
    try {
      // This would be an actual API call in production
      console.log(`Approving admin: ${adminId}`);
      
      // Update UI optimistically
      setPendingAdmins(prevAdmins => 
        prevAdmins.filter(admin => admin.id !== adminId)
      );
      
      // Show success message
      alert("Admin approved successfully");
    } catch (error) {
      console.error("Error approving admin:", error);
      alert("Failed to approve admin. Please try again.");
    }
  };
  
  const handleRejectAdmin = async (adminId: number) => {
    try {
      // This would be an actual API call in production
      console.log(`Rejecting admin: ${adminId}`);
      
      // Update UI optimistically
      setPendingAdmins(prevAdmins => 
        prevAdmins.filter(admin => admin.id !== adminId)
      );
      
      // Show success message
      alert("Admin rejected successfully");
    } catch (error) {
      console.error("Error rejecting admin:", error);
      alert("Failed to reject admin. Please try again.");
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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "signup":
        return <Users className="h-5 w-5 text-blue-500" />;
      case "tournament":
        return <Trophy className="h-5 w-5 text-teal-500" />;
      case "fantasy":
        return <Star className="h-5 w-5 text-purple-500" />;
      case "payment":
        return <DollarSign className="h-5 w-5 text-green-500" />;
      default:
        return <Activity className="h-5 w-5 text-slate-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      {/* Top navigation bar */}
      <header className="border-b sticky top-0 z-10 bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500">
            Master Admin Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => router.push("/master-admin/settings")}
              className="hidden md:flex items-center gap-1"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => router.push("/master-admin/system")}
              className="hidden md:flex items-center gap-1"
            >
              <Server className="h-4 w-4" />
              System
            </Button>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => router.push("/master-admin/profile")}
              className="flex items-center gap-1"
            >
              <UserCog className="h-4 w-4" />
              Admin Tools
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Primary KPIs */}
        <section className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-purple-50/50 to-indigo-50/50 dark:from-purple-950/20 dark:to-indigo-950/20 border-purple-200/50 dark:border-purple-800/30">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                    <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                      ${revenueStats.total.toLocaleString()}
                    </h3>
                    <p className="text-xs flex items-center mt-1 text-green-600 dark:text-green-400">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {revenueStats.monthlyChange}% from last month
                    </p>
                  </div>
                  <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-full">
                    <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200/50 dark:border-blue-800/30">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                    <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                      {userStats.total.toLocaleString()}
                    </h3>
                    <p className="text-xs flex items-center mt-1 text-blue-600 dark:text-blue-400">
                      <Users className="h-3 w-3 mr-1" />
                      {userStats.newSignups} new this month
                    </p>
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-teal-50/50 to-emerald-50/50 dark:from-teal-950/20 dark:to-emerald-950/20 border-teal-200/50 dark:border-teal-800/30">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Yearly Projection</p>
                    <h3 className="text-2xl font-bold text-teal-600 dark:text-teal-400 mt-1">
                      ${(revenueStats.yearlyProjection / 1000).toFixed(0)}K
                    </h3>
                    <p className="text-xs flex items-center mt-1 text-teal-600 dark:text-teal-400">
                      <Calendar className="h-3 w-3 mr-1" />
                      Annual revenue target
                    </p>
                  </div>
                  <div className="bg-teal-100 dark:bg-teal-900/30 p-2 rounded-full">
                    <LineChart className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200/50 dark:border-amber-800/30">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Admin Approvals</p>
                    <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                      {pendingAdmins.length}
                    </h3>
                    <p className="text-xs flex items-center mt-1 text-amber-600 dark:text-amber-400">
                      <ShieldCheck className="h-3 w-3 mr-1" />
                      Pending approvals
                    </p>
                  </div>
                  <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-full">
                    <ShieldCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Revenue Dashboard */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Revenue Breakdown</CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push("/master-admin/revenue")}
                  >
                    View Detailed Reports
                  </Button>
                </div>
                <CardDescription>Revenue sources and projections</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Revenue by Source</h4>
                    <div className="h-64 border border-border rounded-md bg-gradient-to-br from-background to-muted/30 flex flex-col items-center justify-center">
                      <PieChart className="h-16 w-16 text-muted-foreground/30 mb-2" />
                      <p className="text-sm text-muted-foreground">Revenue breakdown chart would appear here</p>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-md border">
                        <p className="text-xs text-muted-foreground">Fantasy Games</p>
                        <p className="text-lg font-semibold">${revenueStats.fantasyGames.toLocaleString()}</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">{Math.round(revenueStats.fantasyGames / revenueStats.total * 100)}% of total</p>
                      </div>
                      <div className="p-3 rounded-md border">
                        <p className="text-xs text-muted-foreground">Tournaments</p>
                        <p className="text-lg font-semibold">${revenueStats.tournaments.toLocaleString()}</p>
                        <p className="text-xs text-purple-600 dark:text-purple-400">{Math.round(revenueStats.tournaments / revenueStats.total * 100)}% of total</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Monthly Revenue Trend</h4>
                    <div className="h-64 border border-border rounded-md bg-gradient-to-br from-background to-muted/30 flex flex-col items-center justify-center">
                      <BarChart3 className="h-16 w-16 text-muted-foreground/30 mb-2" />
                      <p className="text-sm text-muted-foreground">Monthly revenue trend chart would appear here</p>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-md border">
                        <p className="text-xs text-muted-foreground">Monthly Change</p>
                        <div className="flex items-center">
                          <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                          <p className="text-lg font-semibold">{revenueStats.monthlyChange}%</p>
                        </div>
                        <p className="text-xs text-green-600 dark:text-green-400">vs. previous month</p>
                      </div>
                      <div className="p-3 rounded-md border">
                        <p className="text-xs text-muted-foreground">Annual Projection</p>
                        <p className="text-lg font-semibold">${(revenueStats.yearlyProjection / 1000).toFixed(0)}K</p>
                        <p className="text-xs text-teal-600 dark:text-teal-400">Based on current growth</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User Stats */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>User Statistics</CardTitle>
                  <Button 
                    variant="link" 
                    className="text-sm gap-1"
                    onClick={() => router.push("/master-admin/users")}
                  >
                    View All Users
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>Overview of all users on the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="p-4 rounded-lg border text-center">
                    <p className="text-sm text-muted-foreground mb-1">Total Users</p>
                    <p className="text-2xl font-bold">{userStats.total.toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-lg border text-center">
                    <p className="text-sm text-muted-foreground mb-1">Players</p>
                    <p className="text-2xl font-bold">{userStats.players.toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-lg border text-center">
                    <p className="text-sm text-muted-foreground mb-1">Referees</p>
                    <p className="text-2xl font-bold">{userStats.referees.toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-lg border text-center">
                    <p className="text-sm text-muted-foreground mb-1">Admins</p>
                    <p className="text-2xl font-bold">{userStats.admins.toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="aspect-[21/9] border border-border rounded-md bg-gradient-to-br from-background to-muted/30 flex flex-col items-center justify-center mb-4">
                  <BarChart3 className="h-16 w-16 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">User growth chart would appear here</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    variant="outline"
                    onClick={() => router.push("/master-admin/users")}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Manage Users
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => router.push("/master-admin/analytics/users")}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    User Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Pending Admin Approvals */}
            <Card>
              <CardHeader>
                <CardTitle>Pending Admin Approvals</CardTitle>
                <CardDescription>Tournament administrators awaiting approval</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingAdmins.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <ShieldCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No pending approvals</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingAdmins.map((admin) => (
                      <div key={admin.id} className="p-4 rounded-lg border">
                        <div className="flex flex-col">
                          <h4 className="font-medium">{admin.name}</h4>
                          <p className="text-sm text-muted-foreground mb-1">{admin.email}</p>
                          {admin.tournamentName && (
                            <div className="flex items-center mt-1">
                              <Building2 className="h-3 w-3 text-muted-foreground mr-1" />
                              <p className="text-xs">{admin.tournamentName}</p>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            Requested on {new Date(admin.requestDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="w-full"
                            onClick={() => handleApproveAdmin(admin.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                            Approve
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="w-full"
                            onClick={() => handleRejectAdmin(admin.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1 text-red-500" />
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
                  onClick={() => router.push("/master-admin/user-approvals")}
                >
                  View All Approval Requests
                </Button>
              </CardFooter>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest platform events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 pb-4 border-b border-border last:border-0 last:pb-0">
                      <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.action}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-muted-foreground">{activity.user}</p>
                          <span className="text-xs text-muted-foreground">•</span>
                          <p className="text-xs text-muted-foreground truncate">
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => router.push("/master-admin/activity")}
                >
                  View All Activity
                </Button>
              </CardFooter>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common administrative tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start text-left"
                  onClick={() => router.push("/master-admin/create-tournament")}
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  Create New Tournament
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left"
                  onClick={() => router.push("/master-admin/system-settings")}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  System Settings
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left"
                  onClick={() => router.push("/master-admin/finance")}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Finance Management
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left"
                  onClick={() => router.push("/master-admin/user-management")}
                >
                  <UserCog className="h-4 w-4 mr-2" />
                  User Management
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
} 