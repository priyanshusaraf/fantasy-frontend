"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";

interface Player {
  id: number;
  name: string;
  imageUrl?: string;
}

interface Match {
  id: number;
  player1: Player;
  player2: Player;
  player1Score: number;
  player2Score: number;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  round: string;
  tournamentId: number;
  tournamentName?: string;
}

interface LiveScoringProps {
  matchId: number;
  isReferee?: boolean;
}

const LiveScoring: React.FC<LiveScoringProps> = ({
  matchId,
  isReferee = false,
}) => {
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    "portrait"
  );
  const router = useRouter();

  // Connect to socket
  useEffect(() => {
    // Create socket connection
    const newSocket = io(
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001"
    );

    newSocket.on("connect", () => {
      console.log("Connected to socket");

      // Join match room
      newSocket.emit("joinMatch", matchId);
    });

    newSocket.on("scoreUpdate", (updatedMatch: Match) => {
      if (updatedMatch.id === matchId) {
        setMatch(updatedMatch);
      }
    });

    newSocket.on("matchEnd", (endedMatch: Match) => {
      if (endedMatch.id === matchId) {
        setMatch(endedMatch);

        if (isReferee) {
          // Redirect to match summary for referee
          router.push(`/referee/match-summary/${matchId}`);
        }
      }
    });

    newSocket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
      setError("Failed to connect to live scoring server");
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [matchId, isReferee, router]);

  // Fetch initial match data
  useEffect(() => {
    const fetchMatch = async () => {
      try {
        setLoading(true);

        const res = await fetch(`/api/matches/${matchId}`);

        if (!res.ok) {
          throw new Error("Failed to fetch match");
        }

        const data = await res.json();
        setMatch(data);
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

  // Check device orientation
  useEffect(() => {
    const checkOrientation = () => {
      if (window.innerWidth > window.innerHeight) {
        setOrientation("landscape");
      } else {
        setOrientation("portrait");
      }
    };

    // Initial check
    checkOrientation();

    // Listen for orientation changes
    window.addEventListener("resize", checkOrientation);

    return () => {
      window.removeEventListener("resize", checkOrientation);
    };
  }, []);

  // Handle score update
  const updateScore = async (player: "player1" | "player2") => {
    if (!match || !isReferee || match.status !== "IN_PROGRESS") return;

    try {
      const updatedScore =
        player === "player1"
          ? { player1Score: match.player1Score + 1 }
          : { player2Score: match.player2Score + 1 };

      // Update via API
      const res = await fetch(`/api/matches/${matchId}/score`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedScore),
      });

      if (!res.ok) {
        throw new Error("Failed to update score");
      }

      // Socket will update the UI with the new score
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    }
  };

  // Handle end match
  const endMatch = async () => {
    if (!match || !isReferee || match.status !== "IN_PROGRESS") return;

    try {
      // Update match status to completed
      const res = await fetch(`/api/matches/${matchId}/complete`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          player1Score: match.player1Score,
          player2Score: match.player2Score,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to end match");
      }

      // Socket will handle redirect
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading match data...</div>;
  }

  if (error) {
    return (
      <div
        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
        role="alert"
      >
        <p>{error}</p>
        <button
          onClick={() => router.back()}
          className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-4 rounded"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!match) {
    return <div className="text-center py-8">Match not found</div>;
  }

  if (orientation === "portrait" && isReferee) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 max-w-md">
          <p>
            Please rotate your device to landscape mode for the optimal scoring
            experience.
          </p>
        </div>

        <div className="w-24 h-24 animate-[spin_2s_linear_infinite] border-8 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div
      className={`${isReferee ? "h-screen" : "min-h-[50vh]"} ${
        orientation === "landscape" ? "flex-row" : "flex-col"
      } flex bg-gray-100`}
    >
      {/* Player 1 Side */}
      <div
        className={`${
          isReferee ? "cursor-pointer active:bg-blue-100" : ""
        } flex-1 flex flex-col items-center justify-center p-4 border-r border-gray-300`}
        onClick={isReferee ? () => updateScore("player1") : undefined}
      >
        <div className="w-24 h-24 rounded-full overflow-hidden bg-blue-200 mb-4">
          {match.player1.imageUrl ? (
            <img
              src={match.player1.imageUrl}
              alt={match.player1.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-blue-500 font-bold text-2xl">
              {match.player1.name.charAt(0)}
            </div>
          )}
        </div>

        <h2 className="text-2xl font-bold mb-2">{match.player1.name}</h2>

        <div className="text-5xl font-bold mt-2">{match.player1Score}</div>
      </div>

      {/* Center Area - Score & Info */}
      <div className="flex flex-col items-center justify-between p-4 bg-white shadow-md min-w-[200px]">
        <div className="text-center mb-4">
          <h1 className="text-xl font-bold">{match.tournamentName}</h1>
          <p className="text-gray-600">{match.round}</p>
          <div
            className={`
            mt-2 px-2 py-1 rounded-full text-sm inline-block
            ${
              match.status === "IN_PROGRESS"
                ? "bg-green-100 text-green-800"
                : match.status === "COMPLETED"
                ? "bg-gray-100 text-gray-800"
                : match.status === "SCHEDULED"
                ? "bg-blue-100 text-blue-800"
                : "bg-red-100 text-red-800"
            }
          `}
          >
            {match.status.replace("_", " ")}
          </div>
        </div>

        <div className="text-3xl font-bold my-4">
          {match.player1Score} - {match.player2Score}
        </div>

        {isReferee && match.status === "IN_PROGRESS" && (
          <button
            onClick={endMatch}
            className="mt-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            End Match
          </button>
        )}
      </div>

      {/* Player 2 Side */}
      <div
        className={`${
          isReferee ? "cursor-pointer active:bg-blue-100" : ""
        } flex-1 flex flex-col items-center justify-center p-4 border-l border-gray-300`}
        onClick={isReferee ? () => updateScore("player2") : undefined}
      >
        <div className="w-24 h-24 rounded-full overflow-hidden bg-blue-200 mb-4">
          {match.player2.imageUrl ? (
            <img
              src={match.player2.imageUrl}
              alt={match.player2.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-blue-500 font-bold text-2xl">
              {match.player2.name.charAt(0)}
            </div>
          )}
        </div>

        <h2 className="text-2xl font-bold mb-2">{match.player2.name}</h2>

        <div className="text-5xl font-bold mt-2">{match.player2Score}</div>
      </div>
    </div>
  );
};

export default LiveScoring;
