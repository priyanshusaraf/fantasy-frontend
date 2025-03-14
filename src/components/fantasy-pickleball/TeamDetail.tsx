"use client";

import React, { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/form";
import {
  Trophy,
  Star,
  Calendar,
  XCircle,
  ChevronLeft,
  Edit,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface TeamDetailProps {
  teamId: number;
}

interface Player {
  id: number;
  name: string;
  imageUrl?: string | null;
  skillLevel?: string;
  rank?: number;
  tournamentWins?: number;
  country?: string;
  isCaptain: boolean;
  isViceCaptain: boolean;
  totalPoints?: number;
}

interface TeamDetails {
  id: number;
  name: string;
  userId: number;
  contestId: number;
  totalPoints: number;
  rank?: number;
  createdAt: string;
  updatedAt: string;
  players: Player[];
  contest: {
    name: string;
    entryFee: number;
    prizePool: number;
    startDate: string;
    endDate: string;
    rules: string;
    tournament: {
      name: string;
      startDate: string;
      endDate: string;
    };
  };
}

const TeamDetail: React.FC<TeamDetailProps> = ({ teamId }) => {
  const [team, setTeam] = useState<TeamDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playerPerformances, setPlayerPerformances] = useState<
    Record<number, any[]>
  >({});
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  // Fetch team details
  useEffect(() => {
    if (!teamId) return;

    const fetchTeamDetails = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/fantasy-pickleball/teams/${teamId}`);

        if (!res.ok) {
          throw new Error("Failed to fetch team details");
        }

        const data = await res.json();
        setTeam(data.team);

        // Fetch player performances for all players
        await Promise.all(
          data.team.players.map(async (player: Player) => {
            try {
              const performanceRes = await fetch(
                `/api/players/${player.id}/performances?contestId=${data.team.contestId}`
              );
              if (performanceRes.ok) {
                const performanceData = await performanceRes.json();
                setPlayerPerformances((prev) => ({
                  ...prev,
                  [player.id]: performanceData.performances,
                }));
              }
            } catch (err) {
              console.error(
                `Failed to fetch performances for player ${player.id}:`,
                err
              );
            }
          })
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTeamDetails();
  }, [teamId]);

  // Function to navigate to edit page
  const goToEditTeam = () => {
    router.push(`/fantasy/teams/${teamId}/edit`);
  };

  // Check if the logged-in user owns this team
  const isOwner = user && team && user.id === team.userId;

  // Check if team editing is allowed
  const canEditTeam = () => {
    if (!team || !isOwner) return false;

    // Parse rules
    let rules = {};
    try {
      if (typeof team.contest.rules === "string") {
        rules = JSON.parse(team.contest.rules);
      } else {
        rules = team.contest.rules;
      }
    } catch (e) {
      console.error("Error parsing contest rules:", e);
      return false;
    }

    // Check if team changes are allowed
    if (!(rules as any).allowTeamChanges) return false;

    // Check tournament dates
    const now = new Date();
    const tournamentStartDate = new Date(team.contest.tournament.startDate);
    const tournamentEndDate = new Date(team.contest.tournament.endDate);

    // If tournament hasn't started yet, allow full edits
    if (now < tournamentStartDate) return true;

    // If tournament has ended, no edits
    if (now > tournamentEndDate) return false;

    // Check edit window times if tournament is in progress
    if ((rules as any).changeWindowStart && (rules as any).changeWindowEnd) {
      const timeString =
        now.getHours().toString().padStart(2, "0") +
        ":" +
        now.getMinutes().toString().padStart(2, "0");
      if (
        timeString >= (rules as any).changeWindowStart &&
        timeString <= (rules as any).changeWindowEnd
      ) {
        return true;
      }
    }

    return false;
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">Loading team details...</div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-md">
        <p className="font-bold">Error:</p>
        <p>{error}</p>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="p-4 bg-yellow-50 text-yellow-600 rounded-md">
        <p className="font-bold">Team not found</p>
        <p>The requested team could not be found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="mr-2"
          onClick={() => router.back()}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{team.name}</h1>
          <p className="text-gray-500">
            {team.contest.tournament.name} - {team.contest.name}
          </p>
        </div>
        {isOwner && canEditTeam() && (
          <Button variant="outline" size="sm" onClick={goToEditTeam}>
            <Edit className="h-4 w-4 mr-1" />
            Edit Team
          </Button>
        )}
      </div>

      {/* Team Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Team Overview</CardTitle>
          <CardDescription>
            Current standings and points breakdown
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-blue-50">
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <Trophy className="h-6 w-6 text-blue-500 mb-2" />
                <p className="text-lg font-bold">
                  {team.totalPoints?.toFixed(1) || "0.0"}
                </p>
                <p className="text-sm text-gray-500">Total Points</p>
              </CardContent>
            </Card>

            <Card className="bg-green-50">
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <Star className="h-6 w-6 text-green-500 mb-2" />
                <p className="text-lg font-bold">#{team.rank || "-"}</p>
                <p className="text-sm text-gray-500">Current Rank</p>
              </CardContent>
            </Card>

            <Card className="bg-purple-50">
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <Calendar className="h-6 w-6 text-purple-500 mb-2" />
                <p className="text-lg font-bold">
                  {new Date(
                    team.contest.tournament.startDate
                  ).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-500">Tournament Start</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Team Roster */}
      <Card>
        <CardHeader>
          <CardTitle>Team Roster</CardTitle>
          <CardDescription>
            Your selected players and their performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {team.players.map((player) => (
              <Card
                key={player.id}
                className={`
                border-l-4 
                ${
                  player.isCaptain
                    ? "border-l-yellow-400"
                    : player.isViceCaptain
                    ? "border-l-purple-400"
                    : "border-l-transparent"
                }
              `}
              >
                <CardContent className="p-4">
                  <div className="flex items-start">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className="font-bold">{player.name}</h3>
                        {player.isCaptain && (
                          <Badge variant="warning" className="ml-2">
                            C
                          </Badge>
                        )}
                        {player.isViceCaptain && (
                          <Badge variant="secondary" className="ml-2">
                            VC
                          </Badge>
                        )}
                      </div>

                      <div className="text-sm text-gray-500 mt-1">
                        {player.country && <div>Country: {player.country}</div>}
                        {player.rank && <div>Rank: #{player.rank}</div>}
                        {player.skillLevel && (
                          <div>Level: {player.skillLevel}</div>
                        )}
                      </div>

                      <div className="mt-3">
                        <div className="flex justify-between text-sm">
                          <span>Points:</span>
                          <span className="font-medium">
                            {player.totalPoints?.toFixed(1) || "0.0"}
                            {player.isCaptain && " (2x)"}
                            {player.isViceCaptain && " (1.5x)"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Player Performances */}
      <Card>
        <CardHeader>
          <CardTitle>Player Performances</CardTitle>
          <CardDescription>
            Match-by-match breakdown of player points
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="matches">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="matches">By Match</TabsTrigger>
              <TabsTrigger value="players">By Player</TabsTrigger>
            </TabsList>

            <TabsContent value="matches" className="mt-4">
              {Object.keys(playerPerformances).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <XCircle className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-500">
                    No match data available
                  </h3>
                  <p className="text-gray-400 max-w-md mt-2">
                    Performance data will be available once the tournament
                    begins.
                  </p>
                </div>
              ) : (
                <div>
                  {/* Match-by-match view implementation... */}
                  <p className="text-gray-500">
                    Match performance data will be displayed here.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="players" className="mt-4">
              {Object.keys(playerPerformances).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <XCircle className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-500">
                    No player data available
                  </h3>
                  <p className="text-gray-400 max-w-md mt-2">
                    Player performance data will be available once the
                    tournament begins.
                  </p>
                </div>
              ) : (
                <div>
                  {/* Player-by-player view implementation... */}
                  <p className="text-gray-500">
                    Player performance data will be displayed here.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamDetail;
