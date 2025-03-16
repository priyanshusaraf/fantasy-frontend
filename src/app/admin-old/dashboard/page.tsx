"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { AlertCircle, BarChart3, LineChart, PieChart, Trophy, Users } from "lucide-react";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Check if user is master admin
  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user?.role !== "MASTER_ADMIN") {
      router.push("/unauthorized");
    }
  }, [status, session, router]);

  // If still checking authentication, show loading state
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-text">Master Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your platform's performance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Total Revenue</CardTitle>
            <CardDescription>All-time earnings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">$523,900</div>
            <div className="flex items-center text-green-500 text-sm">
              <span className="mr-1">↑</span>
              <span>24.3% increase</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Total Users</CardTitle>
            <CardDescription>Registered accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">4,850</div>
            <div className="flex items-center text-green-500 text-sm">
              <span className="mr-1">↑</span>
              <span>12.4% increase</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Active Tournaments</CardTitle>
            <CardDescription>Currently running</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">8</div>
            <div className="flex items-center text-green-500 text-sm">
              <span className="mr-1">↑</span>
              <span>2 more than last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Prize Pool</CardTitle>
            <CardDescription>Total active prize money</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">$256,000</div>
            <div className="flex items-center text-green-500 text-sm">
              <span className="mr-1">↑</span>
              <span>24.2% increase</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <span>Revenue Chart</span>
            </CardTitle>
            <CardDescription>
              An enhanced dashboard with data visualization requires additional setup
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] flex items-center justify-center">
            <div className="text-center max-w-lg">
              <LineChart className="h-16 w-16 mx-auto mb-4 text-primary opacity-70" />
              <h3 className="text-lg font-medium mb-2">Enhanced Dashboard Available</h3>
              <p className="text-muted-foreground mb-4">
                To enable the complete Master Admin Dashboard with full statistics and visualization,
                install the required chart libraries.
              </p>
              <div className="bg-primary/10 rounded-md p-3 text-sm text-muted-foreground font-mono mb-4">
                npm install recharts date-fns
              </div>
              <Button>Install Dependencies</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              <span>Revenue Sources</span>
            </CardTitle>
            <CardDescription>
              Breakdown by category
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-primary mr-2"></div>
                    <span className="text-sm">Contest Fees</span>
                  </div>
                  <span className="text-sm font-medium">45%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: "45%" }}></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-cyan-500 mr-2"></div>
                    <span className="text-sm">Subscription</span>
                  </div>
                  <span className="text-sm font-medium">28%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 rounded-full" style={{ width: "28%" }}></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-sm">Premium Features</span>
                  </div>
                  <span className="text-sm font-medium">17%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: "17%" }}></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                    <span className="text-sm">Advertising</span>
                  </div>
                  <span className="text-sm font-medium">10%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: "10%" }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span>Admin Requests</span>
            </CardTitle>
            <CardDescription>
              Recent admin approval requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                <div>
                  <div className="font-medium">David Johnson</div>
                  <div className="text-sm text-muted-foreground">Tournament Admin</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700 hover:bg-green-100 border-green-200">
                    Approve
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-100 border-red-200">
                    Reject
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                <div>
                  <div className="font-medium">Sarah Wilson</div>
                  <div className="text-sm text-muted-foreground">Referee</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700 hover:bg-green-100 border-green-200">
                    Approve
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-100 border-red-200">
                    Reject
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                <div>
                  <div className="font-medium">Michael Brown</div>
                  <div className="text-sm text-muted-foreground">Tournament Admin</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700 hover:bg-green-100 border-green-200">
                    Approve
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-100 border-red-200">
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">View All Requests</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              <span>Tournament Statistics</span>
            </CardTitle>
            <CardDescription>
              Active and upcoming tournaments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Total Tournaments</div>
                  <div className="text-2xl font-bold">36</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total Players</div>
                  <div className="text-2xl font-bold">768</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-sm font-medium">Tournament Status</div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5">
                      <Trophy className="h-4 w-4 text-primary" />
                      <span>Active</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">8</span>
                      <span className="text-xs text-muted-foreground">22%</span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: "22%" }}></div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 text-cyan-500" />
                      <span>Upcoming</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">12</span>
                      <span className="text-xs text-muted-foreground">33%</span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500 rounded-full" style={{ width: "33%" }}></div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5">
                      <BarChart3 className="h-4 w-4 text-green-500" />
                      <span>Completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">16</span>
                      <span className="text-xs text-muted-foreground">45%</span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: "45%" }}></div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">View All Tournaments</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 