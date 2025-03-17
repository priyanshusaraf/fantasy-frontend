import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, Trophy, ChevronUp, ChevronDown, Check, Clock } from "lucide-react";
import axios from 'axios';

interface FantasyTeam {
  id: number;
  name: string;
  totalPoints: number;
  userId: number;
  user: {
    name: string;
    username: string;
  };
  rank?: number;
}

interface PrizeRule {
  rank: number;
  percentage: number;
  minPlayers: number;
  estimatedPrize?: number;
  estimatedNetPrize?: number;
}

interface LeaderboardWithPrizesProps {
  contestId: number;
  showPrizeCutoff?: boolean;
  showMyTeamHighlight?: boolean;
  showPrizeEstimates?: boolean;
  showPrizeStatus?: boolean;
  compact?: boolean;
  className?: string;
}

export default function LeaderboardWithPrizes({
  contestId, 
  showPrizeCutoff = true,
  showMyTeamHighlight = true,
  showPrizeEstimates = true,
  showPrizeStatus = false,
  compact = false,
  className = ''
}: LeaderboardWithPrizesProps) {
  const { data: session } = useSession();
  const [teams, setTeams] = useState<FantasyTeam[]>([]);
  const [prizeRules, setPrizeRules] = useState<PrizeRule[]>([]);
  const [contestInfo, setContestInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prizeStatus, setPrizeStatus] = useState<'NOT_DISTRIBUTED' | 'PROCESSING' | 'DISTRIBUTED'>('NOT_DISTRIBUTED');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // For demo purposes, can be removed in production
  const RAZORPAY_FEE_PERCENTAGE = 2.36;

  useEffect(() => {
    fetchLeaderboard();
  }, [contestId, sortOrder]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch teams and standings
      const teamsResponse = await axios.get(`/api/fantasy/contests/${contestId}/leaderboard`);
      
      // Fetch contest info with prize rules
      const contestResponse = await axios.get(`/api/fantasy/contests/${contestId}`);
      
      setContestInfo(contestResponse.data.contest);
      
      // Get prize distribution rules
      const prizeRulesResponse = await axios.get(`/api/tournaments/${contestResponse.data.contest.tournamentId}/prize-rules`);
      
      // Find correct prize rules for this contest
      let rules = [];
      if (prizeRulesResponse.data.contests) {
        const contestRules = prizeRulesResponse.data.contests.find((c: any) => c.id === contestId);
        if (contestRules && contestRules.prizeDistributionRules && contestRules.prizeDistributionRules.length > 0) {
          rules = contestRules.prizeDistributionRules;
        } else {
          // Use tournament default rules
          rules = prizeRulesResponse.data.tournamentRules || [];
        }
      }
      
      // Sort teams by total points
      const sortedTeams = [...teamsResponse.data.teams].sort((a, b) => {
        return sortOrder === 'desc' 
          ? b.totalPoints - a.totalPoints 
          : a.totalPoints - b.totalPoints;
      });
      
      // Add rank to teams based on sorting
      sortedTeams.forEach((team, index) => {
        team.rank = index + 1;
      });
      
      // Calculate prize estimates for each rule
      const prizePool = parseFloat(contestResponse.data.contest.prizePool);
      const enhancedRules = rules.map((rule: PrizeRule) => {
        const percentage = parseFloat(rule.percentage.toString());
        const estimatedPrize = (prizePool * percentage) / 100;
        const razorpayFee = (estimatedPrize * RAZORPAY_FEE_PERCENTAGE) / 100;
        const estimatedNetPrize = estimatedPrize - razorpayFee;
        
        return {
          ...rule,
          estimatedPrize,
          estimatedNetPrize
        };
      });
      
      setTeams(sortedTeams);
      setPrizeRules(enhancedRules);
      
      // Check prize distribution status
      if (contestResponse.data.contest.isPrizesDistributed) {
        setPrizeStatus('DISTRIBUTED');
      } else if (contestResponse.data.contest.isPrizesProcessing) {
        setPrizeStatus('PROCESSING');
      } else {
        setPrizeStatus('NOT_DISTRIBUTED');
      }
    } catch (error: any) {
      console.error('Error fetching leaderboard:', error);
      setError(error.response?.data?.error || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  // Helper to determine if a team is in prize winning position
  const isInPrizePosition = (rank: number) => {
    return prizeRules.some(rule => rule.rank === rank);
  };

  // Helper to get prize for rank
  const getPrizeForRank = (rank: number) => {
    const rule = prizeRules.find(r => r.rank === rank);
    return rule ? rule.estimatedNetPrize : 0;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle>Leaderboard</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-2 border-b">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle>Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const currentUserTeam = session?.user?.id 
    ? teams.find(team => team.userId === parseInt(session.user.id))
    : null;

  return (
    <Card className={className}>
      <CardHeader className={compact ? "pb-2 pt-4 px-4" : "pb-2"}>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className={compact ? "text-lg" : ""}>Leaderboard</CardTitle>
            <CardDescription>
              {contestInfo?.name || 'Fantasy Contest'} • {teams.length} {teams.length === 1 ? 'team' : 'teams'}
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={toggleSortOrder}>
            {sortOrder === 'desc' ? 
              <ChevronDown className="h-4 w-4 mr-1" /> : 
              <ChevronUp className="h-4 w-4 mr-1" />
            }
            Points
          </Button>
        </div>
      </CardHeader>
      
      {showPrizeStatus && (
        <div className="px-6 pb-2">
          <div className="bg-slate-50 p-2 rounded-md text-xs flex items-center">
            {prizeStatus === 'DISTRIBUTED' ? (
              <>
                <Check className="h-3 w-3 mr-1 text-green-600" />
                <span className="text-green-600 font-medium">Prizes have been distributed</span>
              </>
            ) : prizeStatus === 'PROCESSING' ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 text-blue-600 animate-spin" />
                <span className="text-blue-600 font-medium">Prize distribution in progress</span>
              </>
            ) : (
              <>
                <Clock className="h-3 w-3 mr-1 text-amber-600" />
                <span className="text-amber-600 font-medium">Prizes will be distributed after tournament completion</span>
              </>
            )}
          </div>
        </div>
      )}
      
      <CardContent className={compact ? "px-4 pt-0" : "pt-0"}>
        <div className="space-y-1">
          {/* Header row for prize amount */}
          {showPrizeEstimates && prizeRules.length > 0 && (
            <div className="grid grid-cols-12 gap-2 px-2 pt-2 pb-1 text-xs text-gray-500 border-b">
              <div className="col-span-1">Rank</div>
              <div className="col-span-5">Team</div>
              <div className="col-span-3">Points</div>
              <div className="col-span-3 text-right">Prize</div>
            </div>
          )}
          
          {teams.map((team) => {
            const isCurrentUser = showMyTeamHighlight && currentUserTeam?.id === team.id;
            const isPrizeWinner = isInPrizePosition(team.rank || 0);
            const prize = getPrizeForRank(team.rank || 0);
            
            // Determine if this is the cutoff position
            const isLastPrizePosition = isPrizeWinner && 
              !isInPrizePosition((team.rank || 0) + 1) && 
              showPrizeCutoff;
            
            return (
              <div key={team.id}>
                <div 
                  className={`grid grid-cols-12 gap-2 p-2 ${
                    isCurrentUser ? 'bg-blue-50 rounded-md' : ''
                  } ${compact ? 'text-sm' : ''}`}
                >
                  <div className="col-span-1 flex items-center">
                    <div className={`
                      ${isPrizeWinner ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700'} 
                      rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium
                    `}>
                      {team.rank}
                    </div>
                  </div>
                  <div className="col-span-5 flex items-center truncate">
                    <span className="truncate">
                      {team.name}
                      {isCurrentUser && <span className="ml-1 text-xs text-blue-600">(You)</span>}
                    </span>
                  </div>
                  <div className="col-span-3 flex items-center font-medium">
                    {parseFloat(team.totalPoints.toString()).toFixed(2)}
                  </div>
                  {showPrizeEstimates && (
                    <div className="col-span-3 flex items-center justify-end">
                      {isPrizeWinner ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-semibold flex gap-1 items-center">
                          <Trophy className="h-3 w-3" />
                          ₹{prize ? prize.toFixed(0) : '0'}
                        </Badge>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Prize cutoff indicator */}
                {isLastPrizePosition && (
                  <div className="w-full border-t border-dashed border-amber-300 my-1 relative">
                    <div className="absolute -top-2.5 left-1/2 transform -translate-x-1/2 bg-white px-2 text-xs text-amber-600">
                      Prize cutoff
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          
          {teams.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No teams have joined this contest yet.
            </div>
          )}
        </div>
        
        {/* Prize distribution info */}
        {showPrizeEstimates && prizeRules.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h4 className="text-sm font-medium mb-2">Prize Distribution</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {prizeRules.map((rule) => (
                <div key={rule.rank} className="flex justify-between p-2 bg-gray-50 rounded-md">
                  <div className="flex items-center gap-1">
                    <Trophy className="h-3 w-3 text-amber-500" />
                    <span>{getOrdinal(rule.rank)} Place</span>
                  </div>
                  <div className="font-medium">
                    {rule.percentage}% 
                    {rule.estimatedNetPrize && (
                      <span className="text-gray-500 ml-1">
                        (₹{rule.estimatedNetPrize.toFixed(0)})
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Prize amounts are estimates. Final amounts may vary. All prizes will be processed through Razorpay and subject to a {RAZORPAY_FEE_PERCENTAGE}% payment processing fee.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper to get ordinal suffix (1st, 2nd, 3rd, etc.)
function getOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
} 