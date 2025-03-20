"use client";

import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

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

interface Match {
  id: number;
  team1: Team;
  team2: Team;
  player1Score: number;
  player2Score: number;
  tournamentId: number;
  tournamentName: string;
  round: string;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED";
  startTime: string;
  courtNumber: number;
  currentSet: number;
  sets: number;
  maxScore: number;
  isGoldenPoint: boolean;
  setScores?: Array<{
    set: number;
    team1Score: number;
    team2Score: number;
  }>;
}

interface SimplifiedScoringProps {
  match: Match;
  showHeader?: boolean;
}

export default function SimplifiedScoring({ match, showHeader = false }: SimplifiedScoringProps) {
  // Calculate progress percentages for the score visualization
  const totalPoints = match.player1Score + match.player2Score;
  const team1Percentage = totalPoints > 0 ? (match.player1Score / totalPoints) * 100 : 50;
  
  // Get player names
  const formatTeamDisplay = (team: Team) => {
    if (team.players.length === 1) {
      return team.players[0].name;
    } else {
      return `${team.players[0].name} & ${team.players[1].name}`;
    }
  };

  // Format set scores for display
  const formatSetScores = () => {
    if (!match.setScores || match.setScores.length === 0) return null;
    
    return (
      <div className="flex justify-center space-x-2 text-xs mt-1">
        {match.setScores.map((set, index) => (
          <span key={index} className="text-muted-foreground">
            {index > 0 && ' | '}
            Set {set.set}: {set.team1Score}-{set.team2Score}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full">
      {showHeader && (
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium">{match.tournamentName}</h3>
          <Badge variant={match.status === 'IN_PROGRESS' ? 'default' : 'outline'}>
            {match.status === 'IN_PROGRESS' ? 'LIVE' : match.status}
          </Badge>
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="text-center">
          <div className="font-bold truncate">{formatTeamDisplay(match.team1)}</div>
        </div>
        <div className="text-center">
          <div className="font-bold truncate">{formatTeamDisplay(match.team2)}</div>
        </div>
      </div>
      
      <div className="flex justify-between items-center mb-2">
        <div className="text-4xl font-bold">{match.player1Score}</div>
        <div className="text-xs px-2 py-1 bg-muted rounded">
          {match.status === 'IN_PROGRESS' && (
            <>
              Set {match.currentSet}/{match.sets}
              <span className="mx-1">•</span>
              To {match.maxScore}
            </>
          )}
          {match.status === 'COMPLETED' && 'Final'}
          {match.status === 'SCHEDULED' && 'Upcoming'}
        </div>
        <div className="text-4xl font-bold">{match.player2Score}</div>
      </div>
      
      {/* Score progress bar */}
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className="absolute left-0 h-full bg-primary"
          style={{ width: `${team1Percentage}%` }}
        />
      </div>
      
      {/* Set history */}
      {formatSetScores()}
    </div>
  );
} 