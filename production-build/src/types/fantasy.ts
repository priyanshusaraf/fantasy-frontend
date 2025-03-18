// src/types/fantasy.ts
export interface FantasyCategory {
  name: string;
  playerSkillLevel: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "PROFESSIONAL";
  price: number;
}

export interface FantasySettings {
  teamSize: number;
  walletSize: number;
  allowTeamChanges: boolean;
  changeFrequency?: "daily" | "matchday";
  maxPlayersToChange?: number;
  changeWindowStart?: string;
  changeWindowEnd?: string;
  categories: FantasyCategory[];
  entryFees: FantasyEntryFee[];
}

export interface FantasyEntryFee {
  amount: number;
  isEnabled: boolean;
}
