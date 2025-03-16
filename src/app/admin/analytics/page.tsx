"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  BarChart3,
  Download,
  LineChart,
  PieChart,
  TrendingUp,
  Users,
  Trophy,
  Calendar,
  DollarSign,
  Clock,
  HardDrive,
  Server,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

// Mock data - in a real app this would come from API
const revenueData = [
  { month: "Jan", amount: 0 },
  { month: "Feb", amount: 0 },
  { month: "Mar", amount: 45000 },
  { month: "Apr", amount: 62000 },
  { month: "May", amount: 78000 },
  { month: "Jun", amount: 91000 },
  { month: "Jul", amount: 120000 },
  { month: "Aug", amount: 150000 },
  { month: "Sep", amount: 170000 },
  { month: "Oct", amount: 210000 },
  { month: "Nov", amount: 250000 },
  { month: "Dec", amount: 0 },
];

const userGrowthData = [
  { month: "Mar", users: 120 },
  { month: "Apr", users: 250 },
  { month: "May", users: 380 },
  { month: "Jun", users: 450 },
  { month: "Jul", users: 590 },
  { month: "Aug", users: 720 },
  { month: "Sep", users: 830 },
  { month: "Oct", users: 950 },
  { month: "Nov", users: 1100 },
  { month: "Dec", users: 0 },
];

const tournamentStats = [
  { type: "Singles", count: 22, revenue: 125000 },
  { type: "Doubles", count: 18, revenue: 98000 },
  { type: "Mixed Doubles", count: 14, revenue: 76000 },
  { type: "Team", count: 8, revenue: 45000 },
];

const topPerformingTournaments = [
  {
    id: 1,
    name: "Winter Championship 2023",
    participants: 128,
    revenue: 87500,
    status: "COMPLETED",
  },
  {
    id: 2,
    name: "Summer Slam 2023",
    participants: 96,
    revenue: 72000,
    status: "COMPLETED",
  },
  {
    id: 3,
    name: "Diwali Cup 2023",
    participants: 64,
    revenue: 48000,
    status: "COMPLETED",
  },
  {
    id: 4,
    name: "Monsoon Madness",
    participants: 32,
    revenue: 24000,
    status: "IN_PROGRESS",
  },
  {
    id: 5,
    name: "Spring Tournament 2024",
    participants: 48,
    revenue: 36000,
    status: "REGISTRATION_OPEN",
  },
];

const userDemographics = [
  { age: "18-24", percentage: 22 },
  { age: "25-34", percentage: 38 },
  { age: "35-44", percentage: 25 },
  { age: "45-54", percentage: 10 },
  { age: "55+", percentage: 5 },
];

const systemPerformanceData = [
  { hour: "00:00", responseTime: 120, errorRate: 0.5, users: 45 },
  { hour: "03:00", responseTime: 115, errorRate: 0.3, users: 22 },
  { hour: "06:00", responseTime: 105, errorRate: 0.2, users: 35 },
  { hour: "09:00", responseTime: 145, errorRate: 0.8, users: 210 },
  { hour: "12:00", responseTime: 180, errorRate: 1.2, users: 350 },
  { hour: "15:00", responseTime: 165, errorRate: 1.0, users: 320 },
  { hour: "18:00", responseTime: 190, errorRate: 1.5, users: 280 },
  { hour: "21:00", responseTime: 150, errorRate: 0.9, users: 175 },
];

