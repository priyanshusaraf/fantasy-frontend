"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Users,
  Trophy,
  Settings,
  Info,
  AlertTriangle,
  Layers,
  Map,
  Edit,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import TournamentMatches from "@/components/tournaments/TournamentMatches";
import { PlayerStatsTable } from "@/components/tournaments/PlayerStatsTable";
import { toast } from "sonner";

interface Tournament {
  id: number;
  name: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  status: string;
  type: string;
  maxParticipants: number;
  currentParticipants?: number;
  imageUrl?: string;
  entryFee: number;
  prizeMoney?: number;
  organizerId: number;
}

interface TournamentStats {
  totalMatches: number;
  completedMatches: number;
  upcomingMatches: number;
  playerCount: number;
  fantasy: {
    contestCount: number;
    participantCount: number;
    totalPrizePool: number;
  };
}

interface PlayerStat {
  id: number;
  player: {
    id: number;
    name: string;
    imageUrl?: string;
    skillLevel?: string;
  };
  wins: number;
  losses: number;
  winPercentage: number;
  pointsScored?: number;
}

export default function ManageTournamentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tournamentId = searchParams.get("id");
  const { isAuthenticated, user } = useAuth();
  const { isAdmin, isMasterAdmin } = useRoleAccess();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [stats, setStats] = useState<TournamentStats | null>(null);
  const [playerStats, setPlayerStats] = useState<PlayerStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [playerStatsSortBy, setPlayerStatsSortBy] = useState<
    "wins" | "winPercentage" | "pointsScored"
  >("wins");

  useEffect(() => {
    // Redirect if not authenticated or not an admin
    if (isAuthenticated && !isAdmin()) {
      router.push("/");
      return;
    }

    if (!tournamentId) {
      setError("Tournament ID is required");
      setLoading(false);
      return;
    }

    const fetchTournamentData = async () => {
      try {
        setLoading(true);

        // Fetch tournament details
        const response = await fetch(`/api/tournaments/${tournamentId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch tournament details");
        }

        const tournamentData = await response.json();
        setTournament(tournamentData);

        // Fetch tournament stats
        const statsResponse = await fetch(
          `/api/tournaments/${tournamentId}/stats`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        }

        // Fetch player stats
        const playerStatsResponse = await fetch(
          `/api/tournaments/${tournamentId}/player-stats`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (playerStatsResponse.ok) {
          const playerStatsData = await playerStatsResponse.json();
          setPlayerStats(playerStatsData.stats);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchTournamentData();
    }
  }, [tournamentId, isAuthenticated, isAdmin, router]);

  const handleEditTournament = () => {
    router.push(`/admin/tournaments/${tournamentId}/edit`);
  };

  const handleManagePlayers = () => {
    router.push(`/admin/tournaments/${tournamentId}/players`);
  };

  const handleManageContests = () => {
    router.push(`/admin/tournaments/${tournamentId}/contests`);
  };

  const handleCreateMatch = () => {
    router.push(`/admin/tournaments/${tournamentId}/create-match`);
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update tournament status");
      }

      const updatedTournament = await response.json();
      setTournament(updatedTournament);
      toast.success(`Tournament status updated to ${newStatus}`);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to update tournament status"
      );
    }
  };

  const handlePlayerStatsSort = (
    sortBy: "wins" | "winPercentage" | "pointsScored"
  ) => {
    setPlayerStatsSortBy(sortBy);

    // Sort the player stats based on the selected criteria
    const sortedStats = [...playerStats].sort((a, b) => {
      if (sortBy === "wins") {
        return b.wins - a.wins;
      } else if (sortBy === "winPercentage") {
        return b.winPercentage - a.winPercentage;
      } else {
        return (b.pointsScored || 0) - (a.pointsScored || 0);
      }
    });

    setPlayerStats(sortedStats);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00a1e0]"></div>
          <p className="mt-4 text-gray-500">Loading tournament details...</p>
        </div>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error || "Failed to load tournament details"}
          </AlertDescription>
        </Alert>
        <Button
          className="mt-4"
          onClick={() => router.push("/admin/tournaments")}
        >
          Back to Tournaments
        </Button>
      </div>
    );
  }

  // Format dates
  const startDate = new Date(tournament.startDate).toLocaleDateString();
  const endDate = new Date(tournament.endDate).toLocaleDateString();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#00a1e0]">
            {tournament.name}
          </h1>
          <p className="text-gray-600 mt-1">{tournament.location}</p>
        </div>

        <div className="mt-4 md:mt-0 flex gap-2">
          <Button variant="outline" onClick={handleEditTournament}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Tournament
          </Button>
          <Button
            className="bg-[#00a1e0] hover:bg-[#0072a3]"
            onClick={handleManagePlayers}
          >
            <Users className="mr-2 h-4 w-4" />
            Manage Players
          </Button>
        </div>
      </div>

      <div className="bg-[#fff5fc] rounded-lg p-4 mb-6 flex flex-col sm:flex-row justify-between items-center">
        <div className="flex items-center mb-2 sm:mb-0">
          <Badge
            className={
              tournament.status === "DRAFT"
                ? "bg-gray-100 text-gray-800"
                : tournament.status === "REGISTRATION_OPEN"
                ? "bg-blue-100 text-blue-800"
                : tournament.status === "REGISTRATION_CLOSED"
                ? "bg-purple-100 text-purple-800"
                : tournament.status === "IN_PROGRESS"
                ? "bg-green-100 text-green-800"
                : tournament.status === "COMPLETED"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800"
            }
          >
            {tournament.status.replace("_", " ")}
          </Badge>
          <span className="ml-4 text-[#5b62b3]">
            {startDate} to {endDate}
          </span>
        </div>

        <div className="flex gap-2">
          {tournament.status === "DRAFT" && (
            <Button
              size="sm"
              onClick={() => handleUpdateStatus("REGISTRATION_OPEN")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Open Registration
            </Button>
          )}

          {tournament.status === "REGISTRATION_OPEN" && (
            <Button
              size="sm"
              onClick={() => handleUpdateStatus("REGISTRATION_CLOSED")}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Close Registration
            </Button>
          )}

          {tournament.status === "REGISTRATION_CLOSED" && (
            <Button
              size="sm"
              onClick={() => handleUpdateStatus("IN_PROGRESS")}
              className="bg-green-600 hover:bg-green-700"
            >
              Start Tournament
            </Button>
          )}

          {tournament.status === "IN_PROGRESS" && (
            <Button
              size="sm"
              onClick={() => handleUpdateStatus("COMPLETED")}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              Complete Tournament
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6 flex items-center">
            <Calendar className="h-8 w-8 text-[#00a1e0] mr-4" />
            <div>
              <p className="text-sm text-gray-500">Tournament Type</p>
              <p className="font-medium">{tournament.type.replace("_", " ")}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center">
            <Users className="h-8 w-8 text-[#00a1e0] mr-4" />
            <div>
              <p className="text-sm text-gray-500">Participants</p>
              <p className="font-medium">
                {tournament.currentParticipants || "0"} /{" "}
                {tournament.maxParticipants}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center">
            <Trophy className="h-8 w-8 text-[#00a1e0] mr-4" />
            <div>
              <p className="text-sm text-gray-500">Prize Money</p>
              <p className="font-medium">
                ₹{tournament.prizeMoney?.toLocaleString() || "0"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="matches">Matches</TabsTrigger>
          <TabsTrigger value="players">Players</TabsTrigger>
          <TabsTrigger value="fantasy">Fantasy</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tournament Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Description</p>
                    <p>
                      {tournament.description || "No description provided."}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Entry Fee</p>
                      <p className="font-medium">₹{tournament.entryFee}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Matches</p>
                      <p className="font-medium">
                        {stats?.totalMatches || "0"}
                      </p>
                    </div>
                  </div>

                  {/* Add more tournament details as needed */}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Completed Matches</p>
                      <p className="font-medium">
                        {stats?.completedMatches || "0"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Upcoming Matches</p>
                      <p className="font-medium">
                        {stats?.upcomingMatches || "0"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Players</p>
                      <p className="font-medium">{stats?.playerCount || "0"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Fantasy Contests</p>
                      <p className="font-medium">
                        {stats?.fantasy.contestCount || "0"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Fantasy Prize Pool</p>
                    <p className="font-medium">
                      ₹{stats?.fantasy.totalPrizePool?.toLocaleString() || "0"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <Button
                    onClick={handleCreateMatch}
                    variant="outline"
                    className="h-auto py-6 flex flex-col items-center justify-center"
                  >
                    <Layers className="h-8 w-8 mb-2" />
                    <span>Create Match</span>
                  </Button>

                  <Button
                    onClick={handleManageContests}
                    variant="outline"
                    className="h-auto py-6 flex flex-col items-center justify-center"
                  >
                    <Trophy className="h-8 w-8 mb-2" />
                    <span>Manage Fantasy</span>
                  </Button>

                  <Button
                    onClick={() =>
                      router.push(`/tournaments/${tournamentId}/setup-fantasy`)
                    }
                    variant="outline"
                    className="h-auto py-6 flex flex-col items-center justify-center"
                  >
                    <Settings className="h-8 w-8 mb-2" />
                    <span>Fantasy Settings</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {tournament.status === "DRAFT" && (
            <Alert className="mt-6">
              <Info className="h-4 w-4" />
              <AlertTitle>Tournament is in draft mode</AlertTitle>
              <AlertDescription>
                Open registration to allow players to sign up for the
                tournament.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="matches" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Tournament Matches</CardTitle>
              <Button onClick={handleCreateMatch}>Create Match</Button>
            </CardHeader>
            <CardContent>
              <TournamentMatches tournamentId={Number(tournamentId)} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="players" className="mt-6">
          <PlayerStatsTable
            tournamentId={tournamentId || ""}
            stats={playerStats}
            loading={loading}
            sortBy={playerStatsSortBy}
            onSortChange={handlePlayerStatsSort}
          />
        </TabsContent>

        <TabsContent value="fantasy" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Fantasy Contests</CardTitle>
              <Button onClick={handleManageContests}>Manage Contests</Button>
            </CardHeader>
            <CardContent>
              {stats?.fantasy.contestCount ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-500">
                            Total Contests
                          </p>
                          <p className="text-2xl font-bold text-[#00a1e0]">
                            {stats.fantasy.contestCount}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Participants</p>
                          <p className="text-2xl font-bold text-[#00a1e0]">
                            {stats.fantasy.participantCount}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-500">
                            Total Prize Pool
                          </p>
                          <p className="text-2xl font-bold text-[#00a1e0]">
                            ₹{stats.fantasy.totalPrizePool.toLocaleString()}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">
                      Fantasy Settings
                    </h3>
                    <Button
                      variant="outline"
                      onClick={() =>
                        router.push(
                          `/tournaments/${tournamentId}/setup-fantasy`
                        )
                      }
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Edit Fantasy Settings
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10">
                  <div className="bg-gray-100 p-3 rounded-full">
                    <Trophy className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium">
                    No Fantasy Contests
                  </h3>
                  <p className="mt-2 text-sm text-gray-500 text-center max-w-md">
                    You havent set up any fantasy contests for this tournament
                    yet.
                  </p>
                  <Button
                    className="mt-4 bg-[#00a1e0] hover:bg-[#0072a3]"
                    onClick={() =>
                      router.push(`/tournaments/${tournamentId}/setup-fantasy`)
                    }
                  >
                    Set Up Fantasy Game
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
