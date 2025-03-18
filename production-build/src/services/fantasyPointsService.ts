/**
 * Fantasy Points Calculation Service
 * 
 * This service handles the calculation of fantasy points based on player performance
 * in pickleball matches and tournaments.
 */

export interface MatchPerformance {
  playerId: number;
  matchId: string;
  points: number;
  winners: number;
  errors: number;
  aces: number;
  faults: number;
  ralliesWon: number;
  isMatchWinner: boolean;
  isSetWinner: boolean[];
  pointsScored: number;
  pointsConceded: number;
  timeOnCourt: number; // in minutes
}

export interface TournamentPerformance {
  playerId: number;
  tournamentId: string;
  matches: MatchPerformance[];
  tournamentPosition?: number; // final position in tournament
}

export interface PointsConfig {
  // Match outcomes
  matchWin: number;
  matchLoss: number;
  setWin: number;
  
  // Point scoring
  pointWon: number;
  pointLost: number;
  
  // Shot-specific
  winner: number;
  ace: number;
  error: number;
  fault: number;
  
  // Rally
  rallyWon: number;
  
  // Tournament position bonuses
  tournamentWinner: number;
  tournamentRunnerUp: number;
  tournamentSemiFinal: number;
  tournamentQuarterFinal: number;
}

// Default points configuration
export const DEFAULT_POINTS_CONFIG: PointsConfig = {
  // Match outcomes
  matchWin: 10,
  matchLoss: 2,
  setWin: 5,
  
  // Point scoring
  pointWon: 0.5,
  pointLost: -0.2,
  
  // Shot-specific
  winner: 2,
  ace: 3,
  error: -1,
  fault: -0.5,
  
  // Rally
  rallyWon: 1,
  
  // Tournament position bonuses
  tournamentWinner: 25,
  tournamentRunnerUp: 15,
  tournamentSemiFinal: 10,
  tournamentQuarterFinal: 5,
};

/**
 * Calculate fantasy points for a single match performance
 */
export function calculateMatchPoints(
  performance: MatchPerformance,
  config: PointsConfig = DEFAULT_POINTS_CONFIG
): number {
  let points = 0;
  
  // Match outcome points
  if (performance.isMatchWinner) {
    points += config.matchWin;
  } else {
    points += config.matchLoss;
  }
  
  // Set wins
  const setWins = performance.isSetWinner.filter(Boolean).length;
  points += setWins * config.setWin;
  
  // Points won/lost
  points += performance.pointsScored * config.pointWon;
  points += performance.pointsConceded * config.pointLost;
  
  // Shot-specific points
  points += performance.winners * config.winner;
  points += performance.aces * config.ace;
  points += performance.errors * config.error;
  points += performance.faults * config.fault;
  
  // Rally points
  points += performance.ralliesWon * config.rallyWon;
  
  return Math.max(0, points); // Ensure points don't go negative
}

/**
 * Calculate fantasy points for a player's tournament performance
 */
export function calculateTournamentPoints(
  performance: TournamentPerformance,
  config: PointsConfig = DEFAULT_POINTS_CONFIG
): number {
  // Sum up points from all matches
  const matchPoints = performance.matches.reduce(
    (total, match) => total + calculateMatchPoints(match, config),
    0
  );
  
  // Add tournament position bonus
  let tournamentBonus = 0;
  if (performance.tournamentPosition) {
    switch (performance.tournamentPosition) {
      case 1:
        tournamentBonus = config.tournamentWinner;
        break;
      case 2:
        tournamentBonus = config.tournamentRunnerUp;
        break;
      case 3:
      case 4:
        tournamentBonus = config.tournamentSemiFinal;
        break;
      case 5:
      case 6:
      case 7:
      case 8:
        tournamentBonus = config.tournamentQuarterFinal;
        break;
    }
  }
  
  return matchPoints + tournamentBonus;
}

/**
 * Calculate captain and vice-captain multipliers
 */
export function applyRoleMultiplier(points: number, isCaptain: boolean, isViceCaptain: boolean): number {
  if (isCaptain) {
    return points * 2; // Captain gets 2x points
  } else if (isViceCaptain) {
    return points * 1.5; // Vice-captain gets 1.5x points
  }
  return points;
}

/**
 * Calculate fantasy points for a team based on all players' performances
 */
export function calculateTeamPoints(
  playerPerformances: Array<{
    playerId: number;
    performance: TournamentPerformance;
    isCaptain: boolean;
    isViceCaptain: boolean;
  }>,
  config: PointsConfig = DEFAULT_POINTS_CONFIG
): number {
  return playerPerformances.reduce((totalPoints, player) => {
    const playerPoints = calculateTournamentPoints(player.performance, config);
    const pointsWithMultiplier = applyRoleMultiplier(
      playerPoints,
      player.isCaptain,
      player.isViceCaptain
    );
    return totalPoints + pointsWithMultiplier;
  }, 0);
}

/**
 * Generate a player performance summary for display
 */
export function generatePlayerSummary(performance: TournamentPerformance): {
  totalPoints: number;
  matchesPlayed: number;
  matchesWon: number;
  setsWon: number;
  winRate: number;
  bestMatch: { matchId: string; points: number } | null;
} {
  const config = DEFAULT_POINTS_CONFIG;
  const matchesPlayed = performance.matches.length;
  const matchesWon = performance.matches.filter(m => m.isMatchWinner).length;
  
  const setsWon = performance.matches.reduce(
    (total, match) => total + match.isSetWinner.filter(Boolean).length,
    0
  );
  
  const matchPointsMap = performance.matches.map(match => ({
    matchId: match.matchId,
    points: calculateMatchPoints(match, config)
  }));
  
  const bestMatch = matchPointsMap.length > 0
    ? matchPointsMap.reduce((best, current) => 
        current.points > best.points ? current : best, 
        matchPointsMap[0]
      )
    : null;
  
  return {
    totalPoints: calculateTournamentPoints(performance, config),
    matchesPlayed,
    matchesWon,
    setsWon,
    winRate: matchesPlayed > 0 ? (matchesWon / matchesPlayed) * 100 : 0,
    bestMatch
  };
} 