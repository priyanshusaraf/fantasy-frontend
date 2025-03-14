"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";

interface Player {
  id: number;
  name: string;
  imageUrl?: string;
}

interface Team {
  id: number;
  name: string;
  players: Player[];
}

interface Match {
  id: number;
  tournamentId: number;
  player1Id?: number;
  player2Id?: number;
  team1Id?: number;
  team2Id?: number;
  player1?: Player;
  player2?: Player;
  team1?: Team;
  team2?: Team;
  startTime: Date;
  endTime?: Date;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  round: string;
  player1Score: number;
  player2Score: number;
  winnerId?: number;
  maxScore: number; // The score to reach to win
  sets: number; // Number of sets to play
  courtNumber?: number;
}

interface LiveScoringProps {
  matchId: number;
}

const LiveScoring: React.FC<LiveScoringProps> = ({ matchId }) => {
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [team1Score, setTeam1Score] = useState(0);
  const [team2Score, setTeam2Score] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [sets, setSets] = useState<Array<{ team1: number; team2: number }>>([]);
  const [isLandscape, setIsLandscape] = useState(false);
  const [confirmEndMatch, setConfirmEndMatch] = useState(false);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Check if device is in landscape mode
  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };

    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    return () => window.removeEventListener("resize", checkOrientation);
  }, []);

  // Fetch match details
  useEffect(() => {
    if (!matchId) return;

    const fetchMatch = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/matches/${matchId}`);

        if (!res.ok) {
          throw new Error("Failed to fetch match details");
        }

        const matchData = await res.json();
        setMatch(matchData);
        setTeam1Score(matchData.player1Score || 0);
        setTeam2Score(matchData.player2Score || 0);

        // Initialize sets
        if (matchData.sets > 0) {
          const initialSets = Array(matchData.sets).fill({
            team1: 0,
            team2: 0,
          });
          if (matchData.scores && Array.isArray(matchData.scores)) {
            matchData.scores.forEach((score, index) => {
              if (index < initialSets.length) {
                initialSets[index] = score;
              }
            });
          }
          setSets(initialSets);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMatch();
  }, [matchId]);

  // Connect to socket.io server
  useEffect(() => {
    if (!matchId) return;

    const socketIo = io(
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001"
    );

    socketIo.on("connect", () => {
      console.log("Connected to socket server");
      socketIo.emit("joinMatch", matchId);
    });

    socketIo.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
      setError("Failed to connect to scoring server");
    });

    setSocket(socketIo);

    return () => {
      socketIo.disconnect();
    };
  }, [matchId]);

  // Handle score updates
  const updateScore = async (side: "team1" | "team2") => {
    if (!match || match.status !== "IN_PROGRESS") return;

    try {
      const newTeam1Score = side === "team1" ? team1Score + 1 : team1Score;
      const newTeam2Score = side === "team2" ? team2Score + 1 : team2Score;

      // Check if the set is finished
      const setFinished =
        (newTeam1Score >= match.maxScore &&
          newTeam1Score - newTeam2Score >= 2) ||
        (newTeam2Score >= match.maxScore && newTeam2Score - newTeam1Score >= 2);

      if (setFinished) {
        // Update the sets array
        const updatedSets = [...sets];
        updatedSets[currentSet - 1] = {
          team1: newTeam1Score,
          team2: newTeam2Score,
        };
        setSets(updatedSets);

        // Check if the match is finished
        if (currentSet >= match.sets) {
          // Count sets won by each team
          const team1SetsWon = updatedSets.filter(
            (set) => set.team1 > set.team2
          ).length;
          const team2SetsWon = updatedSets.filter(
            (set) => set.team2 > set.team1
          ).length;

          // Determine winner
          let winnerId;
          if (team1SetsWon > team2SetsWon) {
            winnerId = match.team1Id || match.player1Id;
          } else {
            winnerId = match.team2Id || match.player2Id;
          }

          // Update match status
          const response = await fetch(`/api/matches/${matchId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              status: "COMPLETED",
              scores: updatedSets,
              winnerId,
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to update match");
          }

          // Update local state
          setMatch({
            ...match,
            status: "COMPLETED",
            winnerId,
            endTime: new Date(),
          });

          // Emit match end event via socket
          if (socket) {
            socket.emit("matchEnd", {
              matchId,
              scores: updatedSets,
              winnerId,
            });
          }
        } else {
          // Move to next set
          setCurrentSet(currentSet + 1);
          setTeam1Score(0);
          setTeam2Score(0);

          // Update match with current scores
          const response = await fetch(`/api/matches/${matchId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              status: "IN_PROGRESS",
              scores: updatedSets,
              currentSet: currentSet + 1,
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to update match");
          }
        }
      } else {
        // Update the current score
        setTeam1Score(newTeam1Score);
        setTeam2Score(newTeam2Score);

        // Update match in database
        const response = await fetch(`/api/matches/${matchId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            player1Score: newTeam1Score,
            player2Score: newTeam2Score,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update match");
        }

        // Emit score update via socket
        if (socket) {
          socket.emit("scoreUpdate", {
            matchId,
            player1Score: newTeam1Score,
            player2Score: newTeam2Score,
          });
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    }
  };

  // Start the match
  const startMatch = async () => {
    if (!match || match.status !== "SCHEDULED") return;

    try {
      const response = await fetch(`/api/matches/${matchId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "IN_PROGRESS",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start match");
      }

      setMatch({
        ...match,
        status: "IN_PROGRESS",
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    }
  };

  // End match early
  const endMatch = async () => {
    if (!match || match.status !== "IN_PROGRESS") return;

    try {
      // Determine winner based on current score
      let winnerId;
      if (team1Score > team2Score) {
        winnerId = match.team1Id || match.player1Id;
      } else if (team2Score > team1Score) {
        winnerId = match.team2Id || match.player2Id;
      }

      // Update match status
      const response = await fetch(`/api/matches/${matchId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "COMPLETED",
          winnerId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to end match");
      }

      // Update local state
      setMatch({
        ...match,
        status: "COMPLETED",
        winnerId,
        endTime: new Date(),
      });

      // Emit match end event via socket
      if (socket) {
        socket.emit("matchEnd", {
          matchId,
          player1Score: team1Score,
          player2Score: team2Score,
          winnerId,
        });
      }

      // Reset confirmation
      setConfirmEndMatch(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    }
  };

  // Cancel match
  const cancelMatch = async () => {
    if (!match) return;

    try {
      const response = await fetch(`/api/matches/${matchId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "CANCELLED",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to cancel match");
      }

      setMatch({
        ...match,
        status: "CANCELLED",
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    }
  };

  // Handle orientation warning
  if (!isLandscape) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Please rotate your device</h1>
        <p className="mb-8">
          Live scoring works best in landscape orientation.
        </p>
        <div className="w-16 h-16 border-2 border-gray-300 rounded-md p-2 mb-4 animate-pulse">
          <div className="w-full h-full border-2 border-gray-500 rounded"></div>
        </div>
        <p className="text-sm text-gray-500">Rotate your device horizontally</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading match details...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  if (!match) {
    return <div className="p-4">Match not found</div>;
  }

  // Display for completed or cancelled matches
  if (match.status === "COMPLETED" || match.status === "CANCELLED") {
    return (
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>Match {match.status.toLowerCase()}</CardTitle>
            <CardDescription>
              {match.status === "COMPLETED"
                ? "This match has been completed."
                : "This match has been cancelled."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-4">
              <div className="text-center">
                <h3 className="font-bold text-lg">
                  {match.team1?.name || match.player1?.name}
                </h3>
                <p className="text-2xl font-bold">{team1Score}</p>
              </div>
              <div className="text-xl font-bold">vs</div>
              <div className="text-center">
                <h3 className="font-bold text-lg">
                  {match.team2?.name || match.player2?.name}
                </h3>
                <p className="text-2xl font-bold">{team2Score}</p>
              </div>
            </div>

            {match.status === "COMPLETED" && match.winnerId && (
              <div className="bg-green-100 p-4 rounded-md text-center">
                <p className="font-bold">
                  Winner:{" "}
                  {match.winnerId === (match.team1Id || match.player1Id)
                    ? match.team1?.name || match.player1?.name
                    : match.team2?.name || match.player2?.name}
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.back()} className="w-full">
              Return to Matches
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Display for scheduled matches
  if (match.status === "SCHEDULED") {
    return (
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>Match scheduled</CardTitle>
            <CardDescription>
              This match is scheduled but hasn't started yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-4">
              <div className="text-center">
                <h3 className="font-bold text-lg">
                  {match.team1?.name || match.player1?.name}
                </h3>
              </div>
              <div className="text-xl font-bold">vs</div>
              <div className="text-center">
                <h3 className="font-bold text-lg">
                  {match.team2?.name || match.player2?.name}
                </h3>
              </div>
            </div>

            <div className="bg-blue-100 p-4 rounded-md mb-4">
              <p className="text-center">
                Start time: {new Date(match.startTime).toLocaleString()}
              </p>
              {match.courtNumber && (
                <p className="text-center mt-2">Court: {match.courtNumber}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={cancelMatch}>
              Cancel Match
            </Button>
            <Button onClick={startMatch}>Start Match</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Main scoring interface for in-progress matches
  return (
    <div className="h-screen w-full overflow-hidden bg-gradient-to-b from-gray-100 to-gray-200">
      {/* Header with match info */}
      <div className="h-16 bg-blue-600 text-white flex items-center justify-between px-4">
        <div>
          <h1 className="font-bold">
            {match.team1?.name || match.player1?.name} vs{" "}
            {match.team2?.name || match.player2?.name}
          </h1>
          <p className="text-xs">Round: {match.round}</p>
        </div>
        <div className="flex space-x-2">
          {confirmEndMatch ? (
            <>
              <Button variant="destructive" size="sm" onClick={endMatch}>
                Confirm End
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmEndMatch(false)}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmEndMatch(true)}
            >
              End Match
            </Button>
          )}
        </div>
      </div>

      {/* Court and scoring area */}
      <div className="flex h-[calc(100%-16rem)] justify-between">
        {/* Team 1 side */}
        <div
          className="w-1/2 h-full bg-blue-50 hover:bg-blue-100 transition-colors flex items-center justify-center cursor-pointer"
          onClick={() => updateScore("team1")}
        >
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">
              {match.team1?.name || match.player1?.name}
            </h2>
            <div className="mt-4 flex justify-center">
              {match.team1?.players &&
                match.team1.players.map((player) => (
                  <div key={player.id} className="mx-2 text-center">
                    <div className="w-12 h-12 mx-auto rounded-full bg-blue-200 flex items-center justify-center">
                      {player.imageUrl ? (
                        <img
                          src={player.imageUrl}
                          alt={player.name}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <span>{player.name.charAt(0)}</span>
                      )}
                    </div>
                    <p className="text-xs mt-1">{player.name}</p>
                  </div>
                ))}
              {!match.team1?.players && match.player1 && (
                <div className="mx-2 text-center">
                  <div className="w-12 h-12 mx-auto rounded-full bg-blue-200 flex items-center justify-center">
                    {match.player1.imageUrl ? (
                      <img
                        src={match.player1.imageUrl}
                        alt={match.player1.name}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <span>{match.player1.name.charAt(0)}</span>
                    )}
                  </div>
                  <p className="text-xs mt-1">{match.player1.name}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Net/divider */}
        <div className="w-1 h-full bg-gray-400"></div>

        {/* Team 2 side */}
        <div
          className="w-1/2 h-full bg-red-50 hover:bg-red-100 transition-colors flex items-center justify-center cursor-pointer"
          onClick={() => updateScore("team2")}
        >
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">
              {match.team2?.name || match.player2?.name}
            </h2>
            <div className="mt-4 flex justify-center">
              {match.team2?.players &&
                match.team2.players.map((player) => (
                  <div key={player.id} className="mx-2 text-center">
                    <div className="w-12 h-12 mx-auto rounded-full bg-red-200 flex items-center justify-center">
                      {player.imageUrl ? (
                        <img
                          src={player.imageUrl}
                          alt={player.name}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <span>{player.name.charAt(0)}</span>
                      )}
                    </div>
                    <p className="text-xs mt-1">{player.name}</p>
                  </div>
                ))}
              {!match.team2?.players && match.player2 && (
                <div className="mx-2 text-center">
                  <div className="w-12 h-12 mx-auto rounded-full bg-red-200 flex items-center justify-center">
                    {match.player2.imageUrl ? (
                      <img
                        src={match.player2.imageUrl}
                        alt={match.player2.name}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <span>{match.player2.name.charAt(0)}</span>
                    )}
                  </div>
                  <p className="text-xs mt-1">{match.player2.name}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Score display and controls */}
      <div className="h-32 bg-white border-t shadow-inner flex justify-between items-center px-8">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Set {currentSet}</h3>
          <div className="mt-1 text-xs text-gray-500">
            {Array.from({ length: match.sets }).map((_, idx) => (
              <span
                key={idx}
                className={`inline-block mx-1 w-4 h-4 rounded-full ${
                  idx + 1 === currentSet
                    ? "bg-blue-500"
                    : idx + 1 < currentSet
                    ? "bg-gray-300"
                    : "border border-gray-300"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center">
          <div className="text-center mr-12">
            <p className="text-5xl font-bold text-blue-600">{team1Score}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => team1Score > 0 && setTeam1Score(team1Score - 1)}
            >
              -1
            </Button>
          </div>
          <div className="flex flex-col items-center justify-center">
            <p className="text-2xl font-bold">:</p>
            <p className="text-xs text-gray-500">First to {match.maxScore}</p>
          </div>
          <div className="text-center ml-12">
            <p className="text-5xl font-bold text-red-600">{team2Score}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => team2Score > 0 && setTeam2Score(team2Score - 1)}
            >
              -1
            </Button>
          </div>
        </div>

        <div className="text-center">
          <h3 className="text-lg font-semibold">Sets</h3>
          <div className="flex space-x-2 mt-1">
            {sets.map((set, idx) => (
              <div key={idx} className="text-xs">
                {idx + 1 <= currentSet - 1 ? (
                  <span
                    className={`px-2 py-1 rounded ${
                      set.team1 > set.team2
                        ? "bg-blue-100 text-blue-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {set.team1}-{set.team2}
                  </span>
                ) : (
                  <span className="px-2 py-1 rounded bg-gray-100 text-gray-500">
                    -
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="absolute bottom-4 left-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
          <button
            className="absolute top-0 right-0 p-2"
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default LiveScoring;
