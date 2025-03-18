// src/app/(user)/my-tournaments/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/Input";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  MapPin,
  Trophy,
  Users,
  Search,
  Plus,
  Clock,
  CheckCircle,
  FileEdit,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

// Define interfaces
interface Tournament {
  id: number;
  name: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  status:
    | "DRAFT"
    | "REGISTRATION_OPEN"
    | "REGISTRATION_CLOSED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED";
  type: string;
  maxParticipants: number;
  currentParticipants: number;
  entryFee: number;
  prizeMoney: number;
  imageUrl?: string;
  createdAt: string;
  hasJoinedFantasy: boolean;
  role?: "PARTICIPANT" | "ORGANIZER" | "REFEREE";
}

// Mock data - in a real application, this would come from an API
const MOCK_TOURNAMENTS: Tournament[] = [
  {
    id: 1,
    name: "Summer Pickleball Championship",
    description:
      "Annual summer championship with singles and doubles categories",
    location: "Central Sports Complex, Austin",
    startDate: "2023-07-15T09:00:00Z",
    endDate: "2023-07-17T18:00:00Z",
    status: "COMPLETED",
    type: "SINGLES",
    maxParticipants: 64,
    currentParticipants: 64,
    entryFee: 50,
    prizeMoney: 2000,
    imageUrl: "/tournaments/summer-championship.jpg",
    createdAt: "2023-05-10T15:30:00Z",
    hasJoinedFantasy: true,
    role: "PARTICIPANT",
  },
  {
    id: 2,
    name: "Regional Doubles Tournament",
    description: "Competitive doubles tournament for all skill levels",
    location: "Westside Recreation Center, Dallas",
    startDate: "2023-09-10T10:00:00Z",
    endDate: "2023-09-12T17:00:00Z",
    status: "REGISTRATION_OPEN",
    type: "DOUBLES",
    maxParticipants: 32,
    currentParticipants: 18,
    entryFee: 75,
    prizeMoney: 3000,
    imageUrl: "/tournaments/doubles-tournament.jpg",
    createdAt: "2023-06-25T11:45:00Z",
    hasJoinedFantasy: false,
    role: "PARTICIPANT",
  },
  {
    id: 3,
    name: "City League Mixed Doubles",
    description: "Monthly mixed doubles tournament for city residents",
    location: "Downtown Community Center, Houston",
    startDate: "2023-08-25T14:00:00Z",
    endDate: "2023-08-27T20:00:00Z",
    status: "IN_PROGRESS",
    type: "MIXED_DOUBLES",
    maxParticipants: 24,
    currentParticipants: 24,
    entryFee: 40,
    prizeMoney: 1500,
    imageUrl: "/tournaments/city-league.jpg",
    createdAt: "2023-07-01T09:20:00Z",
    hasJoinedFantasy: true,
    role: "PARTICIPANT",
  },
  {
    id: 4,
    name: "Fall Classic",
    description: "Annual tournament to celebrate the fall season",
    location: "Eastside Sports Park, San Antonio",
    startDate: "2023-11-05T11:00:00Z",
    endDate: "2023-11-07T19:00:00Z",
    status: "REGISTRATION_OPEN",
    type: "SINGLES",
    maxParticipants: 48,
    currentParticipants: 22,
    entryFee: 60,
    prizeMoney: 2400,
    imageUrl: "/tournaments/fall-classic.jpg",
    createdAt: "2023-08-15T13:10:00Z",
    hasJoinedFantasy: false,
    role: "ORGANIZER",
  },
  {
    id: 5,
    name: "Winter Invitational",
    description: "Exclusive invitational tournament for top players",
    location: "Indoor Sports Arena, Chicago",
    startDate: "2024-01-15T09:00:00Z",
    endDate: "2024-01-17T18:00:00Z",
    status: "DRAFT",
    type: "ROUND_ROBIN",
    maxParticipants: 16,
    currentParticipants: 0,
    entryFee: 100,
    prizeMoney: 4000,
    imageUrl: "/tournaments/winter-invitational.jpg",
    createdAt: "2023-10-05T16:30:00Z",
    hasJoinedFantasy: false,
    role: "ORGANIZER",
  },
];

