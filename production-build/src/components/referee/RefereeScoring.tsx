"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScoringService } from '@/services/ScoringService';
import { useMatchPolling } from '@/hooks/useMatchPolling';
import { toast } from 'sonner';
import { Match } from '@prisma/client';

interface Team {
  id: number;
  name: string;
  players: Array<{
    id: number;
    name: string;
    imageUrl?: string;
  }>;
}

interface MatchDetails {
  id: number;
  team1: Team;
  team2: Team;
  team1Score: number;
  team2Score: number;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  contestId: number;
  startTime?: Date;
  currentServer?: number; // ID of the player currently serving
}

interface ScoreHistory {
  timestamp: Date;
  team: number;
  points: number;
  description: string;
}

interface RefereeScoreProps {
  matchId: number;
}

export function RefereeScoring({ matchId }: RefereeScoreProps) {
  const { match, error, isLoading } = useMatchPolling({ 
    matchId,
    interval: 2000, // Poll every 2 seconds
  });

  const [isUpdating, setIsUpdating] = useState(false);

  const updateScore = async (teamNumber: 1 | 2, points: number = 1) => {
    if (isUpdating || !match) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/matches/${matchId}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamNumber,
          points,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update score');
      }

      // No need to update state here as polling will handle it
    } catch (err) {
      toast.error('Failed to update score. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUndo = async () => {
    if (isUpdating || !match) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/matches/${matchId}/undo`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to undo last action');
      }

      // No need to update state here as polling will handle it
    } catch (err) {
      toast.error('Failed to undo. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return <div>Loading match data...</div>;
  }

  if (error || !match) {
    return <div>Error loading match data. Please refresh the page.</div>;
  }

  return (
    <Card className="p-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Team 1</h3>
          <div className="text-3xl font-bold my-4">{match.player1Score || 0}</div>
          <Button 
            onClick={() => updateScore(1)} 
            disabled={isUpdating || match.status !== 'IN_PROGRESS'}
          >
            +1 Point
          </Button>
        </div>

        <div className="text-center">
          <h3 className="text-lg font-semibold">Team 2</h3>
          <div className="text-3xl font-bold my-4">{match.player2Score || 0}</div>
          <Button 
            onClick={() => updateScore(2)} 
            disabled={isUpdating || match.status !== 'IN_PROGRESS'}
          >
            +1 Point
          </Button>
        </div>
      </div>

      <div className="mt-4 flex justify-center">
        <Button 
          variant="outline" 
          onClick={handleUndo}
          disabled={isUpdating || match.status !== 'IN_PROGRESS'}
        >
          Undo Last Action
        </Button>
      </div>

      {match.status === 'IN_PROGRESS' && (
        <div className="mt-4 text-center text-sm text-gray-500">
          Auto-saving scores...
        </div>
      )}
    </Card>
  );
} 