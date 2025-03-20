import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Search, TrendingUp, TrendingDown, Minus, Trophy, Medal } from "lucide-react";

interface FantasyTeam {
  id: string;
  rank: number;
  previousRank?: number;
  teamName: string;
  ownerName: string;
  ownerAvatar?: string;
  points: number;
  contestId: string;
}

interface FantasyLeaderboardProps {
  teams: FantasyTeam[];
  contestName: string;
  contestId: string;
  totalTeams: number;
  isLive?: boolean;
  highlightTeamId?: string;
  onTeamClick?: (teamId: string) => void;
}

export function FantasyLeaderboard({
  teams,
  contestName,
  contestId,
  totalTeams,
  isLive = false,
  highlightTeamId,
  onTeamClick,
}: FantasyLeaderboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredTeams = teams.filter(team => 
    team.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.ownerName.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const getRankChangeIcon = (team: FantasyTeam) => {
    if (!team.previousRank) return null;
    
    if (team.rank < team.previousRank) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (team.rank > team.previousRank) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    } else {
      return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };
  
  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-800">
          <Trophy className="h-4 w-4" />
        </div>
      );
    } else if (rank === 2) {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-800">
          <Medal className="h-4 w-4" />
        </div>
      );
    } else if (rank === 3) {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-800">
          <Medal className="h-4 w-4" />
        </div>
      );
    } else {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
          {rank}
        </div>
      );
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{contestName} Leaderboard</CardTitle>
            <CardDescription>
              {totalTeams} teams competing
              {isLive && <Badge variant="outline" className="ml-2 bg-red-50 text-red-700">LIVE</Badge>}
            </CardDescription>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search teams or owners..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Rank</TableHead>
              <TableHead>Team</TableHead>
              <TableHead className="text-right">Points</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTeams.map((team) => (
              <TableRow 
                key={team.id}
                className={`cursor-pointer transition-colors ${
                  team.id === highlightTeamId ? 'bg-muted/50' : ''
                }`}
                onClick={() => onTeamClick && onTeamClick(team.id)}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {getRankBadge(team.rank)}
                    {getRankChangeIcon(team)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={team.ownerAvatar} />
                      <AvatarFallback>
                        {team.ownerName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{team.teamName}</div>
                      <div className="text-xs text-muted-foreground">{team.ownerName}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right font-bold">
                  {isLive && <span className="text-primary animate-pulse mr-1">•</span>}
                  {team.points}
                </TableCell>
              </TableRow>
            ))}
            {filteredTeams.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  No teams found matching your search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
} 