export default function AdminAnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [dateRange, setDateRange] = useState("last30");
  const [loading, setLoading] = useState(true);

  // Check if user is master admin
  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user?.role !== "MASTER_ADMIN") {
      router.push("/unauthorized");
    }

    // Simulate loading data
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [status, session, router]);

  // If still checking authentication, show loading state
  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const handleExportReport = (reportType: string) => {
    toast.success(`Exporting ${reportType} report`);
  };

  const handleDateRangeChange = (value: string) => {
    setDateRange(value);
    toast.info(`Date range changed to ${value}`);
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into your platform's performance
          </p>
        </div>
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <Select defaultValue={dateRange} onValueChange={handleDateRangeChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last7">Last 7 days</SelectItem>
              <SelectItem value="last30">Last 30 days</SelectItem>
              <SelectItem value="last90">Last 90 days</SelectItem>
              <SelectItem value="thisYear">This year</SelectItem>
              <SelectItem value="allTime">All time</SelectItem>
            </SelectContent>
          </Select>
          
          <Button className="bg-primary hover:bg-primary/90">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <h3 className="text-3xl font-bold mt-2">{formatCurrency(1176000)}</h3>
                <p className="text-sm text-green-600 mt-1">
                  <TrendingUp className="inline-block h-3 w-3 mr-1" />
                  +18.3% from last month
                </p>
              </div>
              <div className="bg-primary/10 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <h3 className="text-3xl font-bold mt-2">1,100</h3>
                <p className="text-sm text-green-600 mt-1">
                  <TrendingUp className="inline-block h-3 w-3 mr-1" />
                  +15.3% from last month
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Active Tournaments
                </p>
                <h3 className="text-3xl font-bold mt-2">12</h3>
                <p className="text-sm text-green-600 mt-1">
                  <TrendingUp className="inline-block h-3 w-3 mr-1" />
                  +2 from last month
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Trophy className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Average Order</p>
                <h3 className="text-3xl font-bold mt-2">{formatCurrency(850)}</h3>
                <p className="text-sm text-green-600 mt-1">
                  <TrendingUp className="inline-block h-3 w-3 mr-1" />
                  +5.7% from last month
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="revenue" className="space-y-8">
        <TabsList className="grid grid-cols-4 gap-2">
          <TabsTrigger value="revenue" className="flex items-center">
            <DollarSign className="mr-2 h-4 w-4" />
            <span>Revenue</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center">
            <Users className="mr-2 h-4 w-4" />
            <span>Users</span>
          </TabsTrigger>
          <TabsTrigger value="tournaments" className="flex items-center">
            <Trophy className="mr-2 h-4 w-4" />
            <span>Tournaments</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center">
            <Server className="mr-2 h-4 w-4" />
            <span>System</span>
          </TabsTrigger>
        </TabsList>

        {/* Revenue Tab */}
        <TabsContent value="revenue">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <LineChart className="mr-2 h-5 w-5" />
                  Revenue Trend
                </CardTitle>
                <CardDescription>
                  Monthly revenue trends over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center">
                  <div className="text-center">
                    <LineChart className="h-16 w-16 mx-auto mb-4 text-primary opacity-70" />
                    <h3 className="text-lg font-medium mb-2">Enhanced Charts Available</h3>
                    <p className="text-muted-foreground mb-4 max-w-md">
                      For the full analytics experience with interactive charts, install the required charting libraries.
                    </p>
                    <div className="bg-primary/10 rounded-md p-3 text-sm text-muted-foreground font-mono mb-4">
                      npm install recharts
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t px-6 py-4">
                <Button variant="outline" onClick={() => handleExportReport('revenue')}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Revenue Data
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="mr-2 h-5 w-5" />
                  Revenue Sources
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
                        <div className="w-3 h-3 rounded-full bg-indigo-500 mr-2"></div>
                        <span className="text-sm">Premium Features</span>
                      </div>
                      <span className="text-sm font-medium">17%</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: "17%" }}></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                        <span className="text-sm">Advertising</span>
                      </div>
                      <span className="text-sm font-medium">10%</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-500 rounded-full" style={{ width: "10%" }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <LineChart className="mr-2 h-5 w-5" />
                  User Growth
                </CardTitle>
                <CardDescription>
                  Monthly user acquisition
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center">
                  <div className="text-center">
                    <Users className="h-16 w-16 mx-auto mb-4 text-primary opacity-70" />
                    <h3 className="text-lg font-medium mb-2">User Growth Visualization</h3>
                    <p className="text-muted-foreground mb-4 max-w-md">
                      User growth data is available and ready to be visualized with a charting library.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="mr-2 h-5 w-5" />
                  User Demographics
                </CardTitle>
                <CardDescription>
                  Age distribution
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {userDemographics.map((item) => (
                    <div className="space-y-2" key={item.age}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-sm">{item.age}</span>
                        </div>
                        <span className="text-sm font-medium">{item.percentage}%</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full" 
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="border-t px-6 py-4">
                <Button variant="outline" size="sm" onClick={() => handleExportReport('demographics')}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Demographics
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  User Activity
                </CardTitle>
                <CardDescription>
                  Engagement metrics for platform usage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center">
                        <div className="text-4xl font-bold text-primary">24.6%</div>
                        <p className="text-sm text-gray-500 mt-2">Repeat Users</p>
                        <p className="text-xs text-green-600 mt-1">+2.8% vs last month</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center">
                        <div className="text-4xl font-bold text-primary">18.3</div>
                        <p className="text-sm text-gray-500 mt-2">Avg. Session (min)</p>
                        <p className="text-xs text-green-600 mt-1">+1.2 min vs last month</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center">
                        <div className="text-4xl font-bold text-primary">3.7</div>
                        <p className="text-sm text-gray-500 mt-2">Avg. Sessions/Week</p>
                        <p className="text-xs text-green-600 mt-1">+0.5 vs last month</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tournaments Tab */}
        <TabsContent value="tournaments">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="mr-2 h-5 w-5" />
                  Tournament Statistics
                </CardTitle>
                <CardDescription>
                  Performance metrics for different tournament types
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-sm">Tournament Type</th>
                        <th className="text-left py-3 px-4 font-medium text-sm">Count</th>
                        <th className="text-left py-3 px-4 font-medium text-sm">Avg. Participants</th>
                        <th className="text-left py-3 px-4 font-medium text-sm">Total Revenue</th>
                        <th className="text-left py-3 px-4 font-medium text-sm">Avg. Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {tournamentStats.map((stat) => (
                        <tr key={stat.type}>
                          <td className="py-3 px-4">{stat.type}</td>
                          <td className="py-3 px-4">{stat.count}</td>
                          <td className="py-3 px-4">{Math.round(stat.revenue / stat.count / 750)}</td>
                          <td className="py-3 px-4">{formatCurrency(stat.revenue)}</td>
                          <td className="py-3 px-4">{formatCurrency(Math.round(stat.revenue / stat.count))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Top Performing Tournaments
                </CardTitle>
                <CardDescription>
                  Tournaments with highest revenue and participation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-sm">Tournament Name</th>
                        <th className="text-left py-3 px-4 font-medium text-sm">Participants</th>
                        <th className="text-left py-3 px-4 font-medium text-sm">Revenue</th>
                        <th className="text-left py-3 px-4 font-medium text-sm">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-sm">Revenue/User</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {topPerformingTournaments.map((tournament) => (
                        <tr key={tournament.id}>
                          <td className="py-3 px-4">{tournament.name}</td>
                          <td className="py-3 px-4">{tournament.participants}</td>
                          <td className="py-3 px-4">{formatCurrency(tournament.revenue)}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              tournament.status === 'COMPLETED' 
                                ? 'bg-green-100 text-green-800' 
                                : tournament.status === 'IN_PROGRESS'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {tournament.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4">{formatCurrency(Math.round(tournament.revenue / tournament.participants))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
              <CardFooter className="border-t px-6 py-4">
                <Button variant="outline" onClick={() => handleExportReport('tournaments')}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Tournament Data
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Server className="mr-2 h-5 w-5" />
                  System Performance
                </CardTitle>
                <CardDescription>
                  Server response times and error rates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center">
                  <div className="text-center">
                    <Server className="h-16 w-16 mx-auto mb-4 text-primary opacity-70" />
                    <h3 className="text-lg font-medium mb-2">System Metrics</h3>
                    <p className="text-muted-foreground mb-4 max-w-md">
                      Track system performance metrics to ensure optimal user experience.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="mr-2 h-5 w-5" />
                  System Health
                </CardTitle>
                <CardDescription>
                  Current system status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                      <span>Server Status</span>
                    </div>
                    <span className="text-green-600 font-medium">Operational</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                      <span>Database</span>
                    </div>
                    <span className="text-green-600 font-medium">Operational</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                      <span>API Gateway</span>
                    </div>
                    <span className="text-yellow-600 font-medium">Degraded</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                      <span>Authentication</span>
                    </div>
                    <span className="text-green-600 font-medium">Operational</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                      <span>File Storage</span>
                    </div>
                    <span className="text-green-600 font-medium">Operational</span>
                  </div>
                </div>

                <div className="pt-4">
                  <h4 className="text-sm font-medium mb-2">Current Load</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">CPU</span>
                      <span className="text-sm font-medium">35%</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: "35%" }}></div>
                    </div>
                  </div>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Memory</span>
                      <span className="text-sm font-medium">42%</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: "42%" }}></div>
                    </div>
                  </div>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Storage</span>
                      <span className="text-sm font-medium">68%</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-500 rounded-full" style={{ width: "68%" }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t px-6 py-4">
                <Button variant="outline" onClick={() => handleExportReport('system')}>
                  <Download className="mr-2 h-4 w-4" />
                  Export System Logs
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-5 w-5" />
                  Response Time Analysis
                </CardTitle>
                <CardDescription>
                  Average response times by endpoint
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-sm">Endpoint</th>
                        <th className="text-left py-3 px-4 font-medium text-sm">Avg. Response Time</th>
                        <th className="text-left py-3 px-4 font-medium text-sm">Error Rate</th>
                        <th className="text-left py-3 px-4 font-medium text-sm">Daily Requests</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <tr>
                        <td className="py-3 px-4">/api/auth</td>
                        <td className="py-3 px-4">95ms</td>
                        <td className="py-3 px-4">0.02%</td>
                        <td className="py-3 px-4">12,450</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4">/api/tournaments</td>
                        <td className="py-3 px-4">128ms</td>
                        <td className="py-3 px-4">0.05%</td>
                        <td className="py-3 px-4">8,327</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4">/api/users</td>
                        <td className="py-3 px-4">112ms</td>
                        <td className="py-3 px-4">0.03%</td>
                        <td className="py-3 px-4">9,845</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4">/api/payments</td>
                        <td className="py-3 px-4">165ms</td>
                        <td className="py-3 px-4">0.08%</td>
                        <td className="py-3 px-4">4,562</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4">/api/contests</td>
                        <td className="py-3 px-4">142ms</td>
                        <td className="py-3 px-4">0.04%</td>
                        <td className="py-3 px-4">7,218</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 