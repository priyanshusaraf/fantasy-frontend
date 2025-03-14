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
import { Calendar, Clock, Check, X, AlertCircle } from "lucide-react";

interface TournamentMatchesProps {
  tournamentId: number;
}

interface Match {
  id: number;
  round: string;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  startTime: string;
  endTime?: string;
  courtNumber?: number;
  player1Score?: number;
  player2Score?: number;
  player1?: {
    id: number;
    name: string;
    imageUrl?: string;
  };
  player2?: {
    id: number;
    name: string;
    imageUrl?: string;
  };
  team1?: {
    id: number;
    name: string;
    players: {
      id: number;
      name: string;
      imageUrl?: string;
    }[];
  };
  team2?: {
    id: number;
    name: string;
    players: {
      id: number;
      name: string;
      imageUrl?: string;
    }[];
  };
  winnerId?: number;
}

const TournamentMatches: React.FC<TournamentMatchesProps> = ({
  tournamentId,
}) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("upcoming");
  const router = useRouter();

  // Fetch tournament matches
  useEffect(() => {
    if (!tournamentId) return;

    const fetchMatches = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/tournaments/${tournamentId}/matches`);

        if (!res.ok) {
          throw new Error("Failed to fetch matches");
        }

        const data = await res.json();
        setMatches(data.matches);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [tournamentId]);

  // Filter matches based on active tab
  const filteredMatches = matches.filter((match) => {
    const currentTime = new Date();
    const startTime = new Date(match.startTime);

    switch (activeTab) {
      case "upcoming":
        return match.status === "SCHEDULED" && startTime > currentTime;
      case "live":
        return match.status === "IN_PROGRESS";
      case "completed":
        return match.status === "COMPLETED";
      case "all":
        return true;
      default:
        return false;
    }
  });

  // Group matches by round
  const matchesByRound = filteredMatches.reduce((acc, match) => {
    if (!acc[match.round]) {
      acc[match.round] = [];
    }
    acc[match.round].push(match);
    return acc;
  }, {} as Record<string, Match[]>);

  // Convert to array and sort rounds
  const sortedRounds = Object.keys(matchesByRound).sort((a, b) => {
    // Extract numbers from round names if present (e.g. "Round 1" -> 1)
    const aNum = parseInt(a.match(/\d+/)?.[0] || "0", 10);
    const bNum = parseInt(b.match(/\d+/)?.[0] || "0", 10);

    // Sort by number if both have numbers, otherwise alphabetically
    if (aNum && bNum) {
      return aNum - bNum;
    }
    return a.localeCompare(b);
  });

  // Navigate to match details
  const viewMatchDetails = (matchId: number) => {
    router.push(`/matches/${matchId}`);
  };

  // Navigate to live scoring for referees
  const goToLiveScoring = (matchId: number) => {
    router.push(`/referee/live-scoring/${matchId}`);
  };

  if (loading && !matches.length) {
    return <div className="flex justify-center p-8">Loading matches...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-md">
        <p className="font-bold">Error:</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <Tabs defaultValue="upcoming" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="live">Live</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="all">All Matches</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          {sortedRounds.map((round) => (
            <div key={round} className="mb-8">
              <h3 className="text-lg font-semibold mb-4 px-1">{round}</h3>

              <div className="space-y-4">
                {matchesByRound[round].map((match) => (
                  <Card key={match.id}>
                    <CardContent className="p-5">
                      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        {/* Team/Player 1 */}
                        <div className="w-full md:w-2/5 text-center md:text-right">
                          {match.team1 ? (
                            <>
                              <h4 className="text-lg font-semibold">
                                {match.team1.name}
                              </h4>
                              <div className="flex flex-wrap justify-center md:justify-end gap-2 mt-1">
                                {match.team1.players.map((player) => (
                                  <div
                                    key={player.id}
                                    className="flex items-center text-sm"
                                  >
                                    <span>{player.name}</span>
                                  </div>
                                ))}
                              </div>
                            </>
                          ) : match.player1 ? (
                            <h4 className="text-lg font-semibold">
                              {match.player1.name}
                            </h4>
                          ) : (
                            <span className="text-gray-400">TBD</span>
                          )}
                        </div>

                        {/* Score */}
                        <div className="flex items-center">
                          {match.status === "COMPLETED" ||
                          match.status === "IN_PROGRESS" ? (
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-bold">
                                {match.player1Score || 0}
                              </span>
                              <span className="text-xl">-</span>
                              <span className="text-2xl font-bold">
                                {match.player2Score || 0}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">vs</span>
                          )}
                        </div>

                        {/* Team/Player 2 */}
                        <div className="w-full md:w-2/5 text-center md:text-left">
                          {match.team2 ? (
                            <>
                              <h4 className="text-lg font-semibold">
                                {match.team2.name}
                              </h4>
                              <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-1">
                                {match.team2.players.map((player) => (
                                  <div
                                    key={player.id}
                                    className="flex items-center text-sm"
                                  >
                                    <span>{player.name}</span>
                                  </div>
                                ))}
                              </div>
                            </>
                          ) : match.player2 ? (
                            <h4 className="text-lg font-semibold">
                              {match.player2.name}
                            </h4>
                          ) : (
                            <span className="text-gray-400">TBD</span>
                          )}
                        </div>
                      </div>

                      {/* Match info */}
                      <div className="mt-4 flex flex-wrap justify-between items-center">
                        <div className="flex items-center gap-6">
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>
                              {new Date(match.startTime).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>
                              {new Date(match.startTime).toLocaleTimeString(
                                [],
                                { hour: "2-digit", minute: "2-digit" }
                              )}
                            </span>
                          </div>
                          {match.courtNumber && (
                            <div className="text-sm text-gray-500">
                              Court {match.courtNumber}
                            </div>
                          )}
                        </div>

                        <Badge
                          variant={
                            match.status === "SCHEDULED"
                              ? "outline"
                              : match.status === "IN_PROGRESS"
                              ? "default"
                              : match.status === "COMPLETED"
                              ? "success"
                              : "destructive"
                          }
                        >
                          {match.status.replace("_", " ")}
                        </Badge>
                      </div>

                      {/* Winner indication */}
                      {match.status === "COMPLETED" && match.winnerId && (
                        <div className="mt-3 flex justify-center">
                          <Badge
                            variant="success"
                            className="flex items-center gap-1"
                          >
                            <Check className="h-3 w-3" />
                            <span>
                              Winner:{" "}
                              {match.winnerId ===
                              (match.team1?.id || match.player1?.id)
                                ? match.team1?.name || match.player1?.name
                                : match.team2?.name || match.player2?.name}
                            </span>
                          </Badge>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="mt-4 flex justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewMatchDetails(match.id)}
                        >
                          Details
                        </Button>

                        {match.status === "IN_PROGRESS" && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() =>
                              router.push(`/matches/${match.id}/live`)
                            }
                          >
                            Watch Live
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}

          {/* Empty state */}
          {filteredMatches.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-500">
                No matches found
              </h3>
              <p className="text-gray-400 max-w-md mt-2">
                {activeTab === "upcoming"
                  ? "There are no upcoming matches scheduled at this time."
                  : activeTab === "live"
                  ? "There are no matches currently in progress."
                  : activeTab === "completed"
                  ? "No completed matches yet."
                  : "No matches have been added to this tournament yet."}
              </p>
            </div>
          )}
        </div>
      </Tabs>
    </div>
  );
};

export default TournamentMatches;
