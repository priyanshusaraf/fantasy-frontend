"use client";

import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface TeamStanding {
  id: number;
  name: string;
  rank: number;
  totalPoints: number;
  matchesPlayed: number;
  matchesWon: number;
  winRate: number;
}

interface TeamLeaderboardProps {
  tournamentId: string;
}

export function TeamLeaderboard({ tournamentId }: TeamLeaderboardProps) {
  const [teams, setTeams] = useState<TeamStanding[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tournamentId) return;
    
    const fetchTeamStandings = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/leaderboard/teams?tournamentId=${tournamentId}`);
        if (!response.ok) throw new Error("Failed to fetch team standings");
        
        const data = await response.json();
        setTeams(data);
      } catch (error) {
        console.error("Error fetching team standings:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTeamStandings();
  }, [tournamentId]);

  // Get color based on win rate
  const getWinRateColor = (winRate: number) => {
    if (winRate > 60) return "bg-green-500";
    if (winRate > 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 text-center">Rank</TableHead>
            <TableHead>Team</TableHead>
            <TableHead className="text-right">W-L</TableHead>
            <TableHead className="text-right">Win Rate</TableHead>
            <TableHead className="text-right">Points</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && (
            Array(3).fill(0).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <Skeleton className="h-4 w-12 ml-auto" />
                    <Skeleton className="h-2 w-16" />
                  </div>
                </TableCell>
                <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
              </TableRow>
            ))
          )}
          {!loading && teams.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                {tournamentId ? "No team data available" : "Select a tournament to view team standings"}
              </TableCell>
            </TableRow>
          )}
          {!loading && teams.map((team, index) => index < 5 && (
            <TableRow key={team.id}>
              <TableCell className="text-center font-medium">{team.rank}</TableCell>
              <TableCell className="font-medium">{team.name}</TableCell>
              <TableCell className="text-right">{team.matchesWon}-{team.matchesPlayed - team.matchesWon}</TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-2">
                  <span className="text-sm">{team.winRate}%</span>
                  <div className="relative h-2 w-16 overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`absolute h-full ${getWinRateColor(team.winRate)}`}
                      style={{ width: `${team.winRate}%` }}
                    />
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right font-semibold">{team.totalPoints}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 