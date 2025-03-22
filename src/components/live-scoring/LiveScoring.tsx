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
import { useAuth } from "@/hooks/useAuth";
import { env } from "@/env.mjs";
import { Badge } from "@/components/ui/badge";

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

interface SetScore {
  team1: number;
  team2: number;
}

interface CurrentSetScore {
  team1: number;
  team2: number;
}

export interface Match {
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
  maxScore: number;
  sets: number;
  courtNumber?: number;
}

interface LiveScoringProps {
  matchId: number;
}

const LiveScoring: React.FC<LiveScoringProps> = ({ matchId }) => {
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [team1Score, setTeam1Score] = useState<number>(0);
  const [team2Score, setTeam2Score] = useState<number>(0);
  const [currentSet, setCurrentSet] = useState<number>(1);
  const [sets, setSets] = useState<Array<{ team1: number; team2: number }>>([]);
  const [isLandscape, setIsLandscape] = useState<boolean>(false);
  const [confirmEndMatch, setConfirmEndMatch] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Add missing state variables
  const [currentSetScores, setCurrentSetScores] = useState<CurrentSetScore>({
    team1: 0,
    team2: 0
  });

  // Check device orientation for optimal live scoring experience
  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };

    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    return () => window.removeEventListener("resize", checkOrientation);
  }, []);

  // Fetch match details from the API using HTTP polling
  useEffect(() => {
    if (!matchId) return;

    // Initial match data fetch
    fetchMatchData();
    
    // Set up polling using environment variable for interval
    const pollingInterval = setInterval(() => {
      fetchMatchData();
    }, env.NEXT_PUBLIC_POLLING_INTERVAL_MS);
    
    return () => {
      clearInterval(pollingInterval);
    };
  }, [matchId]);
  
  // HTTP polling implementation for match data
  const fetchMatchData = async () => {
    try {
      setLoading(true);
      const timestamp = new Date().getTime();
      console.log(`[DEBUG] Fetching match data for ID ${matchId} at ${new Date().toISOString()}`);
      
      const res = await fetch(`/api/matches/${matchId}?t=${timestamp}`, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
      
      if (!res.ok) {
        console.error(`[DEBUG] Error response: ${res.status} ${res.statusText}`);
        throw new Error(`Failed to fetch match data: ${res.status}`);
      }
      
      const data = await res.json();
      console.log(`[DEBUG] Match data received:`, data);
      console.log(`[DEBUG] Current timestamp: ${data.timestamp}, Score: ${data.player1Score}-${data.player2Score}`);
      
      setMatch(data);
      
      // Update scores based on fetched data
      if (data) {
        setTeam1Score(data.player1Score || 0);
        setTeam2Score(data.player2Score || 0);
        
        // Update sets if available
        if (data.sets) {
          setCurrentSetScores({
            team1: data.sets[data.currentSet - 1]?.team1 || 0,
            team2: data.sets[data.currentSet - 1]?.team2 || 0
          });
          setCurrentSet(data.currentSet || 1);
          setSets(data.sets);
        }
      }
    } catch (err) {
      console.error("[DEBUG] Error fetching match data:", err);
      setError("Failed to fetch match data");
    } finally {
      setLoading(false);
    }
  };
  
  // Update score through API
  const updateScore = async (matchId: string, team1Score: number, team2Score: number, currentSet: number) => {
    try {
      console.log(`Updating score: Match ${matchId}, Team1: ${team1Score}, Team2: ${team2Score}, Set: ${currentSet}`);
      setIsUpdating(true);
      setError(null);

      const timestamp = new Date().getTime();
      const response = await fetch(`/api/matches/${matchId}/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({
          team1Score,
          team2Score,
          currentSet,
          timestamp // Add timestamp to ensure fresh data
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update score');
      }

      const data = await response.json();
      console.log('Score updated successfully:', data);
      
      // Refresh match data to show latest scores
      await fetchMatchData();
    } catch (error) {
      console.error('Error updating score:', error);
      setError('Failed to update score. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Update handler function for score changes 
  const handleScoreChange = (team: 'team1' | 'team2', increment: boolean) => {
    if (!match || match.status !== "IN_PROGRESS") return;
    
    // Calculate new scores
    let newTeam1Score = team1Score;
    let newTeam2Score = team2Score;
    
    if (team === 'team1') {
      newTeam1Score = increment ? team1Score + 1 : Math.max(0, team1Score - 1);
    } else {
      newTeam2Score = increment ? team2Score + 1 : Math.max(0, team2Score - 1);
    }
    
    // Update current set scores
    const newCurrentSetScores = {
      team1: team === 'team1' ? newTeam1Score : currentSetScores.team1,
      team2: team === 'team2' ? newTeam2Score : currentSetScores.team2
    };
    
    // Copy existing sets and update current set
    const newSets = [...sets];
    if (newSets[currentSet - 1]) {
      newSets[currentSet - 1] = newCurrentSetScores;
    }
    
    // Update UI immediately for responsiveness
    setTeam1Score(newTeam1Score);
    setTeam2Score(newTeam2Score);
    setCurrentSetScores(newCurrentSetScores);
    setSets(newSets);
    
    // Update through API with additional debugging
    console.log(`Calling updateScore - Match: ${match.id}, Team1: ${newTeam1Score}, Team2: ${newTeam2Score}, Set: ${currentSet}`);
    updateScore(match.id.toString(), newTeam1Score, newTeam2Score, currentSet);
  };
  
  const startMatch = async () => {
    // ... existing code ...
    
    try {
      const response = await fetch(`/api/matches/${matchId}/start`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to start match');
      }
      
      // Update local state
      setMatch(prev => prev && { ...prev, status: 'IN_PROGRESS' });
      fetchMatchData(); // Refresh data after update
    } catch (error) {
      console.error('Error starting match:', error);
      setError('Failed to start match. Please try again.');
    }
  };
  
  const endMatch = async () => {
    // ... existing code ...
    
    try {
      const winnerId = team1Score > team2Score ? match?.player1Id || match?.team1Id : match?.player2Id || match?.team2Id;
      
      const response = await fetch(`/api/matches/${matchId}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player1Score: team1Score,
          player2Score: team2Score,
          sets: sets,
          winnerId: winnerId
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to end match');
      }
      
      // Update local state
      setMatch(prev => prev && { ...prev, status: 'COMPLETED', winnerId });
      fetchMatchData(); // Refresh data after update
    } catch (error) {
      console.error('Error ending match:', error);
      setError('Failed to end match. Please try again.');
    }
  };

  // If device is not in landscape, show orientation warning
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
            <Button variant="outline" onClick={() => router.back()}>
              Cancel Match
            </Button>
            <Button onClick={startMatch}>Start Match</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Display the appropriate match status based on match state
  const renderMatchStatus = () => {
    if (!match) return null;

    const getStatusDisplay = () => {
      switch (match.status) {
        case "SCHEDULED":
          return (
            <Badge variant="outline" className="bg-blue-100 text-blue-700">
              Scheduled
            </Badge>
          );
        case "IN_PROGRESS":
          return (
            <Badge variant="outline" className="bg-green-100 text-green-700">
              In Progress 
              <span className="ml-2 animate-pulse">•</span>
              <span className="ml-1 text-xs">(Polling)</span>
            </Badge>
          );
        case "COMPLETED":
          return (
            <Badge variant="outline" className="bg-purple-100 text-purple-700">
              Completed
            </Badge>
          );
        case "CANCELLED":
          return (
            <Badge variant="outline" className="bg-red-100 text-red-700">
              Canceled
            </Badge>
          );
        default:
          return (
            <Badge variant="outline" className="bg-gray-100">
              Unknown
            </Badge>
          );
      }
    };

    return (
      <div className="flex items-center">
        {getStatusDisplay()}
      </div>
    );
  };

  // Main scoring interface for in-progress matches
  return (
    <div className="h-screen w-full overflow-hidden bg-gradient-to-b from-gray-100 to-gray-200 relative">
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
      <div className="flex h-[calc(100%-4rem)]">
        {/* Team 1 side */}
        <div
          className="w-1/2 h-full bg-blue-50 hover:bg-blue-100 transition-colors flex items-center justify-center cursor-pointer"
          onClick={() => handleScoreChange("team1", true)}
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

        {/* Divider */}
        <div className="w-1 h-full bg-gray-400"></div>

        {/* Team 2 side */}
        <div
          className="w-1/2 h-full bg-red-50 hover:bg-red-100 transition-colors flex items-center justify-center cursor-pointer"
          onClick={() => handleScoreChange("team2", true)}
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
              onClick={() => handleScoreChange("team1", false)}
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
              onClick={() => handleScoreChange("team2", false)}
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

      {/* Match status display */}
      <div className="absolute bottom-4 left-4 right-4 bg-white border border-gray-300 p-4 rounded">
        <div className="flex items-center">
          <span className="mr-2 text-sm font-semibold text-gray-500">Status:</span>
          {renderMatchStatus()}
        </div>
      </div>
    </div>
  );
};

export default LiveScoring;
