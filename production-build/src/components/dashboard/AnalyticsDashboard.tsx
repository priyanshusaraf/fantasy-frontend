"use client";
import { useState, useEffect } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AdminGuard } from "@/components/auth/AdminGuard";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Users,
  TrendingUp,
  Calendar,
  DollarSign,
  BarChart2,
  PieChartIcon,
  Trophy,
  Download,
} from "lucide-react";

// Mock data - in a real app, this would come from API calls
const paymentData = [
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
  { month: "Jan", users: 0 },
  { month: "Feb", users: 0 },
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

const tournamentTypeData = [
  { name: "Singles", value: 35 },
  { name: "Doubles", value: 40 },
  { name: "Mixed Doubles", value: 25 },
];

const contestEntryData = [
  { name: "Free", value: 45 },
  { name: "₹500", value: 25 },
  { name: "₹1000", value: 20 },
  { name: "₹1500", value: 10 },
];

const recentTournamentsData = [
  {
    id: 1,
    name: "Spring Championship 2023",
    date: "Mar 15 - Mar 23, 2023",
    entries: 124,
    revenue: "₹62,000",
    status: "COMPLETED",
  },
  {
    id: 2,
    name: "Summer Classic 2023",
    date: "Jun 10 - Jun 18, 2023",
    entries: 156,
    revenue: "₹78,000",
    status: "COMPLETED",
  },
  {
    id: 3,
    name: "Monsoon Madness 2023",
    date: "Jul 22 - Jul 30, 2023",
    entries: 198,
    revenue: "₹99,000",
    status: "COMPLETED",
  },
  {
    id: 4,
    name: "Diwali Championship 2023",
    date: "Oct 18 - Oct 26, 2023",
    entries: 245,
    revenue: "₹122,500",
    status: "COMPLETED",
  },
  {
    id: 5,
    name: "Winter Cup 2023",
    date: "Nov 12 - Nov 20, 2023",
    entries: 278,
    revenue: "₹139,000",
    status: "COMPLETED",
  },
];

const topAdminsData = [
  {
    id: 1,
    name: "Rajesh Kumar",
    tournamentCount: 8,
    totalPlayers: 1245,
    revenue: "₹622,500",
  },
  {
    id: 2,
    name: "Priya Singh",
    tournamentCount: 6,
    totalPlayers: 945,
    revenue: "₹472,500",
  },
  {
    id: 3,
    name: "Amit Patel",
    tournamentCount: 5,
    totalPlayers: 780,
    revenue: "₹390,000",
  },
  {
    id: 4,
    name: "Sanjay Gupta",
    tournamentCount: 4,
    totalPlayers: 620,
    revenue: "₹310,000",
  },
  {
    id: 5,
    name: "Meera Reddy",
    tournamentCount: 3,
    totalPlayers: 465,
    revenue: "₹232,500",
  },
];

const COLORS = ["#00a1e0", "#0b453a", "#6da0e1", "#ec8c2f", "#a066d3"];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTournaments: 0,
    totalContests: 0,
    totalRevenue: 0,
  });

  // In a real app, this data would be fetched from your API
  useEffect(() => {
    const fetchAnalytics = async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setStats({
        totalUsers: 1100,
        totalTournaments: 32,
        totalContests: 128,
        totalRevenue: 1246000,
      });

      setLoading(false);
    };

    fetchAnalytics();
  }, []);

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  return (
    <AuthGuard>
      <AdminGuard>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#00a1e0]">
                Analytics Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Overview of tournaments, users, and revenue
              </p>
            </div>
            <Button className="mt-4 md:mt-0 bg-[#00a1e0] hover:bg-[#0072a3]">
              <Download className="mr-2 h-4 w-4" />
              Export Reports
            </Button>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Total Users
                    </p>
                    <h3 className="text-3xl font-bold mt-2">
                      {loading ? "..." : stats.totalUsers}
                    </h3>
                    <p className="text-sm text-green-600 mt-1">
                      <TrendingUp className="inline-block h-3 w-3 mr-1" />
                      +15.3% from last month
                    </p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Users className="h-6 w-6 text-[#00a1e0]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Total Tournaments
                    </p>
                    <h3 className="text-3xl font-bold mt-2">
                      {loading ? "..." : stats.totalTournaments}
                    </h3>
                    <p className="text-sm text-green-600 mt-1">
                      <TrendingUp className="inline-block h-3 w-3 mr-1" />
                      +8.7% from last month
                    </p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <Calendar className="h-6 w-6 text-[#0b453a]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Total Contests
                    </p>
                    <h3 className="text-3xl font-bold mt-2">
                      {loading ? "..." : stats.totalContests}
                    </h3>
                    <p className="text-sm text-green-600 mt-1">
                      <TrendingUp className="inline-block h-3 w-3 mr-1" />
                      +12.2% from last month
                    </p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Trophy className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Total Revenue
                    </p>
                    <h3 className="text-3xl font-bold mt-2">
                      {loading ? "..." : formatCurrency(stats.totalRevenue)}
                    </h3>
                    <p className="text-sm text-green-600 mt-1">
                      <TrendingUp className="inline-block h-3 w-3 mr-1" />
                      +18.5% from last month
                    </p>
                  </div>
                  <div className="bg-yellow-100 p-3 rounded-full">
                    <DollarSign className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Revenue Trend
                </CardTitle>
                <CardDescription>
                  Monthly revenue from fantasy tournament entries
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={paymentData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => [`₹${value}`, "Revenue"]}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="amount"
                        stroke="#00a1e0"
                        strokeWidth={2}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  User Growth
                </CardTitle>
                <CardDescription>
                  Monthly new user registrations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={userGrowthData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="users" fill="#0b453a" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Distribution Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart2 className="h-5 w-5 mr-2" />
                  Tournament Types
                </CardTitle>
                <CardDescription>
                  Distribution of tournaments by type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={tournamentTypeData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {tournamentTypeData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`${value}%`, "Percentage"]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChartIcon className="h-5 w-5 mr-2" />
                  Contest Entry Types
                </CardTitle>
                <CardDescription>
                  Distribution of contests by entry fee
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={contestEntryData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {contestEntryData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`${value}%`, "Percentage"]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tables */}
          <div className="space-y-6">
            <Tabs defaultValue="tournaments">
              <TabsList className="w-full max-w-md mx-auto mb-6">
                <TabsTrigger value="tournaments" className="flex-1">
                  Recent Tournaments
                </TabsTrigger>
                <TabsTrigger value="admins" className="flex-1">
                  Top Admins
                </TabsTrigger>
              </TabsList>
              <TabsContent value="tournaments">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Tournaments</CardTitle>
                    <CardDescription>
                      Overview of the most recent tournaments and their
                      performance
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tournament Name</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Entries</TableHead>
                          <TableHead>Revenue</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentTournamentsData.map((tournament) => (
                          <TableRow key={tournament.id}>
                            <TableCell className="font-medium">
                              {tournament.name}
                            </TableCell>
                            <TableCell>{tournament.date}</TableCell>
                            <TableCell>{tournament.entries}</TableCell>
                            <TableCell>{tournament.revenue}</TableCell>
                            <TableCell>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {tournament.status}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="admins">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Tournament Admins</CardTitle>
                    <CardDescription>
                      Admins with the most tournaments and highest revenue
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Admin Name</TableHead>
                          <TableHead>Tournaments</TableHead>
                          <TableHead>Total Players</TableHead>
                          <TableHead>Total Revenue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topAdminsData.map((admin) => (
                          <TableRow key={admin.id}>
                            <TableCell className="font-medium">
                              {admin.name}
                            </TableCell>
                            <TableCell>{admin.tournamentCount}</TableCell>
                            <TableCell>{admin.totalPlayers}</TableCell>
                            <TableCell>{admin.revenue}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </AdminGuard>
    </AuthGuard>
  );
}
