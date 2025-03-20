"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  RotateCcw, 
  Check, 
  X, 
  AlertCircle, 
  Flag, 
  RotateCw, 
  ScreenShare, 
  Users, 
  User, 
  Trophy, 
  Timer,
  MoveHorizontal
} from 'lucide-react';

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
  currentSet: number;
  maxScore: number;
  sets: number;
  isGoldenPoint: boolean;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  setScores?: {
    set: number;
    team1Score: number;
    team2Score: number;
  }[];
  startTime?: string;
  duration?: number;
}

interface RefereeScoreProps {
  matchId: number;
}

export function RefereeScoring({ matchId }: RefereeScoreProps) {
  const [match, setMatch] = useState<Match | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [showEndSetConfirm, setShowEndSetConfirm] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [showRotationPrompt, setShowRotationPrompt] = useState(false);
  const [matchTimer, setMatchTimer] = useState<number>(0);
  const [isMatchStarted, setIsMatchStarted] = useState(false);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const courtRef = useRef<HTMLDivElement>(null);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Fetch match data initially and set up polling
  useEffect(() => {
    const fetchMatchData = async () => {
      try {
        const response = await fetch(`/api/matches/${matchId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch match data');
        }
        const data = await response.json();
        setMatch(data);

        // If match is in progress, start the timer
        if (data.status === 'IN_PROGRESS' && !isMatchStarted) {
          setIsMatchStarted(true);
          // Calculate elapsed time if the match already has a start time
          if (data.startTime) {
            const startTime = new Date(data.startTime).getTime();
            const now = Date.now();
            const elapsedSeconds = Math.floor((now - startTime) / 1000);
            setMatchTimer(elapsedSeconds);
          }
        }
      } catch (err) {
        console.error('Error fetching match data:', err);
        setError('Failed to load match data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatchData();

    // Set up polling every 2 seconds
    const pollInterval = setInterval(fetchMatchData, 2000);

    // Check device orientation
    const checkOrientation = () => {
      const isLandscapeMode = window.matchMedia('(orientation: landscape)').matches;
      setIsLandscape(isLandscapeMode);
      setShowRotationPrompt(!isLandscapeMode);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, [matchId]);

  // Handle match timer
  useEffect(() => {
    if (isMatchStarted && match?.status === 'IN_PROGRESS') {
      if (timerInterval.current) clearInterval(timerInterval.current);
      
      timerInterval.current = setInterval(() => {
        setMatchTimer(prevTime => prevTime + 1);
      }, 1000);
    }

    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, [isMatchStarted, match?.status]);

  // Update score function
  const updateScore = async (teamNumber: 1 | 2) => {
    if (isUpdating || !match || match.status !== 'IN_PROGRESS') return;

    // Check if match needs to be started
    if (!isMatchStarted) {
      await startMatch();
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/matches/${matchId}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamNumber }),
      });

      if (!response.ok) {
        throw new Error('Failed to update score');
      }

      const updatedMatch = await response.json();
      setMatch(updatedMatch);

      // Provide visual feedback
      setLastAction(`Team ${teamNumber} scored`);
      
      // Provide haptic feedback on mobile
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }

      // Check if set should end based on the updated scores
      const team1Score = updatedMatch.player1Score;
      const team2Score = updatedMatch.player2Score;
      const { maxScore, isGoldenPoint } = match;

      if (isSetComplete(team1Score, team2Score, maxScore, isGoldenPoint)) {
        setShowEndSetConfirm(true);
      }
    } catch (err) {
      toast.error('Failed to update score. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Check if set should be completed
  const isSetComplete = (team1Score: number, team2Score: number, maxScore: number, isGoldenPoint: boolean): boolean => {
    // If golden point (win by 1)
    if (isGoldenPoint) {
      return team1Score >= maxScore || team2Score >= maxScore;
    }
    
    // If win by 2
    if (team1Score >= maxScore && team1Score - team2Score >= 2) {
      return true;
    }
    
    if (team2Score >= maxScore && team2Score - team1Score >= 2) {
      return true;
    }
    
    return false;
  };

  // Start the match officially
  const startMatch = async () => {
    try {
      const response = await fetch(`/api/matches/${matchId}/start`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to start match');
      }

      setIsMatchStarted(true);
      setMatchTimer(0);
      
      // Start timer
      if (timerInterval.current) clearInterval(timerInterval.current);
      timerInterval.current = setInterval(() => {
        setMatchTimer(prevTime => prevTime + 1);
      }, 1000);
      
      toast.success('Match started successfully');
    } catch (err) {
      toast.error('Failed to start match');
    }
  };

  // Handle undo of last score
  const handleUndo = async () => {
    if (isUpdating || !match || match.status !== 'IN_PROGRESS') return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/matches/${matchId}/undo`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to undo last action');
      }

      const updatedMatch = await response.json();
      setMatch(updatedMatch);
      setLastAction('Last point undone');
      
      // Haptic feedback - double pulse for undo
      if (navigator.vibrate) {
        navigator.vibrate([50, 50, 50]);
      }
    } catch (err) {
      toast.error('Failed to undo. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Complete the current set
  const completeSet = async () => {
    if (isUpdating || !match) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/matches/${matchId}/complete-set`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to complete set');
      }

      const updatedMatch = await response.json();
      setMatch(updatedMatch);
      setShowEndSetConfirm(false);
      
      // Check if match is completed after this set
      if (updatedMatch.status === 'COMPLETED') {
        setShowCompleteConfirm(true);
      } else {
        toast.success(`Set ${updatedMatch.currentSet - 1} completed`);
      }
      
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    } catch (err) {
      toast.error('Failed to complete set. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Complete the entire match
  const completeMatch = async () => {
    if (isUpdating || !match) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/matches/${matchId}/complete`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to complete match');
      }

      const updatedMatch = await response.json();
      setMatch(updatedMatch);
      setShowCompleteConfirm(false);
      
      // Stop timer
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
      
      toast.success('Match completed successfully');
      
      // Haptic feedback - long vibration for completion
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
    } catch (err) {
      toast.error('Failed to complete match. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle user clicking/tapping on the court
  const handleCourtClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!courtRef.current || !match || match.status !== 'IN_PROGRESS') return;

    const courtRect = courtRef.current.getBoundingClientRect();
    const clickX = event.clientX - courtRect.left;
    const courtWidth = courtRect.width;
    
    // Determine if left side (team 1) or right side (team 2) was clicked
    if (clickX < courtWidth / 2) {
      updateScore(1);
    } else {
      updateScore(2);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <Alert variant="destructive" className="mt-4 mb-4">
        <AlertCircle className="h-4 w-4 mr-2" />
        <AlertDescription>
          {error || 'Error loading match data. Please refresh the page.'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      {/* Rotation prompt dialog */}
      <Dialog open={showRotationPrompt} onOpenChange={setShowRotationPrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Please rotate your device</DialogTitle>
            <DialogDescription>
              For the best scoring experience, please rotate your device to landscape mode.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center my-4">
            <ScreenShare className="h-24 w-24 text-primary animate-pulse" />
          </div>
          <DialogFooter>
            <Button onClick={() => setShowRotationPrompt(false)}>Continue anyway</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* End Set confirmation dialog */}
      <Dialog open={showEndSetConfirm} onOpenChange={setShowEndSetConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete the current set?</DialogTitle>
            <DialogDescription>
              The scores indicate this set may be complete. Current score is {match.player1Score} - {match.player2Score}.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setShowEndSetConfirm(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={completeSet}>
              <Check className="h-4 w-4 mr-2" />
              Complete Set
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Match completion confirmation dialog */}
      <Dialog open={showCompleteConfirm} onOpenChange={setShowCompleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm match completion</DialogTitle>
            <DialogDescription>
              This will finalize the match and update the tournament standings. The final score is:{' '}
              <span className="font-bold">
                {match.team1.name || 'Team 1'} {match.player1Score} - {match.player2Score} {match.team2.name || 'Team 2'}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setShowCompleteConfirm(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={completeMatch}>
              <Check className="h-4 w-4 mr-2" />
              Complete Match
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main scoring interface */}
      <div className={`transition-all duration-300 ${isLandscape ? 'landscape-view' : 'portrait-warning'}`}>
        {/* Header with match information */}
        <div className="flex justify-between items-center p-2 bg-primary text-primary-foreground">
          <div className="text-sm flex items-center">
            <Trophy className="h-4 w-4 mr-1" />
            <span className="truncate max-w-[120px]">
              {match.team1.name} vs {match.team2.name}
            </span>
          </div>
          <Badge className={`
            ${match.status === 'IN_PROGRESS' ? 'bg-green-500' : 
              match.status === 'COMPLETED' ? 'bg-blue-500' : 'bg-gray-500'} 
            text-white
          `}>
            {match.status}
          </Badge>
          <div className="text-sm flex items-center">
            <Timer className="h-4 w-4 mr-1" />
            <span>{formatTime(matchTimer)}</span>
          </div>
        </div>

        {/* Main scoring area with court */}
        <div className="flex flex-col h-[calc(100vh-8rem)]">
          <div className="flex justify-between px-2 py-1 bg-muted text-xs text-muted-foreground">
            <div className="flex items-center">
              <User className="h-3 w-3 mr-1" />
              {match.team1.players.map(p => p.name).join(' & ')}
            </div>
            <div className="flex items-center justify-end">
              {match.team2.players.map(p => p.name).join(' & ')}
              <User className="h-3 w-3 ml-1" />
            </div>
          </div>

          {/* Match status bar */}
          <div className="flex justify-between items-center bg-muted/50 px-4 py-1">
            <div className="text-sm">
              Set: {match.currentSet} of {match.sets}
            </div>
            <div className="text-sm">
              {match.isGoldenPoint ? 'Golden Point' : 'Win by 2'}
            </div>
            <div className="text-sm">
              To: {match.maxScore}
            </div>
          </div>

          {/* Interactive Court */}
          <div 
            ref={courtRef}
            onClick={handleCourtClick}
            className="relative flex-1 flex items-stretch border-2 border-primary/50 cursor-pointer mx-2 my-1 overflow-hidden"
          >
            {/* Left side - Team 1 */}
            <div 
              className="w-1/2 flex flex-col items-center justify-between py-4 bg-[url('/images/court-left.png')] bg-cover"
              onClick={(e) => { e.stopPropagation(); updateScore(1); }}
            >
              <div className="text-8xl font-bold text-primary/90 shadow-sm">
                {match.player1Score}
              </div>
              <Button 
                variant="ghost" 
                className="bg-primary/10 hover:bg-primary/20 rounded-full p-6 mt-4 text-primary"
              >
                Tap to score
              </Button>
            </div>

            {/* Court Net */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-white border-l border-r border-primary"></div>

            {/* Right side - Team 2 */}
            <div 
              className="w-1/2 flex flex-col items-center justify-between py-4 bg-[url('/images/court-right.png')] bg-cover"
              onClick={(e) => { e.stopPropagation(); updateScore(2); }}
            >
              <div className="text-8xl font-bold text-secondary/90 shadow-sm">
                {match.player2Score}
              </div>
              <Button 
                variant="ghost" 
                className="bg-secondary/10 hover:bg-secondary/20 rounded-full p-6 mt-4 text-secondary"
              >
                Tap to score
              </Button>
            </div>

            {/* If not started yet */}
            {!isMatchStarted && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
                <Button 
                  size="lg" 
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 rounded-full text-xl"
                  onClick={startMatch}
                >
                  Start Match
                </Button>
              </div>
            )}

            {/* If completed */}
            {match.status === 'COMPLETED' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
                <div className="text-center text-white">
                  <h2 className="text-2xl font-bold mb-2">Match Complete</h2>
                  <p className="text-xl">Final Score: {match.player1Score} - {match.player2Score}</p>
                </div>
              </div>
            )}
          </div>

          {/* Instructions overlay */}
          <div className="absolute bottom-20 left-0 right-0 flex justify-center pointer-events-none">
            <div className="bg-black/40 text-white rounded-full px-4 py-1 text-sm flex items-center">
              <MoveHorizontal className="h-3 w-3 mr-1" />
              <span>Tap left or right side to score</span>
            </div>
          </div>

          {/* Last action indicator */}
          {lastAction && match.status === 'IN_PROGRESS' && (
            <div className="absolute top-20 right-0 left-0 flex justify-center pointer-events-none">
              <div className="bg-black/60 text-white px-4 py-2 rounded-full animate-fade-in-out">
                {lastAction}
              </div>
            </div>
          )}

          {/* Set scores history */}
          {match.setScores && match.setScores.length > 0 && (
            <div className="px-2 py-1 bg-muted/80 flex justify-center">
              <div className="text-xs flex space-x-4">
                {match.setScores.map((setScore, i) => (
                  <div key={i} className="flex space-x-1">
                    <span>Set {setScore.set}:</span>
                    <span className="font-medium">{setScore.team1Score}-{setScore.team2Score}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Control bar */}
          <div className="bg-muted p-2 flex justify-between items-center">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleUndo}
              disabled={isUpdating || match.status !== 'IN_PROGRESS'}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Undo
            </Button>

            {match.status === 'IN_PROGRESS' && (
              <Button 
                variant="default"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => setShowEndSetConfirm(true)}
                disabled={isUpdating}
              >
                <Flag className="h-4 w-4 mr-1" />
                End Set
              </Button>
            )}

            {match.status === 'IN_PROGRESS' && (
              <Button 
                variant="destructive"
                size="sm"
                onClick={() => setShowCompleteConfirm(true)}
                disabled={isUpdating}
              >
                <Check className="h-4 w-4 mr-1" />
                End Match
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Add some custom styles for landscape mode */}
      <style jsx global>{`
        @media (orientation: landscape) {
          body {
            overflow: hidden;
          }
          
          .landscape-view {
            height: 100vh;
            width: 100vw;
            position: fixed;
            top: 0;
            left: 0;
            z-index: 1000;
            background-color: var(--background);
            display: flex;
            flex-direction: column;
          }
        }
        
        .animate-fade-in-out {
          animation: fadeInOut 2s ease-in-out;
        }
        
        @keyframes fadeInOut {
          0% { opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </>
  );
} 