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
import { Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Trophy, DollarSign, Users } from "lucide-react";
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
              >
                {contestInfo.entryFee === 0
                  ? "FREE"
                  : `₹${contestInfo.entryFee} Entry`}
              </Badge>
            </CardTitle>
            <CardDescription>
              Current standings and prize distribution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="bg-blue-50">
                <CardContent className="p-4 flex flex-col items-center justify-center">
                  <Trophy className="h-6 w-6 text-blue-500 mb-2" />
                  <p className="text-lg font-bold">
                    ₹{contestInfo.prizePool.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">Prize Pool</p>
                </CardContent>
              </Card>

              <Card className="bg-green-50">
                <CardContent className="p-4 flex flex-col items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-500 mb-2" />
                  <p className="text-lg font-bold">
                    ₹{prizeBreakdown[0]?.amount.toLocaleString() || 0}
                  </p>
                  <p className="text-sm text-gray-500">1st Place Prize</p>
                </CardContent>
              </Card>

              <Card className="bg-purple-50">
                <CardContent className="p-4 flex flex-col items-center justify-center">
                  <Users className="h-6 w-6 text-purple-500 mb-2" />
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
              <div className="bg-gray-50 rounded-md p-4">
                <div className="grid grid-cols-3 font-medium border-b pb-2 mb-2">
                  <div>Position</div>
                  <div>Percentage</div>
                  <div>Prize Amount</div>
                </div>
                {prizeBreakdown.map((prize) => (
                  <div
                    key={prize.position}
                    className="grid grid-cols-3 py-1 border-b border-gray-100 text-sm"
                  >
                    <div>{prize.position.toLocaleString()}</div>
                    <div>{prize.percentage}%</div>
                    <div>₹{prize.amount.toLocaleString()}</div>
                  </div>
                ))}
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
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left">Rank</th>
                  <th className="px-4 py-2 text-left">Team</th>
                  <th className="px-4 py-2 text-left">Manager</th>
                  <th className="px-4 py-2 text-right">Points</th>
                  <th className="px-4 py-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((team) => (
                  <tr
                    key={team.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
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
                    </td>
                    <td className="px-4 py-3 font-medium">{team.name}</td>
                    <td className="px-4 py-3">{team.user.username}</td>
                    <td className="px-4 py-3 text-right font-medium">
                      {team.totalPoints?.toFixed(1) || "0.0"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewTeamDetails(team.id)}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}

                {/* Empty state */}
                {leaderboard.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      No teams found in this contest.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevPage}
            disabled={page <= 1}
          >
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
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Leaderboard;