export default function MyTournamentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [filteredTournaments, setFilteredTournaments] = useState<Tournament[]>(
    []
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("participated");

  // Fetch tournaments
  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        // In a real app, this would be an API call
        // const response = await fetch('/api/my-tournaments');
        // const data = await response.json();

        // Simulate API call with mock data
        setTimeout(() => {
          setTournaments(MOCK_TOURNAMENTS);
          setFilteredTournaments(MOCK_TOURNAMENTS);
          setLoading(false);
        }, 800);
      } catch (error) {
        console.error("Error fetching tournaments:", error);
        toast.error("Failed to load tournaments");
        setLoading(false);
      }
    };

    fetchTournaments();
  }, []);

  // Filter tournaments based on search, status, and active tab
  useEffect(() => {
    if (!tournaments.length) return;

    let result = [...tournaments];

    // Filter by tab
    if (activeTab === "participated") {
      result = result.filter((t) => t.role === "PARTICIPANT");
    } else if (activeTab === "organized") {
      result = result.filter((t) => t.role === "ORGANIZER");
    } else if (activeTab === "refereed") {
      result = result.filter((t) => t.role === "REFEREE");
    }

    // Filter by search term
    if (searchTerm) {
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter) {
      result = result.filter((t) => t.status === statusFilter);
    }

    setFilteredTournaments(result);
  }, [searchTerm, statusFilter, activeTab, tournaments]);

  const getStatusColor = (status: Tournament["status"]) => {
    switch (status) {
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      case "REGISTRATION_OPEN":
        return "bg-green-100 text-green-800";
      case "REGISTRATION_CLOSED":
        return "bg-yellow-100 text-yellow-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "COMPLETED":
        return "bg-purple-100 text-purple-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getUpcomingTournament = () => {
    const now = new Date();
    const upcoming = tournaments
      .filter((t) => new Date(t.startDate) > now)
      .sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );

    return upcoming.length > 0 ? upcoming[0] : null;
  };

  const getActiveTournament = () => {
    const now = new Date();
    const active = tournaments.find(
      (t) =>
        new Date(t.startDate) <= now &&
        new Date(t.endDate) >= now &&
        t.status === "IN_PROGRESS"
    );

    return active || null;
  };

  const renderTournamentCards = () => {
    if (loading) {
      return <div className="text-center py-10">Loading tournaments...</div>;
    }

    if (filteredTournaments.length === 0) {
      return (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <div className="w-16 h-16 mx-auto rounded-full bg-gray-200 flex items-center justify-center mb-4">
            <Trophy className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700">
            No tournaments found
          </h3>
          <p className="text-gray-500 mt-2">
            {activeTab === "participated"
              ? "You haven't participated in any tournaments yet."
              : activeTab === "organized"
              ? "You haven't organized any tournaments yet."
              : "You haven't refereed any tournaments yet."}
          </p>
          {activeTab === "organized" && (
            <Button
              className="mt-4 bg-[#00a1e0] hover:bg-[#0072a3]"
              onClick={() => router.push("/tournaments/create")}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Tournament
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTournaments.map((tournament) => (
          <Card key={tournament.id} className="overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-[#00a1e0] to-[#0b453a] relative flex items-center justify-center">
              {tournament.imageUrl ? (
                <img
                  src={tournament.imageUrl}
                  alt={tournament.name}
                  className="w-full h-full object-cover opacity-75"
                />
              ) : (
                <Trophy className="h-12 w-12 text-white" />
              )}
              <div className="absolute top-2 right-2">
                <Badge className={getStatusColor(tournament.status)}>
                  {tournament.status.replace("_", " ")}
                </Badge>
              </div>
            </div>

            <CardHeader>
              <CardTitle className="text-lg font-bold text-[#00a1e0] line-clamp-1">
                {tournament.name}
              </CardTitle>
              <CardDescription className="flex items-center text-sm">
                <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                <span className="truncate">{tournament.location}</span>
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{formatDate(tournament.startDate)}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Users className="h-4 w-4 mr-1" />
                    <span>
                      {tournament.currentParticipants}/
                      {tournament.maxParticipants}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center text-sm">
                    <Trophy className="h-4 w-4 mr-1 text-yellow-500" />
                    <span className="font-medium">
                      ${tournament.prizeMoney}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {tournament.type.replace("_", " ")}
                  </span>
                </div>

                {tournament.hasJoinedFantasy && (
                  <div className="flex items-center text-sm text-green-600">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    <span>Joined Fantasy League</span>
                  </div>
                )}
              </div>
            </CardContent>

            <CardFooter className="border-t pt-4 flex justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/tournaments/${tournament.id}`)}
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>

              {tournament.role === "ORGANIZER" &&
                tournament.status !== "COMPLETED" && (
                  <Button
                    size="sm"
                    className="bg-[#00a1e0] hover:bg-[#0072a3]"
                    onClick={() =>
                      router.push(`/tournaments/${tournament.id}/edit`)
                    }
                  >
                    <FileEdit className="h-4 w-4 mr-1" />
                    Manage
                  </Button>
                )}

              {tournament.role === "PARTICIPANT" &&
                !tournament.hasJoinedFantasy && (
                  <Button
                    size="sm"
                    className="bg-[#0b453a] hover:bg-[#115c4e]"
                    onClick={() =>
                      router.push(
                        `/fantasy/contests?tournamentId=${tournament.id}`
                      )
                    }
                  >
                    <Trophy className="h-4 w-4 mr-1" />
                    Join Fantasy
                  </Button>
                )}

              {tournament.hasJoinedFantasy && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    router.push(`/fantasy/tournaments/${tournament.id}`)
                  }
                >
                  <Trophy className="h-4 w-4 mr-1" />
                  My Fantasy Team
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };

  const upcomingTournament = getUpcomingTournament();
  const activeTournament = getActiveTournament();

  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-[#00a1e0] mb-6">
          My Tournaments
        </h1>

        {/* Highlight Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {activeTournament && (
            <Card className="bg-gradient-to-r from-[#00a1e0]/10 to-[#0b453a]/10 border-green-200">
              <CardHeader>
                <CardTitle className="text-lg text-[#0b453a]">
                  Currently Active Tournament
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-full bg-[#0b453a]/20 flex items-center justify-center">
                    <Trophy className="h-6 w-6 text-[#0b453a]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {activeTournament.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {activeTournament.location}
                    </p>
                    <div className="flex items-center mt-2 text-sm">
                      <Clock className="h-4 w-4 mr-1 text-gray-500" />
                      <span>
                        Ends on {formatDate(activeTournament.endDate)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-[#0b453a]/5">
                <Button
                  className="w-full bg-[#0b453a] hover:bg-[#115c4e]"
                  onClick={() =>
                    router.push(`/tournaments/${activeTournament.id}`)
                  }
                >
                  View Tournament
                </Button>
              </CardFooter>
            </Card>
          )}

          {upcomingTournament && (
            <Card className="bg-gradient-to-r from-[#00a1e0]/10 to-[#00a1e0]/5 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg text-[#00a1e0]">
                  Next Upcoming Tournament
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-full bg-[#00a1e0]/20 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-[#00a1e0]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {upcomingTournament.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {upcomingTournament.location}
                    </p>
                    <div className="flex items-center mt-2 text-sm">
                      <Clock className="h-4 w-4 mr-1 text-gray-500" />
                      <span>
                        Starts on {formatDate(upcomingTournament.startDate)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-[#00a1e0]/5">
                <Button
                  className="w-full bg-[#00a1e0] hover:bg-[#0072a3]"
                  onClick={() =>
                    router.push(`/tournaments/${upcomingTournament.id}`)
                  }
                >
                  View Tournament
                </Button>
              </CardFooter>
            </Card>
          )}

          {!activeTournament && !upcomingTournament && (
            <Card className="bg-gray-50 md:col-span-2">
              <CardContent className="flex flex-col items-center py-8">
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mb-4">
                  <Calendar className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700">
                  No active or upcoming tournaments
                </h3>
                <p className="text-gray-500 mt-2 text-center max-w-md">
                  You don't have any active or upcoming tournaments. Browse open
                  tournaments to join or create your own!
                </p>
                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => router.push("/tournaments")}
                  >
                    Browse Tournaments
                  </Button>
                  <Button
                    className="bg-[#00a1e0] hover:bg-[#0072a3]"
                    onClick={() => router.push("/tournaments/create")}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Tournament
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Tournament Tabs & Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <Tabs defaultValue="participated" onValueChange={setActiveTab}>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <TabsList>
                  <TabsTrigger value="participated">Participated</TabsTrigger>
                  <TabsTrigger value="organized">Organized</TabsTrigger>
                  <TabsTrigger value="refereed">Refereed</TabsTrigger>
                </TabsList>

                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      type="search"
                      placeholder="Search tournaments..."
                      className="pl-8 w-full md:w-64"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <select
                    className="px-3 py-2 rounded-md border border-input bg-background h-10"
                    value={statusFilter || ""}
                    onChange={(e) => setStatusFilter(e.target.value || null)}
                  >
                    <option value="">All Statuses</option>
                    <option value="REGISTRATION_OPEN">Registration Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>

              <Separator className="mb-6" />

              <TabsContent value="participated">
                {renderTournamentCards()}
              </TabsContent>

              <TabsContent value="organized">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">
                    Tournaments You've Organized
                  </h2>
                  <Button
                    className="bg-[#00a1e0] hover:bg-[#0072a3]"
                    onClick={() => router.push("/tournaments/create")}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create New
                  </Button>
                </div>
                {renderTournamentCards()}
              </TabsContent>

              <TabsContent value="refereed">
                {renderTournamentCards()}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="outline"
            size="lg"
            onClick={() => router.push("/tournaments")}
            className="flex-1 sm:flex-none"
          >
            Browse All Tournaments
          </Button>
          <Button
            className="bg-[#0b453a] hover:bg-[#115c4e] flex-1 sm:flex-none"
            size="lg"
            onClick={() => router.push("/fantasy/contests")}
          >
            <Trophy className="mr-2 h-4 w-4" />
            Fantasy Contests
          </Button>
        </div>
      </div>
    </AuthGuard>
  );
}
