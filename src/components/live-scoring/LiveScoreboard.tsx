"use client";

import React, { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { RefreshCw, AlertCircle, ChevronLeft, ChevronRight, Smartphone, Loader2 } from "lucide-react";
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
import { useSocket } from "@/hooks/useSocket";

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
  sets?: Array<{ team1: number; team2: number }>;
  currentSet?: number;
}

interface LiveScoreboardProps {
  tournamentId?: number;
  maxMatches?: number;
  showPagination?: boolean;
  compactView?: boolean;
}

export default function LiveScoreboard({
  tournamentId,
  maxMatches = 4,
  showPagination = true,
  compactView = false,
}: LiveScoreboardProps) {
  const [matches, setMatches] = useState<MatchScore[]>([]);
  const [allMatches, setAllMatches] = useState<MatchScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const router = useRouter();
  const { socket, isConnected } = useSocket();

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
      const fetchedMatches = data.matches || [];
      
      setAllMatches(fetchedMatches);
      
      // Calculate total pages
      const pages = Math.ceil(fetchedMatches.length / maxMatches);
      setTotalPages(pages > 0 ? pages : 1);
      
      // Update current page if it's out of bounds
      if (currentPage > pages && pages > 0) {
        setCurrentPage(1);
      }
      
      // Get matches for current page
      const startIdx = (currentPage - 1) * maxMatches;
      const endIdx = startIdx + maxMatches;
      setMatches(fetchedMatches.slice(startIdx, endIdx));
      
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
  }, [tournamentId, maxMatches, currentPage]);

  // Socket connection for real-time updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Join match rooms upon connection
    matches.forEach((match) => {
      socket.emit("joinMatch", match.id);
    });

    // Handle real-time score updates
    const handleScoreUpdate = (data: any) => {
      setAllMatches((prevMatches) => {
        const updatedMatches = prevMatches.map((match) =>
          match.id === data.matchId
            ? {
                ...match,
                player1Score: data.player1Score,
                player2Score: data.player2Score,
                currentSet: data.currentSet,
                sets: data.sets,
              }
            : match
        );
        
        // Update current page matches
        const startIdx = (currentPage - 1) * maxMatches;
        const endIdx = startIdx + maxMatches;
        setMatches(updatedMatches.slice(startIdx, endIdx));
        
        return updatedMatches;
      });
      setLastUpdate(new Date());
    };

    // Handle match end events
    const handleMatchEnd = (data: any) => {
      setAllMatches((prevMatches) => {
        const updatedMatches = prevMatches.map((match) =>
          match.id === data.matchId 
            ? { 
                ...match, 
                status: "COMPLETED" as const,
                player1Score: data.player1Score,
                player2Score: data.player2Score,
                sets: data.sets,
              } 
            : match
        );
        
        // Update current page matches
        const startIdx = (currentPage - 1) * maxMatches;
        const endIdx = startIdx + maxMatches;
        setMatches(updatedMatches.slice(startIdx, endIdx));
        
        return updatedMatches;
      });
      setLastUpdate(new Date());
    };

    // When a new match starts, refresh the matches list
    const handleMatchStart = () => {
      fetchMatches();
    };

    socket.on("scoreUpdate", handleScoreUpdate);
    socket.on("matchEnd", handleMatchEnd);
    socket.on("matchStart", handleMatchStart);

    return () => {
      socket.off("scoreUpdate", handleScoreUpdate);
      socket.off("matchEnd", handleMatchEnd);
      socket.off("matchStart", handleMatchStart);
    };
  }, [socket, isConnected, matches, currentPage, maxMatches]);

  // Handler for manual refresh
  const handleRefresh = async () => {
    await fetchMatches();
  };

  // Pagination handlers
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
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
        className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
        onClick={() => router.push(`/referee/live-scoring/${match.id}`)}
      >
        {!compactView && <TableCell>{match.id}</TableCell>}
        <TableCell className="font-medium">{displayName}</TableCell>
        <TableCell>
          <Badge
            variant={match.status === "IN_PROGRESS" ? "secondary" : "default"}
            className="px-2 py-1"
          >
            {match.player1Score} - {match.player2Score}
          </Badge>
        </TableCell>
        {!compactView && <TableCell>{match.courtNumber ?? "N/A"}</TableCell>}
        {!compactView && <TableCell>{match.round}</TableCell>}
        <TableCell>
          <Badge 
            variant={
              match.status === "IN_PROGRESS" 
                ? "default" 
                : match.status === "COMPLETED" 
                ? "secondary" 
                : "secondary"
            }
          >
            {match.status.replace("_", " ")}
          </Badge>
        </TableCell>
      </TableRow>
    );
  };

  // Compact card view for mobile
  const renderMatchCard = (match: MatchScore) => {
    const displayName =
      match.player1 && match.player2
        ? `${match.player1.name} vs ${match.player2.name}`
        : match.team1 && match.team2
        ? `${match.team1.name} vs ${match.team2.name}`
        : "TBD";

    return (
      <Card 
        key={match.id} 
        className="mb-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        onClick={() => router.push(`/referee/live-scoring/${match.id}`)}
      >
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium text-sm">{displayName}</h3>
            <Badge
              variant={
                match.status === "IN_PROGRESS" 
                  ? "default" 
                  : match.status === "COMPLETED" 
                  ? "secondary" 
                  : "secondary"
              }
            >
              {match.status.replace("_", " ")}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm text-muted-foreground">Court {match.courtNumber ?? "N/A"}</span>
              <span className="text-sm text-muted-foreground ml-2">• {match.round}</span>
            </div>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {match.player1Score} - {match.player2Score}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center">
        <div>
          <CardTitle>Live Scoreboard</CardTitle>
          <CardDescription>
            Last updated: {lastUpdate.toLocaleTimeString()}
            {isConnected && (
              <span className="ml-2 text-green-500 text-xs">• Live</span>
            )}
          </CardDescription>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          className="mt-4 sm:mt-0"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading matches...</span>
          </div>
        ) : matches.length > 0 ? (
          <>
            {/* Desktop view */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    {!compactView && <TableHead>ID</TableHead>}
                    <TableHead>Match</TableHead>
                    <TableHead>Score</TableHead>
                    {!compactView && <TableHead>Court</TableHead>}
                    {!compactView && <TableHead>Round</TableHead>}
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matches.map((match) => renderMatchRow(match))}
                </TableBody>
              </Table>
            </div>
            
            {/* Mobile view */}
            <div className="md:hidden">
              {matches.map((match) => renderMatchCard(match))}
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No live matches available at the moment.</p>
            <p className="text-sm mt-2">Check back later or refresh to update.</p>
          </div>
        )}
      </CardContent>
      
      {showPagination && totalPages > 1 && (
        <CardFooter className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next</span>
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
