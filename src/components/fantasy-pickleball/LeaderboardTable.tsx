"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, TrendingDown, Minus, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LeaderboardTeam {
  id: number;
  rank: number;
  previousRank?: number;
  name: string;
  ownerName: string;
  points: number;
  isUserTeam: boolean;
  pointsChanged?: boolean;
}

interface LeaderboardTableProps {
  teams: LeaderboardTeam[];
  loading?: boolean;
  title?: string;
  description?: string;
  maxHeight?: string;
  highlightTopThree?: boolean;
  highlightUpdates?: boolean;
}

export default function LeaderboardTable({
  teams,
  loading = false,
  title = "Leaderboard",
  description,
  maxHeight = "500px",
  highlightTopThree = true,
  highlightUpdates = false,
}: LeaderboardTableProps) {
  // Get rank movement (up, down, or same)
  const getRankMovement = (team: LeaderboardTeam) => {
    if (!team.previousRank) return null;
    
    if (team.rank < team.previousRank) {
      return { type: "up", diff: team.previousRank - team.rank };
    } else if (team.rank > team.previousRank) {
      return { type: "down", diff: team.rank - team.previousRank };
    }
    return { type: "same", diff: 0 };
  };
  
  // Get trophy emoji for top 3 ranks
  const getTrophyEmoji = (rank: number) => {
    switch (rank) {
      case 1:
        return { icon: <Trophy className="h-4 w-4 text-yellow-400" />, color: "text-yellow-400" };
      case 2:
        return { icon: <Trophy className="h-4 w-4 text-gray-400" />, color: "text-gray-400" };
      case 3:
        return { icon: <Trophy className="h-4 w-4 text-amber-700" />, color: "text-amber-700" };
      default:
        return null;
    }
  };
  
  return (
    <Card className="bg-gray-800 border-gray-700 overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-xl">{title}</CardTitle>
        {description && (
          <CardDescription className="text-gray-400">{description}</CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className={`w-full ${maxHeight ? `max-h-[${maxHeight}]` : ""}`}>
          <Table>
            <TableHeader className="bg-gray-800/90 sticky top-0">
              <TableRow className="border-b-gray-700 hover:bg-transparent">
                <TableHead className="w-[60px] text-gray-400">Rank</TableHead>
                <TableHead className="text-gray-400">Team</TableHead>
                <TableHead className="text-right text-gray-400 w-[120px]">Points</TableHead>
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {loading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index} className="border-b-gray-700 animate-pulse">
                    <TableCell className="py-3 flex justify-center">
                      <div className="h-6 w-6 bg-gray-700 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <div className="h-5 bg-gray-700 rounded-full w-3/4" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="h-5 bg-gray-700 rounded-full w-16 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : teams.length > 0 ? (
                teams.map((team) => {
                  const rankMovement = getRankMovement(team);
                  const trophy = highlightTopThree ? getTrophyEmoji(team.rank) : null;
                  
                  return (
                    <TableRow 
                      key={team.id}
                      className={`
                        border-b-gray-700 group
                        ${team.isUserTeam ? "bg-indigo-900/20" : "hover:bg-gray-700/40"}
                      `}
                    >
                      <TableCell className="py-3 relative">
                        <div className="flex items-center justify-center">
                          {trophy ? (
                            <span className={`font-bold ${trophy.color}`}>
                              {trophy.icon}
                            </span>
                          ) : (
                            <span className="font-medium">{team.rank}</span>
                          )}
                          
                          {rankMovement && (
                            <div className="absolute right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              {rankMovement.type === "up" ? (
                                <Badge className="bg-green-600/30 text-green-300 text-xs font-normal">
                                  <TrendingUp className="h-3 w-3 mr-0.5" />
                                  {rankMovement.diff}
                                </Badge>
                              ) : rankMovement.type === "down" ? (
                                <Badge className="bg-red-600/30 text-red-300 text-xs font-normal">
                                  <TrendingDown className="h-3 w-3 mr-0.5" />
                                  {rankMovement.diff}
                                </Badge>
                              ) : (
                                <Badge className="bg-gray-600/30 text-gray-300 text-xs font-normal">
                                  <Minus className="h-3 w-3" />
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium truncate">{team.name}</span>
                          <span className="text-gray-400 text-xs flex items-center">
                            <User className="h-3 w-3 mr-1 inline text-gray-500" />
                            {team.ownerName}
                          </span>
                        </div>
                        {team.isUserTeam && (
                          <Badge className="bg-indigo-500/30 text-indigo-300 ml-2 text-xs">
                            Your Team
                          </Badge>
                        )}
                      </TableCell>
                      
                      <TableCell 
                        className={`
                          text-right font-medium 
                          ${team.pointsChanged && highlightUpdates 
                            ? 'text-green-400 animate-pulse-brief' 
                            : 'text-indigo-400'}
                        `}
                      >
                        {typeof team.points === 'number' ? team.points.toFixed(1) : '0.0'}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow className="border-b-gray-700">
                  <TableCell colSpan={3} className="text-center py-8 text-gray-400">
                    No teams found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
} 