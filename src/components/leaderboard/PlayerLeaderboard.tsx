"use client";

import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface PlayerRanking {
  rank: number;
  playerId: number;
  totalPoints: number;
  playerName: string;
  playerImage: string | null;
  team: {
    id: number;
    name: string;
  } | null;
}

interface PlayerLeaderboardProps {
  tournamentId: string;
}

export function PlayerLeaderboard({ tournamentId }: PlayerLeaderboardProps) {
  const [players, setPlayers] = useState<PlayerRanking[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tournamentId) return;
    
    const fetchPlayerLeaderboard = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/leaderboard/players?tournamentId=${tournamentId}`);
        if (!response.ok) throw new Error("Failed to fetch player leaderboard");
        
        const data = await response.json();
        setPlayers(data);
      } catch (error) {
        console.error("Error fetching player leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPlayerLeaderboard();
  }, [tournamentId]);

  // Get initials from player name
  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 text-center">Rank</TableHead>
            <TableHead>Player</TableHead>
            <TableHead>Team</TableHead>
            <TableHead className="text-right">Points</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && (
            Array(3).fill(0).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
              </TableRow>
            ))
          )}
          {!loading && players.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                {tournamentId ? "No player data available" : "Select a tournament to view player points"}
              </TableCell>
            </TableRow>
          )}
          {!loading && players.map((player, index) => index < 5 && (
            <TableRow key={player.playerId}>
              <TableCell className="text-center font-medium">{player.rank}</TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={player.playerImage || undefined} alt={player.playerName} />
                    <AvatarFallback>{getInitials(player.playerName)}</AvatarFallback>
                  </Avatar>
                  <span>{player.playerName}</span>
                </div>
              </TableCell>
              <TableCell>
                {player.team ? (
                  <Badge variant="outline">{player.team.name}</Badge>
                ) : (
                  <span className="text-muted-foreground">No team</span>
                )}
              </TableCell>
              <TableCell className="text-right font-semibold">{player.totalPoints}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 