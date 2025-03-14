"use client";

import React, { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

interface MatchScore {
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
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  player1Score: number;
  player2Score: number;
  courtNumber?: number;
  round: string;
}

interface LiveScoreboardProps {
  tournamentId?: number;
  maxMatches?: number;
}

export default function LiveScoreboard({
  tournamentId,
  maxMatches = 4,
}: LiveScoreboardProps) {
  const [matches, setMatches] = useState<MatchScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const router = useRouter();

  // Function to fetch matches from the server
  const fetchMatches = async () => {
    try {
      setLoading(true);
      const endpoint = tournamentId
        ? `/api/tournaments/${tournamentId}/matches?status=IN_PROGRESS`
        : "/api/matches/live";
      const res = await fetch(endpoint);

      if (!res.ok) {
        throw new Error("Failed to fetch live matches");
      }

      const data = await res.json();
      setMatches(data.matches.slice(0, maxMatches));
      setLastUpdate(new Date());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and periodic refresh (fallback if socket fails)
  useEffect(() => {
    fetchMatches();
    const interval = setInterval(fetchMatches, 30000); // every 30 seconds
    return () => clearInterval(interval);
  }, [tournamentId, maxMatches]);

  // Socket connection for real-time updates
  useEffect(() => {
    const socketIo = io(
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001"
    );

    // Join match rooms upon connection
    socketIo.on("connect", () => {
      console.log("Connected to socket server");
      matches.forEach((match) => {
        socketIo.emit("joinMatch", match.id);
      });
    });

    // Handle real-time score updates
    socketIo.on("scoreUpdate", (data) => {
      setMatches((prevMatches) =>
        prevMatches.map((match) =>
          match.id === data.matchId
            ? {
                ...match,
                player1Score: data.player1Score,
                player2Score: data.player2Score,
              }
            : match
        )
      );
      setLastUpdate(new Date());
    });

    // Handle match end events
    socketIo.on("matchEnd", (data) => {
      setMatches((prevMatches) =>
        prevMatches.map((match) =>
          match.id === data.matchId ? { ...match, status: "COMPLETED" } : match
        )
      );
      setLastUpdate(new Date());
    });

    // When a new match starts, refresh the matches list
    const refreshMatches = async () => {
      try {
        const endpoint = tournamentId
          ? `/api/tournaments/${tournamentId}/matches?status=IN_PROGRESS`
          : "/api/matches/live";
        const res = await fetch(endpoint);
        if (res.ok) {
          const data = await res.json();
          setMatches(data.matches.slice(0, maxMatches));
          setLastUpdate(new Date());
          // Join new match rooms
          data.matches.forEach((match: MatchScore) => {
            socketIo.emit("joinMatch", match.id);
          });
        }
      } catch (err) {
        console.error("Error refreshing matches:", err);
      }
    };

    socketIo.on("matchStart", () => {
      refreshMatches();
    });

    socketIo.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
    });

    setSocket(socketIo);

    return () => {
      socketIo.disconnect();
    };
  }, [tournamentId, maxMatches, matches]);

  // Handler for manual refresh
  const handleRefresh = async () => {
    await fetchMatches();
  };

  // Helper to render each match row in the table
  const renderMatchRow = (match: MatchScore) => {
    const displayName =
      match.player1 && match.player2
        ? `${match.player1.name} vs ${match.player2.name}`
        : match.team1 && match.team2
        ? `${match.team1.name} vs ${match.team2.name}`
        : "TBD";

    return (
      <TableRow
        key={match.id}
        className="cursor-pointer hover:bg-gray-100"
        onClick={() => router.push(`/referee/live-scoring/${match.id}`)}
      >
        <TableCell>{match.id}</TableCell>
        <TableCell>{displayName}</TableCell>
        <TableCell>
          <Badge
            variant={match.status === "IN_PROGRESS" ? "secondary" : "default"}
          >
            {match.player1Score} - {match.player2Score}
          </Badge>
        </TableCell>
        <TableCell>{match.courtNumber ?? "N/A"}</TableCell>
        <TableCell>{match.round}</TableCell>
        <TableCell>{match.status}</TableCell>
      </TableRow>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center">
        <div>
          <CardTitle>Live Scoreboard</CardTitle>
          <CardDescription>
            Last updated: {lastUpdate.toLocaleTimeString()}
          </CardDescription>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          className="mt-4 sm:mt-0"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>
              <AlertCircle className="mr-2 h-4 w-4" />
              Error
            </AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {loading ? (
          <p>Loading matches...</p>
        ) : matches.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Match</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Court</TableHead>
                <TableHead>Round</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches.map((match) => renderMatchRow(match))}
            </TableBody>
          </Table>
        ) : (
          <p>No live matches available.</p>
        )}
      </CardContent>
    </Card>
  );
}
