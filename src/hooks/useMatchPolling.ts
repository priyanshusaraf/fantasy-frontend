import { useState, useEffect } from 'react';
import { Match } from '@prisma/client';

interface UseMatchPollingOptions {
  matchId: number;
  interval?: number; // in milliseconds
  enabled?: boolean;
}

export function useMatchPolling({ matchId, interval = 3000, enabled = true }: UseMatchPollingOptions) {
  const [match, setMatch] = useState<Match | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!enabled) return;

    const fetchMatch = async () => {
      try {
        const response = await fetch(`/api/matches/${matchId}`);
        if (!response.ok) throw new Error('Failed to fetch match data');
        const data = await response.json();
        setMatch(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchMatch();

    // Set up polling
    const pollInterval = setInterval(fetchMatch, interval);

    return () => {
      clearInterval(pollInterval);
    };
  }, [matchId, interval, enabled]);

  return { match, error, isLoading };
} 