// src/components/tournament/PlayerStatsTable.tsx
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PlayerStats {
  id: number;
  player: {
    id: number;
    name: string;
    imageUrl?: string;
    skillLevel?: string;
  };
  wins: number;
  losses: number;
  winPercentage: number;
  aces?: number;
  pointsScored?: number;
  pointsAgainst?: number;
}

interface PlayerStatsTableProps {
  tournamentId: string;
  stats: PlayerStats[];
  loading: boolean;
  sortBy?: "wins" | "winPercentage" | "pointsScored";
  onSortChange?: (sortBy: "wins" | "winPercentage" | "pointsScored") => void;
}

export function PlayerStatsTable({
  tournamentId,
  stats,
  loading,
  sortBy = "wins",
  onSortChange,
}: PlayerStatsTableProps) {
  const getSkillLevelColor = (level?: string) => {
    switch (level) {
      case "BEGINNER":
        return "bg-green-100 text-green-800";
      case "INTERMEDIATE":
        return "bg-blue-100 text-blue-800";
      case "ADVANCED":
        return "bg-purple-100 text-purple-800";
      case "PROFESSIONAL":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Player Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">Loading player stats...</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead
                    className={`cursor-pointer ${
                      sortBy === "wins" ? "text-[#00a1e0]" : ""
                    }`}
                    onClick={() => onSortChange && onSortChange("wins")}
                  >
                    Wins
                  </TableHead>
                  <TableHead>Losses</TableHead>
                  <TableHead
                    className={`cursor-pointer ${
                      sortBy === "winPercentage" ? "text-[#00a1e0]" : ""
                    }`}
                    onClick={() =>
                      onSortChange && onSortChange("winPercentage")
                    }
                  >
                    Win %
                  </TableHead>
                  <TableHead
                    className={`cursor-pointer ${
                      sortBy === "pointsScored" ? "text-[#00a1e0]" : ""
                    }`}
                    onClick={() => onSortChange && onSortChange("pointsScored")}
                  >
                    Points
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.length > 0 ? (
                  stats.map((stat) => (
                    <TableRow key={stat.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-gray-200 mr-2 flex items-center justify-center overflow-hidden">
                            {stat.player.imageUrl ? (
                              <img
                                src={stat.player.imageUrl}
                                alt={stat.player.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span>{stat.player.name.charAt(0)}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">
                              {stat.player.name}
                            </div>
                            {stat.player.skillLevel && (
                              <Badge
                                variant="secondary"
                                className={getSkillLevelColor(
                                  stat.player.skillLevel
                                )}
                              >
                                {stat.player.skillLevel.toLowerCase()}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{stat.wins}</TableCell>
                      <TableCell>{stat.losses}</TableCell>
                      <TableCell>{stat.winPercentage.toFixed(1)}%</TableCell>
                      <TableCell>{stat.pointsScored || "0"}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-4 text-gray-500"
                    >
                      No player statistics available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
