"use client";

import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface FantasyContest {
  id: number;
  name: string;
  entryFee: number;
}

interface FantasyTeam {
  id: number;
  name: string;
  rank: number;
  totalPoints: number;
  user: {
    name: string;
    username: string;
    email: string;
  };
  expectedPrize: number;
}

interface FantasyLeaderboardProps {
  tournamentId: string;
  contestId: string;
  onContestChange: (contestId: string) => void;
}

export function FantasyLeaderboard({ tournamentId, contestId, onContestChange }: FantasyLeaderboardProps) {
  const [contests, setContests] = useState<FantasyContest[]>([]);
  const [teams, setTeams] = useState<FantasyTeam[]>([]);
  const [loading, setLoading] = useState(false);
  const [contestsLoading, setContestsLoading] = useState(false);

  // Fetch contests for selected tournament
  useEffect(() => {
    if (!tournamentId) return;
    
    const fetchContests = async () => {
      try {
        setContestsLoading(true);
        const response = await fetch(`/api/tournaments/${tournamentId}/fantasy-contests`);
        if (!response.ok) throw new Error("Failed to fetch contests");
        
        const data = await response.json();
        setContests(data);
        
        // Auto-select first contest if available and none selected
        if (data.length > 0 && !contestId) {
          onContestChange(data[0].id.toString());
        }
      } catch (error) {
        console.error("Error fetching contests:", error);
      } finally {
        setContestsLoading(false);
      }
    };
    
    fetchContests();
  }, [tournamentId, contestId, onContestChange]);

  // Fetch teams for selected contest
  useEffect(() => {
    if (!contestId) return;
    
    const fetchTeams = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/leaderboard/fantasy?contestId=${contestId}`);
        if (!response.ok) throw new Error("Failed to fetch fantasy leaderboard");
        
        const data = await response.json();
        setTeams(data);
      } catch (error) {
        console.error("Error fetching fantasy leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTeams();
  }, [contestId]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div>
      {/* Contest Selector */}
      <div className="mb-4">
        <label className="text-sm font-medium mb-2 block">
          Select Contest
        </label>
        <Select 
          value={contestId}
          onValueChange={onContestChange}
          disabled={contestsLoading || contests.length === 0}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a contest" />
          </SelectTrigger>
          <SelectContent>
            {contests.map((contest) => (
              <SelectItem key={contest.id} value={contest.id.toString()}>
                {contest.name} ({formatCurrency(contest.entryFee)})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {contestsLoading && <p className="text-sm text-muted-foreground mt-2">Loading contests...</p>}
        {!contestsLoading && contests.length === 0 && (
          <p className="text-sm text-muted-foreground mt-2">No contests available for this tournament</p>
        )}
      </div>
      
      {/* Leaderboard Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">Rank</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead className="text-right">Points</TableHead>
              <TableHead className="text-right">Prize</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              Array(3).fill(0).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))
            )}
            {!loading && teams.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                  {contestId ? "No teams found in this contest" : "Select a contest to view teams"}
                </TableCell>
              </TableRow>
            )}
            {!loading && teams.map((team, index) => index < 5 && (
              <TableRow key={team.id}>
                <TableCell className="text-center font-medium">{team.rank}</TableCell>
                <TableCell>{team.name}</TableCell>
                <TableCell>{team.user.name || team.user.username || team.user.email}</TableCell>
                <TableCell className="text-right">{team.totalPoints.toString()}</TableCell>
                <TableCell className="text-right">{formatCurrency(team.expectedPrize)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 