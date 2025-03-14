// src/components/fantasy-pickleball/Leaderboard.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Trophy,
  DollarSign,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface LeaderboardProps {
  contestId: number;
}

interface TeamEntry {
  id: number;
  name: string;
  totalPoints: number;
  rank: number;
  userId: number;
  user: {
    username: string;
  };
}

interface ContestInfo {
  name: string;
  entryFee: number;
  prizePool: number;
  participants: number;
  status: string;
}

interface PrizeBreakdown {
  position: number;
  percentage: number;
  amount: number;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ contestId }) => {
  const [leaderboard, setLeaderboard] = useState<TeamEntry[]>([]);
  const [contestInfo, setContestInfo] = useState<ContestInfo | null>(null);
  const [prizeBreakdown, setPrizeBreakdown] = useState<PrizeBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const router = useRouter();

  // Fetch leaderboard data
  useEffect(() => {
    if (!contestId) return;

    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/fantasy-pickleball/contests/${contestId}/leaderboard?page=${page}&limit=20`
        );

        if (!res.ok) {
          throw new Error("Failed to fetch leaderboard");
        }

        const data = await res.json();
        setLeaderboard(data.leaderboard);
        setContestInfo(data.contest);
        setPrizeBreakdown(data.prizeBreakdown);
        setTotalPages(data.meta.totalPages);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [contestId, page]);

  // Handle pagination
  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  // View team details
  const viewTeamDetails = (teamId: number) => {
    router.push(`/fantasy/teams/${teamId}`);
  };

  if (loading && !leaderboard.length) {
    return (
      <div className="flex justify-center p-8">Loading leaderboard...</div>
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

  return (
    <div className="space-y-6">
      {/* Contest Info */}
      {contestInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{contestInfo.name} Leaderboard</span>
              <Badge
                variant={contestInfo.entryFee === 0 ? "secondary" : "default"}
                className={
                  contestInfo.entryFee === 0
                    ? "bg-gray-100"
                    : "bg-[#00a1e0] text-white"
                }
              >
                {contestInfo.entryFee === 0
                  ? "FREE"
                  : `₹${contestInfo.entryFee} Entry`}
              </Badge>
            </CardTitle>
            <CardDescription>
              {contestInfo.status === "IN_PROGRESS"
                ? "Live standings"
                : contestInfo.status === "COMPLETED"
                ? "Final results"
                : "Current standings"}{" "}
              and prize distribution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="bg-[#6da0e1]/10">
                <CardContent className="p-4 flex flex-col items-center justify-center">
                  <Trophy className="h-6 w-6 text-[#00a1e0] mb-2" />
                  <p className="text-lg font-bold">
                    ₹{contestInfo.prizePool.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">Prize Pool</p>
                </CardContent>
              </Card>

              <Card className="bg-[#0b453a]/10">
                <CardContent className="p-4 flex flex-col items-center justify-center">
                  <DollarSign className="h-6 w-6 text-[#0b453a] mb-2" />
                  <p className="text-lg font-bold">
                    ₹{prizeBreakdown[0]?.amount.toLocaleString() || 0}
                  </p>
                  <p className="text-sm text-gray-500">1st Place Prize</p>
                </CardContent>
              </Card>

              <Card className="bg-[#dec2db]/10">
                <CardContent className="p-4 flex flex-col items-center justify-center">
                  <Users className="h-6 w-6 text-[#5b62b3] mb-2" />
                  <p className="text-lg font-bold">
                    {contestInfo.participants}
                  </p>
                  <p className="text-sm text-gray-500">Participants</p>
                </CardContent>
              </Card>
            </div>

            {/* Prize Breakdown */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Prize Distribution</h3>
              <div className="bg-[#fff5fc] rounded-md p-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Position</TableHead>
                      <TableHead>Percentage</TableHead>
                      <TableHead>Prize Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prizeBreakdown.map((prize) => (
                      <TableRow key={prize.position}>
                        <TableCell>{prize.position.toLocaleString()}</TableCell>
                        <TableCell>{prize.percentage}%</TableCell>
                        <TableCell>₹{prize.amount.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard Table */}
      <Card>
        <CardHeader>
          <CardTitle>Current Standings</CardTitle>
          <CardDescription>
            Page {page} of {totalPages} - {leaderboard.length} teams shown
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                  <TableHead className="text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.map((team) => (
                  <TableRow
                    key={team.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <TableCell>
                      {team.rank <= 3 ? (
                        <div className="flex items-center">
                          <div
                            className={`
                            w-8 h-8 flex items-center justify-center rounded-full 
                            ${
                              team.rank === 1
                                ? "bg-yellow-100 text-yellow-800"
                                : team.rank === 2
                                ? "bg-gray-100 text-gray-800"
                                : "bg-amber-100 text-amber-800"
                            }
                          `}
                          >
                            {team.rank}
                          </div>
                        </div>
                      ) : (
                        <span className="px-2">{team.rank}</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{team.name}</TableCell>
                    <TableCell>{team.user.username}</TableCell>
                    <TableCell className="text-right font-medium">
                      {team.totalPoints?.toFixed(1) || "0.0"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        className="hover:bg-[#00a1e0]/10"
                        onClick={() => viewTeamDetails(team.id)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {/* Empty state */}
                {leaderboard.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-gray-500"
                    >
                      No teams found in this contest.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        {totalPages > 1 && (
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevPage}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <span className="px-4 py-2">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={handleNextPage}
              disabled={page >= totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default Leaderboard;
