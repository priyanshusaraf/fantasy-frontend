// src/types/player.ts
export interface Player {
  id: number;
  name: string;
  imageUrl?: string;
  skillLevel?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "PROFESSIONAL";
  country?: string;
  dominantHand?: "LEFT" | "RIGHT" | "AMBIDEXTROUS";
}

export interface NewPlayerData {
  name: string;
  skillLevel: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "PROFESSIONAL";
  country?: string;
  dominantHand: "LEFT" | "RIGHT" | "AMBIDEXTROUS";
}
