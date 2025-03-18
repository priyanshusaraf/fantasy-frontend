// src/lib/fantasy-pickleball.ts
export interface PlayerStats {
  id?: number;
  name: string;
  age: number;
  gender: "Male" | "Female";
  ranking: number;
  recentPerformance: number;
  specialtyPosition: "Singles" | "Doubles" | "Mixed Doubles";
  totalPoints: number;
  matchesPlayed: number;
  winRate: number;
}

export interface FantasyTeam {
  id?: number;
  userId: number;
  teamName: string;
  players: string[]; // Player IDs
  totalPoints: number;
  budget: number;
  transfersAvailable: number;
  currentRank?: number;
  leagueId?: number;
  createdAt: Date;
}

export interface League {
  id?: number;
  name: string;
  startDate: Date;
  endDate: Date;
  entryFee: number;
  prizePool: number;
  maxTeams: number;
  currentTeams: number;
  status: "Upcoming" | "Active" | "Completed";
}

export interface MatchEvent {
  id?: number;
  leagueId: number;
  date: Date;
  players: string[]; // Participating player IDs
  results?: {
    winner: string;
    scores: string;
    pointsAwarded: { [playerId: string]: number };
  };
}
