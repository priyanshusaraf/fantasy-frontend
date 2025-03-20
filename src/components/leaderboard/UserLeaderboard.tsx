"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Trophy, ArrowRight, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/sonner";

interface LeaderboardEntry {
  id: number;
  contestId: number;
  contestName: string;
  tournamentName: string;
  rank: number;
  totalPoints: number;
  expectedPrize?: number;
  previousRank?: number;
}

export function UserLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUserLeaderboard = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/user/leaderboard");
        if (!response.ok) {
          throw new Error("Failed to fetch user leaderboard");
        }
        const data = await response.json();
        setEntries(data.entries || []);
      } catch (error) {
        console.error("Error fetching user leaderboard:", error);
        toast({
          title: "Error",
          description: "Could not load your leaderboard data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserLeaderboard();
  }, []);

  // Helper to display rank change
  const getRankChange = (entry: LeaderboardEntry) => {
    if (!entry.previousRank) return <Minus className="h-4 w-4 text-gray-400" />;
    
    if (entry.previousRank > entry.rank) {
      const diff = entry.previousRank - entry.rank;
      return (
        <span className="flex items-center text-green-500">
          <ArrowUp className="h-4 w-4 mr-1" />
          {diff}
        </span>
      );
    } else if (entry.previousRank < entry.rank) {
      const diff = entry.rank - entry.previousRank;
      return (
        <span className="flex items-center text-red-500">
          <ArrowDown className="h-4 w-4 mr-1" />
          {diff}
        </span>
      );
    } else {
      return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-[#27D3C3]" />
            Your Leaderboard
          </span>
          <Button 
            variant="ghost"
            className="text-sm gap-1 text-[#27D3C3]"
            onClick={() => router.push("/leaderboard")}
          >
            View Global Rankings
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-6">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#27D3C3]"></div>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center p-6 text-muted-foreground">
            <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>You haven't joined any contests yet</p>
            <Button 
              variant="link" 
              className="mt-2 text-[#27D3C3]"
              onClick={() => router.push("/fantasy/contests")}
            >
              Join a fantasy contest
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left py-3 px-2">Contest</th>
                  <th className="text-center py-3 px-2">Rank</th>
                  <th className="text-center py-3 px-2">Change</th>
                  <th className="text-right py-3 px-2">Points</th>
                  <th className="text-right py-3 px-2">Potential Prize</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr 
                    key={`${entry.contestId}-${entry.id}`}
                    className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/50 cursor-pointer"
                    onClick={() => router.push(`/fantasy/contests/${entry.contestId}`)}
                  >
                    <td className="py-3 px-2">
                      <div>
                        <p className="font-medium">{entry.contestName}</p>
                        <p className="text-xs text-gray-500">{entry.tournamentName}</p>
                      </div>
                    </td>
                    <td className="text-center py-3 px-2">
                      <Badge variant={entry.rank <= 3 ? "default" : "outline"} className={entry.rank <= 3 ? "bg-[#27D3C3] text-black" : ""}>
                        {entry.rank}
                      </Badge>
                    </td>
                    <td className="text-center py-3 px-2">
                      {getRankChange(entry)}
                    </td>
                    <td className="text-right py-3 px-2 font-medium">
                      {entry.totalPoints.toFixed(2)}
                    </td>
                    <td className="text-right py-3 px-2 font-medium">
                      ${entry.expectedPrize?.toFixed(2) || "0.00"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default UserLeaderboard; 